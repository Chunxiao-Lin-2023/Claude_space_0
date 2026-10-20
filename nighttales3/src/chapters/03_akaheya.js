/* ================= 第三夜 · 赤い部屋 ================= */
(() => {
  /* ---------------- 弹窗：那句话一次比一次长 ---------------- */
  const POP = ['', '你', '你喜欢', '你喜欢红色的', '你喜欢红色的房间', '你喜欢红色的房间吗？'];
  const POPS = ['popD', 'popC', 'popF', 'rpop1', 'rpop2', 'rpop3'];
  const CC = { 'ムラサキ': '#6a2a90', kaz: '#1e6a2a', 'ちなつ': '#c02850', HARU: '#2040a0', '　': '#a00000', sys: '#7a7a7a' };

  /* ---------------- 小工具：3×5 像素字（ASCII） ---------------- */
  const FONT = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
    '5': '111100111001111', '6': '111100111101111', '7': '111001001010010', '8': '111101111101111', '9': '111101111001111',
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
    G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
    M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
    S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
    Y: '101101010010010', Z: '111001010100111', ':': '000010000010000', '/': '001001010100100', '.': '000000000000010', '-': '000000111000000',
    '?': '111001010000010', '!': '010010010000010', '_': '000000000000111'
  };
  function TXT(R, x, y, s, col) {
    s = String(s).toUpperCase();
    for (let i = 0; i < s.length; i++) { const gl = FONT[s[i]]; if (gl) for (let k = 0; k < 15; k++) if (gl[k] === '1') R(x + i * 4 + (k % 3), y + ((k / 3) | 0), 1, 1, col); }
  }
  /* ---------------- 真·像素中文：离屏渲染后二值化，按实体原点贴图 ---------------- */
  const TXC = new Map();
  function hexRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mix(a, b, k) { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); }
  function txtCanvas(str, px, col, bold) {
    const key = str + '|' + px + '|' + col + '|' + (bold ? 1 : 0);
    let c = TXC.get(key); if (c) return c;
    const F = (bold ? 'bold ' : '') + px + 'px "Noto Sans CJK SC","Noto Sans CJK JP","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
    const m = mk(4, 4).getContext('2d'); m.font = F;
    const w = Math.max(1, Math.ceil(m.measureText(str).width) + 2);
    c = mk(w, px + 4); const q = c.getContext('2d', { willReadFrequently: true }); q.font = F; q.textBaseline = 'top'; q.fillStyle = '#000'; q.fillText(str, 1, 1);
    const im = q.getImageData(0, 0, c.width, c.height), d = im.data, [r, g2, b] = hexRgb(col);
    for (let i = 0; i < d.length; i += 4) { const a = d[i + 3]; d[i] = r; d[i + 1] = g2; d[i + 2] = b; d[i + 3] = a > 100 ? 255 : 0; }
    q.putImageData(im, 0, 0);
    if (TXC.size > 400) TXC.clear();
    TXC.set(key, c); return c;
  }
  function originOf(g, R) {   // R 是带实体偏移的 fillRect：借它问出原点
    let o = [0, 0]; g.fillRect = (X, Y) => { o = [X, Y]; };
    try { R(0, 0, 1, 1, '#000'); } finally { delete g.fillRect; }
    return o;
  }
  /* TX：在实体局部坐标 (x,y) 写一行字；o.max 截断宽度，o.l/o.r 局部裁剪区间 */
  function TX(g, R, x, y, str, px, col, o = {}) {
    if (!str) return 0;
    const c = txtCanvas(String(str), px, col, o.bold), [X, Y] = originOf(g, R);
    let sx = 0, sw = o.max ? Math.min(c.width, o.max) : c.width, dx = x;
    if (o.l != null && dx < o.l) { sx = o.l - dx; sw -= sx; dx = o.l; }
    if (o.r != null && dx + sw > o.r) sw = o.r - dx;
    if (sw > 0) g.drawImage(c, sx, 0, sw, c.height, X + dx, Y + y, sw, c.height);
    return c.width;
  }
  function bevel(R, x, y, w, h, face, sunk) {
    R(x, y, w, h, face || '#c0c0c0');
    R(x, y, w, 1, sunk ? '#808080' : '#ffffff'); R(x, y, 1, h, sunk ? '#808080' : '#ffffff');
    R(x, y + h - 1, w, 1, sunk ? '#ffffff' : '#404040'); R(x + w - 1, y, 1, h, sunk ? '#ffffff' : '#404040');
  }

  /* ---------------- 房间变红：从书桌开始往外蔓延的地板格 ---------------- */
  const REDR = [];
  for (let y = 2; y <= 8; y++) for (let x = 1; x <= 10; x++) REDR.push([x, y]);
  REDR.sort((a, b) => (Math.abs(a[0] - 7.5) + Math.abs(a[1] - 3)) - (Math.abs(b[0] - 7.5) + Math.abs(b[1] - 3)));

  /* ---------------- 精灵 ---------------- */
  const SPR3 = {
    /* 玩家在电脑里：鼠标指针（忙的时候变沙漏） */
    cursor(g, e, t, R) {
      if (W && W.busy) {
        const c = '#000', s = '#fff';
        R(4, 1, 9, 1, c); R(4, 13, 9, 1, c); R(5, 2, 1, 11, c); R(11, 2, 1, 11, c);
        R(6, 2, 5, 3, s); R(7, 5, 3, 2, s); R(8, 7, 1, 1, s); R(7, 8, 3, 2, s); R(6, 10, 5, 3, s);
        const k = ((t * 2) | 0) % 2; R(6, k ? 10 : 2, 5, 2, '#d8b84a'); R(8, 6, 1, 3, '#d8b84a');
        return;
      }
      const A = ['1', '11', '1w1', '1ww1', '1www1', '1wwww1', '1wwwww1', '1wwwwww1', '1wwwwwww1', '1wwww11111', '1ww1ww1', '1w1 1ww1', '11   1ww1', '1    1ww1', '      11'];
      for (let y = 0; y < A.length; y++) for (let x = 0; x < A[y].length; x++) if (A[y][x] !== ' ') R(6 + x, 1 + y, 1, 1, 'rgba(0,0,0,.35)');
      for (let y = 0; y < A.length; y++) for (let x = 0; x < A[y].length; x++) { const ch = A[y][x]; if (ch === '1') R(5 + x, y, 1, 1, '#000'); else if (ch === 'w') R(5 + x, y, 1, 1, '#fff'); }
    },
    /* 书桌 + 显像管显示器 + 主机 + 调制解调器（2×1） */
    crt(g, e, t, R) {
      box(R, 0, 3, 32, 12, '#5e5040'); R(1, 4, 30, 2, '#726250'); R(2, 13, 2, 3, '#2e261e'); R(28, 13, 2, 3, '#2e261e');
      box(R, 1, -11, 17, 15, '#cdc4ae'); R(2, -10, 15, 1, '#e2dac6');
      const off = e.off, red = e.red;
      R(3, -9, 13, 10, off ? '#0d1216' : red ? (Math.sin(t * 18) > 0 ? '#b01414' : '#7a0808') : '#0b6a6a');
      if (!off && !red) { R(4, -8, 2, 2, '#e0e0e0'); R(4, -5, 2, 2, '#e0e0e0'); R(4, -2, 2, 2, '#e0e0e0'); R(3, 0, 13, 1, '#c0c0c0'); }
      if (!off && e.pop) { R(7, -7, 7, 5, '#c0c0c0'); R(7, -7, 7, 1, red ? '#800000' : '#000080'); R(8, -5, 5, 2, '#fff'); R(8, -4, 3, 1, '#b00000'); }
      if (!off) R(3, -9, 13, 1, 'rgba(255,255,255,.08)');
      R(6, 4, 7, 2, '#b4aa94');
      R(3, 7, 15, 3, '#d4ccb8'); for (let i = 0; i < 7; i++) R(4 + i * 2, 8, 1, 1, '#948c78');
      box(R, 21, -9, 9, 14, '#cdc4ae'); R(23, -7, 5, 1, '#8a8270'); R(23, -4, 5, 1, '#8a8270'); R(24, 1, 2, 1, off ? '#2a3a2a' : '#4f4');
      box(R, 19, 6, 11, 4, '#34343a');
      const ml = e.modem;
      for (let i = 0; i < 4; i++) R(21 + i * 2, 7, 1, 1, ml ? (Math.sin(t * (ml === 'mad' ? 47 : 9) + i * 1.9) > 0 ? (ml === 'mad' ? '#ff3030' : '#40ff60') : '#223') : '#223');
      R(19, 11, 3, 2, '#e6dece');
    },
    /* 桌面图标：e.k 种类，e.lab 标签（ASCII 像素字） */
    icon(g, e, t, R) {
      const k = e.k;
      if (k === 'pc') { box(R, 3, 0, 10, 8, '#cdc4ae'); R(4, 1, 8, 5, '#0b6a6a'); R(5, 2, 2, 1, '#9ff'); R(6, 8, 4, 1, '#b4aa94'); R(4, 9, 8, 1, '#cdc4ae'); }
      else if (k === 'docs' || k === 'folder') { R(2, 2, 5, 2, '#d8b040'); R(2, 3, 12, 7, '#f0d060'); R(2, 9, 12, 1, '#a08020'); if (k === 'docs') { R(4, 1, 7, 4, '#fff'); R(5, 2, 4, 1, '#88a'); } }
      else if (k === 'trash') { R(4, 2, 8, 1, '#6a7078'); box(R, 4, 3, 8, 7, '#a8b0b8'); R(6, 4, 1, 5, '#7a828a'); R(9, 4, 1, 5, '#7a828a'); R(6, 1, 4, 1, '#6a7078'); }
      else if (k === 'ie') { R(5, 1, 6, 9, '#1a5ad8'); R(4, 2, 8, 7, '#1a5ad8'); R(6, 3, 4, 1, '#fff'); R(5, 4, 1, 3, '#fff'); R(6, 5, 4, 1, '#fff'); R(6, 7, 4, 1, '#fff'); R(10, 4, 1, 1, '#fff'); R(1, 6, 14, 1, '#f0c020'); R(2, 5, 2, 1, '#f0c020'); }
      else if (k === 'chat') { box(R, 2, 1, 9, 6, '#ffffff'); R(4, 7, 2, 1, '#000'); box(R, 6, 4, 9, 6, '#ffe070'); R(11, 10, 2, 1, '#000'); R(4, 3, 4, 1, '#888'); R(8, 6, 5, 1, '#a07a20'); }
      else if (k === 'mail') { box(R, 2, 2, 12, 8, '#f4f0e0'); for (let i = 0; i < 5; i++) { R(3 + i, 3 + i, 1, 1, '#998'); R(12 - i, 3 + i, 1, 1, '#998'); } if (e.flash && Math.sin(t * 6) > 0) R(12, 1, 3, 3, '#e03030'); }
      else if (k === 'dial') { box(R, 1, 1, 6, 5, '#cdc4ae'); R(2, 2, 4, 3, '#0b6a6a'); box(R, 9, 4, 6, 5, '#cdc4ae'); R(10, 5, 4, 3, '#0b6a6a'); R(4, 7, 1, 2, '#333'); R(4, 9, 8, 1, '#333'); R(11, 9, 1, 1, '#333'); }
      else if (k === 'memo') { box(R, 4, 0, 8, 10, '#ffffff'); R(4, 0, 8, 2, '#3a6ad8'); for (let i = 0; i < 3; i++) R(5, 3 + i * 2, 6, 1, '#99a'); }
      else if (k === 'akai') { const f = Math.sin(t * 5) > .6; R(3, 0, 10, 10, f ? '#d01818' : '#900808'); R(4, 1, 8, 8, f ? '#e83030' : '#a80c0c'); }
      else if (k === 'lnk') { box(R, 3, 0, 10, 9, '#d0d0d0'); R(4, 1, 8, 2, '#000080'); R(5, 4, 6, 3, '#f0e0a0'); box(R, 3, 6, 4, 4, '#fff'); R(4, 7, 2, 1, '#000'); R(5, 8, 1, 1, '#000'); }
      else if (k === 'exe') { box(R, 3, 0, 10, 9, '#d0d0d0'); R(4, 1, 8, 2, '#800000'); R(5, 4, 6, 3, '#e04040'); }
      else if (k === 'blank') { for (let i = 0; i < 10; i += 2) { R(4, i, 1, 1, '#9a9a9a'); R(11, i + 1, 1, 1, '#9a9a9a'); } for (let i = 0; i < 8; i += 2) { R(4 + i, 0, 1, 1, '#9a9a9a'); R(5 + i, 9, 1, 1, '#9a9a9a'); } R(5, 1, 6, 8, Math.sin(t * 2.3) > .85 ? '#ffd8d8' : '#f4f4f4'); }
      if (e.lab) { const w = e.lab.length * 4 - 1, x = 8 - (w >> 1); R(x - 1, 11, w + 2, 7, e.sel ? '#000080' : 'rgba(0,40,40,.55)'); TXT(R, x, 12, e.lab, '#fff'); }
      else if (k === 'blank') { for (let i = 0; i < 10; i += 2) { R(3 + i, 12, 1, 1, '#808080'); R(4 + i, 16, 1, 1, '#808080'); } R(3, 13, 1, 1, '#808080'); R(12, 15, 1, 1, '#808080'); }
    },
    /* 弹窗。e.num = 第几句；e.s.small = 现实里的小窗；e.s.str 覆盖文字 */
    popup(g, e, t, R) {
      const n = clamp(e.num || 1, 1, 5), small = e.small, Wd = (e.w || 4) * 16, red = n >= 5 || e.red2;
      const bob = small ? Math.round(Math.sin(t * 2.2 + e.px * .1) * 1.5) : 0;
      const top = small ? -10 + bob : -2, H = small ? 24 : (e.h || 2) * 16;
      R(3, top + 3, Wd, H, 'rgba(0,0,0,.45)');
      bevel(R, 0, top, Wd, H, '#c0c0c0');
      const tb = red ? ['#800000', '#c82020'] : ['#000080', '#1084d0'];
      R(2, top + 2, Wd - 4, 6, tb[0]); R(2 + ((Wd - 4) >> 1), top + 2, (Wd - 4) >> 1, 6, tb[1]);
      const bx0 = Wd - 9; bevel(R, bx0, top + 3, 6, 4, '#c0c0c0');
      R(bx0 + 2, top + 4, 1, 1, '#000'); R(bx0 + 3, top + 5, 1, 1, '#000'); R(bx0 + 4, top + 4, 1, 1, '#000');
      R(3, top + 9, Wd - 6, small ? 12 : 13, '#ffffff');
      const str = e.str || POP[n];
      TX(g, R, 5, top + 9 + (small ? 1 : 1), str, small ? 9 : 11, red ? '#c80000' : '#b00000', { max: Wd - 9 });
      if (e.str && e.blink && Math.sin(t * 8) > 0) R(5 + Math.min(Wd - 14, str.length * 11), top + 10, 2, 11, '#b00000');
      if (!small) { const bw = 18, bx = (Wd - bw) >> 1, by = top + H - 9; bevel(R, bx, by, bw, 7, '#c0c0c0'); TXT(R, bx + 6, by + 1, 'OK', '#000'); }
    },
    /* 弹窗风暴里的小装饰窗 */
    minipop(g, e, t, R) {
      const j = Math.sin(t * 3 + e.px) > .92 ? 1 : 0;
      R(2, 2, 26, 16, 'rgba(0,0,0,.4)'); bevel(R, 0 + j, 0, 26, 16, '#c0c0c0');
      R(2 + j, 2, 22, 4, '#800000'); R(3 + j, 8, 20, 6, '#fff');
      TX(g, R, 4 + j, 7, POP[clamp(e.num || 2, 1, 5)].slice(0, 2), 9, '#b00000', { max: 19 });
    },
    /* 资源管理器窗口（贴地，10×6） */
    expwin(g, e, t, R) {
      const Wd = 160, H = 96;
      R(3, 3, Wd, H, 'rgba(0,0,0,.35)'); bevel(R, 0, 0, Wd, H, '#c0c0c0');
      R(2, 2, Wd - 4, 10, '#000080'); R(80, 2, Wd - 82, 10, '#1084d0');
      R(4, 4, 6, 5, '#f0d060'); TX(g, R, 12, 1, 'スタートアップ', 9, '#ffffff');
      TXT(R, 4, 15, 'FILE  EDIT  VIEW  HELP', '#000');
      bevel(R, 3, 21, Wd - 6, H - 35, '#ffffff', true);
      bevel(R, 2, H - 13, Wd - 4, 11, '#c0c0c0', true);
      TX(g, R, 5, H - 14, '4 個のオブジェクト', 9, '#000000');
    },
    xbtn(g, e, t, R) { bevel(R, 3, 3, 11, 9, '#c0c0c0'); for (let i = 0; i < 5; i++) { R(6 + i, 5 + i, 1, 1, '#000'); R(10 - i, 5 + i, 1, 1, '#000'); } },
    /* 聊天记录的一行（贴地，宽 13） */
    cline(g, e, t, R) { if (e.text) TX(g, R, 3, 2, e.text, 10, e.c || '#303030', { max: e.w * 16 - 6 }); },
    avatar(g, e, t, R) {
      const c = e.col || '#888';
      box(R, 0, 3, 10, 10, c); R(2, 5, 6, 6, shade(c, .35));
      if (e.blank) R(1, 4, 8, 8, '#ffffff'); else { R(3, 7, 1, 1, '#111'); R(6, 7, 1, 1, '#111'); R(4, 9, 2, 1, '#111'); }
      TX(g, R, 12, 2, e.name || '', 10, e.blank ? '#a00000' : '#202020');
    },
    ttl(g, e, t, R) { TX(g, R, 4, 2, e.str || '', 10, e.c2 || '#ffffff', { max: e.w * 16 - 6 }); },
    xsm(g, e, t, R) { bevel(R, 5, 2, 9, 7, '#c0c0c0'); for (let i = 0; i < 4; i++) { R(7 + i, 3 + i, 1, 1, '#000'); R(10 - i, 3 + i, 1, 1, '#000'); } },
    inputbox(g, e, t, R) {
      bevel(R, 0, 2, e.w * 16, 12, '#ffffff', true);
      TX(g, R, 4, 2, '（点这里发言）', 9, '#9a9a9a');
      if (Math.sin(t * 6) > 0) R(e.w * 16 - 10, 4, 1, 8, '#000');
    },
    btn(g, e, t, R) { bevel(R, 0, 2, 16, 12, '#c0c0c0'); TXT(R, 2, 6, e.lab || '', '#000'); },
    startbtn(g, e, t, R) {
      bevel(R, 1, 2, 30, 12, '#c0c0c0');
      R(4, 5, 3, 3, '#e03020'); R(7, 5, 3, 3, '#30a030'); R(4, 8, 3, 3, '#2050d0'); R(7, 8, 3, 3, '#e0c020');
      TXT(R, 11, 6, 'START', '#000');
    },
    tray(g, e, t, R) {
      const m = e.lit, f = m ? Math.sin(t * (m === 'mad' ? 40 : 7)) : 0;
      bevel(R, 1, 3, 14, 10, '#c0c0c0', true);
      R(3, 5, 4, 3, f > 0 ? (m === 'mad' ? '#ff3030' : '#40d040') : '#406060'); R(8, 7, 4, 3, f < 0 ? (m === 'mad' ? '#ff3030' : '#40d040') : '#406060');
      R(4, 8, 2, 1, '#333'); R(9, 10, 2, 1, '#333');
    },
    tclock(g, e, t, R) { bevel(R, 0, 3, 32, 10, '#c0c0c0', true); TXT(R, 9, 6, e.tm || '2:07', '#000'); },
    /* 网页 */
    banner(g, e, t, R) {
      const f = Math.random() < .03 ? 1 : 0;
      TX(g, R, 63 + f, 0, '赤い部屋', 16, '#4a0000', { bold: true });
      TX(g, R, 62, -1, '赤い部屋', 16, f ? '#ff4040' : '#e01818', { bold: true });
    },
    marq(g, e, t, R) {
      const Wd = e.w * 16, s = 'ようこそ　赤い部屋へ　　　ようこそ　赤い部屋へ', L = 260;
      const x = Wd - ((t * 18) % (Wd + L));
      TX(g, R, x, 2, s, 10, '#a01010', { l: 0, r: Wd });
    },
    hitcounter(g, e, t, R) {
      TX(g, R, 0, 2, 'あなたは', 10, '#c8c8c8');
      R(42, 2, 46, 12, '#000'); bevel(R, 41, 1, 48, 14, '#202020', true);
      const d = String(e.n || 4444).padStart(7, '0'); for (let i = 0; i < 7; i++) { R(44 + i * 6, 4, 5, 9, '#0a1a0a'); TXT(R, 45 + i * 6, 6, d[i], '#50ff50'); }
      TX(g, R, 92, 2, '人目のお客様です', 10, '#c8c8c8');
    },
    link(g, e, t, R) {
      const w = TX(g, R, 4, 1, e.lab || '', 11, e.hot ? '#ff5050' : '#d02020', { bold: true });
      R(4, 14, Math.max(0, w - 2), 1, '#d02020');
    },
    lhead(g, e, t, R) { TX(g, R, 2, 2, '■ 犠牲者リスト ■', 10, '#909090'); },
    vrow(g, e, t, R) {
      const w = TX(g, R, 2, 2, e.text || '', 10, e.me ? '#ff3030' : '#c01818');
      if (e.me && Math.sin(t * 7) > 0) R(2 + w, 4, 5, 10, '#ff3030');
    },
    secret(g, e, t, R) {
      if (e.sel) { R(0, 2, e.w * 16, 13, '#ffffff'); TX(g, R, 4, 2, '为什么要关掉窗口呢', 10, '#000000'); }
      else TX(g, R, 4, 2, '为什么要关掉窗口呢', 10, '#0d0607');
    },
    /* 房间 */
    redwash(g, e, t, R) {
      const Wd = e.w * 16, a = clamp((e.num || 6) / 6, .2, 1);
      R(0, 0, Wd, 16, 'rgba(70,0,4,' + (.55 * a) + ')');
      for (let x = 0; x < Wd; x += 2) { const h = 5 + ((hash(x, 1, 33) * 16) | 0); R(x, 16, 2, Math.round(h * a), 'rgba(140,8,12,.82)'); }
      R(0, 16, Wd, Math.round(5 * a), 'rgba(118,6,10,.85)');
      for (let i = 0; i < 12; i++) { const x = (hash(i, 2, 34) * Wd) | 0; R(x, 16, 1, Math.round((12 + hash(i, 3, 34) * 16) * a), 'rgba(90,0,0,.9)'); }
    },
    nwin(g, e, t, R) {
      box(R, 1, 0, 14, 12, '#4a4038'); R(2, 1, 12, 10, '#0a0f1c'); R(2, 4, 12, 7, '#141a26');
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
        const lit = e.red ? (e.all || (i === 3 && j === 0)) : (i === 1 && j === 1);
        R(3 + i * 3, 5 + j * 3, 2, 2, lit ? (e.red ? (Math.sin(t * 3 + i) > -.3 ? '#d02020' : '#900c0c') : '#d9c27a') : '#1e2432');
      }
      R(7, 1, 1, 10, '#4a4038'); R(1, 11, 14, 2, '#6a5a4a');
    },
    calendar2(g, e, t, R) {
      R(4, 1, 8, 11, '#eeeae0'); R(4, 1, 8, 3, e.mom ? '#3a6aa8' : '#b83030');
      for (let y = 5; y < 12; y += 2) for (let x = 5; x < 11; x += 2) R(x, y, 1, 1, '#aaa');
      if (!e.mom) R(9, 6, 2, 2, '#e07090'); else { R(5, 7, 1, 1, '#3a6aa8'); R(9, 9, 1, 1, '#3a6aa8'); }
    },
    bag(g, e, t, R) { R(2, 7, 12, 7, '#24243a'); R(2, 7, 12, 3, '#34344c'); R(5, 4, 6, 1, '#24243a'); R(5, 4, 1, 3, '#24243a'); R(10, 4, 1, 3, '#24243a'); R(7, 9, 2, 2, '#c9a35a'); R(3, 13, 10, 1, '#141420'); R(10, 5, 3, 3, '#e8e0d0'); },
    pager(g, e, t, R) { R(5, 8, 7, 5, '#e88aa8'); R(5, 8, 7, 1, '#f8b0c8'); R(6, 9, 4, 2, e.lit ? (Math.sin(t * 10) > 0 ? '#c8ffc0' : '#6a9a6a') : '#5a7a5a'); R(11, 10, 1, 1, '#fff'); },
    radicase(g, e, t, R) { box(R, 0, 3, 16, 11, '#38383e'); R(4, 1, 8, 2, '#555'); R(2, 6, 4, 4, '#1c1c1c'); R(10, 6, 4, 4, '#1c1c1c'); R(3, 7, 2, 2, '#555'); R(11, 7, 2, 2, '#555'); R(6, 5, 4, 3, '#7a9aaa'); R(6, 10, 4, 2, '#888'); },
    trashcan(g, e, t, R) { R(4, 6, 8, 9, '#6a7a8a'); R(3, 5, 10, 2, '#7a8a9a'); R(5, 3, 3, 3, '#e8e8e0'); R(8, 2, 3, 3, '#f0f0e8'); },
    /* 家 */
    steeldoor(g, e, t, R) {
      const c = e.col || '#68707a';
      box(R, 2, -2, 12, 16, c); R(3, -1, 10, 1, shade(c, .2));
      R(2, -2, 12, 7, '#d8d4c8'); R(2, 4, 12, 1, shade(c, -.3)); TXT(R, 3, -1, e.num2 || '', '#333');
      R(11, 7, 2, 2, '#d0d0d0');
      if (e.kichu) { R(4, 6, 8, 6, '#f4f2ec'); R(4, 6, 8, 1, '#111'); R(4, 11, 8, 1, '#111'); R(4, 6, 1, 6, '#111'); R(11, 6, 1, 6, '#111'); R(6, 7, 1, 4, '#222'); R(9, 7, 1, 4, '#222'); R(7, 8, 2, 1, '#222'); }
      else R(5, 10, 6, 1, '#2a2a2e');
      if (e.glow) R(2, 13, 12, 1, Math.sin(t * 4) > 0 ? '#d01818' : '#801010');
    },
    phonestand(g, e, t, R) {
      box(R, 1, 2, 14, 12, '#7a5a3a'); R(2, 3, 12, 2, '#8a6a48'); R(7, 8, 2, 1, '#c9a35a');
      const ring = e.lit && Math.sin(t * 34) > 0 ? 1 : 0;
      R(3, -3 - ring, 10, 5, '#1a1a1e'); R(2, -4 - ring, 12, 2, '#2a2a30'); R(5, -1 - ring, 6, 2, '#3a3a40');
      for (let i = 0; i < 3; i++) R(5 + i * 2, -1 - ring, 1, 1, '#999');
      R(13, 9, 3, 4, '#e8e4d8'); R(14, 10, 1, 1, '#555');
      if (e.cord) R(14, 11, 2, 2, '#a8a8a0'); else if (!e.loose) R(14, 11, 2, 2, '#222');
      if (!e.cord) R(3, 2, 1, 3, '#222');
    },
    cordpath(g, e, t, R) {
      const c = '#b0b0a8', d = 'rgba(0,0,0,.35)';
      R(7, -2, 1, 11, c); R(8, -2, 1, 11, d);
      R(7, 8, 98, 1, c); R(7, 9, 98, 1, d);
      const L = e.loose ? 72 : 84; R(104, 8, 1, L, c); R(105, 8, 1, L, d);
      if (e.loose) { R(102, 80, 5, 2, '#999'); R(103, 82, 3, 1, '#c0a060'); }
    },
    crtv(g, e, t, R) {
      box(R, 0, 0, 16, 13, '#2a2a2a');
      if (e.off) R(2, 2, 10, 9, '#151a1c');
      else if (e.red) { for (let y = 2; y < 11; y++) for (let x = 2; x < 12; x++) R(x, y, 1, 1, hash(x, y, (t * 30) | 0) < .5 ? '#e02020' : '#4a0606'); }
      else { for (let y = 2; y < 11; y++) for (let x = 2; x < 12; x++) R(x, y, 1, 1, hash(x, y, (t * 30) | 0) < .5 ? '#ddd' : '#555'); }
      R(13, 3, 2, 1, '#888'); R(13, 6, 2, 1, '#888'); R(3, 13, 10, 3, '#333');
    },
    butsudan(g, e, t, R) {
      box(R, 1, -7, 14, 21, '#3a2214'); R(3, -5, 10, 10, '#1a0e08'); R(6, -3, 4, 5, '#d8d0c0'); R(7, -2, 2, 2, '#555'); R(6, 0, 4, 1, '#888');
      R(4, 6, 8, 1, '#c9a35a'); R(9, 8, 3, 3, '#e89030'); R(5, 8, 1, 3, '#8a3a2a');
    },
    mdf(g, e, t, R) {
      box(R, 1, -2, 14, 15, '#8a9096'); R(2, -1, 12, 1, '#a8aeb4');
      if (e.open) {
        R(2, 0, 12, 12, '#16181c');
        for (let i = 0; i < 5; i++) { R(3, 1 + i * 2, 10, 1, '#4a4a4a'); R(4, 1 + i * 2, 1, 1, '#c8a040'); R(11, 1 + i * 2, 1, 1, '#c8a040'); }
        if (!e.cut) { R(5, 1, 6, 1, Math.sin(t * 14) > 0 ? '#ff3030' : '#a01010'); } else { R(5, 1, 2, 1, '#a08060'); R(9, 1, 2, 1, '#a08060'); }
      } else {
        R(3, 1, 10, 4, '#e8e4d8'); TXT(R, 4, 1, 'TEL', '#333');
        R(2, -1, 1, 1, '#ddd'); R(13, -1, 1, 1, '#ddd'); R(2, 11, 1, 1, '#ddd'); R(13, 11, 1, 1, '#ddd');
        if (e.glow) R(3, 7, 10, 1, Math.sin(t * 9) > 0 ? '#d02020' : '#601010');
      }
    },
    flamp(g, e, t, R) {
      R(2, 1, 12, 4, '#5a5a5e'); const dim = e.fl && Math.random() < .25;
      R(3, 2, 10, 2, e.off || dim ? '#555' : '#f4fff4');
    },
    bouquet(g, e, t, R) { R(5, 8, 1, 6, '#3a6a2a'); R(8, 8, 1, 6, '#3a6a2a'); R(3, 10, 8, 4, '#e8e0f0'); R(2, 5, 4, 4, '#f4f4ec'); R(6, 4, 4, 4, '#f0e8a0'); R(9, 6, 4, 4, '#f8c0d8'); R(4, 6, 1, 1, '#c8c060'); },
    rolls(g, e, t, R) { R(2, -1, 4, 15, '#f2f0ea'); R(2, -1, 4, 2, '#d8d6d0'); R(6, 1, 4, 13, '#eae8e2'); R(6, 1, 4, 2, '#cfcdc6'); R(10, 5, 4, 9, '#8a7a6a'); R(10, 5, 4, 2, '#5a2a24'); R(10, 9, 4, 1, '#c8c080'); R(10, 11, 4, 1, '#c8c080'); },
    bike(g, e, t, R) { R(1, 9, 5, 5, '#2a2a2a'); R(10, 9, 5, 5, '#2a2a2a'); R(2, 10, 3, 3, '#7a7a7a'); R(11, 10, 3, 3, '#7a7a7a'); R(4, 8, 8, 1, '#9a2a2a'); R(7, 5, 1, 4, '#9a2a2a'); R(5, 4, 4, 1, '#222'); R(11, 4, 4, 3, '#888'); R(12, 4, 2, 1, '#8a6a2a'); }
  };

  /* ---------------- 瓦片 ---------------- */
  const TILES3 = {
    bezel: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#141318'); if (hash(X, Y, 41) < .3) R((hash(X, Y, 42) * 14) | 0, (hash(X, Y, 43) * 14) | 0, 2, 1, '#1c1b22'); } },
    desktop: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#0b7070'); for (let y = 1; y < 16; y += 2) R(0, y, 16, 1, '#096666'); } },
    taskbar: { solid: false, paint(R) { R(0, 0, 16, 16, '#c0c0c0'); R(0, 0, 16, 1, '#dfdfdf'); R(0, 1, 16, 1, '#ffffff'); } },
    wtitle: { solid: true, paint(R, X) { R(0, 0, 16, 16, '#c0c0c0'); R(0, 1, 16, 14, mix('#000080', '#1084d0', clamp((X - 1) / 18, 0, 1))); } },
    wsep: { solid: true, paint(R) { R(0, 0, 16, 16, '#c0c0c0'); R(7, 0, 1, 16, '#808080'); R(8, 0, 1, 16, '#ffffff'); } },
    chatlog: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#f2f0e8'); for (let y = 1; y < 16; y += 2) R(0, y, 16, 1, '#eceae2'); if (X === 1) R(0, 0, 1, 16, '#808080'); } },
    chatlist: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#e6e3da'); for (let y = 1; y < 16; y += 2) R(0, y, 16, 1, '#dedbd2'); } },
    chatin: { solid: false, paint(R) { R(0, 0, 16, 16, '#c0c0c0'); R(0, 0, 16, 1, '#ffffff'); } },
    addrbar: { solid: false, paint(R) { R(0, 0, 16, 16, '#c0c0c0'); R(0, 3, 16, 11, '#ffffff'); R(0, 3, 16, 1, '#808080'); R(0, 13, 16, 1, '#dfdfdf'); } },
    pagebg: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#060203'); for (let y = 1; y < 16; y += 2) R(0, y, 16, 1, '#080304'); if (hash(X, Y, 51) < .12) R((hash(X, Y, 52) * 15) | 0, (hash(X, Y, 53) * 15) | 0, 1, 1, '#2a0606'); } },
    parapet: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#76766f'); R(0, 0, 16, 3, '#96968e'); R(0, 3, 16, 1, '#55554f'); R(0, 12, 16, 4, '#4a4a45'); if (hash(X, Y, 61) < .4) R((hash(X, Y, 62) * 12) | 0, 5, 3, 6, '#6a6a63'); } },
    nightview: { solid: true, paint(R, X, Y) {
      R(0, 0, 16, 16, '#070a14');
      if (Y % 2 === 1) { R(0, 4, 16, 12, '#10141f'); R(0, 4, 16, 1, '#181d2a'); for (let i = 0; i < 4; i++) { const h = hash(X, Y, 70 + i); R(1 + i * 4, 8, 2, 2, h < .14 ? '#d9c27a' : (X === 9 && i === 2 ? '#7a1010' : '#151a26')); } }
      else { for (let i = 0; i < 3; i++) { const h = hash(X, Y, 80 + i); R(2 + i * 5, 3, 2, 2, h < .1 ? '#c8b070' : '#121722'); R(2 + i * 5, 9, 2, 2, h > .92 ? '#c8b070' : '#121722'); } R(0, 0, 16, 1, '#0d1220'); }
    } }
  };

  /* ---------------- 共用小剧本 ---------------- */
  function setStage(S, n) { S.f.stage = n; for (const id of POPS) { const e = getEnt(id); if (e) e.num = n; } const p = getEnt('pc', 'room'); if (p) p.s.pop = n > 0; }
  async function popSay(S, n) { S.sfx('ding'); await S.say('', POP[n], { style: 'big' }); }
  function chatPush(S, who, msg) {
    for (let i = 0; i < 7; i++) { const a = getEnt('cl' + i, 'chat'), b = getEnt('cl' + (i + 1), 'chat'); a.text = b.text; a.s = Object.assign({}, b.s); }
    const l = getEnt('cl7', 'chat'); l.text = who === 'sys' ? msg : who + '＞' + msg; l.s = { c: CC[who] || '#303030' };
  }
  async function cs(S, who, msg, o) { chatPush(S, who, msg); S.sfx('blip'); await S.say(who, msg, o); }
  function wearMe(S) { S.wear('@me'); }
  function wearCursor(S) { S.wear('cursor'); }

  function huntGoal(S) {
    const f = S.f; if (f.phase !== 'hunt') return;
    if (f.explorer) return S.goal('在「启动」文件夹里找出那个文件，删掉它（对照日期）');
    if (f.page) {
      if (!f.sawName) return S.goal('看看网页上的那张名单');
      if (!f.knowStartup) return S.goal('网页最底下好像藏着什么');
      return S.goal('打开「我的电脑」（PC），找「启动」文件夹');
    }
    if (!f.readMail) return S.goal('看看千夏寄来的那封邮件（MAIL）');
    if (!f.knowRoom) return S.goal(f.ruleKnown ? '查出千夏家的房间号（楼道门牌／班级联络网）' : '邮件里的地址最后几位是乱码——问问聊天室里的人');
    return S.goal('用浏览器（WEB）打开那个地址：…/~room/（房间号）/');
  }
  function runGoal(S) {
    const f = S.f; if (f.phase !== 'run') return;
    if (!f.jackOut) return S.goal('拔掉电话线！——去客厅，从墙上的插座拔');
    if (!S.has('driver')) return S.goal('拿螺丝刀（厨房抽屉），去楼道切断端子盘里的线');
    return S.goal('去楼道，打开电话端子盘，切断 401 的线！');
  }

  /* 看完最后一个弹窗（限时失败 / 关掉了第四个窗口） */
  async function lastPopup(S) {
    const f = S.f; S.clearTimer(); setStage(S, 5); S.amb('none');
    await S.wait(500);
    S.sfx('ding'); S.fx('red');
    await S.say('', POP[5], { style: 'big' });
    await S.wait(700);
    S.sfx('whisper');
    await S.say('？？？', '……是的。', { style: 'whisper' });
    await S.scare('blood', { spr: '@akai', dur: 1.2 });
    await S.die('最后一个窗口弹了出来。\n你没有按「OK」，也没有按「×」。\n\n身后有人凑到你耳边，替你回答了。', '房间变红了');
  }

  /* ---------------- 环境惊吓（找源头阶段，间歇触发） ---------------- */
  async function ambient(S) {
    const f = S.f; if (f.phase !== 'hunt') return;
    const i = f._ai = (f._ai || 0) + 1, m = S.map;
    if (m === 'desk' || m === 'chat' || m === 'page') {
      const k = i % 3;
      if (k === 0) { S.sfx('ding'); S.fx('glitch'); await S.think('（右下角「叮」了一声。……什么窗口都没有弹出来。）'); }
      else if (k === 1) { S.shake(300, 1); S.sfx('tick'); await S.think('（光标自己往旁边滑了一下。……是鼠标垫不平吧。）'); }
      else { S.sfx('tick'); await S.wait(200); S.sfx('tick'); await S.think('（硬盘咔哒咔哒地转起来。你什么都没有打开。）'); }
    } else if (m === 'room') {
      const p = S.ent('pager'); p.lit = true; f.pagerMsg = true;
      S.sfx('tick'); await S.wait(250); S.sfx('tick'); await S.wait(250); S.sfx('tick');
      await S.think('（枕边的 BP 机「哔哔哔」地响了。）');
    } else if (m === 'home') {
      const p = S.ent('phone'); p.lit = true; S.sfx('phone'); await S.wait(1200); S.sfx('phone'); await S.wait(900); p.lit = false;
      await S.think('（电话响了两声，停了。\n……电话的线，明明已经拔下来，接在你的电脑上了。）');
    } else if (m === 'corridor') {
      S.dark(.97); S.sfx('switch'); await S.wait(700); S.dark(null);
      await S.think('（楼道的灯灭了一下。黑暗里，402 的门缝底下好像有光。……红色的。）');
    }
  }

  /* ---------------- 房间：电脑 ---------------- */
  async function pcUse(S) {
    const f = S.f, pc = S.ent('pc');
    if (f.phase === 'run') {
      if (S.once('stuck')) {
        await S.narr('你抓住电脑后面的电话线，用力一拔——\n拔不下来。');
        S.sfx('heart');
        await S.narr('插头像是长在了调制解调器里。\n线是热的，在你手心里一跳、一跳，像一根血管。');
      } else await S.narr('电话线拔不下来。屏幕上，那句话还在一个字一个字地往外长。');
      return runGoal(S);
    }
    if (f.phase === 'end') return S.narr('屏幕黑着。');
    if (!f.pcOn) {
      await S.narr('你按下电源。\n主机「嗡」地一声，硬盘咔哒咔哒地转了起来。');
      pc.off = false; S.sfx('chime');
      await S.narr('Windows 98 的启动音。凌晨两点，这声音大得吓人——你赶紧把音箱的音量拧到最小。');
      f.pcOn = true;
    } else if (f.phase === 'cut' && S.once('pcCut')) {
      await S.narr('屏幕还亮着。调制解调器上的小灯，一盏也不亮了。');
    }
    wearCursor(S);
    await S.go('desk', 6, 6, 0);
  }

  /* ---------------- 桌面 ---------------- */
  async function startMenu(S) {
    const f = S.f;
    const r = await S.ask('「スタート」', ['离开电脑前（回到房间）', 'Windows の終了', 'キャンセル']);
    if (r === 2) return;
    if (r === 1) {
      if (f.phase === 'hunt' || f.phase === 'cut') {
        S.sfx('ding');
        await S.narr('「Windows を終了しています……」\n画面停在这一行，一动不动。\n……半分钟后，桌面又回来了。');
        if (f.phase === 'hunt') await S.think('（关不掉。……它不让我关。）');
        return;
      }
      return S.narr('现在关机的话，今晚就真的只剩下你一个人了。');
    }
    wearMe(S);
    await S.go('room', 7, 3, 3);
  }
  async function dialUse(S) {
    const f = S.f;
    if (f.phase === 'cut') return S.narr('「接続できません。モデムから応答がありません。」\n……这一次，是真的断了。');
    if (f.online) return S.narr('右下角的两台小电脑一闪一闪。「56000bps で接続中」。\n现在是テレホーダイ的时间——晚上十一点到早上八点，电话费不涨。');
    if (!f.cordIn) {
      await S.narr('「ダイヤルアップ接続」——你点了「接続」。');
      S.sfx('blip'); await S.wait(500);
      S.sfx('locked');
      await S.narr('「ダイヤルトーンがありません」\n（没有拨号音。）');
      await S.think('（电话线……对了，桌子后面空着。线被妈妈收走了。）');
      f.noTone = true;
      return S.goal('找到电话线（妈妈收到哪儿去了？）');
    }
    await S.narr('「ダイヤルアップ接続」——你点了「接続」。');
    for (let i = 0; i < 6; i++) { S.sfx('blip'); await S.wait(120); }
    S.sfx('phone'); await S.wait(500); S.sfx('tv'); await S.wait(400); S.sfx('glass');
    await S.narr('ピ、ポ、パ、ポ……\n然后是那串熟悉的尖叫：「ピ——、ギュルルル、ガ——、ザ——」。');
    S.ent('tray').lit = true; S.ent('pc').s.modem = 'on';
    f.online = true;
    await S.narr('「56000bps で接続しました」');
    S.goal('去聊天室（CHAT）');
  }
  async function chatIcon(S) {
    const f = S.f;
    if (f.phase === 'cut') return S.narr('「サーバーに接続できません」\n网已经断了。');
    if (!f.online) return S.narr('「サーバーに接続できません」\n……得先拨号上网。');
    await S.go('chat', 13, 9, 3);
  }
  async function mailUse(S) {
    const f = S.f;
    const ic = S.ent('i_mail'); ic.s.flash = false;
    await S.narr('Outlook Express。收件箱里只有几封信：班级通知、kaz 的恶作剧，还有……');
    await S.note('mail');
    if (!f.readMail) {
      f.readMail = true;
      await S.think('（那天早上我点开过附件。屏幕白了一下，什么都没发生。我还以为是千夏发错了。）');
      await S.think('（地址最后那几位是乱码……要是能看清楚就好了。）');
    }
    huntGoal(S);
  }
  async function ieUse(S) {
    const f = S.f;
    if (f.phase === 'cut') return S.narr('「ページを表示できません」\n——线已经断了。');
    if (!f.online) return S.narr('「ページを表示できません」\n没有连上网。');
    if (f.page) { S.sfx('blip'); return S.go('page', 9, 6, 3); }
    const v = await S.keypad('地址栏　http://www2.kumo.ne.jp/~room/＿＿＿＿/', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 4);
    if (v == null) return;
    if (v === '7402') {
      f.page = true; S.sfx('blip');
      await S.narr('沙沙沙……\n进度条走得很慢。页面从上往下，一行一行地加载出来。');
      return S.go('page', 9, 6, 3);
    }
    if (v === '7401') {
      S.sfx('whisper');
      await S.narr('页面一片白。正中间一行小字：\n「このページは準備中です。もうすぐ完成します。」\n（本页正在准备中。马上就好。）');
      return S.think('（7401……是我家。）');
    }
    S.sfx('locked');
    await S.narr('「404 Not Found」\n……不是这个。');
    if (f.ruleKnown && !f.knowRoom) await S.think('（「搬到上一个看过的人的房间号」……千夏家是几号来着？门牌上写着。）');
  }
  async function myPcUse(S) {
    const f = S.f;
    if (!S.ent('expwin').hidden) return S.narr('「启动」文件夹已经开着了。');
    if (!f.knowStartup) return S.narr('マイコンピュータ。C 盘里有几千个文件夹……\n不知道该从哪儿找起。');
    const r = await S.ask('C:\\WINDOWS\\スタートメニュー\\プログラム\\', ['打开「スタートアップ」（启动）', '算了']);
    if (r) return;
    S.sfx('open');
    for (const id of ['expwin', 'expx', 'f1', 'f2', 'f3', 'f4']) S.show(id);
    f.explorer = true;
    await S.narr('「启动」文件夹打开了。\n开机时会自己跑起来的东西，都住在这里。里面有四个图标。');
    huntGoal(S);
  }
  async function expClose(S) {
    if (S.f.phase === 'cut') return S.narr('不能关。……它还在里面。');
    for (const id of ['expwin', 'expx', 'f1', 'f2', 'f3', 'f4']) S.hide(id);
    S.sfx('close');
  }
  async function popDUse(S) {
    const f = S.f, n = f.stage;
    await S.narr('一个灰色的小窗口，标题栏上什么都没写。拖不动。');
    await popSay(S, n);
    const r = await S.ask(n >= 4 ? '……再关一次，下一个就是最后一个了。' : '窗口里只有一行字，和一个「OK」按钮。', ['关掉它（×）', '别管它']);
    if (r === 1) return S.think(n >= 3 ? '（不能再让它长了。）' : '（不关，它就一直挂在那儿。……也好。）');
    S.sfx('switch'); S.hide('popD');
    await S.wait(900);
    if (n >= 4) return lastPopup(S);
    const P = [[9, 1], [10, 9], [3, 9]]; f.popI = ((f.popI || 0) + 1) % 3;
    S.place('popD', P[f.popI][0], P[f.popI][1]);
    setStage(S, n + 1);
    await S.narr('窗口消失了。\n……一秒钟之后，它在另一个地方弹了出来。');
    await popSay(S, n + 1);
    await S.think(n + 1 >= 4 ? '（只差最后一个字了……不能再关了！）' : '（每关一次，就长一截。）');
    if (n + 1 >= 4) S.show('redwash');
  }

  /* ---------------- 启动文件夹里的四个文件 ---------------- */
  async function fileUse(S, e) {
    const f = S.f, id = e.id;
    if (id === 'f1') return S.narr('「ATOK12」——日语输入法的常驻程序。\n修改日期：1999/04/02 19:20。买电脑那天，电器店的人装的。');
    if (id === 'f2') return S.narr('「Microsoft Office ショートカット バー」\n修改日期：1999/04/02 19:22。你从来没用过它。');
    if (id === 'f3') {
      await S.narr('「akai_heya.exe」\n修改日期：1999/11/28 23:12　大小：12KB');
      await S.think(f.kazJoke ? '（kaz 说过，这是他上个月寄来的恶作剧软件。）' : '（akai_heya……赤い部屋？）');
      if (f.phase !== 'hunt') return;
      const r = await S.ask('要删掉它吗？', ['删除', '算了']); if (r) return;
      S.hide('f3'); S.sfx('cut');
      await S.narr('「ファイルを削除しました」');
      await S.wait(600); S.sfx('laugh');
      if (f.stage < 4) {
        setStage(S, f.stage + 1);
        await S.narr('「叮」。\n桌面上的那个窗口，像是在笑。');
        await popSay(S, f.stage);
        if (f.stage >= 4) S.show('redwash');
      }
      return S.think('（不是这个……！kaz 说过——哪天中招，它就是哪天住进来的。）');
    }
    /* f4：没有名字的文件 */
    if (f.phase === 'cut') return finale(S);
    await S.narr('一个没有名字的图标。白色的，什么图案都没有。\n修改日期：1999/12/05 04:44　大小：4,444 字节');
    await S.think(f.readMail ? '（04:44……和千夏那封邮件的时间，一模一样。）' : '（1999年12月5日，早上四点四十四分。……这个时间，好像在哪儿见过。）');
    const r = await S.ask('要删掉它吗？', ['删除', '算了']); if (r) return;
    return startRun(S);
  }

  /* ---------------- 危险：顺着电话线 ---------------- */
  async function startRun(S) {
    const f = S.f;
    S.sfx('blip');
    await S.narr('「このファイルを削除しますか？」——你按下了「はい」。');
    S.sfx('locked');
    await S.narr('「削除できません：ファイルは使用中です。」\n（无法删除：文件正在使用中。）');
    S.ent('tray').lit = 'mad'; S.ent('pc').s.modem = 'mad';
    await S.narr('右下角，拨号连接的两台小电脑开始疯狂地闪：送信、送信、送信——\n它在顺着电话线，往外面传什么东西。');
    setStage(S, Math.max(3, f.stage));
    S.show('popD');
    for (let i = 1; i <= 7; i++) { S.show('sp' + i); S.ent('sp' + i).num = f.stage; S.sfx('ding'); await S.wait(140); }
    S.fx('glitch'); S.shake(500, 2);
    await popSay(S, f.stage);
    await S.think('（线……电话线！只要把线拔了——）');
    f.phase = 'run'; f.redN = 0;
    const pc = S.ent('pc'); pc.red = true; pc.light = { r: 4, col: 'rgba(255,40,40,.28)', dx: 10, dy: 0 };
    wearMe(S);
    await S.go('room', 7, 3, 3);
    S.cp('run');
    runSetup(S);
    await S.narr('你一把推开椅子。\n地毯从书桌底下开始，一格一格地……变红了。');
  }
  function runSetup(S) {
    const f = S.f;
    for (const id of ['rpop1', 'rpop2', 'rpop3']) { const e = getEnt(id); if (e && !f['x_' + id]) { e.hidden = false; e.num = f.stage; } }
    if (f.stage >= 4) S.show('redwash');
    const tv = getEnt('tvh', 'home'); tv.off = false; tv.red = true; tv.light = { r: 3, col: 'rgba(255,40,40,.22)' };
    getEnt('rwin', 'room').red = true; getEnt('rwin', 'room').s.all = true;
    getEnt('d402', 'corridor').s.glow = true; getEnt('mdf', 'corridor').s.glow = true;
    for (const id of ['fl1', 'fl2', 'fl3']) getEnt(id, 'corridor').s.fl = true;
    S.amb('otherworld');
    S.timer(f.stage >= 4 ? 35 : 45, '赤い部屋', runTick);
    runGoal(S);
  }
  async function runTick(S) {
    const f = S.f;
    if (f.stage >= 4) return lastPopup(S);
    setStage(S, 4); S.fx('glitch'); S.shake(500, 2);
    await popSay(S, 4);
    await S.think('（又长了……只差最后一个字了！）');
    S.show('redwash');
    S.timer(35, '赤い部屋', runTick);
  }
  async function rpopUse(S, e) {
    const f = S.f;
    if (f.phase !== 'run') return;
    await S.narr('一个灰色的窗口，浮在半空中。\n透过它看过去，后面的东西全是红的。');
    await popSay(S, f.stage);
    const r = await S.ask(f.stage >= 4 ? '再关一次，就是最后一个了。' : '它挡在路上。', ['关掉它（×）', '绕过去']);
    if (r) return;
    S.hide(e.id); f['x_' + e.id] = true; S.sfx('switch');
    if (f.stage >= 4) return lastPopup(S);
    setStage(S, f.stage + 1); S.fx('glitch');
    await popSay(S, f.stage);
    await S.think('（……又长了。不能再关了！）');
    S.show('redwash');
  }
  async function afterCut(S) {
    const f = S.f;
    S.clearTimer(); f.phase = 'cut';
    S.sfx('cut'); S.fx('flash'); S.shake(500, 3);
    await S.wait(400);
    for (const id of ['rpop1', 'rpop2', 'rpop3', 'redwash', 'popD']) S.hide(id);
    for (let i = 1; i <= 7; i++) S.hide('sp' + i);
    for (let i = 0; i < (f.redN || 0) && i < REDR.length; i++) S.tile(REDR[i][0], REDR[i][1], 'c', 'room');
    f.redN = 0;
    const tv = getEnt('tvh', 'home'); tv.off = true; tv.red = false;
    const rw = getEnt('rwin', 'room'); rw.red = false; rw.s.all = false;
    getEnt('d402', 'corridor').s.glow = false; getEnt('mdf', 'corridor').s.glow = false;
    for (const id of ['fl1', 'fl2', 'fl3']) getEnt(id, 'corridor').s.fl = false;
    const pc = getEnt('pc', 'room'); pc.red = false; pc.s.modem = null; pc.s.pop = false; pc.light = { r: 3.8, col: 'rgba(80,150,255,.22)', dx: 10, dy: 0 };
    getEnt('tray', 'desk').lit = false;
    S.dark(null); S.amb('night');
    await S.narr('……\n楼道的灯不闪了。远处有一辆车开过去。\n安静得能听见自己的心跳。');
    S.ent('chi').alpha = 0; S.place('chi', 8, 2, 0);
    await S.alpha('chi', .7, 900);
    await S.narr('402 的门口，那个穿水手服的女孩还站在那里。\n她朝你轻轻点了点头。');
    await S.alpha('chi', 0, 1200);
    await S.think('（……还没完。那个文件还在硬盘里。下一次连上网，它就会回来。）');
    S.goal('回到电脑前，删掉那个没有名字的文件');
    S.cp('cut');
  }

  /* ---------------- 聊天室 ---------------- */
  async function chatIntro(S) {
    const f = S.f;
    await S.narr('「深夜零時の怪談部屋」。\n白底黑字的小聊天室。你和千夏，都是这里的常客。');
    chatPush(S, 'sys', '＊＊＊ HARU さんが入室しました ＊＊＊'); S.sfx('ding');
    await cs(S, 'ムラサキ', '啊，HARU。好久不见。');
    await cs(S, 'kaz', '哟。考试周还上网，胆子不小（笑）');
    const r = await S.ask('（敲键盘）', ['「睡不着。」', '「……千夏的事，你们听说了吗？」']);
    if (r === 0) {
      await cs(S, 'HARU', '睡不着。');
      await cs(S, 'ムラサキ', '我也是。……对了，ちなつ最近怎么不来了？上周六之后就没见过她。');
    } else await cs(S, 'HARU', '……千夏的事，你们听说了吗？');
    await cs(S, 'HARU', '千夏她……上周六夜里，走了。');
    await cs(S, 'HARU', '告别式是前天。');
    await S.wait(900);
    await cs(S, 'kaz', '……');
    await cs(S, 'ムラサキ', '骗人的吧。');
    await cs(S, 'ムラサキ', '她上周六还在这儿。说她找到了「赤い部屋」，要一个人看到最后——');
    await cs(S, 'kaz', '喂，别说了。');
    await cs(S, 'ムラサキ', '……HARU，你自己翻翻那天晚上的记录吧。点下面的「LOG」。');
    f.phase = 'chat1';
    S.goal('看看那天晚上的聊天记录（LOG）');
  }
  async function logUse(S) {
    await S.note('log');
    if (S.f.phase === 'chat1') return chinatsuJoins(S);
  }
  async function chinatsuJoins(S) {
    const f = S.f;
    f.phase = 'chat2';
    await S.think('（……「看到最后一个窗口之前就关掉嘛」。千夏总是这样，说什么都像在开玩笑。）');
    await S.wait(900);
    S.sfx('ding'); chatPush(S, 'sys', '＊＊＊ ちなつ さんが入室しました ＊＊＊');
    S.show('av_c');
    await S.narr('「叮」。\n＊＊＊ ちなつ さんが入室しました ＊＊＊');
    getEnt('pager', 'room').lit = true; f.pagerMsg = true;
    await cs(S, 'kaz', '……谁？');
    await cs(S, 'ちなつ', '遥', { style: 'whisper' });
    await cs(S, 'ちなつ', '你　看到了吗', { style: 'whisper' });
    await cs(S, 'ムラサキ', '谁在用她的名字？这玩笑一点都不好笑！');
    await cs(S, 'ちなつ', '不要　关　窗口', { style: 'whisper' });
    S.sfx('ding'); chatPush(S, 'sys', '＊＊＊ ちなつ さんが退室しました ＊＊＊');
    S.hide('av_c');
    await S.narr('＊＊＊ ちなつ さんが退室しました ＊＊＊');
    await S.wait(1000);
    setStage(S, 1); S.show('popC'); S.shake(200, 1);
    S.sfx('ding');
    await S.narr('「叮」。\n一个灰色的小窗口，弹在了聊天记录正中间。标题栏上什么都没写。');
    await popSay(S, 1);
    await S.ask('窗口里只有一个字，和一个「OK」按钮。', ['点「×」关掉它']);
    S.hide('popC'); S.sfx('switch');
    await S.wait(1100);
    setStage(S, 2); S.show('popC');
    await S.narr('窗口消失了。\n……一秒钟之后，它又弹了出来。');
    await popSay(S, 2);
    await S.think('（……多了两个字。）');
    await cs(S, 'kaz', 'HARU？怎么不说话了。');
    await cs(S, 'HARU', '弹出来一个窗口。关掉，又出来了。字变多了。');
    await cs(S, 'kaz', 'ブラクラ吧。那种一关就多一个的。别乱点，越关越多。');
    await cs(S, 'ムラサキ', '……是赤い部屋。');
    await cs(S, 'ムラサキ', '记录里写着呢。关一次，长一截。等那句话问完——');
    await cs(S, 'kaz', '停！那都是 Flash 做出来吓人的。');
    await cs(S, 'kaz', '真有东西自己弹出来，就是你电脑里进了程序。找到本体，删掉，完事。');
    await cs(S, 'kaz', '最近有没有打开过谁发来的附件？');
    await S.think('（附件……千夏走的那天早上，给我发过一封邮件。我点开过它的附件。）');
    S.hide('popC'); S.show('popD');
    S.ent('i_mail').s.flash = true;
    await S.narr('灰色的窗口晃了一下，从聊天窗口里滑了出去——落到了桌面上。');
    S.sfx('whisper'); chatPush(S, 'sys', '＊＊＊ 　 さんが入室しました ＊＊＊'); S.show('av_r');
    await S.narr('＊＊＊ 　 さんが入室しました ＊＊＊\n\n……名单上，多了一个没有名字的人。');
    f.phase = 'hunt'; f._am = 40;
    getEnt('rwin', 'room').red = true;
    huntGoal(S);
    S.cp('hunt');
  }
  async function kazTalk(S) {
    const f = S.f;
    if (f.phase !== 'hunt') return cs(S, 'kaz', '先看记录吧。……那天晚上的事，我不想再说一遍了。');
    if (!f.kazTold) {
      f.kazTold = true; f.knowStartup = true; f.kazJoke = true;
      await cs(S, 'HARU', 'kaz，那种程序会藏在哪儿？');
      await cs(S, 'kaz', 'Win98 的话，开机自动跑的东西，一般塞在「スタートアップ」（启动）文件夹里。');
      await cs(S, 'kaz', '「我的电脑」→ C 盘 → WINDOWS → スタートメニュー → プログラム → スタートアップ。');
      await cs(S, 'kaz', '名字会伪装的，别看名字。看「修改日期」——你哪天中的招，它就是哪天住进去的。');
      await cs(S, 'kaz', '对了，里面要是有个 akai_heya.exe，那是我上个月寄给你的恶作剧软件（笑）。删错了别怪我。');
      return huntGoal(S);
    }
    const L = [];
    if (!f.readMail) L.push('先看邮件。附件是什么，几点寄来的。');
    else if (!f.explorer) L.push('スタートアップ。从「我的电脑」进去找。');
    else L.push('看修改日期。哪天中招，就是哪天住进去的。……还有，别删我的 akai_heya.exe（笑）');
    L.push('……喂，HARU。你那边真的没事吧？');
    f._kz = ((f._kz ?? -1) + 1) % L.length;
    await cs(S, 'kaz', L[f._kz]);
  }
  async function muraTalk(S) {
    const f = S.f;
    if (f.phase !== 'hunt') return cs(S, 'ムラサキ', '……「LOG」。你看了就知道了。');
    if (!f.ruleKnown) {
      f.ruleKnown = true;
      await cs(S, 'ムラサキ', '……我知道的，全都告诉你。');
      await cs(S, 'ムラサキ', '赤い部屋，最早是在 BBS 上流传的一段文字。后来有人做成了 Flash，到处转来转去。');
      await cs(S, 'ムラサキ', '上网的时候，弹出一个窗口：「你喜欢红色的房间吗？」关掉，它又弹出来。字一次比一次多。');
      await cs(S, 'ムラサキ', '看到最后一个窗口的人……会死在自己的房间里。墙是红的。');
      await cs(S, 'ムラサキ', '网页上还有一张名单。看过的人的名字，会自己出现在上面。');
      await cs(S, 'ムラサキ', '有人说，回答「不喜欢」就没事；有人说，不管回答什么都一样。……没有人回来说过到底是哪种。');
      await cs(S, 'ムラサキ', '还有——ちなつ说过一句很怪的话。「它的地址会搬家。搬到上一个看过的人的房间号。」');
      await cs(S, 'HARU', '……房间号。');
      await S.think('（千夏的邮件里，地址最后那几位是乱码。……如果那是千夏家的房间号——）');
      return huntGoal(S);
    }
    let m;
    if (!f.knowRoom) m = '千夏家的房间号……你们是邻居吧？门牌上就写着。';
    else if (!f.page) m = '地址最后那几位，就是房间号。四位数。……你知道的吧。';
    else if (!f.knowStartup) m = '那种网页，常常把字藏起来——黑底黑字。用鼠标刷一下就看到了。';
    else m = 'HARU，删掉它。然后……今晚别再上网了。好吗？';
    await cs(S, 'ムラサキ', m);
  }
  async function avrUse(S) {
    const f = S.f;
    await S.narr('名单上那个没有名字的人。\n你点了它一下，私聊窗口弹了出来。光标一闪一闪——对方在打字。');
    S.sfx('whisper');
    const L = { 2: '房间　还没有　打扫好', 3: '快好了', 4: '马上　就好' };
    await S.say('　', L[clamp(f.stage || 2, 2, 4)], { style: 'whisper' });
  }
  async function inputUse(S) {
    const f = S.f;
    if (f.phase === 'chat1') return cs(S, 'HARU', '……LOG，我看看。');
    const r = await S.ask('（发言）', ['问 kaz：「那种程序会藏在哪儿？」', '问ムラサキ：「赤い部屋到底是什么？」', '算了']);
    if (r === 0) return kazTalk(S);
    if (r === 1) return muraTalk(S);
  }

  /* ---------------- 网页 ---------------- */
  async function nameRow(S) {
    const f = S.f;
    if (f.sawName) return S.narr('最后一行。光标还在一闪一闪。\n……它在等最后一个数字。');
    f.sawName = true;
    await S.narr('名单的最后一行还没有写完。\n光标一闪一闪，一个字一个字地往后打：');
    S.sfx('tick');
    await S.say('', '■ 1999.12.1_　佐伯 遥（7-40_', { style: 'big' });
    await S.think('（……是我的名字。）');
    S.fx('glitch'); S.sfx('sting');
    if ((f.stage || 0) < 3) {
      setStage(S, 3);
      await S.narr('「叮」。\n桌面上的那个窗口，自己又长了一截。');
      await popSay(S, 3);
    }
    S.show('i_akai'); S.ent('counter').s.n = 4445;
    huntGoal(S);
    S.cp('hunt');
  }
  async function secretUse(S) {
    const f = S.f, e = S.ent('secret');
    e.s.sel = true; S.sfx('select');
    await S.narr('你按住鼠标，从页面最底下那片黑色上拖过去。\n反白的地方，浮出了一行黑色的字：');
    await S.say('', '为什么要关掉窗口呢', { style: 'whisper' });
    await S.narr('你点了右键——「ソースの表示」。记事本弹了出来。');
    await S.note('source');
    f.readSource = true; f.knowStartup = true;
    await S.think('（「钥匙住在スタートアップ里」……「它顺着电话线回家」……）');
    huntGoal(S);
  }
  async function flashUse(S) {
    const f = S.f;
    await S.narr('「ENTER」——你点了下去。\n屏幕黑了一下，一个 Flash 动画开始加载。进度条是红色的。');
    S.amb('none'); S.sfx('tick');
    await S.card('', '', '有一个男孩，在学校里听说了一个传言——\n\n上网的时候，会弹出一个窗口。\n窗口里只有一句话：\n「你喜欢红色的房间吗？」');
    await S.card('', '', '男孩回到家，打开电脑。\n\n窗口真的弹出来了。\n他关掉它，它又弹出来。\n他再关，它再弹。\n每弹一次，那句话就长一点。');
    await S.card('', '', '最后，整个屏幕变成了红色。\n红色上面，是一列一列的名字。\n他在里面看到了同学的名字。\n\n最后一行，是他自己的。');
    await S.card('', '', '第二天，男孩没有来上学。\n\n听说，他房间的墙，\n全部被涂成了红色。');
    S.amb('otherworld');
    f.flash = true;
    await S.think('（……和ムラサキ说的一样。只是一个吓人的 Flash 而已。）');
    await S.think('（只是一个吓人的 Flash 而已。……对吧。）');
  }
  async function bbsUse(S) {
    const f = S.f;
    await S.narr('「ゲストブック」——留言板。\n\n■ k.t　「看过了」　4/4\n■ ゆみ　「看过了」　6/13\n■ しんご　「看过了」　11/28\n　（一模一样的留言，往下拉了很久很久）\n■ ちなつ　「看过了」　12/5');
    S.sfx('whisper');
    await S.narr('最后一条，是今天的。\n\n■ ちなつ　「遥　最底下　黑色的字」　12/10 02:41');
    f.bbs = true;
    await S.think('（千夏……）');
  }

  /* ---------------- 结局 ---------------- */
  async function finale(S) {
    const f = S.f;
    await S.narr('你把光标移到那个没有名字的图标上。\n手指搭在键盘上——');
    S.place('popF', 9, 7); S.ent('popF').s.str = '你喜欢红色的房间吗'; S.ent('popF').s.blink = true; S.ent('popF').num = 5;
    S.show('popF'); S.sfx('ding'); S.shake(300, 2);
    await S.narr('「叮」。\n最后一个窗口，弹在了屏幕正中间。\n没有网，没有线——它还是弹出来了。');
    await S.say('', '你喜欢红色的房间吗', { style: 'big' });
    await S.narr('……还差最后一个字。\n问号的那一笔，正在一点一点地往外长。');
    const r = await S.ask('它在等你看完。', ['闭上眼睛，按下 Shift + Delete', '……看完它']);
    if (r === 1) return badEnd(S);
    return goodEnd(S);
  }
  async function badEnd(S) {
    const f = S.f;
    S.amb('none');
    await S.narr('你睁大眼睛，看着最后那一笔，慢慢地长了出来。');
    S.ent('popF').s.str = null; S.ent('popF').s.blink = false; setStage(S, 5);
    await S.say('', POP[5], { style: 'big' });
    await S.wait(1300);
    S.sfx('whisper');
    await S.say('？？？', '……是的。', { style: 'whisper' });
    await S.narr('身后有人替你回答了。\n那声音很近，近得像是贴着你的后颈。');
    await S.scare('face', { spr: '@akai', dur: 1.1 });
    S.fx('blood');
    for (const [x, y] of REDR) S.tile(x, y, 'R', 'room');
    getEnt('redwash', 'room').hidden = false; getEnt('redwash', 'room').num = 9;
    const pc = getEnt('pc', 'room'); pc.red = true; pc.light = { r: 4, col: 'rgba(255,40,40,.3)', dx: 10, dy: 0 };
    wearMe(S); S.hidePlayer(true);
    await S.go('room', 5, 5, 3, { ms: 1200 });
    S.dark(.62);
    await S.wait(1600);
    await S.narr('……');
    return S.end({ bad: true, title: '你喜欢红色的房间吗？', text: '1999年12月10日早上，下了夜班回家的母亲，在女儿的房门口站了很久。\n房间的墙是红色的。\n……她记得，那原本是白色的。\n\n那个网页的名单上，多了一行：\n■ 1999.12.10　佐伯 遥（7-401）\n\n而那个地址，搬到了新的门牌号。\nhttp://www2.kumo.ne.jp/~room/7401/' });
  }
  async function goodEnd(S) {
    const f = S.f;
    S.sfx('cut');
    await S.narr('你闭着眼睛，摸到键盘左下角的 Shift，又摸到右上角的 Delete。\n按下去。');
    await S.narr('「このファイルを完全に削除しますか？」\n——はい。');
    S.hide('f4'); S.hide('i_akai'); S.sfx('glass'); S.fx('flash');
    await S.alpha('popF', 0, 900);
    await S.narr('再睁开眼睛的时候，屏幕上只剩下一片蓝绿色的桌面。\n那个窗口，没有再弹出来。');
    f.phase = 'end';
    S.hide('av_m'); S.hide('av_k'); S.hide('av_r');
    await S.go('chat', 13, 9, 3, { ms: 900 });
    chatPush(S, 'sys', '＊＊＊ 回線が切断されました ＊＊＊');
    await S.narr('聊天室的窗口，不知道什么时候自己打开了。\n最下面一行：＊＊＊ 回線が切断されました ＊＊＊');
    await S.wait(1200);
    S.sfx('ding'); chatPush(S, 'sys', '＊＊＊ ちなつ さんが入室しました ＊＊＊'); S.show('av_c');
    await S.narr('「叮」。\n＊＊＊ ちなつ さんが入室しました ＊＊＊');
    await S.think('（……线是断的。）');
    await cs(S, 'ちなつ', '遥');
    await cs(S, 'ちなつ', '谢谢你');
    await cs(S, 'ちなつ', '名单上的大家，都可以回家了');
    const r = await S.ask('（敲键盘）', ['「千夏，对不起。那封邮件，我什么都没发现。」', '「……你别走。」']);
    if (r === 0) { await cs(S, 'HARU', '千夏，对不起。那封邮件，我什么都没发现。'); await cs(S, 'ちなつ', '不是遥的错。是我不该看到最后'); }
    else { await cs(S, 'HARU', '……你别走。'); await cs(S, 'ちなつ', '笨蛋。明天还要考数学呢'); }
    await cs(S, 'ちなつ', '帮我跟妈妈说');
    await cs(S, 'ちなつ', '房间的墙，不是我涂的');
    await cs(S, 'ちなつ', '还有，联络网的下一个，以后就不是我了哦');
    await cs(S, 'ちなつ', '3470');
    S.sfx('ding'); chatPush(S, 'sys', '＊＊＊ ちなつ さんが退室しました ＊＊＊');
    await S.alpha('av_c', 0, 900);
    await S.narr('＊＊＊ ちなつ さんが退室しました ＊＊＊');
    await S.think('（3470。サ、ヨ、ナ、ラ。）');
    await S.fade(1, 1400);
    await S.card('早上七点', '1999年12月10日', '门锁「咔哒」一声。妈妈下夜班回来了。\n「遥？怎么趴在电脑前面睡着了……\n　电话线怎么扔了一地？」\n\n你什么都没有解释。\n你只是抱着她，抱了很久。');
    await S.end({ title: '第三夜　完', text: '那天下午，NTT 的人来修楼道里的端子盘，说线「像是被什么东西咬断的」。\n\n后来，那个地址再也打不开了。\n402 门上的白纸撕掉了。新住户搬进来的那天，你在门口放了一小束满天星。\n\n……只是有时候，深夜一个人上网，右下角的小电脑会无缘无故地闪一下。\n你再也不会点开了。' });
  }

  /* ---------------- 房间里的小物件 ---------------- */
  async function rwinUse(S) {
    const f = S.f, w = S.ent('rwin');
    if (f.phase === 'run') return S.narr('对面 8 号栋的窗户……一整栋楼，全都亮着红光。');
    if (w.red) return S.narr('对面 8 号栋，四楼最东边的那扇窗户亮着红光。\n……那一户，你记得一直是空着的。');
    await S.narr('窗外是对面的 8 号栋。凌晨两点，整栋楼只剩楼梯间的灯还亮着。\n几十栋一模一样的楼，几千扇一模一样的窗户。');
  }
  async function clockUse(S) {
    const t = { night: '凌晨两点零七分。', chat1: '两点十四分。', chat2: '两点十五分。', hunt: '两点三十几分。秒针走到「4」的时候，好像卡了一下。', run: '指针在疯狂地转。……停在了四点四十四分。', cut: '三点十分。秒针又正常地走起来了。', end: '三点十二分。' };
    await S.narr(t[S.f.phase] || t.night);
  }
  async function pagerUse(S) {
    const f = S.f, p = S.ent('pager');
    if (f.pagerMsg) {
      p.lit = false;
      await S.narr('你的 BP 机。屏幕上有一条新消息。\n发信号码那一栏，是一长串「4」。');
      S.sfx('whisper');
      await S.say('', 'ミタ？', { style: 'big' });
      return S.think('（「看到了吗？」……千夏的 BP 机，告别式那天放进棺材里了。）');
    }
    await S.narr('粉色的 BP 机。千夏也有一只一模一样的，两个人在车站前的店里一起买的。\n最后一条消息是上周六深夜，千夏发来的：「3470」。');
    await S.think('（3470，サ・ヨ・ナ・ラ。……我还以为她是在说晚安。）');
  }
  async function bagUse(S) {
    const f = S.f;
    await S.narr('书包。课本、笔袋、没写完的数学练习册……\n夹层里塞着一张折起来的油印纸。');
    await S.note('renraku');
    if (!f.knowRoom) { f.knowRoom = true; await S.think('（白石……7-402。千夏家。）'); }
    huntGoal(S);
  }
  async function memoUse(S) {
    await S.narr('「memo.txt」——你自己写的东西。\n\n12/5　千夏不接电话。\n12/6　班会。老师说千夏「因病」……没有人信。\n12/8　告别式。千夏的妈妈拉着我的手说，千夏是在自己房间里……她没有说下去。\n　　　有人在走廊里小声说，警察来的时候，千夏房间的墙……\n12/9　不想写了。');
  }
  async function docUse(S) {
    const f = S.f;
    const r = await S.ask('「My Documents」', ['purikura.bmp（大头贴扫描）', 'kashi.txt（抄的歌词）', '关闭']);
    if (r === 0) {
      if (f.phase === 'hunt' && S.once('puri')) {
        await S.narr('上周六和千夏一起拍的大头贴，用学校的扫描仪扫进来的。\n两个人比着「V」字，背景是粉红色的爱心——');
        S.sfx('sting'); S.fx('red');
        return S.narr('……千夏那一半的背景，是红色的。\n不是粉红。是红。');
      }
      return S.narr('上周六和千夏一起拍的大头贴。\n千夏在旁边用荧光笔写了一行歪歪扭扭的字：「ずっと友達☆」');
    }
    if (r === 1) return S.narr('抄下来的歌词。副歌那一段，你和千夏在卡拉 OK 连唱了三遍。');
  }
  async function binUse(S) {
    await S.narr('回收站。里面只有一个文件：「nengajo.txt」。\n今年本来说好了，要和千夏一起画年贺状的。');
  }
  async function trayUse(S) {
    const f = S.f, l = S.ent('tray').lit;
    if (l === 'mad') return S.narr('两台小电脑疯狂地闪：送信、送信、送信。');
    return S.narr(l ? '拨号连接的图标。两台小电脑一闪一闪：已连接 56000bps。' : '拨号连接的图标。灰的——没有连接。');
  }

  /* ---------------- 家里 ---------------- */
  async function phoneUse(S) {
    const f = S.f, p = S.ent('phone');
    if (f.phase === 'run') {
      if (!f.jackOut) {
        f.jackOut = true; p.s.cord = false; p.s.loose = true; S.ent('cord').s.loose = true; S.sfx('tear');
        await S.narr('你扑到电话插座前，一把拔下了那根灰色的线。\n插头「啪」地弹出来，落在地上。');
        await S.wait(600);
        p.lit = true; S.sfx('phone'); await S.wait(900); S.sfx('phone');
        await S.narr('——电话响了。\n电话机的线，你刚才明明已经拔下来了。');
        const r = await S.ask('「叮铃铃——叮铃铃——」', ['拿起听筒', '不接']);
        p.lit = false;
        if (r === 0) {
          await S.narr('你拿起了听筒。\n听筒里没有拨号音。只有风声，和很远很远的、敲键盘的声音。');
          await S.say('千夏（听筒里）', ['遥……', '线　在墙里', '外面的　箱子'], { style: 'whisper' });
          await S.think('（外面的箱子……楼道里的电话端子盘！整层楼的线，都是从那里接进来的！）');
        } else {
          await S.narr('电话响了七声，停了。');
          await S.think('（线拔了，它还在响……它还连着。线是从墙里走的——一直通到楼道里的端子盘！）');
        }
        return runGoal(S);
      }
      return S.narr('插座空着。线头躺在地上，像一条死掉的蛇。');
    }
    if (f.phase === 'cut' || f.phase === 'end') return S.narr('电话安安静静的。墙上的插座空着。');
    if (f.cordIn) return S.narr('电话机的线被你拔下来了。\n墙上的插座里，插着通往你房间的那根灰色长线。');
    if (S.has('cord')) {
      S.take('cord'); f.cordIn = true; p.s.cord = true; S.show('cord'); S.sfx('switch');
      await S.narr('你拔下电话机的线，换上那根灰色的长线。\n线沿着走廊一路拖进你的房间，插进电脑后面的调制解调器。「咔」。');
      await S.think('（家里只有这一个插座。我上网的时候，电话就打不进来了。）');
      return S.goal('回电脑前，拨号上网（DIAL）');
    }
    await S.narr('黑色的按键电话，线插在墙上的电话插座里。\n家里只有这一个插座——电话和电脑，只能用一个。');
    if (f.noTone) await S.think('（电脑的那根长线被妈妈收起来了……在她房间里吧。）');
  }
  async function dresserUse(S) {
    const f = S.f;
    if (!f.gotCord) {
      f.gotCord = true; S.give('cord');
      await S.narr('妈妈的五斗柜。最上面的抽屉里，整整齐齐地卷着一根灰色的电话线——十米长，是你的。');
      await S.narr('线下面压着一张纸：上个月的电话费账单。\n总金额被红笔圈了起来，旁边写着两个大大的「！！」。');
      return S.goal('把电话线接到客厅的电话插座上');
    }
    await S.narr('抽屉里还有妈妈的护士证、一叠排班表，和一个装着你小时候乳牙的小盒子。');
  }
  async function fridgeUse(S) {
    const f = S.f;
    await S.narr('冰箱门上，妈妈用磁铁压着一张便条：\n\n「遥へ\n　今晚夜班，早上七点回来。\n　电话费太贵了！テレホーダイ以外的时间不许上网。\n　电话线妈妈先收起来了。考试加油。　母」');
    if (!f.gotCord) {
      await S.think('（テレホーダイ是晚上十一点到早上八点……现在明明就是嘛。线应该在妈妈房间里。）');
      if (f.phase === 'night' && !f.cordIn) S.goal('去妈妈的房间找电话线');
    }
  }
  async function drawerUse(S) {
    const f = S.f;
    if (!f.gotDriver) {
      f.gotDriver = true; S.give('driver');
      await S.narr('厨房的抽屉：筷子、开瓶器、一捆橡皮筋……\n还有一把十字螺丝刀。你把它揣进了口袋。');
      return runGoal(S);
    }
    await S.narr('抽屉里只剩下筷子、开瓶器和橡皮筋。');
  }
  async function tvhUse(S) {
    const f = S.f;
    if (f.phase === 'run') return S.narr('满屏红色的雪花。\n雪花里有一行字在闪：「你喜欢红色的房间——」\n你不敢看完。');
    if (f.phase === 'hunt') return S.narr('电视黑着。\n黑色的屏幕上映出客厅，和客厅里站着的你。\n……你身后，和室的门口，好像也站着一个人。');
    return S.narr('电视。录像机里还卡着妈妈睡前看的刑侦剧录像带。');
  }

  /* ---------------- 楼道 ---------------- */
  async function door402(S) {
    const f = S.f;
    if (f.phase === 'run') return S.narr('门缝底下透出一线红光。\n……你不敢停下来。');
    if (f.phase === 'cut' || f.phase === 'end') return S.narr('「忌中」的白纸，被风吹得轻轻地动。');
    await S.narr('402。白石家。\n门上贴着一张白纸，黑框里写着两个字：「忌中」。');
    await S.narr('门牌：「7-402　白石」。\n门上的报纸投递口里，塞着一份 12 月 5 日的早报，一直没有人拿。');
    if (!f.knowRoom) { f.knowRoom = true; await S.think('（7-402……）'); }
    huntGoal(S);
  }
  async function mdfUse(S) {
    const f = S.f, m = S.ent('mdf');
    if (f.phase === 'cut' || f.phase === 'end') return S.narr('端子盘的盖子掉在地上。\n401 那对端子之间，只剩下一截像是烧焦了的断线。');
    if (f.phase !== 'run') {
      f.sawMdf = true;
      return S.narr('「電話端子盤」。灰色的铁箱子，盖子用四颗十字螺丝拧着。\n这一层五户人家的电话线，都是从这里分进各家的。');
    }
    if (!S.has('driver')) {
      await S.narr('螺丝拧得死死的，指甲都抠翻了——徒手根本打不开！');
      await S.think('（螺丝刀……厨房的抽屉里有一把！）');
      return runGoal(S);
    }
    if (!m.open) {
      S.sfx('open'); m.open = true;
      await S.narr('你哆嗦着拧下四颗螺丝。盖子「哐」地掉在地上。\n里面是五对端子，每一对都贴着门牌号。');
      S.sfx('heart');
      await S.narr('401 那一对线——是热的。\n线皮一鼓一鼓地跳，像是有什么东西，正顺着它往你家里爬。');
    }
    for (;;) {
      const r = await S.ask('扯断哪一根？', ['「401」——自己家', '「402」——千夏家', '「403」——隔壁的老爷爷家']);
      if (r === 0) break;
      if (r === 1) { await S.narr('402 的线早就拆掉了。\n空着的端子上，缠着一根长长的、黑色的头发。'); continue; }
      await S.narr('403 的线是凉的。门里传出深夜购物节目的声音。\n——不是这根！');
    }
    m.s.cut = true; S.take('driver');
    await S.narr('你抓住 401 的那对线，用尽全身的力气——');
    return afterCut(S);
  }

  defChapter({
    id: 'akaheya', n: 3, title: '赤い部屋', sub: '弹出来的窗口只有一句话。关掉它，它会再弹出来——比上一次长一点。', origin: '日本网络都市传说', color: '#7a0a14',
    icon: '@me', iconDir: 3, iconX: 22, amb: 'room', floor: 'carpet', wall: 'paper', dark: .72, plr: 3.2,
    thumb(g, w, h) {
      const x = 12, y = 10;
      g.fillStyle = '#cdc4ae'; g.fillRect(x, y, 60, 46); g.fillStyle = '#e2dac6'; g.fillRect(x, y, 60, 2);
      g.fillStyle = '#0b5a5a'; g.fillRect(x + 5, y + 5, 50, 34);
      const pops = [[x + 8, y + 9], [x + 16, y + 15], [x + 24, y + 21]];
      pops.forEach(([a, b], i) => {
        g.fillStyle = '#000'; g.fillRect(a + 2, b + 2, 26, 14);
        g.fillStyle = '#c0c0c0'; g.fillRect(a, b, 26, 14); g.fillStyle = i === 2 ? '#a00000' : '#000080'; g.fillRect(a + 1, b + 1, 24, 3);
        g.fillStyle = '#fff'; g.fillRect(a + 2, b + 6, 22, 6); g.fillStyle = '#c00000'; for (let k = 0; k < 2 + i * 2; k++) g.fillRect(a + 3 + k * 3, b + 8, 2, 2);
      });
      g.fillStyle = '#b4aa94'; g.fillRect(x + 22, y + 46, 16, 4); g.fillStyle = '#cdc4ae'; g.fillRect(x + 14, y + 50, 32, 3);
      const gr = g.createRadialGradient(x + 30, y + 22, 2, x + 30, y + 22, 50); gr.addColorStop(0, 'rgba(255,40,40,.25)'); gr.addColorStop(1, 'rgba(255,40,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    },
    people: {
      me: { skin: '#f1cfb0', hair: '#1a1416', hs: 'bob', top: '#8a9ab8', top2: '#dfe2ec', bottom: '#5a6478', shoes: '#d8d0c8' },
      chinatsu: { key: 'akaheya-chinatsu', skin: '#e4e0e2', hair: '#121014', hs: 'long', cover: true, top: '#252c50', top2: '#e8e8f0', skirt: true, bottom: '#252c50', ghost: true,
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT, 8, 1, '#e8e8f0'); R(7, G.tT + 1, 2, 2, '#b02a2a'); } } },
      akai: { key: 'akaheya-akai', skin: '#d8c4c4', hair: '#0a0606', hs: 'long', cover: true, redEye: true, top: '#7a0c10', robe: true, noFeet: true, ghost: true }
    },
    items: {
      cord: { name: '电话线（10米）', desc: '灰色的模块化电话线，十米长。妈妈怕电话费，把它收进了自己的五斗柜。' },
      driver: { name: '十字螺丝刀', desc: '厨房抽屉里的螺丝刀，把手上缠着一圈褪色的胶布。' }
    },
    notes: {
      log: { title: '聊天记录 · 12月4日（土）', text: '＊＊＊ 深夜零時の怪談部屋　ログ ＊＊＊\n\n23:41 ちなつ＞找到了！！赤い部屋！\n23:41 kaz＞又来（笑）\n23:42 ムラサキ＞真的假的。那个 Flash？\n23:42 ちなつ＞不是 Flash，是一个网页。黑底红字，还有访客计数器\n23:43 ムラサキ＞我听说的版本是：上网的时候弹出一个窗口，问「你喜欢红色的房间吗？」关掉了又会弹出来，字越来越多……\n23:43 ムラサキ＞看到最后一个窗口的人，会死在自己的房间里。墙被涂成红色\n23:44 kaz＞就是ブラクラ啦。用 JavaScript 写个 window.open 的循环，谁都会\n23:45 ちなつ＞网页上有一张名单，好多人的名字，后面还写着房间号\n23:45 ちなつ＞而且哦，听说它的地址会「搬家」，搬到上一个看过的人的房间号\n23:46 ムラサキ＞……ちなつ，别看了\n23:47 ちなつ＞我就看一下下。看到最后一个窗口之前就关掉嘛\n23:47 ちなつ＞明天讲给 HARU 听，吓死她（笑）\n23:52 ちなつ＞已经出来四个了\n23:58 ちなつ＞关不掉\n23:58 ちなつ＞kaz　关不掉\n23:59 kaz＞拔电源啊！！\n00:04 ムラサキ＞ちなつ？\n00:31 ムラサキ＞ちなつ，回句话\n\n＊＊＊ ちなつ さんが退室しました ＊＊＊（04:44）' },
      mail: { title: '千夏的邮件', text: '差出人：ちなつ <chinatsu_s@○○.ne.jp>\n日時：1999/12/05（日）04:44\n件名：みた？\n添付：akai.swf（4,444 バイト）\n\n遥，醒着吗？\n我看到了。赤い部屋。\n我一直关，一直关。最后一个窗口出来之前，我拔了电源。\n\n可是它又弹出来了。电源明明是拔掉的。\n\n地址给你：\nhttp://www2.kumo.ne.jp/~room/縺ゅ°縺/\n\n……不对。不要去。\n遥，不要\n\n（邮件到这里就断了。后面是一大片乱码。\n　那天早上你点开过附件——屏幕白了一下，什么都没有发生。）' },
      source: { title: '网页源代码（ソースの表示）', text: '<html>\n<head><title>赤い部屋</title></head>\n<body bgcolor="#000000" text="#ff0000">\n\n<!-- 欢迎光临。你喜欢红色的房间吗？ -->\n<!-- 窗口每被关掉一次，问题就会长一点。问完的时候，房间就打扫好了。 -->\n<!-- 看过这个房间的人，名字会自己写到名单上。 -->\n<!-- 房间的钥匙，装在信里，寄给你最好的朋友。 -->\n<!-- 钥匙住在「スタートアップ」里。它没有名字。 -->\n<!-- 它顺着电话线回家。 -->\n<!-- 地址会搬家：下一个门牌号，就是下一位客人的房间。 -->\n\n<font color="#000000">为什么要关掉窗口呢</font>\n</body>\n</html>' },
      renraku: { title: '2年B组　紧急联络网', text: '（夹在书包里的一张油印纸。联络网是从上往下，一个人打电话给下一个人。）\n\n班主任 → 井上（3-102）→ 佐伯（7-401）→ 白石（7-402）→ 中村（7-508）→ ……\n\n「白石」两个字上，被人用红笔划了一道。\n旁边是班主任的字：\n「白石同学家里，这段时间请不要打电话过去。\n　关于白石同学的事，请不要在电话里或者网上传播没有根据的传言。」\n\n联络网传到你这儿，下一个就是千夏。\n每一次，你在电话里说「下一个是你哦」，她都在那头笑。' }
    },
    legend: '「赤い部屋」（红色房间）是日本最早的网络怪谈之一。据说它在 1990 年代末先以文字的形式在网上流传，2000 年前后又出现了被大量转载的 Flash 动画版本：一个少年上网时，屏幕上弹出一个窗口，只有一句话——「あなたは赤い部屋が好きですか？」（你喜欢红色的房间吗？）。他关掉它，它又弹出来，句子一次比一次长；最后整个屏幕变成红色，上面列着一串人名，其中有他朋友的名字。第二天，少年死在自己的房间里，墙壁被涂成了红色。\n\n它诞生在拨号上网的年代。深夜的「テレホーダイ」（电话费包月）时段挤满了聊天室和个人主页，而「ブラクラ」（浏览器崩溃程序）——用脚本不停打开新窗口、直到电脑死机的恶作剧网页——让很多人真的被「关不掉的窗口」吓到过。有一种说法认为，赤い部屋的恐怖正是从这种真实的体验里长出来的：你以为自己掌控着屏幕，其实并没有。\n\n流传中出现了许多变体：有的说只要回答「不喜欢」就能得救，有的说怎么回答都一样；有的版本里，名单的最后会出现读者自己的名字；也有人把它和「看了就会被诅咒」的连锁信、诅咒录像带归为同一类。据报道，2004 年日本媒体在报道一起发生在小学里的悲剧时，提到当事人曾浏览过这个 Flash，它因此一度被广泛讨论，很多人也是在那时第一次听说它。\n\n如今，赤い部屋常被看作「网络怪谈」的起点之一：它把古老的「看见了就逃不掉」的禁忌，搬进了每个人家里那块发着光的屏幕。\n\n（本章中的绿台团地、佐伯遥、白石千夏、聊天室「深夜零時の怪談部屋」及其中的人物、「地址会搬到上一位看过的人的房间号」的说法、藏在「启动」文件夹里的无名文件、以及切断端子盘线路的破解方法，均为游戏虚构。）',
    start: { map: 'room', x: 6, y: 6, dir: 3 },
    resume: {
      hunt: async S => { huntGoal(S); },
      run: async S => { runSetup(S); },
      cut: async S => { S.goal('回到电脑前，删掉那个没有名字的文件'); }
    },
    async intro(S) {
      await S.card('第三夜　赤い部屋', '1999年12月10日　凌晨　千叶县・绿台团地 7号栋 401', '隔壁的千夏，五天前死了。\n大人们什么都不肯说。\n学校里只悄悄地流传着一句话——\n\n她房间的墙，是红色的。');
    },
    tick(S, dt) {
      const f = S.f;
      if (W.busy) return;
      if (f.phase === 'run') {
        f._rt = (f._rt || 0) + dt;
        if (f._rt > .5) { f._rt = 0; const n = f.redN || 0; if (n < REDR.length) { S.tile(REDR[n][0], REDR[n][1], 'R', 'room'); f.redN = n + 1; } }
      }
      if (f.phase === 'hunt') { f._am = (f._am ?? 40) - dt; if (f._am <= 0) { f._am = 55 + Math.random() * 25; S.after(0, ambient); } }
    },
    sprites: SPR3,
    tiles: TILES3,
    maps: {
      /* ---------------- 遥的房间 ---------------- */
      room: {
        amb: 'room', dark: .72, wall: 'paper', floor: 'carpet', plr: 3.1,
        tileOpts: { carpetC: '#3c4256' },
        rows: [
          '############',
          '############',
          '#cccccccccc#',
          '#cccccccccc#',
          '#cccccccccc#',
          '#cccccccccc#',
          '#cccccccccc#',
          '#cccccccccc#',
          '#cccccccccc#',
          '######c#####'],
        ents: [
          { id: 'rwin', x: 2, y: 1, spr: 'nwin', on: rwinUse },
          { x: 4, y: 1, spr: 'poster', col: '#2a2440', on: S => S.narr('视觉系乐队的海报。主唱的眼线画得比整张脸还用力。\n千夏说，这种发型一次要用掉半罐发胶。') },
          { x: 5, y: 1, spr: 'calendar2', on: S => S.narr('1999年12月。13 号那格写着「期末考·数学」。\n4 号那格画着一颗小小的爱心——那天放学，你和千夏去车站前拍了大头贴。') },
          { id: 'rclock', x: 9, y: 1, spr: 'wallclock', on: clockUse },
          { id: 'pc', x: 7, y: 2, w: 2, spr: 'crt', off: true, s: { modem: null, pop: false }, light: { r: 3.8, col: 'rgba(80,150,255,.22)', dx: 10, dy: 0 }, on: pcUse },
          { x: 10, y: 2, spr: 'bookshelf', on: S => S.narr('漫画、参考书、几本旧的《ムー》。\n最上面一层夹着一本「赤本」——大学入试真题集，封面是红色的。……你把它转了过去。') },
          { id: 'bed', x: 1, y: 4, h: 2, spr: 'bed', col: '#5a6a8a', on: S => S.narr(S.f.phase === 'run' ? '被子上……落了一层细细的、红色的粉末。' : '被子还是早上起床时的样子。\n你已经三个晚上没怎么睡了。') },
          { id: 'pager', x: 2, y: 4, spr: 'pager', solid: false, on: pagerUse },
          { x: 4, y: 5, w: 2, spr: 'lowtable', col: '#6a5038', on: S => S.narr('矮桌上摊着数学参考书。三角函数那一页，被自动铅笔戳了好几个洞。') },
          { id: 'bag', x: 4, y: 7, spr: 'bag', solid: false, on: bagUse },
          { x: 10, y: 5, spr: 'radicase', on: S => S.narr(S.f.phase === 'hunt' || S.f.phase === 'run' ? 'CD 收录机。你按下播放键。\n……沙沙的杂音里，有人在很小声地数数：一、二、三、四。四。四。' : 'CD 收录机。里面是千夏借你的那张 CD，一直没还。\n现在也还不了了。') },
          { x: 1, y: 8, spr: 'trashcan', on: S => S.narr('垃圾桶里是一团一团的草稿纸。\n其中一张上，你写了好几遍「千夏」，又全部涂掉了。') },
          { x: 10, y: 8, spr: 'box', on: S => S.narr('纸箱里是爸爸留下的旧电脑杂志。\n最上面一本的封面写着：「今すぐ始めるインターネット」。') },
          { id: 'redwash', x: 0, y: 0, w: 12, h: 2, spr: 'redwash', z: 1, solid: false, hidden: true, num: 6 },
          { x: 6, y: 9, spr: 'invisible', to: ['home', 4, 2, 0] }
        ],
        async enter(S, first) {
          const f = S.f;
          if (first) {
            f.phase = 'night'; f.stage = 0;
            await S.narr('凌晨两点零七分。\n妈妈今晚值夜班，整个家里只有你一个人。');
            await S.think('（又睡不着。一闭上眼睛，就是告别式上千夏的照片。）');
            await S.think('（上网吧。テレホーダイ的时间，聊天室里应该还有人。）');
            S.goal('打开电脑');
            return;
          }
          if (f.phase === 'hunt' && f.pagerMsg && S.once('pagerSeen')) { S.bubble('pager', '!', 1500); await S.think('（枕边的 BP 机，屏幕一闪一闪。）'); }
        }
      },
      /* ---------------- 家：客厅兼厨房、玄关、妈妈的和室 ---------------- */
      home: {
        amb: 'room', dark: .78, wall: 'plain', floor: 'linoleum', plr: 3,
        rows: [
          '#################',
          '#################',
          '#xxnnnnnnnn#tttt#',
          '#xxnnnnnnnn#tttt#',
          '#nnnnnnnnnnntttt#',
          '#nnnnnnnnnn#tttt#',
          '#nnnnnnnnnn#tttt#',
          '#nnnnnnnnnn#tttt#',
          '#################'],
        ents: [
          { id: 'fdoor', x: 1, y: 1, spr: 'steeldoor', s: { num2: '401' }, to: ['corridor', 3, 2, 0] },
          { x: 4, y: 1, spr: 'door', col: '#8a7a62', to: ['room', 6, 8, 3] },
          { x: 6, y: 1, spr: 'door', col: '#c8c4b8', on: S => S.narr(S.f.phase === 'run' ? '厕所的门后面，水箱在咕嘟咕嘟地响。' : '厕所。水箱滴答、滴答地漏着水。') },
          { x: 8, y: 1, spr: 'door', col: '#c8c4b8', on: S => S.narr(S.f.phase === 'run' ? '浴室里有放水的声音。\n……水龙头明明是关着的。' : '浴室。门缝里飘出一点肥皂的味道。') },
          { x: 10, y: 1, spr: 'calendar2', s: { mom: true }, on: S => S.narr('妈妈的排班表。12 月 10 日那一格写着「夜」。\n一个月里，有一半的格子都是「夜」。') },
          { x: 13, y: 1, spr: 'window', on: S => S.narr('和室的窗外，是对面 8 号栋黑漆漆的背影。\n楼下的自行车棚里，一盏灯忽明忽暗。') },
          { x: 2, y: 2, spr: 'getabako', on: S => S.narr('鞋柜上摆着一只招财猫，和一叠没拆的信。\n最上面一封，是 NTT 寄来的电话费账单。') },
          { x: 1, y: 3, spr: 'shoes', col: '#3a2a22', decal: true, on: S => S.narr('玄关只有你的乐福鞋。\n妈妈的护士鞋不在——她今晚值班。') },
          { id: 'tvh', x: 1, y: 5, spr: 'crtv', off: true, light: { r: 2.6, col: 'rgba(140,160,255,.15)' }, on: tvhUse },
          { x: 5, y: 4, w: 2, spr: 'table2', col: '#8a6a48', on: S => S.narr('餐桌上扣着一个盘子，下面是妈妈捏的两个饭团。\n便签：「遥へ　夜食。早点睡。母」') },
          { id: 'fridge', x: 1, y: 7, spr: 'fridge', on: fridgeUse },
          { x: 2, y: 7, spr: 'stove', on: S => S.narr('煤气灶上的锅里，是没喝完的味噌汤。早就凉了。') },
          { x: 3, y: 7, spr: 'counter', col: '#9a9a92', on: S => S.narr('水槽里泡着一个碗、一双筷子。\n水龙头滴答、滴答。') },
          { id: 'drawer', x: 4, y: 7, spr: 'counter', on: drawerUse },
          { id: 'phone', x: 10, y: 7, spr: 'phonestand', on: phoneUse },
          { id: 'cord', x: 4, y: 2, spr: 'cordpath', decal: true, solid: false, hidden: true },
          { x: 12, y: 2, spr: 'closet', on: S => S.narr('壁橱。妈妈的冬被，和一箱你小时候的玩具。') },
          { id: 'dresser', x: 15, y: 2, spr: 'dresser', col: '#6a4a34', on: dresserUse },
          { x: 13, y: 5, h: 2, spr: 'futon', col: '#8a5a6a', on: S => S.narr('妈妈的被褥铺得整整齐齐。枕边放着老花镜，和一本看到一半的文库本。') },
          { x: 15, y: 6, spr: 'butsudan', on: S => S.narr(S.f.phase === 'hunt' || S.f.phase === 'run' ? '小小的佛龛。外婆的照片前面供着一个橘子。\n线香早就烧完了。可是烟……一直往你房间那边飘。' : '小小的佛龛。外婆的照片前面供着一个橘子。\n你在心里说了一句：外婆，保佑千夏。') },
          { x: 12, y: 7, spr: 'vanity', on: S => S.narr('妈妈的梳妆台。镜子里的和室，比实际要红一点。\n……是窗外路灯的颜色吧。') },
          { x: 6, y: 3, spr: 'invisible', light: { r: 5, col: 'rgba(120,140,190,.05)', a: .35 } },
          { id: 'rpop1', x: 5, y: 2, w: 5, h: 1, spr: 'popup', s: { small: true }, hidden: true, num: 3, on: rpopUse },
          { id: 'rpop2', x: 1, y: 4, w: 5, h: 1, spr: 'popup', s: { small: true }, hidden: true, num: 3, on: rpopUse },
          { id: 'shadowH', x: 11, y: 4, spr: '@akai', hidden: true, solid: false }
        ],
        async enter(S, first) {
          const f = S.f;
          if (first && f.phase === 'night') await S.narr('客厅黑漆漆的，冰箱嗡嗡地响。\n妈妈房间的拉门开着，被褥铺得整整齐齐——她今晚值夜班。');
          if (f.phase === 'run' && S.once('runHome')) {
            const sh = S.ent('shadowH'); sh.alpha = 0; sh.hidden = false;
            await S.alpha('shadowH', .85, 500);
            await S.narr('客厅的电视自己开着，满屏红色的雪花。\n和室的门口……站着一个人影。');
            S.sfx('sting');
            await S.alpha('shadowH', 0, 400);
            await S.narr('一眨眼，又不见了。');
            runGoal(S);
          }
        }
      },
      /* ---------------- 团地外廊（4 楼） ---------------- */
      corridor: {
        amb: 'wind', dark: .8, wall: 'concrete', floor: 'concrete', plr: 3,
        legend: { 'Y': 'parapet', 'Z': 'nightview' },
        rows: [
          '####################',
          '####################',
          '#xxxxxxxxxxxxxxxxxx#',
          '#xxxxxxxxxxxxxxxxxx#',
          '#YYYYYYYYYYYYYYYxxx#',
          '#ZZZZZZZZZZZZZZZxxx#',
          '#ZZZZZZZZZZZZZZZ####'],
        ents: [
          { x: 3, y: 1, spr: 'steeldoor', s: { num2: '401' }, to: ['home', 1, 2, 0] },
          { id: 'fl1', x: 6, y: 1, spr: 'flamp', light: { r: 3.2, col: 'rgba(220,235,255,.12)', flick: true }, on: S => S.narr('日光灯管嗡嗡地响，一明一暗。\n几只小飞虫在灯罩里打转。') },
          { id: 'd402', x: 8, y: 1, spr: 'steeldoor', s: { num2: '402', kichu: true }, on: door402 },
          { id: 'fl2', x: 11, y: 1, spr: 'flamp', light: { r: 3.2, col: 'rgba(220,235,255,.12)', flick: true }, on: S => S.narr('灯罩里积着一层死掉的飞虫。') },
          { x: 13, y: 1, spr: 'steeldoor', s: { num2: '403' }, on: S => S.narr(S.f.phase === 'run' ? '403 的门里，电视在念一串名字。\n……念得很慢，像是在一个一个地确认。' : '403，独居的老爷爷家。\n这个点了，门里还传出深夜购物节目的声音。') },
          { id: 'fl3', x: 15, y: 1, spr: 'flamp', light: { r: 3.2, col: 'rgba(220,235,255,.12)', flick: true }, on: S => S.narr('楼梯口的灯。灯管的一头已经发黑了。') },
          { id: 'mdf', x: 17, y: 1, spr: 'mdf', on: mdfUse },
          { x: 9, y: 2, spr: 'bouquet', solid: false, on: S => S.narr('402 的门口放着几束花。菊花、百合，\n还有一小束粉色的满天星——是你前天放的。') },
          { x: 10, y: 2, spr: 'rolls', on: S => S.narr('靠在墙边的几卷新壁纸，白色的。\n旁边还有一卷撕下来的旧壁纸，卷得很紧，用胶带缠了好几圈。\n……看不见里面是什么颜色。你也不想看。') },
          { x: 14, y: 3, spr: 'bike', on: S => S.narr('谁家的自行车，车筐里落满了枯叶。') },
          { x: 10, y: 4, spr: 'invisible', solid: true, on: S => S.narr('栏杆外面，是一整片团地。\n几十栋一模一样的楼，几千扇一模一样的窗户。\n每一扇后面，都可能有一台亮着的电脑。') },
          { x: 17, y: 5, spr: 'stairsdown', on: S => S.narr(S.f.phase === 'run' ? '楼梯底下黑得像一口井。\n不能往下跑——线在这一层！' : '楼梯通往一楼的信箱。\n凌晨两点，不会有人上来。') },
          { id: 'rpop3', x: 4, y: 3, w: 5, h: 1, spr: 'popup', s: { small: true }, hidden: true, num: 3, on: rpopUse },
          { id: 'chi', x: 8, y: 2, spr: '@chinatsu', hidden: true, solid: false }
        ],
        async enter(S, first) {
          const f = S.f;
          if (first && f.phase !== 'run') await S.narr('团地的外廊。十二月的风从栏杆外面灌进来。\n一排一模一样的铁门，一盏一盏一模一样的日光灯。');
          if (f.phase === 'run' && S.once('runCor')) {
            S.dark(.9);
            const c = S.ent('chi'); c.alpha = 0; S.place('chi', 8, 2, 0); c.alpha = 0;
            await S.alpha('chi', .9, 900);
            await S.narr('402 的门口，站着一个穿水手服的女孩。\n长长的头发垂在脸前面，看不清脸。');
            S.sfx('whisper');
            await S.say('千夏', '……遥。', { style: 'whisper' });
            S.face('chi', 2); S.bubble('chi', '!', 1500);
            await S.say('千夏', '那边的　箱子。快。', { style: 'whisper' });
            await S.alpha('chi', 0, 900);
            await S.think('（千夏……）');
            runGoal(S);
          }
        }
      },
      /* ---------------- 电脑桌面 ---------------- */
      desk: {
        amb: 'tv', dark: .22, darkC: '#00030c', plr: 6, floor: 'desktop', speed: .9,
        legend: { 'B': 'bezel', 'T': 'taskbar' },
        rows: [
          'BBBBBBBBBBBBBBBBBBBB',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'BTTTTTTTTTTTTTTTTTTB',
          'BBBBBBBBBBBBBBBBBBBB'],
        ents: [
          { id: 'i_pc', x: 2, y: 2, spr: 'icon', s: { k: 'pc', lab: 'PC' }, on: myPcUse },
          { id: 'i_doc', x: 2, y: 4, spr: 'icon', s: { k: 'docs', lab: 'DOCS' }, on: docUse },
          { id: 'i_bin', x: 2, y: 6, spr: 'icon', s: { k: 'trash', lab: 'BIN' }, on: binUse },
          { id: 'i_ie', x: 2, y: 8, spr: 'icon', s: { k: 'ie', lab: 'WEB' }, on: ieUse },
          { id: 'i_chat', x: 4, y: 2, spr: 'icon', s: { k: 'chat', lab: 'CHAT' }, on: chatIcon },
          { id: 'i_mail', x: 4, y: 4, spr: 'icon', s: { k: 'mail', lab: 'MAIL' }, on: mailUse },
          { id: 'i_dial', x: 4, y: 6, spr: 'icon', s: { k: 'dial', lab: 'DIAL' }, on: dialUse },
          { id: 'i_memo', x: 4, y: 8, spr: 'icon', s: { k: 'memo', lab: 'MEMO' }, on: memoUse },
          { id: 'i_akai', x: 6, y: 2, spr: 'icon', s: { k: 'akai', lab: '' }, hidden: true, on: S => S.narr('桌面上多了一个红色的图标。下面的名字是空白的。\n你没有点它。……你不敢点它。') },
          { id: 'expwin', x: 8, y: 4, w: 10, h: 6, spr: 'expwin', decal: true, solid: false, hidden: true },
          { id: 'expx', x: 17, y: 4, spr: 'xsm', hidden: true, on: expClose },
          { id: 'f1', x: 9, y: 6, spr: 'icon', s: { k: 'lnk', lab: 'ATOK' }, hidden: true, on: fileUse },
          { id: 'f2', x: 11, y: 6, spr: 'icon', s: { k: 'lnk', lab: 'MSO' }, hidden: true, on: fileUse },
          { id: 'f3', x: 13, y: 6, spr: 'icon', s: { k: 'exe', lab: 'AKAI' }, hidden: true, on: fileUse },
          { id: 'f4', x: 15, y: 6, spr: 'icon', s: { k: 'blank', lab: '' }, hidden: true, on: fileUse },
          { id: 'popD', x: 9, y: 1, w: 8, h: 2, spr: 'popup', hidden: true, num: 2, on: popDUse },
          { id: 'popF', x: 9, y: 7, w: 8, h: 2, spr: 'popup', hidden: true, num: 5, z: 1 },
          ...[[6, 1], [12, 3], [1, 10], [15, 9], [7, 9], [16, 2], [10, 10]].map(([x, y], i) => ({ id: 'sp' + (i + 1), x, y, spr: 'minipop', z: 1, solid: false, hidden: true, num: 3 })),
          { id: 'startbtn', x: 1, y: 11, w: 2, spr: 'startbtn', on: startMenu },
          { id: 'tray', x: 16, y: 11, spr: 'tray', on: trayUse },
          { id: 'tclock', x: 17, y: 11, w: 2, spr: 'tclock', s: { tm: '2:09' }, on: S => S.narr('任务栏右下角的时钟：' + (S.ent('tclock').s.tm || '') + '。') }
        ],
        async enter(S, first) {
          const f = S.f;
          S.ent('tclock').s.tm = { night: '2:09', chat1: '2:14', chat2: '2:15', hunt: '2:31', run: '4:44', cut: '3:10', end: '3:12' }[f.phase] || '2:09';
          if (first) await S.narr('蓝绿色的桌面。\n盯着屏幕太久，你觉得自己好像缩进了里面——变成了那个小小的白色箭头。');
          if (f.phase === 'night') return S.goal(f.online ? '去聊天室（CHAT）' : f.cordIn ? '拨号上网（DIAL）' : f.noTone ? '找到电话线（妈妈收到哪儿去了？）' : '连上网（DIAL：拨号连接）');
          if (f.phase === 'chat1') return S.goal('看看那天晚上的聊天记录（CHAT → LOG）');
          if (f.phase === 'hunt') return huntGoal(S);
          if (f.phase === 'cut' && S.once('cutDesk')) {
            await S.narr('桌面安静得可怕。所有的弹窗都不见了。\n只有「启动」文件夹还开着。那个没有名字的图标，白得刺眼。');
            S.goal('删掉那个没有名字的文件');
          }
        }
      },
      /* ---------------- 聊天室 ---------------- */
      chat: {
        amb: 'tv', dark: .2, darkC: '#00030c', plr: 6, floor: 'chatlist', floor2: 'chatlog', speed: .9,
        legend: { 'B': 'bezel', 'H': 'wtitle', 'S': 'wsep', 'I': 'chatin', 'T': 'taskbar' },
        rows: [
          'BBBBBBBBBBBBBBBBBBBB',
          'BHHHHHHHHHHHHHHHHHHB',
          'B,,,,,,,,,,,,,S....B',
          'B,,,,,,,,,,,,,S....B',
          'B,,,,,,,,,,,,,S....B',
          'B,,,,,,,,,,,,,S....B',
          'B,,,,,,,,,,,,,S....B',
          'B,,,,,,,,,,,,,S....B',
          'B,,,,,,,,,,,,,S....B',
          'B,,,,,,,,,,,,,,....B',
          'BIIIIIIIIIIIIIIIIIIB',
          'BTTTTTTTTTTTTTTTTTTB',
          'BBBBBBBBBBBBBBBBBBBB'],
        ents: [
          { x: 1, y: 1, w: 17, spr: 'ttl', decal: true, solid: false, s: { str: '深夜零時の怪談部屋 － チャット' } },
          { id: 'xbtn', x: 18, y: 1, spr: 'xbtn', on: async S => { if (S.f.phase === 'end') return; await S.go('desk', 4, 3, 0); } },
          ...[
            ['sys', '＊＊＊ ムラサキ さんが入室しました ＊＊＊'], ['kaz', '十一点了～テレホタイム突入'], ['ムラサキ', '今晚讲点什么好呢'], ['kaz', '讲点不吓人的'],
            ['ムラサキ', '那就不叫怪谈了（笑）'], ['kaz', '……最近大家都不怎么说话啊'], ['ムラサキ', '考试周嘛'], ['kaz', '嗯']
          ].map(([w, m], i) => ({ id: 'cl' + i, x: 1, y: 2 + i, w: 13, spr: 'cline', decal: true, solid: false, text: w === 'sys' ? m : w + '＞' + m, s: { c: CC[w] }, on: (S, e) => S.narr(e.text || '（空行）') })),
          { x: 15, y: 2, w: 4, spr: 'ttl', decal: true, solid: false, s: { str: '参加者', c2: '#404040' } },
          { id: 'av_m', x: 15, y: 3, spr: 'avatar', col: '#9a6ac0', s: { name: 'ムラサキ' }, on: muraTalk },
          { id: 'av_k', x: 15, y: 4, spr: 'avatar', col: '#5aa05a', s: { name: 'kaz' }, on: kazTalk },
          { id: 'av_c', x: 15, y: 5, spr: 'avatar', col: '#e07090', s: { name: 'ちなつ' }, hidden: true, on: S => S.narr('「ちなつ」。头像是一只粉色的兔子——千夏自己画的。') },
          { id: 'av_r', x: 15, y: 6, spr: 'avatar', col: '#c0c0c0', s: { name: '　', blank: true }, hidden: true, on: avrUse },
          { id: 'inputbox', x: 2, y: 10, w: 9, spr: 'inputbox', decal: true, solid: false, on: inputUse },
          { id: 'logbtn', x: 12, y: 10, spr: 'btn', s: { lab: 'LOG' }, on: logUse },
          { id: 'popC', x: 3, y: 4, w: 8, h: 2, spr: 'popup', z: 1, solid: false, hidden: true, num: 1 }
        ],
        async enter(S, first) {
          const f = S.f;
          if (f.phase === 'end') return;
          if (f.phase === 'night') return chatIntro(S);
          if (f.phase === 'chat1') return S.goal('看看那天晚上的聊天记录（LOG）');
          if (f.phase === 'hunt') {
            if (S.once('chatBack')) await cs(S, 'ムラサキ', 'HARU！你还在吗？……想问什么就问吧。点我们的名字，或者在下面发言。');
            huntGoal(S);
          }
        }
      },
      /* ---------------- 赤い部屋（网页） ---------------- */
      page: {
        amb: 'otherworld', dark: .3, darkC: '#0a0000', plr: 6, floor: 'pagebg', speed: .9,
        legend: { 'B': 'bezel', 'H': 'wtitle', 'A': 'addrbar', 'T': 'taskbar' },
        rows: [
          'BBBBBBBBBBBBBBBBBBBB',
          'BHHHHHHHHHHHHHHHHHHB',
          'BAAAAAAAAAAAAAAAAAAB',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'B..................B',
          'BTTTTTTTTTTTTTTTTTTB',
          'BBBBBBBBBBBBBBBBBBBB'],
        ents: [
          { x: 1, y: 1, w: 17, spr: 'ttl', decal: true, solid: false, s: { str: '赤い部屋 － Microsoft Internet Explorer' } },
          { id: 'pxbtn', x: 18, y: 1, spr: 'xbtn', on: async S => { await S.go('desk', 2, 9, 3); } },
          { x: 1, y: 2, w: 18, spr: 'ttl', decal: true, solid: false, s: { str: 'アドレス  http://www2.kumo.ne.jp/~room/7402/', c2: '#000000' } },
          { id: 'banner', x: 4, y: 3, w: 12, spr: 'banner', light: { r: 4, col: 'rgba(255,30,30,.22)', dx: 96, dy: 6 }, on: S => S.narr('「赤い部屋」四个红字，像是用画图软件一笔一笔描出来的，边缘全是锯齿。\n……红色的部分，好像在很慢很慢地往下淌。') },
          { id: 'marq', x: 1, y: 4, w: 18, spr: 'marq', decal: true, solid: false, on: S => S.narr('一行红字从右往左慢慢滚过去：\n「ようこそ　赤い部屋へ」（欢迎光临红色的房间）') },
          { id: 'counter', x: 6, y: 5, w: 8, spr: 'hitcounter', s: { n: 4444 }, on: S => S.narr(S.ent('counter').s.n > 4444 ? '访客计数器：0004445。\n刚才是 4444。……多出来的那一个，是你。' : '访客计数器：「あなたは 0004444 人目のお客様です」\n你刷新了一下。数字没有变。') },
          { id: 'enter', x: 4, y: 7, w: 4, spr: 'link', s: { lab: 'ENTER' }, on: flashUse },
          { id: 'bbs', x: 12, y: 7, w: 4, spr: 'link', s: { lab: '掲示板' }, on: bbsUse },
          { x: 3, y: 8, w: 14, spr: 'lhead', decal: true, solid: false },
          { id: 'r0', x: 3, y: 9, w: 14, spr: 'vrow', decal: true, solid: false, text: '■ 1999.04.04　k.t（2-104）', on: S => S.narr('名单的第一行，日期是今年四月四号。\n名字大多是网名，后面都跟着一对括号——括号里是房间号。') },
          { id: 'r1', x: 3, y: 10, w: 14, spr: 'vrow', decal: true, solid: false, text: '■ 1999.06.13　ゆみ（5-311）', on: S => S.narr('「ゆみ（5-311）」。\n这一行和下一行之间，还有四十几个名字。你没有一行一行地看。') },
          { id: 'r2', x: 3, y: 11, w: 14, spr: 'vrow', decal: true, solid: false, text: '■ 1999.11.28　しんご（3-205）', on: S => S.narr('「しんご（3-205）」。\n3 号栋……就在你们团地的东头。') },
          { id: 'r3', x: 3, y: 12, w: 14, spr: 'vrow', decal: true, solid: false, text: '■ 1999.12.05　白石千夏（7-402）', on: S => S.narr('千夏的名字。不是网名——是全名。\n……她从来不在网上写自己的全名。') },
          { id: 'r4', x: 3, y: 13, w: 14, spr: 'vrow', decal: true, solid: false, text: '■ 1999.12.1　佐伯 遥（7-40', s: { me: true }, on: nameRow },
          { id: 'secret', x: 6, y: 14, w: 8, spr: 'secret', decal: true, solid: false, on: secretUse }
        ],
        async enter(S, first) {
          if (first) {
            await S.narr('黑色的网页。\n正中间用红色的字写着——「赤い部屋」。\n背景音乐是一段走了调的八音盒 MIDI，一遍又一遍地循环。');
          }
          huntGoal(S);
        }
      }
    }
  });
})();
