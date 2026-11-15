/* 剧本杀 · 程序绘制：背景、赵家平面图、死亡讯息、村内地图 */
const ART = { key: '', off: null, flies: [], raf: 0 };
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function ridge(ctx, w, h, base, amp, seed, col, rough) {
  ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 4) {
    let y = 0, a = amp, f = 1 / 320;
    for (let o = 0; o < 5; o++) { y += Math.sin(x * f + seed * (o + 1) * 1.7) * a + (hash(Math.floor(x * f * 6) + seed * 9 + o) - .5) * a * (rough || .25); a *= .5; f *= 2.1; }
    ctx.lineTo(x, base - y);
  }
  ctx.lineTo(w, h); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
function paperNoise(ctx, w, h, alpha) { for (let i = 0; i < w * h / 260; i++) { ctx.fillStyle = `rgba(${hash(i) > .5 ? '90,60,30' : '255,250,235'},${alpha * hash(i + 3)})`; ctx.fillRect(hash(i + 1) * w, hash(i + 2) * h, 1 + hash(i + 4) * 2, 1); } }
function drawBg(scr) {
  const c = $('#bgc'), dpr = Math.min(2, window.devicePixelRatio || 1), w = innerWidth, h = innerHeight;
  const key = scr + w + 'x' + h; if (ART.key === key) return; ART.key = key;
  c.width = w * dpr; c.height = h * dpr; const o = document.createElement('canvas'); o.width = c.width; o.height = c.height;
  const x = o.getContext('2d'); x.scale(dpr, dpr);
  if (scr === 'title' || scr === 'setup' || scr === 'lobby') {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#070a10'); g.addColorStop(.55, '#151b26'); g.addColorStop(1, '#0b0e13'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) { x.fillStyle = `rgba(240,230,210,${.2 + hash(i) * .6})`; x.fillRect(hash(i + 7) * w, hash(i + 9) * h * .5, hash(i) > .92 ? 2 : 1, 1); }
    const mx = w * .78, my = h * .2, mr = Math.min(w, h) * .06; const mg = x.createRadialGradient(mx, my, mr * .2, mx, my, mr * 4); mg.addColorStop(0, 'rgba(240,226,190,.35)'); mg.addColorStop(1, 'rgba(240,226,190,0)'); x.fillStyle = mg; x.fillRect(0, 0, w, h);
    x.fillStyle = '#efe2bf'; x.beginPath(); x.arc(mx, my, mr, 0, 7); x.fill(); x.fillStyle = 'rgba(21,27,38,.92)'; x.beginPath(); x.arc(mx + mr * .35, my - mr * .15, mr * .92, 0, 7); x.fill();
    ridge(x, w, h, h * .62, h * .16, 1.3, '#1a2130', .3); ridge(x, w, h, h * .7, h * .12, 2.9, '#131925', .35);
    const fg = x.createLinearGradient(0, h * .6, 0, h * .8); fg.addColorStop(0, 'rgba(160,170,180,0)'); fg.addColorStop(.5, 'rgba(160,170,180,.10)'); fg.addColorStop(1, 'rgba(160,170,180,0)'); x.fillStyle = fg; x.fillRect(0, h * .55, w, h * .3);
    ridge(x, w, h, h * .82, h * .06, 5.1, '#0c1018', .4);
    /* 村子：几间茅屋，一扇亮着的窗 */
    const by = h * .8; [[.18, 1], [.27, .8], [.36, 1.1], [.62, .9], [.7, 1.2]].forEach(([p, s], i) => {
      const hx = w * p, hw = 46 * s, hh = 26 * s; x.fillStyle = '#080b10'; x.fillRect(hx - hw / 2, by - hh, hw, hh);
      x.beginPath(); x.moveTo(hx - hw * .65, by - hh); x.lineTo(hx, by - hh - 24 * s); x.lineTo(hx + hw * .65, by - hh); x.closePath(); x.fill();
      if (i === 4 || i === 1) { const lg = x.createRadialGradient(hx + hw * .2, by - hh * .5, 1, hx + hw * .2, by - hh * .5, 40 * s); lg.addColorStop(0, 'rgba(255,190,90,.55)'); lg.addColorStop(1, 'rgba(255,190,90,0)'); x.fillStyle = lg; x.fillRect(hx - 60, by - 80, 140, 120); x.fillStyle = '#f2b45a'; x.fillRect(hx + hw * .1, by - hh * .7, 8 * s, 8 * s); }
    });
    x.fillStyle = '#05070a'; x.fillRect(0, h * .86, w, h * .14);
  } else if (scr === 'read' || scr === 'answer') {
    x.fillStyle = '#e9dfc8'; x.fillRect(0, 0, w, h); paperNoise(x, w, h, .08);
    const v = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, Math.max(w, h) * .75); v.addColorStop(0, 'rgba(120,80,30,0)'); v.addColorStop(1, 'rgba(120,80,30,.22)'); x.fillStyle = v; x.fillRect(0, 0, w, h);
  } else if (scr === 'r1' || scr === 'r2') {
    x.fillStyle = '#0f171a'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(127,192,160,.05)'; for (let i = 0; i < w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } for (let i = 0; i < h; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
    const v = x.createRadialGradient(w / 2, h * .4, 50, w / 2, h * .4, Math.max(w, h) * .8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); x.fillStyle = v; x.fillRect(0, 0, w, h);
  } else if (scr === 'reveal') {
    x.fillStyle = '#140c0c'; x.fillRect(0, 0, w, h); const v = x.createRadialGradient(w / 2, 0, 20, w / 2, 0, h * 1.1); v.addColorStop(0, 'rgba(160,40,30,.25)'); v.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = v; x.fillRect(0, 0, w, h);
  } else {
    x.fillStyle = '#1b130d'; x.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * .12, v = x.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * .9); v.addColorStop(0, 'rgba(240,170,80,.20)'); v.addColorStop(.4, 'rgba(120,70,30,.10)'); v.addColorStop(1, 'rgba(0,0,0,.5)'); x.fillStyle = v; x.fillRect(0, 0, w, h);
    paperNoise(x, w, h, .03);
  }
  ART.off = o; ART.scr = scr; c.getContext('2d').drawImage(o, 0, 0);
  ART.flies = (scr === 'title' || scr === 'r1' || scr === 'r2' || scr === 'setup') ? Array.from({ length: scr === 'title' ? 26 : 12 }, (_, i) => ({ x: hash(i) * w, y: h * (.5 + hash(i + 5) * .45), p: hash(i + 2) * 6, s: .2 + hash(i + 3) * .5 })) : [];
  if (!ART.raf) ART.raf = requestAnimationFrame(flyLoop);
}
let _flyT = 0;
function flyLoop(t) {
  ART.raf = requestAnimationFrame(flyLoop);
  if (!ART.flies.length || !OPT.anim || document.hidden || t - _flyT < 33) return; _flyT = t;
  const c = $('#bgc'), x = c.getContext('2d'), dpr = c.width / innerWidth; x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(ART.off, 0, 0); x.scale(dpr, dpr);
  const warm = ART.scr === 'title' || ART.scr === 'setup';
  for (const f of ART.flies) { f.p += .02; f.x += Math.sin(f.p * 1.3) * f.s; f.y += Math.cos(f.p) * f.s * .6; const a = .35 + .35 * Math.sin(f.p * 2.2);
    const g = x.createRadialGradient(f.x, f.y, 0, f.x, f.y, 7); g.addColorStop(0, warm ? `rgba(255,220,120,${a})` : `rgba(160,240,200,${a * .7})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(f.x - 7, f.y - 7, 14, 14); }
}
addEventListener('resize', () => { ART.key = ''; if (typeof render === 'function') render(); });

/* 赵家平面图（粉笔线） */
function drawPlan(c, round) {
  if (!c) return; const r = c.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); c.width = r.width * dpr; c.height = r.height * dpr;
  const x = c.getContext('2d'); x.scale(dpr, dpr); const W = r.width, H = r.height, u = W / 600;
  const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#16221f'); bg.addColorStop(1, '#0d1513'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(127,192,160,.07)'; for (let i = 0; i < W; i += 14 * u) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
  const chalk = (w, a) => { x.strokeStyle = `rgba(232,240,232,${a || .85})`; x.lineWidth = w * u; x.lineCap = 'round'; x.lineJoin = 'round'; };
  const P = (px, py) => [px * W, py * H];
  /* 外墙 */
  chalk(3.2); x.beginPath(); const L = .05, T = .1, R = .95, B = .88, mid = .6;
  x.moveTo(...P(L + .1, B)); x.lineTo(...P(L, B)); x.lineTo(...P(L, T)); x.lineTo(...P(R, T)); x.lineTo(...P(R, .26)); x.moveTo(...P(R, .42)); x.lineTo(...P(R, B)); x.lineTo(...P(L + .2, B)); x.stroke();
  /* 内墙与被踹开的门 */
  x.beginPath(); x.moveTo(...P(mid, T)); x.lineTo(...P(mid, .5)); x.moveTo(...P(mid, .64)); x.lineTo(...P(mid, B)); x.stroke();
  chalk(2, .6); x.beginPath(); x.moveTo(...P(mid, .64)); x.lineTo(...P(mid + .07, .55)); x.stroke(); x.setLineDash([4 * u, 4 * u]); x.beginPath(); x.arc(...P(mid, .64), .1 * W * .7, -Math.PI / 2, -.6); x.stroke(); x.setLineDash([]);
  /* 窗 */
  chalk(1.5, .7); x.beginPath(); x.moveTo(...P(R - .012, .26)); x.lineTo(...P(R - .012, .42)); x.moveTo(...P(R + .012, .26)); x.lineTo(...P(R + .012, .42)); x.stroke();
  x.fillStyle = 'rgba(232,240,232,.7)'; x.font = `${12 * u}px var(--sans),sans-serif`; x.fillText('窗（开着）', (R - .1) * W, .47 * H);
  x.fillText('大门', (L + .115) * W, (B + .07) * H);
  x.font = `bold ${18 * u}px "Songti SC","Noto Serif SC",serif`; x.fillStyle = 'rgba(232,240,232,.28)'; x.fillText('客　厅', .25 * W, .2 * H); x.fillText('卧　室', .7 * W, .82 * H);
  /* 桌子、水杯、蜡烛 */
  chalk(2, .75); x.strokeRect(.14 * W, .32 * H, .2 * W, .16 * H);
  x.beginPath(); x.arc(.22 * W, .4 * H, 6 * u, 0, 7); x.stroke();
  x.fillStyle = '#ffcf7a'; x.beginPath(); x.ellipse(.36 * W, .34 * H, 3 * u, 6 * u, 0, 0, 7); x.fill(); x.fillStyle = 'rgba(232,240,232,.85)'; x.fillRect(.36 * W - 3 * u, .35 * H, 6 * u, 10 * u);
  const cg = x.createRadialGradient(.36 * W, .34 * H, 1, .36 * W, .34 * H, 60 * u); cg.addColorStop(0, 'rgba(255,190,90,.22)'); cg.addColorStop(1, 'rgba(255,190,90,0)'); x.fillStyle = cg; x.fillRect(0, 0, W, H);
  /* 尸体轮廓与血 */
  x.fillStyle = 'rgba(150,20,20,.55)'; x.beginPath(); x.ellipse(.4 * W, .73 * H, 30 * u, 14 * u, .3, 0, 7); x.fill();
  chalk(2.2, .9); x.beginPath(); const bx = .33 * W, by = .66 * H;
  x.arc(bx + 34 * u, by + 14 * u, 9 * u, 0, 7); x.moveTo(bx + 26 * u, by + 10 * u); x.lineTo(bx - 20 * u, by - 6 * u); x.lineTo(bx - 52 * u, by - 2 * u); x.moveTo(bx - 20 * u, by - 6 * u); x.lineTo(bx - 50 * u, by - 22 * u);
  x.moveTo(bx + 20 * u, by + 6 * u); x.lineTo(bx + 6 * u, by + 30 * u); x.moveTo(bx + 4 * u, by - 2 * u); x.lineTo(bx + 30 * u, by - 22 * u); x.stroke();
  /* 墙上弹孔 */
  x.fillStyle = 'rgba(232,240,232,.9)'; [[.06, .26], [.065, .33], [.058, .38], [.07, .21]].forEach(([px, py]) => { x.beginPath(); x.arc(px * W, py * H, 2.5 * u, 0, 7); x.fill(); });
  /* 床（第二轮：床板掀开、露出地洞） */
  const open = round === 2 && G && G.pub.includes('c_cellar');
  chalk(2, .75); x.strokeRect(.68 * W, .2 * H, .2 * W, .32 * H);
  if (open) { x.fillStyle = '#050808'; x.fillRect(.7 * W, .24 * H, .16 * W, .24 * H); chalk(1.2, .6); for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(.7 * W, (.27 + i * .055) * H); x.lineTo(.86 * W, (.27 + i * .055) * H); x.stroke(); } x.fillStyle = 'rgba(232,240,232,.7)'; x.font = `${12 * u}px sans-serif`; x.fillText('地洞', .75 * W, .38 * H); }
  else { chalk(1.2, .5); x.beginPath(); x.moveTo(.68 * W, .28 * H); x.lineTo(.88 * W, .28 * H); x.stroke(); }
  x.fillStyle = 'rgba(232,240,232,.55)'; x.font = `${11 * u}px sans-serif`; x.fillText('衣物 · 食物 · 矿泉水', .62 * W, .66 * H);
  /* 村内地图图标 */
  chalk(1.5, .6); x.strokeRect(.85 * W, .8 * H, .08 * W, .1 * H); x.beginPath(); x.moveTo(.87 * W, .83 * H); x.lineTo(.91 * W, .87 * H); x.moveTo(.89 * W, .82 * H); x.lineTo(.89 * W, .88 * H); x.stroke();
}
/* 线索图片 */
function drawImg(c) {
  const k = c.dataset.img, x = c.getContext('2d'), W = c.width, H = c.height;
  if (k === 'msg') {
    x.fillStyle = '#f6f1e6'; x.fillRect(0, 0, W, H); paperNoise(x, W, H, .05);
    x.strokeStyle = '#7d0a0a'; x.lineWidth = 16; x.lineCap = 'round'; x.lineJoin = 'round';
    /* 左：露出的“贝”字旁 */
    x.beginPath(); x.moveTo(62, 88); x.lineTo(62, 190); x.moveTo(62, 88); x.lineTo(120, 82); x.lineTo(112, 200); x.moveTo(98, 150); x.lineTo(70, 240); x.moveTo(108, 210); x.lineTo(130, 240); x.stroke();
    /* 右：露出的“土” */
    x.beginPath(); x.moveTo(318, 72); x.lineTo(318, 134); x.moveTo(288, 102); x.lineTo(350, 100); x.moveTo(278, 136); x.lineTo(372, 128); x.stroke();
    /* 盖住的血 */
    x.fillStyle = '#7d0a0a'; x.beginPath(); x.moveTo(140, H); x.bezierCurveTo(120, 220, 150, 130, 175, 70); x.bezierCurveTo(190, 10, 270, 0, 290, 60); x.bezierCurveTo(300, 120, 330, 150, 380, 160); x.bezierCurveTo(420, 175, 410, 260, W, H); x.closePath(); x.fill();
    x.beginPath(); x.ellipse(120, 120, 22, 30, .5, 0, 7); x.fill();
  } else if (k === 'map') {
    x.fillStyle = '#0d0f12'; x.fillRect(0, 0, W, H); x.strokeStyle = '#e8e8e8'; x.lineWidth = 4; x.fillStyle = '#e8e8e8'; x.font = 'bold 18px "PingFang SC","Microsoft YaHei",sans-serif'; x.textAlign = 'center';
    const box = (bx, by, bw, bh, t, ty) => { x.strokeRect(bx, by, bw, bh); x.fillText(t, bx + bw / 2, ty || by + bh / 2 + 6); };
    box(22, 20, 96, 76, '王村长'); box(286, 34, 96, 72, '赵慈善');
    box(40, 200, 52, 70, '', 0); box(176, 200, 52, 70, '', 0); box(312, 196, 52, 74, '', 0);
    x.fillText('李警察', 66, 292); x.fillText('胡调研', 202, 292); x.fillText('张村民', 338, 292); x.font = '13px sans-serif'; x.fillText('窗', 396, 82);
    x.beginPath();
    x.moveTo(48, 96); x.lineTo(48, 200); x.moveTo(60, 96); x.lineTo(60, 150); x.lineTo(100, 150); x.lineTo(100, 90); x.lineTo(286, 70);
    x.moveTo(286, 92); x.lineTo(120, 110); x.lineTo(120, 150); x.lineTo(304, 150); x.lineTo(304, 196);
    x.moveTo(62, 200); x.lineTo(62, 172); x.lineTo(196, 172); x.lineTo(196, 200);
    x.moveTo(214, 200); x.lineTo(214, 168); x.lineTo(326, 168); x.lineTo(326, 196);
    x.moveTo(382, 92); x.lineTo(392, 92); x.lineTo(392, 110); x.stroke();
  }
}
