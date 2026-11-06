/* ================= 第三夜 · 烛湾 ================= */
(() => {
  /* ---------- 3×5 像素字（台标、价签） ---------- */
  const GLYPH = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
    '5': '111100111001111', '6': '111100111101111', '7': '111001001001001', '8': '111101111101111', '9': '111101111001111',
    '$': '011110010011110', '.': '000000000000010', ' ': '000000000000000'
  };
  function txt(g, x, y, s, k, col) {
    g.fillStyle = col; let cx = x;
    for (const ch of s) { const b = GLYPH[ch]; if (b) for (let i = 0; i < 15; i++) if (b[i] === '1') g.fillRect(cx + (i % 3) * k, y + ((i / 3) | 0) * k, k, k); cx += 4 * k; }
  }

  /* ---------- 雪花：预先生成几帧噪点，缩放贴到屏幕上 ---------- */
  let NZ = null;
  function noise() {
    if (NZ) return NZ; NZ = [];
    for (let k = 0; k < 6; k++) {
      const c = mk(80, 60), g = c.getContext('2d'), im = g.createImageData(80, 60), d = im.data;
      for (let i = 0; i < 4800; i++) { const r = Math.random(), v = r < .42 ? 200 + r * 130 : r < .8 ? 70 + r * 40 : 14; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v | 0; d[i * 4 + 3] = 255; }
      g.putImageData(im, 0, 0); NZ.push(c);
    }
    return NZ;
  }

  /* ---------- 调台：screen 地图第 18 行是一条看不见的「旋钮」，每走一格 =「咔」一下 = 2 个台 ---------- */
  const X0 = 2, NPOS = 35;                 // p = 0..34 对应 UHF 14..82
  const ST = [{ p: 4, ch: 22, k: 'news' }, { p: 10, ch: 34, k: 'bars' }, { p: 16, ch: 46, k: 'god' }, { p: 28, ch: 70, k: 'shop' }];
  const P58 = 22;
  const STN = {
    news: '22 台，河谷新闻。主播在念今天下午一场车祸的消息，声音一卡一卡的。\n是晚间重播。',
    bars: '34 台，公共电视。节目早就播完了，只剩一排彩条，「哔——」地一直叫。',
    god: '46 台，福音台。穿白西装的牧师高高举着双手：\n「……主在看着你！对，就是你，坐在电视机前面的你！」',
    shop: '70 台，购物台。一枚戒指在红丝绒上慢慢地转。\n「只要四十九块九毛五！现在打进电话——」'
  };

  /* ---------- 合成音效（双方都听得到） ---------- */
  function click(S) { S.tone('square', 2300, 2300, .012, .035, 0, 5000); S.tone('triangle', 320, 180, .035, .04); }
  function clack(S, v = 1, d = 0) { S.tone('square', 240, 120, .045, .06 * v, d, 1400); S.tone('square', 190, 90, .05, .05 * v, d + .1, 1400); }
  function shriek(S, v = 1, d = 0) {
    S.tone('sawtooth', 940, 610, 1.1, .07 * v, d, 2600); S.tone('sawtooth', 1010, 660, 1.1, .05 * v, d + .03, 2600);
    S.tone('square', 520, 470, 1.0, .03 * v, d + .1, 1500); S.tone('triangle', 1480, 1100, .9, .03 * v, d + .2, 3200);
  }
  /* 《烛湾》主题曲：玩具风琴一样的六拍小调，越弹越走音 */
  const THEME = [[523, 1], [659, 1], [784, 1], [880, 2], [784, 1], [659, 3], [698, 1], [659, 1], [587, 1], [523, 3], [392, 1], [523, 2], [494, 1], [523, 3]];
  function theme(S, v = 1, d0 = 0, det = 1) {
    let t = d0;
    THEME.forEach(([f, n], i) => { const ff = f * det * (1 - i * .002); S.tone('square', ff, ff * .993, n * .19, .022 * v, t, 1700); S.tone('triangle', ff / 2, ff / 2 * .99, n * .19, .03 * v, t, 900); t += n * .2; });
    return t;
  }
  function stationSound(S, k) {
    if (k === 'bars') S.tone('sine', 1000, 1000, .7, .03);
    else if (k === 'god') [262, 330, 392].forEach(f => S.tone('triangle', f, f, .9, .03, 0, 1200));
    else if (k === 'shop') [784, 988, 1175].forEach((f, i) => S.tone('square', f, f, .09, .02, i * .09, 2600));
    else [523, 659].forEach((f, i) => S.tone('square', f, f, .16, .022, i * .16, 2000));
  }
  function hum58(S, v) { let t = .05; THEME.slice(0, 6).forEach(([f, n]) => { S.tone('triangle', f * .97, f * .96, n * .17, .03 * v, t, 900); t += n * .18; }); }
  function crtOff(S) { S.tone('sine', 7600, 300, .9, .03); S.tone('sine', 90, 40, .4, .2, .05); }

  /* ---------- 电视画面：屏幕位置随视口变化（竖屏时旋钮放在屏幕下面） ---------- */
  function crtRect() {
    const land = VW > VH * 1.1; let w, h;
    if (land) { h = VH - 26; w = Math.min(h * 4 / 3, VW - 88); h = w * .75; } else { w = VW - 16; h = w * .75; }
    w = Math.round(w); h = Math.round(h);
    return { x: Math.round((VW - w) / 2), y: Math.round((VH - h) / 2) - (land ? 0 : 20), w, h, land };
  }
  function station(g, r, k, roll) {
    const draw = oy => {
      const F = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(r.x + Math.round(x * r.w), r.y + Math.round(y * r.h) + oy, Math.ceil(w * r.w), Math.ceil(h * r.h)); };
      if (k === 'bars') {
        const C = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'], C2 = ['#0000c0', '#131313', '#c000c0', '#131313', '#00c0c0', '#131313', '#c0c0c0'];
        C.forEach((c, i) => F(i / 7, 0, 1 / 7, .67, c)); C2.forEach((c, i) => F(i / 7, .67, 1 / 7, .08, c));
        F(0, .75, .18, .25, '#00214c'); F(.18, .75, .18, .25, '#f0f0f0'); F(.36, .75, .18, .25, '#32006a'); F(.54, .75, .46, .25, '#131313');
      } else if (k === 'news') {
        F(0, 0, 1, 1, '#1e3a6a'); F(.66, .1, .28, .24, '#8a9ab8'); F(.7, .14, .2, .12, '#5a3a3a');
        F(.36, .44, .28, .32, '#26262e'); F(.48, .45, .04, .16, '#a82a2a'); F(.44, .26, .12, .17, '#d8b090'); F(.43, .24, .14, .06, '#3a2a1a');
        F(0, .68, 1, .32, '#5a3a2a'); F(0, .66, 1, .03, '#7a5a3a'); F(0, .8, .72, .09, '#b82020'); F(.03, .83, .4, .03, '#e8e8e8');
      } else if (k === 'god') {
        F(0, 0, 1, 1, '#3a1a4a'); for (let i = 0; i < 8; i++) F(i / 8, 0, .02, .8, '#2a0e36');
        F(.47, .06, .06, .3, '#d8b84a'); F(.4, .13, .2, .05, '#d8b84a');
        F(.38, .5, .24, .34, '#ecece4'); F(.45, .36, .1, .14, '#d8b090'); F(.3, .3, .06, .22, '#ecece4'); F(.64, .3, .06, .22, '#ecece4');
        F(.3, .27, .06, .04, '#d8b090'); F(.64, .27, .06, .04, '#d8b090'); F(0, .86, 1, .1, '#e8c83a'); for (let i = 0; i < 9; i++) F(.06 + i * .1, .89, .06, .04, '#3a2a10');
      } else {
        F(0, 0, 1, 1, '#2a0a14'); F(0, .55, 1, .45, '#4a0e20'); F(.3, .62, .4, .1, '#1a1a1a');
        F(.42, .36, .16, .2, '#d8b84a'); F(.45, .4, .1, .12, '#2a0a14'); F(.47, .28, .06, .09, '#a8e8ff'); F(.48, .29, .02, .03, '#ffffff');
        F(0, 0, 1, .1, '#c82a2a'); F(.58, .74, .38, .16, '#e8e8e8');
        txt(g, r.x + Math.round(r.w * .6), r.y + Math.round(r.h * .77) + oy, '$49.95', 2, '#c82a2a');
      }
    };
    draw(roll); if (roll) draw(roll - r.h);
  }
  function circle(g, x, y, rad) { g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); }
  function knob(g, x, y, a) {
    g.fillStyle = '#120a06'; circle(g, x, y, 11); g.fillStyle = '#2e2620'; circle(g, x, y, 9); g.fillStyle = '#40362e'; circle(g, x - 2, y - 2, 4);
    g.fillStyle = 'rgba(220,200,160,.22)'; for (let i = 0; i < 12; i++) { const b = -Math.PI / 2 + (i / 11 - .5) * 5.2; g.fillRect(Math.round(x + Math.cos(b) * 13), Math.round(y + Math.sin(b) * 13), 1, 1); }
    g.strokeStyle = '#d8ccb0'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); g.stroke();
  }
  function grille(g, x, y, w, h) { g.fillStyle = '#2a180c'; g.fillRect(x, y, w, h); g.fillStyle = '#3e2614'; for (let yy = y + 2; yy < y + h - 1; yy += 3) g.fillRect(x + 1, yy, w - 2, 1); }
  function bezel(g, r, e) {
    g.fillStyle = '#4a2c18'; g.fillRect(0, 0, VW, r.y); g.fillRect(0, r.y + r.h, VW, VH - r.y - r.h); g.fillRect(0, r.y, r.x, r.h); g.fillRect(r.x + r.w, r.y, VW - r.x - r.w, r.h);
    g.fillStyle = 'rgba(20,10,4,.3)';
    for (let y = 2; y < VH; y += 5) { if (y > r.y - 4 && y < r.y + r.h + 4) { g.fillRect(0, y, r.x - 4, 1); g.fillRect(r.x + r.w + 4, y, VW, 1); } else g.fillRect(0, y, VW, 1); }
    g.fillStyle = '#0c0806'; g.fillRect(r.x - 3, r.y - 3, r.w + 6, 3); g.fillRect(r.x - 3, r.y + r.h, r.w + 6, 3); g.fillRect(r.x - 3, r.y, 3, r.h); g.fillRect(r.x + r.w, r.y, 3, r.h);
    for (const [cx, cy, sx, sy] of [[r.x, r.y, 1, 1], [r.x + r.w - 1, r.y, -1, 1], [r.x, r.y + r.h - 1, 1, -1], [r.x + r.w - 1, r.y + r.h - 1, -1, -1]]) {
      g.fillRect(cx, cy, 1, 1); g.fillRect(cx + sx, cy, 1, 1); g.fillRect(cx + 2 * sx, cy, 1, 1); g.fillRect(cx, cy + sy, 1, 1); g.fillRect(cx, cy + 2 * sy, 1, 1);
    }
    const pos = e.pos ?? P58, ua = -Math.PI / 2 + (pos / (NPOS - 1) - .5) * 5.2, va = -Math.PI / 2 + 2.1;
    if (r.land) {
      const kx = r.x + r.w + Math.round((VW - r.x - r.w) / 2);
      knob(g, kx, Math.round(r.y + r.h * .2), va); knob(g, kx, Math.round(r.y + r.h * .48), ua);
      grille(g, kx - 13, Math.round(r.y + r.h * .68), 26, Math.round(r.h * .28)); grille(g, 6, r.y + 6, r.x - 12, r.h - 12);
    } else {
      const ky = r.y + r.h + 22; knob(g, Math.round(VW * .3), ky, va); knob(g, Math.round(VW * .56), ky, ua); grille(g, Math.round(VW * .72), ky - 10, Math.round(VW * .2), 20);
    }
  }

  /* ---------- 剥皮人（地下室） ---------- */
  const SPD = 3.0;
  const SPOTS = [[2, 4], [3, 9], [9, 9], [12, 2], [8, 7]];
  let DEATHS = 0;
  function chaseReset(S, sp) {
    S.stop('skin_b'); S.hide('skin_b'); const e = S.ent('skin_b'); e.s.limp = 0;
    S.f.phase = 'chase'; S.f._sp = sp; S.f._wn = 0; S.f._spt = null; S.f._cw = 0; S.f._sc = .2; S.f._ck = 0; S.f.wrong = 0;
    const tv = S.ent('tv'); tv.power = 'scream'; tv.off = false; S.ent('bulb').off = true; S.ent('fuse').open = false;
    S.dark(.84); S.plr(3.2); S.norun(false);
    tv.light = { r: 4.4, col: 'rgba(230,90,80,.26)', flick: true, dy: 2 };
  }
  async function caught(S) {
    if (!S.f._cw) {
      S.f._cw = 1; S.stop('skin_b');
      S.fx('red'); S.shake(400, 2); clack(S, 1); clack(S, 1, .2);
      await S.narr('一根冰凉的细线缠上了你的手腕，往后一扯——\n你拼命一甩。线「嘣」地断了。');
      const p = S.pl, d = s => Math.abs(s[0] - p.x) + Math.abs(s[1] - p.y);
      const far = SPOTS.slice().sort((a, b) => d(b) - d(a))[0];
      S.place('skin_b', far[0], far[1], 0);
      await S.think('它被甩开了……可它还会过来。电闸！');
      S.chase('skin_b', { spd: SPD, always: true, wait: 1.4, catch: caught }); clack(S, .8, 1.2); clack(S, .8, 1.4);   // 甩开以后多给一点距离，它重新动起来时有咔咔声
      return;
    }
    DEATHS++; S.stop('skin_b');
    await S.scare('face', { spr: '@skin', sfx: 'scream' });
    await S.die('细线一根一根地缠上来。手腕，脚踝，脖子。\n你的胳膊自己抬了起来，像被人从天花板上提着。\n\n电视还在叫。\n你被一步一步地拉回电视前面，盘着腿，坐在那块小地毯上。\n\n「你得进去。」', '你被提起来了');
  }

  /* ---------- 人物 ---------- */
  function plaid(g, d, fr, G, R) { for (let y = G.tT + 2; y < G.tB; y += 3) R(4, y, 8, 1, '#4a2418'); if (d === 0) { R(6, G.tT + 1, 1, G.tB - G.tT, '#4a2418'); R(9, G.tT + 1, 1, G.tB - G.tT, '#4a2418'); } }
  function percyX(g, d, fr, G, R) {
    for (let y = G.tT + 1; y < G.tB; y += 2) R(4, y, 8, 1, '#b82a2a');
    if (d === 0) {
      R(3, G.hT - 2, 10, 3, '#151214'); R(1, G.hT, 14, 1, '#151214'); R(7, G.hT - 1, 2, 1, '#e8e8e0');
      R(5, G.hT + 3, 3, 3, '#f4f0e4'); R(9, G.hT + 3, 3, 3, '#f4f0e4'); R(5, G.hT + 4, 1, 1, '#111'); R(9, G.hT + 4, 1, 1, '#111');
      R(7, G.hT + 5, 2, 2, '#c87a5a'); R(6, G.hT + 7, 4, 1, '#5a2a1a'); R(5, G.hT + 6, 1, 2, '#9a6a4a'); R(10, G.hT + 6, 1, 2, '#9a6a4a');
    } else if (d === 1) { R(2, G.hT - 2, 11, 3, '#151214'); R(1, G.hT, 13, 1, '#151214'); R(3, G.hT + 5, 2, 2, '#c87a5a'); R(5, G.hT + 3, 2, 2, '#f4f0e4'); R(5, G.hT + 4, 1, 1, '#111'); }
    else { R(3, G.hT - 2, 10, 3, '#151214'); R(1, G.hT, 14, 1, '#151214'); }
  }
  function janiceX(g, d, fr, G, R) {
    R(6, G.hT - 1, 4, 1, '#c83a5a');
    if (d === 0) { R(6, G.hT + 6, 1, 2, '#b88a6a'); R(9, G.hT + 6, 1, 2, '#b88a6a'); R(5, G.hT + 5, 1, 1, '#e88a8a'); R(10, G.hT + 5, 1, 1, '#e88a8a'); R(7, G.hT + 6, 2, 1, '#9a3a3a'); }
  }
  function skinX(g, d, fr, G, R) {
    const H = '#141012', B = '#f0e8d2', BR = '#5a3a1c';
    R(5, G.tT + 1, 1, G.tB - G.tT + 2, '#6a3a2a'); R(9, G.tT + 3, 1, G.tB - G.tT, '#6a3a2a'); R(3, G.tT + 4, 10, 1, '#6a3a2a'); R(3, G.tB, 10, 1, '#6a3a2a');
    R(4, G.tT + 2, 2, 2, '#c89a80'); R(9, G.tT + 6, 3, 2, '#8a5a44');
    if (d === 0) {
      R(4, G.hT, 8, 7, B); R(5, G.hT + 2, 2, 2, '#1a120e'); R(9, G.hT + 2, 2, 2, '#1a120e'); R(5, G.hT + 2, 2, 2, '#ffffff'); R(9, G.hT + 2, 2, 2, '#ffffff'); R(6, G.hT + 3, 1, 1, '#2a6ad8'); R(9, G.hT + 3, 1, 1, '#2a6ad8');
      R(7, G.hT + 4, 2, 1, '#3a2a20'); R(4, G.hT + 5, 8, 3, BR); R(3, G.hT + 5, 1, 4, BR); R(12, G.hT + 5, 1, 4, BR); R(5, G.hT + 8, 1, 2, '#4a2e16'); R(9, G.hT + 8, 2, 2, '#4a2e16');
      R(6, G.hT + 6, 4, 1, '#140a08'); R(6, G.hT + 6, 1, 1, '#e8e0c8'); R(8, G.hT + 6, 1, 1, '#e8e0c8');
    } else if (d === 1) { R(4, G.hT, 6, 7, B); R(4, G.hT + 2, 2, 2, '#1a120e'); R(4, G.hT + 5, 6, 3, BR); R(3, G.hT + 6, 2, 3, BR); }
    R(4, G.hT - 7, 8, 7, H); R(2, G.hT - 1, 12, 2, H); R(4, G.hT - 3, 8, 1, '#5a1e1e');
  }
  const PUPS = ['p_percy', 'p_janice', 'p_skin'];
  const TVL = { r: 3.4, col: 'rgba(160,190,230,.24)', flick: true, dy: 2 };

  defChapter({
    id: 'candlecove', n: 3, title: '烛湾', sub: '几个陌生人在论坛上，一起想起了一部小时候的木偶戏。最后有人说：那个时间段，只有雪花。', origin: '美国　2009 年网络怪谈', color: '#26384a',
    thumb(g, w, h) {
      const x = Math.round(w / 2 - 32), y = h - 22 - 60;
      g.fillStyle = '#24160a'; g.fillRect(x + 6, y + 50, 3, 10); g.fillRect(x + 55, y + 50, 3, 10);
      g.fillStyle = '#5a361c'; g.fillRect(x, y, 64, 51); g.fillStyle = '#6e4626'; g.fillRect(x + 2, y + 2, 60, 2);
      g.fillStyle = 'rgba(30,16,8,.35)'; for (let i = 0; i < 7; i++) g.fillRect(x, y + 7 + i * 6, 64, 1);
      g.fillStyle = '#100c0a'; g.fillRect(x + 4, y + 5, 42, 36);
      for (let yy = 0; yy < 32; yy += 2) for (let xx = 0; xx < 38; xx += 2) { const v = hash(xx, yy, 7); g.fillStyle = v < .4 ? '#d4d4ce' : v < .75 ? '#6a6a68' : '#1e1e1e'; g.fillRect(x + 6 + xx, y + 7 + yy, 2, 2); }
      g.fillStyle = 'rgba(16,20,28,.6)'; g.fillRect(x + 11, y + 26, 22, 5); g.fillRect(x + 13, y + 31, 18, 1); g.fillRect(x + 21, y + 12, 2, 14); g.fillRect(x + 15, y + 14, 12, 8);
      g.fillStyle = 'rgba(232,210,120,.9)'; g.fillRect(x + 30, y + 27, 2, 1); g.fillRect(x + 31, y + 26, 1, 1);
      g.fillStyle = '#ffcf6a'; for (const cx of [9, 37, 41]) { g.fillRect(x + cx, y + 34, 1, 2); g.fillStyle = '#ffcf6a'; }
      g.fillStyle = '#1a120c'; g.fillRect(x + 50, y + 8, 9, 9); g.fillRect(x + 50, y + 22, 9, 9); g.fillStyle = '#c8b898'; g.fillRect(x + 54, y + 9, 1, 4); g.fillRect(x + 55, y + 26, 3, 1);
      g.fillStyle = '#3a2412'; for (let i = 0; i < 4; i++) g.fillRect(x + 50, y + 36 + i * 3, 9, 1);
      const gr = g.createRadialGradient(x + 25, y + 23, 2, x + 25, y + 23, 52); gr.addColorStop(0, 'rgba(190,210,230,.24)'); gr.addColorStop(1, 'rgba(190,210,230,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    },
    amb: 'room', floor: 'wood', wall: 'paper', dark: .6, plr: 3.2,
    people: {
      me: { key: 'cc-me', skin: '#e8c4a0', hair: '#5a4030', hs: 'short', top: '#7a3a2a', top2: '#e8e0d0', bottom: '#3a4458', shoes: '#4a3a2a', extra: plaid },
      mom: { skin: '#ecd0b8', hair: '#dcdcdc', hs: 'bun', top: '#8a7a9a', top2: '#ece4dc', bottom: '#5a5a6a', skirt: true, shoes: '#6a5a5a', blush: '#e0a8a0' },
      nurse: { skin: '#c89a74', hair: '#1e1410', hs: 'bun', top: '#7ab0b8', top2: '#5a9098', bottom: '#7ab0b8', shoes: '#e8e8e8' },
      oldman: { skin: '#e0c0a0', hair: '#c8c8c8', hs: 'bald', top: '#6a7a5a', top2: '#e0dccc', bottom: '#4a4a4a', shoes: '#3a2a20' },
      oldlady: { skin: '#e8ccb0', hair: '#e4e4e4', hs: 'short', top: '#c88a9a', top2: '#f0e0e4', bottom: '#6a5a6a', skirt: true, shoes: '#5a4a4a' },
      percy: { key: 'cc-percy', skin: '#e8b890', hair: '#3a2a1a', hs: 'messy', top: '#ece4d4', top2: '#ece4d4', bottom: '#3a3a5a', shoes: '#2a1a10', extra: percyX },
      janice: { key: 'cc-janice', skin: '#f2d4b6', hair: '#7a4a2a', hs: 'twin', child: true, dress: true, top: '#e8c84a', top2: '#f4e08a', bottom: '#e8c84a', shoes: '#a83a3a', extra: janiceX },
      skin: { key: 'cc-skin', skin: '#ddd4bc', hair: '#141012', hs: 'bald', top: '#a87a62', top2: '#c89a80', bottom: '#2a1a14', shoes: '#1a1010', coat: true, extra: skinX }
    },
    faces: {
      /* 剥皮人：高礼帽、骷髅脸、乱糟糟的棕胡子、会转的玻璃眼珠；下巴越掉越低 */
      skin(R, a, t) {
        const H = '#120e10', B = '#ddd4bc', B2 = '#b8ae94', D = '#1a100c', BR = '#5a3a1c', BR2 = '#3e2610';
        R(0, 0, 32, 32, '#050404');
        R(9, 0, 14, 8, H); R(9, 6, 14, 2, '#5a1a1a'); R(5, 8, 22, 2, H);
        R(8, 10, 16, 12, B); R(9, 22, 14, 1, B); R(7, 12, 1, 8, B2); R(24, 12, 1, 8, B2); R(22, 11, 2, 10, B2);
        R(10, 13, 5, 5, D); R(18, 13, 5, 5, D);
        const ex = Math.round(Math.sin(t * 2.3));
        R(11, 14, 3, 3, '#f2f2ea'); R(19, 14, 3, 3, '#f2f2ea'); R(12 + ex, 15, 1, 1, '#2a5aa8'); R(20 + ex, 15, 1, 1, '#2a5aa8'); R(11, 14, 1, 1, '#ffffff'); R(19, 14, 1, 1, '#ffffff');
        R(15, 18, 1, 2, D); R(17, 18, 1, 2, D);
        R(10, 20, 5, 1, BR); R(17, 20, 5, 1, BR);
        const j = Math.round(a * 5);
        R(10, 21, 12, 2, '#e8e0c8'); for (let x = 11; x < 22; x += 2) R(x, 21, 1, 2, '#8a8270');
        if (j) R(10, 23, 12, j, D);
        R(9, 23 + j, 14, 3, B); R(10, 23 + j, 12, 1, '#e8e0c8');
        R(6, 19 + j, 4, 9, BR); R(22, 19 + j, 4, 9, BR); R(8, 26 + j, 16, 3, BR);
        for (let i = 0; i < 8; i++) R(7 + i * 2 + (i % 2), 28 + j + (i % 3), 1, 3, i % 2 ? BR2 : BR);
        R(0, 29, 32, 3, '#a87a62'); R(0, 30, 32, 1, '#c89a80'); R(4, 29, 1, 3, '#5a2e1e'); R(12, 29, 1, 3, '#5a2e1e'); R(22, 29, 1, 3, '#5a2e1e');
      },
      /* 尖叫的佩西：毛毡脸，眼睛瞪得溜圆，嘴越张越大 */
      percy(R, a, t) {
        const F = '#e8b890', F2 = '#c8966a', H = '#151214', D = '#1a0a0a';
        R(0, 0, 32, 32, '#060506');
        R(4, 1, 24, 6, H); R(1, 6, 30, 2, H); R(14, 2, 4, 3, '#e8e8e0'); R(15, 3, 1, 1, H); R(16, 3, 1, 1, H);
        R(6, 8, 20, 18, F); R(5, 10, 1, 14, F2); R(26, 10, 1, 14, F2); R(8, 26, 16, 2, F2); R(15, 8, 1, 4, '#9a6a4a');
        const p = Math.sin(t * 30) > 0 ? 1 : 0;
        R(8, 11, 6, 6, '#f8f4e8'); R(18, 11, 6, 6, '#f8f4e8'); R(10 + p, 13, 2, 2, '#111'); R(20 + p, 13, 2, 2, '#111');
        R(14, 15, 4, 4, '#c87a5a'); R(14, 15, 4, 1, '#d89070');
        const m = 2 + Math.round(a * 6);
        R(11, 20, 10, m, D); R(12, 20 + m - 2, 8, 2, '#7a1a1a'); R(10, 20, 1, m + 3, '#8a5a3a'); R(21, 20, 1, m + 3, '#8a5a3a');
        R(4, 28, 24, 4, '#e8e0d0'); R(4, 29, 24, 1, '#b82a2a'); R(4, 31, 24, 1, '#b82a2a');
      }
    },
    items: {
      drawing: { name: '蜡笔画', desc: '你七岁画的。蓝色的海，咖啡色的船，船头一张笑脸；岸边一根小蜡烛。\n角落里有一团用黑蜡笔涂得很用力的东西，戴着高帽子。右下角写着：烛湾。' },
      sock: { name: '袜子木偶', desc: '一只灰色的旧袜子，缝着两颗扣子当眼睛，头上是黑布剪的三角帽。\n一颗扣子缝得高，一颗缝得低。' }
    },
    notes: {
      n1: { title: '怀旧论坛 · 地方电视版（第 1 页）', text: '【求助】有人记得一个叫《烛湾》的儿童节目吗？\n\nriver_kid64（我）：\n大概 1971 还是 72 年，我六七岁，住在俄亥俄河边的小镇。节目叫《烛湾》。不记得是哪个台了，只记得播的时间很怪，下午四点左右。\n\nporchlight72：\n有点印象……讲海盗的？一个木偶海盗站在山洞口，跟一个小女孩说话。\n\nriver_kid64：\n对！！我没疯！海盗佩西！胆子特别小，老惦记宝藏。女孩叫……珍妮丝？\n\nporchlight72：\n珍妮丝！船叫「笑柄号」。\n\nohio_valley_k：\n我想说是 58 台。下午四点。不过我也不太敢肯定。' },
      n2: { title: '怀旧论坛 · 地方电视版（第 2 页）', text: 'sockmonkey_55：\n你们是不是都忘了剥皮人？\n一张骷髅脸，糊着一圈乱糟糟的棕胡子，一对玻璃眼珠。下巴是松的，一直磕、一直磕。戴高礼帽，披一件披风。\n那披风和帽子是用什么做的，节目里没说。可我们都知道。\n\nporchlight72：\n……老天。我想起来了。那阵子我不敢关灯睡觉。\n\nriver_kid64：\n他一出来，镜头就往他脸上推，推得很近很近。那是给小孩看的节目吗？\n\nohio_valley_k：\n我跟我妈说过剥皮人。她让我以后别看了。' },
      n3: { title: '怀旧论坛 · 地方电视版（第 3 页）', text: 'jl_1966：\n「你得进去。」有人记得这句吗？\n佩西站在山洞口，不敢进去。然后有个声音说：「你得进去，佩西。」\n\nporchlight72：\n是船说的。笑柄号说的。\n\nsockmonkey_55：\n不对，是珍妮丝说的。……又好像是剥皮人。\n\njl_1966：\n还有那一集。没有故事，没有歌，所有角色就是一直尖叫。珍妮丝在哭，佩西在叫，剥皮人一边叫一边磕牙。\n我一直以为那是我做的噩梦。\n\nohio_valley_k：\n我也是。我也以为是噩梦。' },
      chlist: { title: '冰箱上的频道表（妈妈的字）', text: '用一块草莓磁铁压在冰箱门上。\n\n地下室那台老电视能收到的台：\n（先把上面的钮拧到「U」，再转下面那个）\n\n22　河谷新闻——晚上重播当天的新闻\n34　公共电视——半夜以后只有彩条，「哔——」\n46　福音台——二十四小时讲道，穿白西装那个\n70　购物台——戒指、锅，什么都卖\n\n底下压着电力公司的一张传单：\n「模拟电视信号停播日期由 2 月 17 日推迟至 2009 年 6 月 12 日。届时老式电视需加装数字转换盒。」\n「2 月 17 日」几个字被妈妈用笔划掉了。\n\n最底下一行，字小小的：\n「地下室电视跟洗衣机插一块儿。跳闸了就拉『洗衣房』。」' }
    },
    endings: { off: '关掉电视', inside: '你得进去', deadair: '半个钟头的雪花' },
    legend: '「烛湾」（Candle Cove）是2009年发表在网上的一篇短篇恐怖小说，作者是一位美国漫画家。全文模仿怀旧论坛上的一串帖子：几个网友回忆1970年代初在俄亥俄州一带看过的一部儿童节目——小女孩珍妮丝、胆小的木偶海盗佩西、海盗船「笑柄号」，还有一个骷髅脸、乱糟糟的棕胡子、玻璃眼珠，戴高礼帽披披风的「剥皮人」（Skin-Taker），网友们隐约觉得那披风是用人皮做的。他们越聊越多，想起「你得进去」那句台词，想起一集所有角色只是不停尖叫的节目。最后，发帖人去疗养院看母亲，母亲说：你那时总说「妈，我要去看烛湾了」，然后把电视调到雪花，对着没有信号的屏幕看半个钟头。\n\n这篇小说很快被转贴到各个恐怖故事网站，成了最有名的网络怪谈（creepypasta）之一。因为写得太像真帖，不少读者以为真有这部节目，四处打听当年的播出记录——当然查不到。这种「好几个人都记得一件没发生过的事」的味道，后来常被拿来和「失落的一集」一类故事放在一起谈。2016年，它被改编为美国电视剧集《零频道》（Channel Zero）的第一季。\n\n查无实据的部分：历史上没有任何一部叫《烛湾》的地方儿童节目，帖子里的台号与播出时间也对不上真实的电视台；它从一开始就是作为小说发表的。真实的一点是：美国的全功率电视台在2009年6月12日停播了模拟信号（原定2月17日，后来推迟），之后老式电视在原来的频道上，就只剩一片雪花。\n\n（本章的主角与母亲、论坛网名、河景疗养院、频道表上的四个电视台、地下室的电闸与追逐、主题歌、木偶戏的具体情节与台词（「你得进去」这句除外——原作网友们对是谁说的也记得不一样）、袜子木偶，以及三个结局，均为游戏虚构。）',
    start: { map: 'house', x: 11, y: 8, dir: 3 },
    async intro(S) {
      DEATHS = 0;
      await S.card('第三夜　烛湾', '2009年3月　美国俄亥俄州　河边的一座小镇', '妈妈搬进了疗养院。\n老房子下个月就要卖掉。\n\n我在一个怀旧论坛上发了个帖子，\n问有没有人记得一部小时候看过的儿童节目。\n\n我以为不会有人回。');
    },
    resume: {
      chase: async S => {
        chaseReset(S, 2.0);
        if (DEATHS > 0) await S.narr('（它走得不快，可是不会停。别绕远路，直奔东北角的电闸箱。\n电视的插头，是跟洗衣机插在一起的。）');
      }
    },
    tick(S, dt) {
      if (S.busy) return;
      /* 厨房的老电话在响 */
      if (S.map === 'house') {
        const ph = S.ent('phone');
        if (ph && ph.s.ring) { S.f._rg = (S.f._rg ?? 0) - dt; if (S.f._rg <= 0) { S.f._rg = 2.4; S.sfx('phone'); S.f._rn = (S.f._rn || 0) + 1; if (S.f._rn > 6) ph.s.ring = 0; } }
        return;
      }
      if (S.map !== 'basement' || S.f.phase !== 'chase') return;
      const e = S.ent('skin_b');
      S.f._sc = (S.f._sc ?? .2) - dt;
      if (S.f._sc <= 0) { S.f._sc = 1.25; shriek(S, .45); }
      if (S.f._sp > 0) {
        S.f._sp -= dt;
        if (S.f._sp <= .9 && !S.f._wn) {
          S.f._wn = 1; clack(S, .9); clack(S, .9, .3); clack(S, .9, .6); S.toast('……咔、咔、咔。');
          const p = S.pl, d = q => Math.abs(q[0] - p.x) + Math.abs(q[1] - p.y);
          S.f._spt = d(SPOTS[0]) >= 4 ? SPOTS[0] : SPOTS.slice().sort((a, b) => d(b) - d(a))[0];   // 玩家贴着电视时，换到最远的地方出来
          S.place('skin_b', S.f._spt[0], S.f._spt[1], 0); e.alpha = .35;
        }
        if (S.f._sp <= 0) { const q = S.f._spt || SPOTS[0]; S.place('skin_b', q[0], q[1], 0); e.alpha = 1; S.chase('skin_b', { spd: SPD, always: true, wait: .25, catch: caught }); }
        return;
      }
      if (e.chase && !e.hidden) {
        S.f._ck = (S.f._ck ?? 0) - dt;
        if (S.f._ck <= 0) { S.f._ck = .42; const d = Math.hypot(e.px - S.pl.px, e.py - S.pl.py) / TS; clack(S, Math.max(.25, 1.2 - d * .1)); }
      }
    },
    tiles: {
      /* 木偶戏的布景：硬纸板天空、硬纸板海浪 */
      sky: { solid: false, paint(R, X, Y) {
        R(0, 0, 16, 16, Y < 2 ? '#14283a' : '#1c3a50'); if (X % 3 === 0) R(0, 0, 1, 16, '#16303f');
        if (hash(X, Y, 3) < .3) R((hash(X, Y, 4) * 14) | 0, (hash(X, Y, 5) * 14) | 0, 1, 1, '#e8dca0');
        if (Y === 3 && hash(X, 1, 6) < .4) { R(1, 6, 14, 4, '#3a5468'); R(3, 4, 8, 3, '#3a5468'); }
        if (X === 18 && Y === 1) { R(4, 4, 8, 8, '#e8dca8'); R(4, 4, 3, 3, '#1c3a50'); R(9, 9, 2, 1, '#c8bc88'); }
      } },
      sea: { solid: false, paint(R, X, Y) {
        R(0, 0, 16, 16, Y === 6 ? '#2a5a7a' : '#1e4a68');
        for (let i = 0; i < 4; i++) { R(i * 4, (Y % 2) * 4 + 2, 3, 1, '#4a86a8'); R(i * 4 + 1, (Y % 2) * 4 + 1, 1, 1, '#6aa6c8'); }
        R(0, 15, 16, 1, '#163a52'); if (X % 4 === 0) R(0, 0, 1, 16, '#18405a');
      } },
      boxes: { solid: true, paint(R, X, Y) {
        speck(R, '#5a5a5d', ['#4e4e51'], X, Y, 8, 3);
        const c = hash(X, Y, 8) < .5 ? '#8a6a42' : '#7a5c38';
        R(1, 2, 14, 13, c); R(1, 2, 14, 1, shade(c, .2)); R(1, 8, 14, 1, shade(c, -.25)); R(7, 2, 2, 6, '#c8b890'); R(2, 14, 12, 1, '#2a2a2a');
        if (hash(X, Y, 9) < .5) R(3, 10, 5, 2, '#e8e2d0');
      } }
    },
    sprites: {
      /* 电视的玻璃屏幕 + 木头机壳（整屏叠加） */
      crt(g, e, t, R) {
        const r = crtRect(), m = e.mode || 'snow', N = noise(), fi = ((t * 24) | 0) % 6;
        g.save(); g.beginPath(); g.rect(r.x, r.y, r.w, r.h); g.clip();
        if (m === 'tune') {
          const p = e.pos ?? 0; let best = null, c = 0;
          for (const s of ST) { const k = Math.max(0, 1 - Math.abs(p - s.p) / 1.15); if (k > c) { c = k; best = s; } }
          if (best && c > 0) station(g, r, best.k, Math.floor((1 - c) * ((t * 90) % r.h)));
          g.globalAlpha = best && c > 0 ? 1 - c * .86 : 1; g.drawImage(N[fi], r.x, r.y, r.w, r.h); g.globalAlpha = 1;
          if (best && c > .55) txt(g, r.x + r.w - 26, r.y + 7, String(best.ch), 2, 'rgba(240,240,240,.8)');
        } else if (m === 'show' || m === 'scream') {
          g.globalAlpha = e.k ?? .16; g.drawImage(N[fi], r.x, r.y, r.w, r.h); g.globalAlpha = 1;
          if (m === 'scream') { g.fillStyle = `rgba(150,0,0,${.1 + Math.random() * .14})`; g.fillRect(r.x, r.y, r.w, r.h); }
          const by = r.y + ((t * 37) % (r.h + 30)) - 15; g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(r.x, by, r.w, 6);
        } else if (m === 'dot') {
          const k = e.k ?? 0; g.fillStyle = '#040505'; g.fillRect(r.x, r.y, r.w, r.h);
          const lw = Math.max(3, r.w * Math.max(0, 1 - k * 1.4)), lh = Math.max(1, r.h * .5 * Math.max(0, .3 - k));
          const a = k < .75 ? 1 : Math.max(.15, 1 - (k - .75) * 3.4);
          g.fillStyle = `rgba(160,190,255,${a * .25})`; g.fillRect(r.x + (r.w - lw) / 2 - 3, r.y + r.h / 2 - lh / 2 - 4, lw + 6, lh + 8);
          g.fillStyle = `rgba(244,248,255,${a})`; g.fillRect(r.x + (r.w - lw) / 2, r.y + r.h / 2 - lh / 2 - 1, lw, lh + 2);
        } else if (m === 'dark') { g.fillStyle = '#0c0f0e'; g.fillRect(r.x, r.y, r.w, r.h); }
        else g.drawImage(N[fi], r.x, r.y, r.w, r.h);
        g.fillStyle = 'rgba(0,0,0,.16)'; for (let y = r.y; y < r.y + r.h; y += 2) g.fillRect(r.x, y, r.w, 1);
        g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(r.x + 6, r.y + 5, Math.round(r.w * .35), 3);
        g.restore();
        bezel(g, r, e);
      },
      /* 夜景：给布景蒙一层蓝黑 */
      veil(g, e, t, R) {
        const r = crtRect(); g.fillStyle = e.red ? 'rgba(60,0,0,.35)' : 'rgba(4,8,24,.42)'; g.fillRect(r.x, r.y, r.w, r.h);
        const m = curMap(), C = { rocks: [[13, -9], [21, -11], [34, -6], [39, -5], [7, -1]], cave: [[17, 33], [23, 33], [73, 33], [79, 33], [85, 33]] };
        g.save(); g.beginPath(); g.rect(r.x, r.y, r.w, r.h); g.clip(); g.globalCompositeOperation = 'lighter';
        for (const id in C) {
          const k = m.ents.find(z => z.id === id); if (!k || k.hidden) continue;
          for (const [cx, cy] of C[id]) {
            const x = e.sx + (k.px - e.px) + cx, y = e.sy + (k.py - e.py) + cy, rr = 15 + Math.sin(t * 9 + cx) * 1.5;
            const gr = g.createRadialGradient(x, y, 1, x, y, rr); gr.addColorStop(0, 'rgba(255,190,90,.32)'); gr.addColorStop(1, 'rgba(255,190,90,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
          }
        }
        g.restore();
      },
      /* 提线木偶：画人物，再画几根往上去的线（e.who / e.sc / e.jerk / e.limp 放在 e.s 里） */
      pup(g, e, t, R) {
        const P = W.ch.people[e.who]; if (!P) return;
        const sc = e.sc || 1, img = personSprite(P, e.dir, e.fr || 0), w = 16 * sc, h = 24 * sc, x = Math.round(e.sx + 8 - w / 2);
        if (e.limp) { g.drawImage(img, x - 3, e.sy + 16 - h * .32, w + 6, h * .32); g.fillStyle = '#e8e0c8'; g.fillRect(x + w / 2 + 6, e.sy + 13, 2, 2); return; }
        const bob = Math.round(Math.sin(t * (e.jerk ? 8 : 2.6) + e.px * .1) * (e.jerk ? 1.6 : 1)), y = Math.round(e.sy + 16 - 23 * sc) + bob, top = Math.max(0, y - 110);
        g.fillStyle = e.jerk ? 'rgba(200,196,180,.45)' : 'rgba(230,226,210,.35)';
        g.fillRect(x + 5 * sc, top, 1, y + 2 * sc - top); g.fillRect(x + 10 * sc, top, 1, y + 2 * sc - top);
        g.fillRect(x + 3 * sc, top, 1, y + 15 * sc - top); g.fillRect(x + 12 * sc, top, 1, y + 15 * sc - top);
        if (y - 110 > 0) { g.fillStyle = '#5a3a1e'; g.fillRect(x + 2 * sc, top, 12 * sc, 2); g.fillRect(x + 7 * sc, top - 3, 2, 8); }
        g.drawImage(img, x, y, w, h);
      },
      /* 笑柄号：船头画着一张笑脸，说话时嘴巴一开一合 */
      ship(g, e, t, R) {
        const b = Math.round(Math.sin(t * 1.4) * 1.5);
        R(30, -58 + b, 3, 70, '#3a2414'); R(78, -44 + b, 3, 56, '#3a2414');
        R(12, -52 + b, 36, 30, '#d8ccb0'); R(12, -52 + b, 36, 2, '#b8ac90'); R(22, -44 + b, 8, 6, '#a89c80'); R(36, -34 + b, 6, 5, '#a89c80');
        R(62, -40 + b, 32, 24, '#d0c4a8'); R(70, -34 + b, 6, 5, '#a89c80');
        R(33, -60 + b, 12, 7, '#1a1416'); R(37, -58 + b, 3, 3, '#e8e8e0');
        R(-6, -10 + b, 22, 16, '#6a4226'); R(-6, -12 + b, 22, 3, '#8a5a32'); R(-2, -6 + b, 4, 4, '#e8c860'); R(6, -6 + b, 4, 4, '#e8c860');
        for (let yy = 0; yy < 27; yy++) { const ins = Math.round((yy / 26) * (yy / 26) * 20); R(ins - 4, 4 + yy + b, 126 - 2 * ins, 1, yy < 12 ? '#6a4226' : yy < 20 ? '#5a361e' : '#4a2c18'); }
        for (let x = 8; x < 108; x += 12) R(x, 6 + b, 1, 16, '#4a2c18');
        R(-6, 2 + b, 126, 3, '#8a5a32'); for (let x = 4; x < 112; x += 6) R(x, -3 + b, 1, 5, '#8a5a32'); R(-6, -4 + b, 126, 1, '#8a5a32');
        for (let x = 14; x < 100; x += 18) { R(x, 9 + b, 5, 5, '#2a1a10'); R(x + 1, 10 + b, 3, 3, '#3a3020'); }
        R(44, 14 + b, 30, 6, '#d8c890'); for (let x = 47; x < 72; x += 5) R(x, 16 + b, 3, 2, '#5a2a1a');
        R(112, -4 + b, 14, 30, '#7a4c2a'); R(120, -8 + b, 8, 8, '#7a4c2a');
        R(113, 2 + b, 4, 4, '#f4f0e4'); R(121, 2 + b, 4, 4, '#f4f0e4'); R(114, 3 + b, 2, 2, '#111'); R(122, 3 + b, 2, 2, '#111');
        const mo = e.talk ? (Math.sin(t * 18) > 0 ? 6 : 2) : e.scream ? 9 : 2;
        R(113, 12 + b, 12, mo, '#1a0a08'); R(112, 11 + b, 1, 2, '#1a0a08'); R(125, 11 + b, 1, 2, '#1a0a08'); if (mo > 3) R(115, 12 + b, 8, 1, '#e8e0c8');
        for (let i = 0; i < 9; i++) { const wx = i * 15 - 4 + Math.round(Math.sin(t * 1.2 + i) * 2); R(wx, 22, 14, 10, '#24587a'); R(wx + 2, 20, 10, 3, '#24587a'); R(wx + 4, 19, 6, 2, '#3a7aa0'); }
      },
      /* 岩石上的蜡烛 */
      rocks(g, e, t, R) {
        R(2, 2, 40, 14, '#4a4440'); R(8, -4, 18, 8, '#5a524c'); R(28, -2, 14, 6, '#544c46'); R(4, 2, 36, 2, '#6a625a'); R(10, -4, 14, 2, '#6e665e');
        for (const [cx, cy, hh] of [[12, -10, 6], [20, -12, 8], [33, -7, 5], [38, -6, 4], [6, -2, 4]]) {
          R(cx, cy, 3, hh, '#ece4c8'); R(cx, cy + hh - 1, 3, 2, '#d8d0b0'); R(cx + 1, cy - 1, 1, 1, '#2a2a2a');
          const f = Math.sin(t * 11 + cx) > 0 ? 1 : 0; R(cx, cy - 4 - f, 3, 3 + f, '#ffb84a'); R(cx + 1, cy - 3, 1, 2, '#fff2b0');
        }
      },
      /* 山洞：一圈石头，洞口点着蜡烛，洞里黑得像井 */
      cave(g, e, t, R) {
        R(0, -56, 96, 104, '#3a3430'); R(4, -60, 30, 10, '#4a423c'); R(56, -62, 36, 12, '#4a423c'); R(-4, -30, 10, 70, '#443c36'); R(90, -34, 10, 74, '#443c36');
        for (let i = 0; i < 14; i++) R(((hash(i, 1, 9) * 88) | 0), -54 + ((hash(i, 2, 9) * 90) | 0), 6, 3, '#4e4640');
        R(26, -30, 44, 76, '#050404'); R(30, -36, 36, 8, '#050404'); R(36, -40, 24, 6, '#050404'); R(22, -10, 4, 56, '#0e0c0a'); R(70, -10, 4, 56, '#0e0c0a');
        if (e.deep) { R(40, -4, 16, 30, '#000'); R(46, 4, 1, 1, '#c8c8c0'); R(50, 4, 1, 1, '#c8c8c0'); }
        for (const cx of [16, 22, 72, 78, 84]) { R(cx, 36, 3, 8, '#ece4c8'); const f = Math.sin(t * 10 + cx) > 0 ? 1 : 0; R(cx, 32 - f, 3, 3 + f, '#ffb84a'); R(cx + 1, 33, 1, 2, '#fff2b0'); }
      },
      /* —— 老房子 —— */
      drawing(g, e, t, R) {
        R(4, 1, 2, 1, '#d8d0b0'); R(10, 1, 2, 1, '#d8d0b0');
        if (e.gone) { R(3, 2, 10, 9, 'rgba(255,255,255,.06)'); return; }
        R(2, 2, 12, 9, '#e8e2d0'); R(2, 2, 12, 1, '#c8c0a8');
        R(3, 8, 10, 1, '#3a6ad8'); R(4, 9, 8, 1, '#3a6ad8'); R(5, 6, 6, 2, '#8a4a1a'); R(7, 3, 1, 3, '#2a1a10'); R(8, 3, 3, 2, '#f0f0f0'); R(10, 6, 1, 1, '#c82020');
        R(12, 5, 1, 2, '#e8c020'); R(12, 4, 1, 1, '#ff7a1a'); R(3, 3, 2, 1, '#111'); R(3, 4, 2, 2, '#2a2a2a');
      },
      chest(g, e, t, R) {
        box(R, 1, 4, 14, 11, '#8a5a3a'); R(4, 8, 2, 2, '#e8c040'); R(10, 9, 2, 2, '#e8c040'); R(7, 11, 2, 2, '#e8c040');
        if (e.open) { R(1, -2, 14, 6, '#6a4228'); R(2, 4, 12, 2, '#1a1008'); } else { R(1, 2, 14, 3, '#a86a42'); R(7, 4, 2, 1, '#c9a35a'); }
      },
      outline(g, e, t, R) { R(3, 4, 26, 1, '#86664a'); R(3, 12, 26, 1, '#86664a'); R(3, 4, 1, 9, '#86664a'); R(28, 4, 1, 9, '#86664a'); R(16, 13, 1, 3, '#222'); R(16, 15, 6, 1, '#222'); },
      frontdoor(g, e, t, R) { R(1, 0, 14, 10, '#4a321e'); R(2, 0, 12, 9, '#5e4028'); R(3, 2, 10, 1, '#6e4e30'); R(12, 4, 1, 2, '#c9a35a'); R(0, 10, 16, 5, '#3a3a36'); R(2, 11, 12, 3, '#4a4a42'); },
      wallphone(g, e, t, R) {
        const j = e.ring && Math.sin(t * 40) > 0 ? 1 : 0;
        R(5 + j, 2, 6, 9, '#c8c0a8'); R(6 + j, 3, 4, 3, '#a89880'); R(4 + j, 4, 2, 7, '#5a5048'); R(3, 11, 1, 3, '#3a3a3a'); R(4, 13, 1, 2, '#3a3a3a');
        if (e.ring && Math.sin(t * 8) > 0) { R(12, 1, 2, 1, '#f0f0e0'); R(13, 3, 2, 1, '#f0f0e0'); R(1, 1, 2, 1, '#f0f0e0'); }
      },
      fridgeN(g, e, t, R) {
        box(R, 1, -10, 14, 25, '#d6d4cb'); R(2, -3, 12, 1, '#a8a69d'); R(12, -8, 1, 4, '#888'); R(12, 0, 1, 6, '#888');
        R(3, -8, 7, 8, '#f0ecd8'); R(4, -6, 5, 1, '#5a5a8a'); R(4, -4, 4, 1, '#5a5a8a'); R(4, -2, 5, 1, '#5a5a8a'); R(5, -9, 2, 2, '#d83a4a');
        R(3, 2, 6, 6, '#e8d870'); R(4, 3, 4, 1, '#8a6a2a'); R(9, 4, 2, 2, '#3a8a3a');
      },
      laptop(g, e, t, R) {
        R(3, 2, 10, 7, '#2a2a2e'); R(4, 3, 8, 5, e.new ? (Math.sin(t * 5) > 0 ? '#a8d8ff' : '#6aa0d8') : '#4a7aa8'); R(5, 4, 4, 1, '#e8f0f8'); R(5, 6, 5, 1, '#c8d8e8');
        R(2, 9, 12, 3, '#4a4a50'); R(3, 9, 10, 1, '#3a3a40');
      },
      /* —— 地下室 —— */
      tvset(g, e, t, R) {
        R(3, 11, 2, 5, '#24160a'); R(27, 11, 2, 5, '#24160a');
        box(R, 0, -10, 32, 22, '#5a361c'); R(1, -9, 30, 2, '#6e4626');
        R(2, -7, 20, 15, '#0c0a08'); const p = e.power;
        if (p === 'static' || p === 'scream' || p === 'show') {
          for (let y = -6; y < 7; y++) for (let x = 3; x < 21; x++) R(x, y, 1, 1, hash(x, y, (t * 26) | 0) < .45 ? '#d4d4ce' : '#565654');
          if (p === 'scream' && Math.sin(t * 17) > 0) { R(3, -6, 18, 13, 'rgba(170,0,0,.45)'); R(9, -3, 6, 6, '#e8e0c8'); R(10, -2, 1, 1, '#000'); R(13, -2, 1, 1, '#000'); R(10, 1, 4, 1, '#000'); }
        } else { R(4, -5, 5, 2, '#2a3030'); }
        R(24, -6, 5, 5, '#1a120c'); R(26, -6, 1, 3, '#c8b898'); R(24, 1, 5, 5, '#1a120c'); R(25, 3, 3, 1, '#c8b898');
        for (let i = 0; i < 3; i++) R(23, 8 + i * 1, 7, 1, '#3a2412');
      },
      rugk(g, e, t, R) { R(1, 1, 30, 30, '#4a2a20'); R(3, 3, 26, 26, '#6a3a2a'); R(6, 6, 20, 20, '#7a4630'); R(12, 14, 9, 7, '#5a3222'); for (let i = 0; i < 6; i++) R(1 + i * 5, 30, 2, 2, '#8a6a4a'); },
      washer(g, e, t, R) { box(R, 1, 0, 14, 15, '#d8d8d0'); R(2, 1, 12, 3, '#c0c0b8'); R(4, 6, 8, 7, e.dry ? '#b8b8b0' : '#9aa4b0'); R(5, 7, 6, 5, e.dry ? '#8a8a84' : '#5a6a7a'); R(11, 2, 2, 1, '#3a3a3a'); },
      fusebox(g, e, t, R) {
        box(R, 3, 1, 10, 12, '#7a7c80');
        if (e.open) { R(4, 2, 8, 10, '#2a2a2e'); for (let i = 0; i < 3; i++) { R(5, 3 + i * 3, 2, 2, '#111'); R(9, 3 + i * 3, 2, 2, '#111'); R(5, 5 + i * 3, 2, 1, '#e8e2d0'); R(9, 5 + i * 3, 2, 1, '#e8e2d0'); } }
        else { R(4, 2, 8, 10, '#8a8c90'); R(11, 6, 1, 2, '#3a3a3a'); R(5, 3, 4, 1, '#c82a2a'); }
      },
      furnace(g, e, t, R) { R(6, -14, 4, 6, '#7a7a7c'); box(R, 1, -8, 14, 23, '#5a5a5c'); R(4, 5, 8, 6, '#1a1a1a'); if (!e.off) { const f = Math.sin(t * 9) > 0 ? 1 : 0; R(5, 8 - f, 6, 2 + f, '#ff8a2a'); R(6, 9, 4, 1, '#ffd060'); } },
      jars(g, e, t, R) {
        box(R, 0, -8, 16, 22, '#5a4a36'); R(1, -1, 14, 1, '#3a2a1a'); R(1, 6, 14, 1, '#3a2a1a');
        const C = ['#c86a2a', '#8a9a3a', '#c8b84a', '#a83a3a', '#6a8a4a'];
        for (let i = 0; i < 3; i++) { R(2 + i * 5, -6, 3, 5, C[i]); R(2 + i * 5, -7, 3, 1, '#9a9a90'); R(2 + i * 5, 1, 3, 5, C[(i + 2) % 5]); R(2 + i * 5, 0, 3, 1, '#9a9a90'); }
      },
      /* —— 疗养院 —— */
      wheel(g, e, t, R) { R(3, -2, 1, 11, '#7a7a80'); R(12, -2, 1, 11, '#7a7a80'); R(2, 8, 12, 2, '#5a5a60'); R(0, 6, 2, 9, '#2a2a2e'); R(14, 6, 2, 9, '#2a2a2e'); R(1, 9, 1, 3, '#8a8a90'); R(14, 9, 1, 3, '#8a8a90'); },
      cork(g, e, t, R) { box(R, 1, 1, 14, 10, '#a87a4a'); R(3, 2, 5, 6, '#f0ecd8'); R(9, 3, 4, 4, '#e8d870'); R(4, 3, 3, 1, '#6a6a8a'); R(4, 5, 2, 1, '#6a6a8a'); R(5, 1, 1, 1, '#c82a2a'); }
    },
    maps: {
      /* ---------------- 老房子：卧室 / 客厅 / 厨房 ---------------- */
      house: {
        amb: 'room', dark: .62, plr: 3.2, wall: 'paper', tileOpts: { carpetC: '#34405a', tileC: '#c8c2a8', woodC: '#6a4a30' },
        rows: [
          '######################',
          '######################',
          '#cccccc#wwwwwww#+++++#',
          '#cccccc#wwwwwww#+++++#',
          '#cccccc#wwwwwww.+++++#',
          '#cccccc.wwwwwww#+++++#',
          '#cccccc#wwwwwww#+++++#',
          '#cccccc#wwwwwww#+++++#',
          '########wwwwwww#######',
          '######################'],
        ents: [
          /* 卧室 */
          { id: 'bed', x: 1, y: 2, h: 2, spr: 'bed', col: '#3a5a8a', on: S => S.narr('你小时候的床。床单早就换成了素色的，可床头板上还贴着一张褪色的贴纸：一艘海盗船。\n贴纸是你自己贴的。你想不起来是从哪儿弄来的了。') },
          { x: 2, y: 1, spr: 'window', on: S => S.narr('窗外是邻居家的后院，黑漆漆的。\n小时候你总觉得，半夜那棵树后面站着一个戴高帽子的人。') },
          { id: 'drawing', x: 4, y: 1, spr: 'drawing', on: S => drawingOn(S) },
          { id: 'chest', x: 5, y: 2, spr: 'chest', on: S => chestOn(S) },
          { x: 1, y: 6, spr: 'shelf', on: S => S.narr('书架上还剩几本没装箱的童书：《金银岛》、《小飞侠》，还有一本被翻烂了的《海盗图鉴》。\n书脊上有你用蜡笔写的名字，歪歪扭扭的。') },
          { x: 6, y: 7, spr: 'lamp', off: true, on: S => S.narr('一盏小台灯，灯罩上印着帆船。灯泡早就坏了。') },
          /* 客厅 */
          { x: 11, y: 2, w: 2, spr: 'outline', decal: true, solid: false, on: S => S.narr('地毯上有一块长方形的印子，颜色比周围深。旁边还拖着一截天线。\n这里原来摆着妈妈的电视。上礼拜，它跟着她一起搬进了疗养院。') },
          { x: 9, y: 3, spr: 'armchair', col: '#6a4a3a', on: S => S.narr('妈妈的扶手椅。扶手上被她的手磨出了两块亮亮的印子。\n她每天坐在这儿看下午的肥皂剧，一边看一边织毛衣。') },
          { x: 12, y: 5, w: 2, spr: 'sofa', col: '#d0ccc0', on: S => S.narr('沙发上蒙着一块白布。白布底下鼓起一块，像有人蜷在上面睡觉。\n你掀开一角——是一个靠垫。') },
          { x: 10, y: 1, spr: 'painting', col: '#5a4a3a', on: S => S.narr('一张装在相框里的全家福。爸爸、妈妈，还有七岁的你，穿着一件横条纹的海魂衫。\n你在照片里笑得很用力。') },
          { id: 'clock', x: 13, y: 1, spr: 'wallclock', on: S => S.narr(S.f.phase === 'arrive' || S.f.phase === 'tune' ? '挂钟：十一点四十。秒针一格一格地走。' : '挂钟：快一点了。\n……你在地下室待了这么久？') },
          { x: 8, y: 7, spr: 'box', on: S => S.narr('纸箱上用马克笔写着「厨房·易碎」。是妈妈的字。\n她坚持要自己写，说别人写的她认不出来。') },
          { x: 9, y: 7, spr: 'box', on: S => S.narr('「旧衣服·捐」。最上面露出一件小小的海魂衫，袖口都脱线了。') },
          { x: 14, y: 2, spr: 'box', on: S => S.narr('「相册」。箱子封得严严实实的，胶带缠了好几圈。') },
          { id: 'front', x: 11, y: 9, spr: 'frontdoor', on: S => S.narr('前门。门廊灯亮着，外面黑漆漆的，只听得见远处河上的驳船在鸣笛。\n今晚哪儿也不去了。') },
          /* 厨房 */
          { id: 'fridge', x: 16, y: 2, spr: 'fridgeN', on: S => fridgeOn(S) },
          { x: 17, y: 2, spr: 'counter', on: S => S.narr('料理台擦得干干净净。妈妈走之前擦了三遍。\n角落里放着一罐她舍不得扔的培根油。') },
          { x: 18, y: 2, spr: 'sink', on: S => S.narr('水龙头一滴、一滴地漏。修了好多年，一直没修好。') },
          { id: 'phone', x: 19, y: 1, spr: 'wallphone', on: S => phoneOn(S) },
          { id: 'bdoor', x: 20, y: 1, spr: 'door', col: '#5a4632', on: S => basementDoor(S) },
          { x: 17, y: 5, w: 2, spr: 'table2', col: '#7a5a3a' },
          { id: 'laptop', x: 17, y: 5, spr: 'laptop', z: 1, light: { r: 1.8, col: 'rgba(140,190,255,.16)' }, on: S => laptopOn(S) },
          { x: 19, y: 5, spr: 'chair', col: '#6a4a2a', dir: 1, on: S => S.narr('一把木椅子，坐上去「吱」地响。下午你就坐在这儿，打完了那个帖子。') }
        ],
        async enter(S, first) {
          if (first) return opening(S);
          if (S.ent('laptop').s.new && S.once('ding_' + S.f.phase)) { S.tone('sine', 1318, 1318, .5, .05); S.tone('sine', 1760, 1760, .6, .04, .12); S.toast('厨房里，笔记本「叮」地响了一声——论坛有新回复。'); }
          if (S.f.phase === 'p3' && S.once('ring')) {
            S.ent('phone').s.ring = 1; S.f._rg = .3; S.f._rn = 0;
            await S.narr('你刚走上最后一级台阶——\n厨房墙上的老电话，响了。\n半夜一点。');
          }
        }
      },
      /* ---------------- 地下室 ---------------- */
      basement: {
        amb: 'room', dark: .8, plr: 2.8, wall: 'concrete', floor: 'concrete', legend: { X: { t: 'boxes', solid: true } },
        rows: [
          '####################',
          '####################',
          '#xxxxxXxxxxxxxxxxxx#',
          '#xxxxxXxxxXXxxXxxxx#',
          '#xxxxxXxxxxxxxXxxxx#',
          '#xxxxxxxxXXXXxXXXxx#',
          '#xxxxxXXxxxxxxxxxxx#',
          '#xxxxxxxxxxxxXXXxxx#',
          '#xxxxxXxxXXxxxxxXxx#',
          '#xxxxxXxxxxxxxxxxxx#',
          '#xxxxxXxxxxxxxxxxxx#',
          '####################'],
        ents: [
          { id: 'stairs', x: 2, y: 1, spr: 'stairsup', on: S => upstairs(S) },
          { id: 'tv', x: 2, y: 3, w: 2, spr: 'tvset', power: false, off: true, light: TVL, on: S => tvOn(S) },
          { x: 2, y: 4, w: 2, h: 2, spr: 'rugk', decal: true, solid: false, on: S => S.pl.dir === 3 ? tvOn(S) : S.narr('一块磨秃了的小地毯，正对着电视。\n中间被压出一个圆圆的凹痕——一个七岁小孩，天天盘着腿坐出来的。') },
          { id: 'washer', x: 16, y: 4, spr: 'washer', on: S => washerOn(S) },
          { x: 17, y: 4, spr: 'washer', s: { dry: 1 }, on: S => S.narr('烘干机。门上贴着一张便条：「别烘爸爸的毛衣！！」\n爸爸走了十二年了。便条一直没撕。') },
          { id: 'fuse', x: 18, y: 1, spr: 'fusebox', on: S => fuseOn(S) },
          { id: 'furnace', x: 10, y: 9, spr: 'furnace', light: { r: 1.4, col: 'rgba(255,140,60,.18)', dy: 10 }, on: S => S.narr(S.ent('furnace').off ? '暖气炉灭了。冷气从水泥地往上冒。' : '暖气炉。小窗里一小团蓝里带橙的火，呼呼地响。\n小时候你觉得它是一头睡着的怪兽。') },
          { x: 1, y: 9, spr: 'jars', on: S => S.narr('一架子玻璃罐：桃子、酸黄瓜、番茄酱。标签上写着 1996、1998……\n妈妈每年夏天都做，做到她的手拧不开盖子为止。') },
          { x: 13, y: 9, spr: 'box', on: S => S.narr('「圣诞装饰」。箱子边上露出一截彩灯线。') },
          { x: 9, y: 2, spr: 'invisible', solid: true, on: S => S.narr('墙上钉着一排挂钩，挂着爸爸的工具。锤子、钳子、卷尺，都落了一层灰。') },
          { id: 'bulb', x: 9, y: 6, spr: 'invisible', solid: false, light: { r: 5.2, col: 'rgba(255,220,160,.12)' } },
          { id: 'skin_b', x: 2, y: 4, spr: 'pup', hidden: true, solid: false, s: { who: 'skin', sc: 1.6, jerk: 1 } }
        ],
        async enter(S, first) {
          if (S.f.phase === 'final') return finalEnter(S);
          if (first) {
            await S.narr('地下室的灯是拉绳的。你拉了一下，灯泡「嗞」地亮起来，昏黄昏黄的。\n洗衣机，暖气炉，一架子落满灰的玻璃罐。');
            await S.narr('墙角那台老电视，还在。');
            if (S.f.phase === 'tune') S.goal('看看墙角那台老电视');
          }
        }
      },
      /* ---------------- 电视里：《烛湾》的木偶戏（底下第 18 行是看不见的旋钮） ---------------- */
      screen: {
        amb: 'tv', dark: 0, plr: 3, wall: 'plain', legend: { S: { t: 'sky', solid: false }, V: { t: 'sea', solid: false } },
        rows: [
          'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
          'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
          'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
          'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
          'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
          'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
          'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
          'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
          'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
          'ssssssssssssssssssssssssssssssssssssssss',
          'ssssssssssssssssssssssssssssssssssssssss',
          'ssssssssssssssssssssssssssssssssssssssss',
          'ssssssssssssssssssssssssssssssssssssssss',
          'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
          '                                        ',
          '                                        ',
          '                                        ',
          '########################################',
          '##' + 'x'.repeat(NPOS) + '###',
          '########################################'],
        ents: [
          { id: 'ship', x: 4, y: 6, w: 8, h: 2, spr: 'ship', solid: false },
          { id: 'rocks', x: 17, y: 9, w: 3, spr: 'rocks', solid: false },
          { id: 'cave', x: 25, y: 8, w: 6, h: 3, spr: 'cave', solid: false },
          { id: 'p_percy', x: 16, y: 10, spr: 'pup', hidden: true, solid: false, s: { who: 'percy', sc: 2 } },
          { id: 'p_janice', x: 13, y: 10, spr: 'pup', hidden: true, solid: false, s: { who: 'janice', sc: 2 } },
          { id: 'p_skin', x: 11, y: 4, spr: 'pup', hidden: true, solid: false, s: { who: 'skin', sc: 2.6, jerk: 1 } },
          { id: 'veil', x: 12, y: 7, spr: 'veil', hidden: true, solid: false, z: 8 },
          { id: 'crt', x: 12, y: 7, spr: 'crt', solid: false, z: 9, s: { mode: 'snow', pos: 0 } }
        ].concat(Array.from({ length: NPOS }, (_, i) => ({ x: X0 + i, y: 18, spr: 'invisible', on: S => lockTune(S) }))),
        async enter(S) {
          S.focus(12, 7); S.place('crt', 12, 7);
          const c = S.ent('crt'); c.s.mode = S.f.mode === 'tune' ? 'tune' : 'show'; c.s.k = .16; c.s.pos = S.f.found ? P58 : (S.f.dial || 0);
        },
        step(S, x, y) {
          if (y !== 18 || S.f.mode !== 'tune') return;
          click(S); const st = ST.find(s => s.p === x - X0); if (st) stationSound(S, st.k);
          const dd = Math.abs(x - X0 - P58);
          if (!S.f.found && (S.f.tries || 0) >= 2 && dd <= 2) hum58(S, [1, .5, .25][dd]);   // 失败两次以后：58 台附近的雪花里，隐隐约约有那段小调
        },
        tick(S, dt) { if (S.f.mode === 'tune') { const c = S.ent('crt'); c.s.pos = Math.round((S.pl.px / TS - X0) * 100) / 100; } }
      },
      /* ---------------- 河景疗养院 ---------------- */
      care: {
        amb: 'room', dark: .22, plr: 4, wall: 'plain', floor: 'linoleum', tileOpts: { carpetC: '#5a6a7a' },
        rows: [
          '########################',
          '########################',
          '#nnnnnnnnn#nnnnn#cccccc#',
          '#nnnnnnnnn#nnnnn#cccccc#',
          '#nnnnnnnnn.nnnnn.cccccc#',
          '#nnnnnnnnn#nnnnn#cccccc#',
          '#nnnnnnnnn#nnnnn#cccccc#',
          '###########nnnnn########',
          '###########nnnnn########',
          '########################'],
        ents: [
          { id: 'cfront', x: 13, y: 9, spr: 'frontdoor', on: S => careExit(S) },
          { id: 'desk', x: 12, y: 3, w: 2, spr: 'counter', col: '#9a8a72', on: S => nurseOn(S) },
          { id: 'nurse', x: 12, y: 2, spr: '@nurse', dir: 0, on: S => nurseOn(S) },
          { x: 15, y: 2, spr: 'plant', on: S => S.narr('一盆塑料绿萝，叶子上落了一层薄灰。') },
          { x: 15, y: 6, spr: 'chair', col: '#5a7a8a', on: S => S.narr('走廊里的塑料椅。椅背上贴着一张纸：「请勿在走廊奔跑」。') },
          /* 活动室 */
          { id: 'ctv', x: 5, y: 2, spr: 'tv', power: true, light: { r: 2.4, col: 'rgba(170,200,240,.2)' }, on: S => ctvOn(S) },
          { id: 'oldman', x: 4, y: 4, spr: '@oldman', dir: 3, on: S => oldmanOn(S) },
          { id: 'oldlady', x: 7, y: 4, spr: '@oldlady', dir: 1, on: S => S.narr('老太太在织一条很长很长的围巾，长得都拖到地上了。\n「给我孙女织的，」她说，「她明年就上大学了。」\n她冲你笑了笑，又低下头数针。') },
          { x: 2, y: 5, spr: 'armchair', col: '#7a8a9a', on: S => S.narr('一张蓝色的扶手椅，椅垫被坐出了一个坑。') },
          { x: 2, y: 1, spr: 'window', lit: true, on: S => S.narr('窗外是停车场和一排光秃秃的枫树。三月的太阳斜斜的，没什么热气。') },
          { x: 8, y: 1, spr: 'cork', on: S => S.narr('活动安排表：\n周一　手工课\n周三　宾果游戏\n周五　老电影\n每天下午　电视时间\n\n有人在「电视时间」后面，用铅笔加了一个小小的问号。') },
          /* 妈妈的房间 */
          { x: 19, y: 1, spr: 'window', lit: true, on: S => S.narr('窗外能看见河。一条驳船慢慢地往下游开，开得像没在动。') },
          { id: 'cclock', x: 18, y: 1, spr: 'wallclock', on: S => S.narr(S.f.four ? '墙上的钟：四点过一点。' : '墙上的钟：三点五十。') },
          { x: 21, y: 2, h: 2, spr: 'bed', col: '#c8ccd8', on: S => S.narr('床头柜上摆着一张照片：你七岁，穿着海魂衫，盘腿坐在地下室的小地毯上，回头冲镜头笑。\n你背后的电视，开着。') },
          { x: 22, y: 5, spr: 'plant', on: S => S.narr('一盆真的天竺葵，开着红花。卡片上写着：「给妈妈。」是你上礼拜送来的。') },
          { id: 'wheel', x: 19, y: 4, spr: 'wheel', decal: true, solid: false },
          { id: 'mom', x: 19, y: 4, spr: '@mom', dir: 3, on: S => momOn(S) }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('河景疗养院。走廊里一股消毒水和炖菜的味道。\n活动室的电视开着，在放一个猜价格的游戏节目，观众一阵一阵地鼓掌。');
          S.goal('去看妈妈（走廊右手边的房间）');
          S.cp('care');
        }
      }
    }
  });

  /* ================= 老房子 ================= */
  async function opening(S) {
    S.f.phase = 'arrive';
    await S.narr('晚上十一点半。\n老房子里一股樟脑丸和旧报纸的味道。家具大都蒙上了白布，纸箱从客厅一直堆到门口。');
    await S.think('妈妈搬进疗养院一个礼拜了。这房子，下个月就归别人了。');
    await S.narr('厨房桌上，你的笔记本电脑还开着。\n下午你在一个怀旧论坛上发了个帖子。发完你就后悔了——一个四十多岁的人，在网上打听一部谁都没听说过的儿童节目。');
    await S.think('……不知道有没有人回。');
    S.ent('laptop').s.new = 1;
    S.goal('去厨房，看看论坛帖子有没有人回（笔记本电脑在桌上）');
    S.cp('start');
  }

  async function laptopOn(S) {
    const ph = S.f.phase, lp = S.ent('laptop');
    if (ph === 'arrive') {
      await S.narr('你刷新了一下页面。\n……有回复了。不止一条。');
      lp.s.new = 0; await S.note('n1'); S.f.phase = 'tune';
      await S.think('58 台。下午四点。\n……地下室那台老电视，妈妈一直没舍得扔。');
      S.goal('去地下室找那台老电视（地下室的门在厨房里）');
      return;
    }
    if (ph === 'p2') {
      await S.narr('刷新。\n帖子又多了一页。有人提到了一个名字——你看见那个名字的一瞬间，后脖子一凉。');
      lp.s.new = 0; await S.note('n2'); S.f.phase = 's2';
      await S.think('剥皮人。\n……我怎么会把他忘了？');
      S.goal('回地下室，接着看');
      return;
    }
    if (ph === 'p3') {
      await S.narr('刷新。\n已经半夜一点了，帖子还在往下长。好像所有人都睡不着。');
      lp.s.new = 0; await S.note('n3'); S.f.phase = 's3';
      await S.think('尖叫的那一集。\n……我也以为那是噩梦。');
      S.goal('回地下室，把剩下的看完');
      return;
    }
    const last = { tune: 'n1', s2: 'n2', s3: 'n3' }[ph];
    if (last) { await S.narr('没有新回复。你又把帖子翻了一遍。'); return S.note(last); }
    await S.narr('论坛的页面停在最后一条回复上。光标一闪，一闪。');
  }

  async function fridgeOn(S) {
    if (S.once('fridge')) await S.narr('冰箱门上贴满了东西：药房的提醒单、你小时候的奖状、一张手写的单子。\n手写的那张，是妈妈的字。');
    await S.note('chlist'); S.f.chlist = true;
  }

  async function drawingOn(S) {
    if (S.has('drawing')) return S.narr('墙上只剩四块发黄的胶带印子。');
    await S.narr('墙上用胶带贴着一张发黄的蜡笔画。\n蓝色的海，一艘咖啡色的船，船头画着一张笑脸。岸边点着一根小蜡烛。');
    await S.narr('角落里，有一团用黑蜡笔涂得很用力的东西，戴着一顶高高的帽子。\n右下角歪歪扭扭地写着两个字：烛湾。');
    await S.think('……我画的。我一点都不记得了。');
    S.ent('drawing').s.gone = 1; S.give('drawing');
  }

  async function chestOn(S) {
    const e = S.ent('chest');
    if (S.has('sock')) return S.narr('玩具箱里只剩一盒缺了好几块的拼图。');
    e.open = true;
    await S.narr('你小时候的玩具箱。铁皮小汽车、断了一只胳膊的士兵、一盒拼图……\n最底下压着一只袜子木偶。');
    await S.narr('灰色的旧袜子，缝着两颗扣子当眼睛。头上用黑布缝了一顶三角帽。\n一颗扣子缝得高，一颗缝得低，看上去像是吓坏了。');
    await S.think('……佩西？');
    S.give('sock');
  }

  async function phoneOn(S) {
    const ph = S.ent('phone');
    if (ph.s.ring) {
      ph.s.ring = 0; S.f.phoned = true;
      await S.narr('你拿起听筒。\n「……喂？」');
      S.sfx('tv');
      await S.narr('听筒里是一片沙沙声。跟电视里的雪花一个声音。');
      S.sfx('whisper');
      await S.say('听筒里', '……妈，我要去看烛湾了。', { style: 'whisper' });
      await S.narr('是个小男孩的声音。\n然后「咔哒」一声，只剩下嘟——嘟——的忙音。');
      await S.think('……那是我的声音。七岁的时候的。');
      return;
    }
    await S.narr('墙上的老电话，米色的，听筒的线卷成一团。\n妈妈到最后都不肯装无绳的，说那种电话「听着不像真人」。');
  }

  async function basementDoor(S) {
    S.sfx('open');
    await S.go('basement', 2, 2, 0);
  }
  async function upstairs(S) {
    if (S.f.phase === 'chase') { S.sfx('locked'); return S.narr('门推不开！楼梯顶上那扇门，像是从外面被什么东西顶住了。'); }
    if (S.f.phase === 'final') return S.narr('得先把插头拔了。明天一早卡车就来。');
    S.sfx('open');
    await S.go('house', 20, 2, 0);
  }

  /* ================= 地下室 ================= */
  async function washerOn(S) {
    if (S.f.phase === 'final') return unplug(S);
    if (S.f.phase === 'chase') return S.narr('插座在洗衣机后面，胳膊伸不进去！\n……电闸。电闸在那边墙上。');
    await S.narr('一台老洗衣机，盖子上放着一盒洗衣粉。');
    await S.narr('洗衣机后面的墙上有个插座。插着两个插头：一个是洗衣机的，另一个连着一根长长的灰线，沿着墙根一路拖到电视那边。');
    await S.think('电视跟洗衣机插在一起。妈妈总说这样「省事」。');
    S.f.cord = true;
  }

  const FUSE = ['厨房', '客厅', '楼上卧室', '炉子', '洗衣房', '门廊灯'];
  const FUSEMSG = [
    '「啪。」\n楼上厨房里，冰箱「嗡」地一声停了。\n电视还在叫。',
    '「啪。」\n头顶上传来一声轻响，客厅的灯灭了。\n电视还在叫。',
    '「啪。」\n什么都没有变。楼上你那间小卧室，本来就没开灯。\n电视还在叫。',
    '「啪。」\n暖气炉「呼」地灭了。冷气一下子从地上冒上来。\n电视还在叫。',
    '',
    '「啪。」\n门缝底下漏进来的那一线光没了——门廊灯灭了。\n电视还在叫。'
  ];
  async function fuseOn(S) {
    const e = S.ent('fuse');
    if (S.f.phase === 'chase') return breaker(S);
    e.open = true;
    await S.narr('墙上的灰色电闸箱。打开盖子，里面六个黑色的拉闸，每个底下都贴着一张小纸条，是妈妈的字：\n厨房、客厅、楼上卧室、炉子、洗衣房、门廊灯。');
    await S.think('地下室的灯泡，大概跟哪一路都不在一起……爸爸当年自己接的线。');
    e.open = false;
  }
  async function breaker(S) {
    const e = S.ent('fuse'), sk = S.ent('skin_b'); e.open = true;
    for (; ;) {
      const r = await S.ask('六个拉闸，六张小纸条。电视插在哪一路上？', FUSE);
      const near = sk && sk.chase && !sk.hidden && Math.abs(sk.px - S.pl.px) + Math.abs(sk.py - S.pl.py) < 14;
      if (r === 4) return chaseWin(S);
      S.sfx('switch'); S.f.wrong = (S.f.wrong || 0) + 1;
      if (r === 3) S.ent('furnace').off = true;
      await S.narr(FUSEMSG[r]);
      const near2 = sk && sk.chase && !sk.hidden && Math.abs(sk.px - S.pl.px) + Math.abs(sk.py - S.pl.py) < 14;
      if (near || near2) { S.sfx('heart'); await S.think('咔咔声……已经贴到耳朵后面了。'); return; }
      if (S.f.wrong === 1) S.toast(S.f.cord ? '电视是跟洗衣机插在一起的！' : '电视的线……插在哪个插座上？');
      else if (S.f.wrong === 2) await S.think('洗衣机！电视的线是跟洗衣机插在一起的——「洗衣房」那一路！');
    }
  }
  async function chaseWin(S) {
    S.stop('skin_b'); S.sfx('switch'); S.amb('none');
    const tv = S.ent('tv'); tv.power = false; tv.off = true;
    S.f.phase = 'after'; S.dark(.95);
    await S.narr('「啪。」\n\n叫声停了。\n一下子安静得能听见自己的心跳。');
    S.sfx('heart'); S.sfx('thud');
    const sk = S.ent('skin_b');
    if (!sk.hidden) sk.s.limp = 1;
    await S.narr('黑暗里，「哗啦」一声，什么东西塌在了地上。');
    S.plr(3.6); S.dark(.86);
    if (!sk.hidden) {
      await S.narr('你摸出手机，打开手电筒。\n离你几步远的水泥地上，堆着一摊东西：几块缝在一起的、颜色深深浅浅的破布，一顶压扁的高礼帽，一个塑料骷髅头。\n一颗玻璃眼珠，滚到了你脚边。');
      await S.think('……一只旧木偶。只是一只旧木偶。');
      await S.narr('你蹲下去想捡那颗眼珠。手电晃了一下。\n再照过去的时候，地上什么都没有了。');
      S.hide('skin_b');
    } else await S.narr('你摸出手机，打开手电筒。地下室里什么都没有。\n只有电视，安安静静地立在墙角，屏幕灰灰的，还带着一点余温。');
    await S.fade(1, 900);
    S.ent('bulb').off = false; S.ent('furnace').off = false; S.ent('fuse').open = false;
    await S.card('第二天　下午三点四十', '河景疗养院', '你一夜没合眼。\n天亮以后，你把论坛上的帖子从头到尾又看了一遍。\n\n然后你开车去看妈妈。\n有些事，只有她知道。');
    S.f.phase = 'care'; S.dark(null); S.plr(null); S.norun(false);
    await S.go('care', 13, 8, 3);
  }

  async function tvOn(S) {
    const ph = S.f.phase, tv = S.ent('tv');
    if (ph === 'arrive') return S.narr('一台老式的落地电视，木头机壳，四条细腿。\n你盯着它看了一会儿，心里有什么东西动了一下。\n……先上楼看看论坛上有没有人回吧。');
    if (ph === 'chase') { clack(S); return S.narr('你去拧电源钮——拧不动！\n像有另一只手，在里面攥着它。'); }
    if (ph === 'final') {
      if (!S.f.unplug) return S.narr('电视安安静静的，屏幕是灰的。\n插头在洗衣机后面。拔了它，明天卡车来了直接搬走。');
      return finalShow(S);
    }
    if (ph === 'tune') {
      if (S.once('tvon')) {
        await S.narr('一台老式的落地电视，木头机壳，四条细腿。右边两个旋钮：上面那个 VHF 停在「U」上；下面那个 UHF 是一圈一圈能一直转的——钮上的数字，早就磨得一个都看不见了。');
        await S.think('……是被一只小手，一天一天磨光的。');
        await S.narr('你拧开电源。显像管「嗡」地响了一声，慢慢亮起来——\n满屏雪花。');
        tv.power = 'static'; tv.off = false; S.sfx('tv');
      }
      return toScreen(S, 'tune');
    }
    if (ph === 'p2' || ph === 'p3') return S.narr('雪花，沙沙沙的。你盯着看了一会儿，什么都想不起来了。\n……也许论坛上，又有人想起了什么。');
    if (ph === 's2') { await toScreen(S, 'show'); await seg2(S); return backDown(S, async () => { S.f.phase = 'p3'; S.ent('laptop').s.new = 1; await S.think('一个儿童节目。下午四点的儿童节目。\n……怎么会有这种东西？'); S.goal('上楼看看论坛'); }); }
    if (ph === 's3') { await toScreen(S, 'show'); await seg3(S); await seg4(S); return chaseStart(S); }
    return S.narr('电视安安静静地立在墙角。');
  }

  /* ---------------- 进出电视 ---------------- */
  async function toScreen(S, mode) {
    await S.fade(1, 300);
    S.hidePlayer(true); S.f.mode = mode;
    await S.go('screen', X0 + (S.f.found ? P58 : (S.f.dial || 0)), 18, 2, { fade: false });
    camUpdate(0, true);
    await S.fade(0, 300);
    if (mode === 'tune') {
      if (S.once('tuneHelp')) await S.narr('雪花，沙沙沙的。\n你的手搭在 UHF 旋钮上。往右拧，台号变大；往左拧，变小。拧一下，「咔」一声。');
      S.goal((S.f.tries || 0) >= 4 ? '调到 58 台：从福音台（46）往右转六下，按调查键' : '调到 58 台：←→ 转旋钮，停稳按调查键（看收得到的台推算；频道表在「笺」里）');
    }
  }
  async function backDown(S, after) {
    await S.fade(1, 300);
    S.f.mode = null; S.hidePlayer(false); stageReset(S);
    await S.go('basement', 3, 5, 3, { fade: false });
    await S.fade(0, 300);
    if (after) await after();
  }
  async function cut(S, fx, fy, mode) {
    await S.fade(1, 140);
    S.focus(fx, fy); S.place('crt', fx, fy); const v = S.ent('veil'); if (!v.hidden) S.place('veil', fx, fy);
    if (mode) S.ent('crt').s.mode = mode;
    camUpdate(0, true);
    await S.fade(0, 140);
  }
  function stageReset(S) {
    for (const id of PUPS) { S.hide(id); S.ent(id).alpha = 1; }
    S.hide('veil'); const v = S.ent('veil'); v.s.red = 0;
    const sh = S.ent('ship'); sh.s.talk = 0; sh.s.scream = 0; S.ent('cave').s.deep = 0;
    S.focus(12, 7); S.place('crt', 12, 7);
  }
  async function shipSay(S, text, o) { const sh = S.ent('ship'); sh.s.talk = 1; try { await S.say('笑柄号', text, o); } finally { sh.s.talk = 0; } }
  async function revealShow(S) {
    const c = S.ent('crt'); c.s.mode = 'show';
    for (let i = 0; i <= 12; i++) { c.s.k = 1 - i * .07; await S.wait(90); }
    c.s.k = .16;
  }

  /* ---------------- 调台 ---------------- */
  async function lockTune(S) {
    if (S.f.mode !== 'tune') return;
    const p = S.pl.x - X0; S.f.dial = p;
    if (p === P58) return found58(S);
    S.f.tries = (S.f.tries || 0) + 1;
    const st = ST.find(s => s.p === p);
    if (st) { stationSound(S, st.k); await S.narr(STN[st.k]); }
    else {
      S.f.miss = (S.f.miss || 0) + 1; S.sfx('tv');
      if (S.f.miss === 1) { S.fx('glitch'); S.sfx('whisper'); await S.narr('雪花，沙沙沙的。\n雪花底下，好像有人很小声地说了一句什么。'); }
      else if (S.f.miss === 2) { S.fx('glitch'); clack(S, .7); clack(S, .7, .35); await S.narr('雪花。\n沙沙声底下，有一种很轻的声音：咔、咔、咔。\n像牙齿在磕。'); }
      else { await S.scare('static'); await S.narr('雪花猛地一亮，亮得刺眼。\n一瞬间，你好像看见雪花里有一张脸贴着玻璃——再看，又只是雪花。'); }
    }
    await tuneHint(S);
    const r = await S.ask('旋钮还在你手里。', ['接着调', '先关掉电视']);
    if (r === 1) return backDown(S, async () => S.goal((S.f.tries || 0) >= 4 ? '调到 58 台：再看一次电视，从福音台（46）往右转六下' : '调到 58 台：再看一次电视（频道表在「笺」里）'));
  }
  async function tuneHint(S) {
    const n = S.f.tries;
    if (n === 1) await S.think('……论坛上有人说是 58 台。可旋钮上一个数字都没有。');
    else if (n === 2) await S.think('收得到的台，角上都有台标号码。\n……它们在旋钮上，隔得是不是一样远？\n（雪花里，好像有什么地方飘出来一点点调子。）');
    else if (n === 3) await S.think('22、34、46……每隔 12 个台，旋钮正好「咔」六下。\n那 58 台，应该在……');
    else { await S.think('福音台（46）再往右「咔」六下——正好在福音台和购物台（70）的正中间。\n就是那儿。58 台。'); S.goal('调到 58 台：从福音台（46）往右转六下，按调查键'); }
  }
  async function found58(S) {
    S.f.found = true; S.f.mode = 'show'; S.f.dial = P58;
    S.goal('');
    await S.narr('雪花。\n……可是这片雪花，跟别处的不一样。它在动——不是乱动，是一层一层地，往两边退。');
    S.sfx('chime');
    await revealShow(S);
    await seg1(S);
    return backDown(S, async () => {
      S.f.phase = 'p2'; S.ent('laptop').s.new = 1;
      await S.think('我想起来了。\n佩西，珍妮丝，笑柄号。我全都想起来了。\n……它是真的。');
      S.goal('回厨房，看看论坛有没有新回复');
    });
  }

  /* ---------------- 第一段：片头 ---------------- */
  async function seg1(S) {
    await S.narr('画面是彩色的，可是颜色褪得厉害，像泡过水。\n一块画着海浪的硬纸板，一艘画着笑脸的木头船。岸边的石头上，点着一排蜡烛。');
    const t = theme(S); theme(S, .9, t, .985);
    await S.say('电视里的歌声', '烛湾，烛湾，点着蜡烛的海湾——\n扬起帆呀笑柄号，带我们去找宝藏——');
    await S.narr('手风琴似的小调，走了音。你跟着在心里哼完了下半句。\n你居然会唱。');
    S.place('p_janice', 22, 10, 1);
    await S.walk('p_janice', [13, 10], 3);
    S.face('p_janice', 2);
    await S.say('珍妮丝', '佩西！佩西——你在哪儿？');
    const pe = S.ent('p_percy'); S.place('p_percy', 16, 10, 1); pe.alpha = 0;
    await S.alpha('p_percy', 1, 500);
    S.bubble('p_percy', '!', 800);
    await S.say('海盗佩西', ['嘘——小声点，珍妮丝！', '宝藏会被你吓跑的！']);
    await S.say('珍妮丝', '宝藏又没有腿，怎么会跑？');
    await S.say('海盗佩西', ['会跑的！什么东西都会跑的！', '……还有，你又一个人跑到烛湾来了。你妈妈知道吗？']);
    await shipSay(S, '哈——哈——哈——');
    await S.say('海盗佩西', '别笑了，笑柄号！');
    await S.narr('木偶的线在画面顶上晃。拍的人连线都懒得藏。\n可是七岁的你，一点都不在乎。');
    S.face('p_percy', 0); S.bubble('p_percy', '…', 1200); S.sfx('heart');
    await S.narr('佩西忽然转过头来。\n看着镜头。看着你。');
    await S.say('海盗佩西', ['……你也来啦？', '现在又不是四点。你好久好久，都没来了。'], { style: 'whisper' });
    S.ent('crt').s.mode = 'snow'; S.sfx('tv');
    await S.wait(700);
  }

  /* ---------------- 第二段：剥皮人 ---------------- */
  async function seg2(S) {
    S.place('veil', 12, 7);
    S.place('p_janice', 13, 10, 2); S.place('p_percy', 15, 10, 1);
    await revealShow(S);
    await S.narr('这一集是晚上。蜡烛都点着了。\n佩西和珍妮丝坐在沙滩上，数一小箱金币。');
    await S.say('海盗佩西', '一百零一，一百零二……珍妮丝，你别动，你一动我就数乱了。');
    clack(S, .5); clack(S, .5, .4);
    await S.say('珍妮丝', '……佩西，你听。');
    await S.say('海盗佩西', '我、我什么都没听见！');
    clack(S, .9); clack(S, .9, .3); clack(S, .9, .6);
    const sk = S.ent('p_skin'); S.place('p_skin', 11, 2, 0); sk.alpha = 0;
    await S.alpha('p_skin', 1, 400);
    await S.walk('p_skin', [11, 9], 1.6);
    await S.narr('一个东西从上面吊了下来。\n你看得见吊着它的线。线一直伸到画面外面，伸到你看不见的地方。');
    await S.scare('face', { spr: '@skin', sfx: 'scare' });
    await S.narr('一张骷髅脸，糊着一圈乱糟糟的棕胡子。两颗玻璃眼珠，亮得不像假的。\n下巴松松地挂着，一张，一合。咔，咔，咔。\n高礼帽。披风。');
    await S.say('剥皮人', ['晚——上——好——', '小——朋——友——们——']);
    await S.narr('那件披风是一块一块缝起来的，颜色深深浅浅，针脚又粗又大。\n节目里从来没说过，那是用什么做的。\n可是坐在电视前面的每一个小孩，都知道。');
    await S.say('剥皮人', '我的披风……旧了。');
    S.face('p_skin', 0); clack(S, 1);
    await S.say('剥皮人', '你的……还很新。', { style: 'whisper' });
    S.bubble('p_percy', '!', 900);
    await S.say('海盗佩西', '珍、珍妮丝！快跑——！', { style: 'big' });
    S.ent('crt').s.mode = 'snow'; S.sfx('tv');
    await S.wait(700);
  }

  /* ---------------- 第三段：山洞 ---------------- */
  async function seg3(S) {
    S.place('p_percy', 28, 11, 3); S.place('p_janice', 25, 11, 2);
    await cut(S, 28, 7, 'show');
    await revealShow(S);
    await S.narr('山洞。洞口点着一圈蜡烛，洞里黑得像一口井。\n佩西站在洞口，两条腿一直在抖。');
    await S.say('海盗佩西', ['我不要进去。', '里面好黑，珍妮丝。里面有声音。']);
    await shipSay(S, '你得进去，佩西。');
    await S.narr('是笑柄号的声音。可是画面里看不见船——声音是从画面外面传进来的。');
    S.face('p_janice', 2);
    await S.say('珍妮丝', '你得进去。');
    await S.narr('珍妮丝说这句话的时候，脸上没有表情。木偶本来就没有表情。\n可是你记得——那一天，你觉得她的声音变了。');
    S.ent('cave').s.deep = 1; S.sfx('whisper');
    await S.narr('镜头慢慢往洞里推。\n洞的最深处，有两个小小的、亮亮的点。');
    S.face('p_percy', 0); S.bubble('p_percy', '?', 1200);
    await S.narr('佩西慢慢地转过头来，看着镜头。');
    await S.say('海盗佩西', '……那你呢？');
    const r = await S.ask('电视里的声音，在等你回答。', ['「……我也进去。」', '「我不进去。」']);
    S.f.yes1 = r === 0;
    if (r === 0) await S.say('珍妮丝', '好。我们等你。');
    else await S.say('海盗佩西', '……你每次都这么说。', { style: 'whisper' });
  }

  /* ---------------- 第四段：尖叫的那一集 ---------------- */
  async function seg4(S) {
    S.fx('glitch'); S.sfx('tv');
    S.place('p_janice', 10, 10, 0); S.place('p_percy', 12, 10, 0); S.place('p_skin', 14, 10, 0);
    S.place('veil', 12, 7); S.ent('veil').s.red = 1;
    await cut(S, 12, 7, 'scream');
    await S.narr('画面跳了一下。换了一集。\n没有片头，没有歌。所有的木偶都站成一排，脸朝着镜头。');
    S.sfx('cry');
    await S.narr('珍妮丝在哭。');
    shriek(S, 1); S.ent('ship').s.scream = 1; S.shake(500, 2);
    await S.scare('face', { spr: '@percy', sfx: 'scream' });
    await S.narr('佩西张着嘴在叫。剥皮人一边叫，一边磕牙，咔咔咔咔咔。\n连笑柄号也在叫——船头那张画上去的笑脸，嘴张得比整条船还大。');
    shriek(S, 1.2); shriek(S, 1, .5);
    await S.say('', '啊啊啊啊啊啊啊啊——', { style: 'big' });
    await S.narr('你去拧音量钮，拧到了底。\n叫声还在变大。');
    shriek(S, 1.4); S.shake(900, 3);
    await S.walk('p_skin', [13, 12], 2.4);
    await S.say('剥皮人', '进——来——', { style: 'big' });
  }

  /* ---------------- 地下室：剥皮人出来了 ---------------- */
  async function chaseStart(S) {
    await S.fade(1, 120);
    S.f.mode = null; S.hidePlayer(false); stageReset(S);
    S.f.phase = 'chase';
    const tv = S.ent('tv'); tv.power = 'scream'; tv.off = false; S.ent('bulb').off = true;
    await S.go('basement', 5, 8, 3, { fade: false });
    S.dark(.84);
    await S.fade(0, 200);
    S.shake(500, 3); S.sfx('thud');
    await S.narr('你整个人往后一仰——不，是被什么东西推了出去——摔在几步外的水泥地上。\n头顶的灯泡「啪」地灭了。');
    shriek(S, .8);
    S.focus(3, 4); S.place('skin_b', 2, 4, 0); const e = S.ent('skin_b'); e.alpha = .55;
    await S.narr('电视还在叫。\n屏幕里，那张骷髅脸贴着玻璃，越贴越近……然后，玻璃好像不存在了。');
    S.hide('skin_b'); S.focus(null);
    S.sfx('close');
    await S.narr('楼梯顶上，地下室的门「砰」地关上了。');
    await S.think('电源钮拧不动——插头在洗衣机后面，够不着——\n电闸！东北角墙上那个电闸箱！');
    S.goal('电视关不掉！跑到东北角的电闸箱，拉下电视那一路（拿不准就请另一个人翻「笺」里的频道表）');
    S.toast('跑！别停下来！');
    chaseReset(S, 1.0);
    S.cp('chase');
  }

  /* ================= 疗养院 ================= */
  async function nurseOn(S) {
    S.face('nurse', 'pl');
    if (S.f.phase === 'home') return S.say('护士', ['路上慢点开。', '……那台电视的事，你别往心里去。老机器了。']);
    if (S.once('sign')) {
      await S.say('护士', ['来看你妈妈？她今天精神不错，早上还问你什么时候来。', '先签个到吧。']);
      await S.narr('访客登记簿。你在「来访人」一栏写下自己的名字，「时间」那一栏写：3:42 PM。');
      return;
    }
    await S.say('护士', '她在房间里。走廊右手边，靠窗那间。');
  }
  async function oldmanOn(S) {
    if (S.f.four) return S.narr('老先生还盯着电视。屏幕上只有雪花。\n「换台了，」他小声说，也不知道是在跟谁说，「每天这个点儿，都换台。」');
    await S.narr('老先生攥着遥控器，谁也不让碰。\n「这个节目好，」他说，「猜对了价格，东西就归你。」');
  }
  async function ctvOn(S) {
    if (S.f.four) return S.narr('活动室的电视只剩一片雪花，沙沙沙的。护士拍了两下机顶，没用。\n你没有走近。');
    await S.narr('电视里在放一个猜价格的游戏节目。一个穿毛衣的大婶猜中了一台洗碗机，激动得直跳。');
  }
  async function careExit(S) {
    if (S.f.phase !== 'home') return S.narr('还没见到妈妈呢。她的房间在走廊右手边。');
    await S.fade(1, 800);
    await S.card('那天晚上', '', '收旧家电的卡车，约在明天上午九点。\n\n你回到老房子，下了地下室。\n电视安安静静地立在墙角，屏幕是灰的。\n\n只要拔掉插头就好。\n只要拔掉插头。');
    S.f.phase = 'final';
    await S.go('basement', 2, 2, 0);
  }

  const MOMQ = ['「妈，你记不记得一个叫《烛湾》的电视节目？」', '「一个木偶海盗，一艘会笑的船……」', '「还有一个……剥皮人。」', '「下午四点，58 台。」'];
  async function momOn(S) {
    S.face('mom', 'pl');
    if (S.f.phase === 'home') return S.say('妈妈', ['回去吧，天快黑了。', '……那台电视，扔了。听见没有？']);
    if (!S.f.momMet) {
      S.f.momMet = true;
      await S.narr('妈妈坐在窗边的轮椅上，腿上盖着一条毛毯。');
      await S.say('妈妈', ['你来啦。', '房子收拾得怎么样了？我那几箱碗，你可别给我扔了。']);
      await S.say('你', '没扔。都装好了。');
      await S.say('妈妈', '那就好。……你脸色怎么这么差？一宿没睡？');
      S.goal('问问妈妈，她记不记得《烛湾》');
    }
    for (; ;) {
      const opts = MOMQ.slice(); const ids = [0, 1, 2, 3];
      if (S.has('drawing')) { opts.push('（把那张蜡笔画拿给她看）'); ids.push(4); }
      if (S.has('sock') && !S.f.sockShown) { opts.push('（把袜子木偶拿出来）'); ids.push(5); }
      opts.push('（先不说了）'); ids.push(6);
      const k = ids[await S.ask('妈妈等着你开口。', opts)];
      if (k === 6) return;
      if (k === 3) return famous(S);
      if (k === 4) { await S.say('妈妈', ['这是你画的。这条船，你画了不下一百遍。', '船头上还非得画一张笑脸。我问你为什么，你说：「因为它是笑柄号呀。」', '……笑柄号。我都忘了。', '你每天画完一张，就扔下蜡笔往地下室跑。天天都是那个点儿。']); continue; }
      if (k === 5) { S.f.sockShown = true; await S.say('妈妈', ['哎哟，这个还在！', '你七岁那年，非让我缝个海盗，说要给「佩西」做个伴。我拿你爸的旧袜子缝的，钉了两颗扣子当眼睛。', '缝好了你又不要了，说佩西的眼睛不是扣子。……你那时候可挑剔了。']); continue; }
      S.f.mw = (S.f.mw || 0) + 1;
      if (k === 0) await S.say('妈妈', ['烛……什么湾？', '没听说过。是电视节目？']);
      else if (k === 1) await S.say('妈妈', ['你小时候是迷海盗。拿个卫生纸筒当望远镜，在后院喊「起锚」。', '……这跟电视有什么关系？']);
      else await S.say('妈妈', ['……什么人？', '你这孩子，大白天的说这个。']);
      if (S.f.mw === 2) await S.say('妈妈', ['我哪知道你看的什么节目。我那会儿下午都在厨房忙。', '我就记得，你每天一到点儿，就往地下室跑。']);
      else if (S.f.mw >= 3) await S.say('妈妈', '……一到几点来着？天天都是那个点儿。下午……下午四点？');
    }
  }
  async function famous(S) {
    await S.narr('你说出「四点」的时候，妈妈的手停了一下。');
    await S.say('妈妈', ['……四点。你怎么还记得这个？', '我记得的不是什么《烛湾》。我记得的是你。']);
    await S.say('妈妈', ['你七岁那年，每天下午四点，都跑到厨房来跟我说：\n「妈，我要去看烛湾了。」', '然后你就下到地下室，把电视调到一个没有台的地方。\n对着一片雪花，一看就是半个钟头。']);
    await S.say('妈妈', '我下楼看过你一次。你盘着腿坐在那块小地毯上，看得可认真了。有时候笑，有时候还跟雪花说话。\n我还以为你在玩什么想象出来的游戏。你从小就想象力好。');
    await S.think('……雪花。\n那个时间段，58 台什么都没有播。从来就没有播过。');
    S.f.four = true; S.ent('ctv').power = 'static';
    S.sfx('tv'); theme(S, .3, .4, .97);
    await S.narr('走廊那头，活动室的鼓掌声突然断了，变成一片沙沙声。沙沙声里，有人在弹一段走了音的小调。\n墙上的钟，正好指着四点。');
    await S.say('护士（走廊）', '哎，这台电视又这样了……一到四点就跳台，修了好几回了。');
    if (S.f.phoned) await S.say('妈妈', '你那时候还老拿厨房那部电话，假装打给谁。拨好多好多个号码，然后说：「妈，我要去看烛湾了。」');
    await S.say('妈妈', '你对着雪花说过一句话，我一直记得。\n你说：「我不进去，佩西。我不进去。」');
    if (S.f.yes1) await S.think('……可是昨天夜里，我对它说的是——「我也进去」。');
    const r = await S.ask('妈妈握住你的手。她的手很凉。', ['「……妈，那时候你怎么不拦着我？」', '（握紧她的手）']);
    await S.say('妈妈', (r === 0 ? '拦什么？一片雪花，有什么好拦的。\n' : '') + '……那台老电视，你扔了吧。别再下去看了。');
    S.f.phase = 'home';
    S.goal('回家，把地下室那台老电视处理掉（从大门出去）');
  }

  /* ================= 最后一夜 ================= */
  async function finalEnter(S) {
    const tv = S.ent('tv'); tv.power = false; tv.off = true; tv.light = TVL;
    S.ent('bulb').off = false; S.ent('furnace').off = false; S.hide('skin_b'); S.dark(null);
    if (S.once('finalIn')) await S.narr('你把电闸推了回去。灯泡闪了两下，亮了。\n地下室里静悄悄的。只有暖气炉在呼呼地响。');
    S.goal('拔掉电视的插头（插座在洗衣机后面）');
    S.cp('final');
  }
  async function unplug(S) {
    if (S.f.unplug) return S.narr('插头握在你手里。线软软地垂着，一直拖到电视那边。');
    await S.narr('你把洗衣机挪开一点，伸手到后面，把那根灰色的插头拔了下来。\n插头握在你手里，还是温的。');
    S.f.unplug = true;
    await S.wait(500);
    const tv = S.ent('tv'); tv.power = 'static'; tv.off = false; S.sfx('switch'); S.sfx('tv');
    await S.narr('身后，「啪」的一声。\n然后是那个声音。沙沙沙的。');
    await S.think('……插头，在我手里。');
    S.goal('……去电视前面');
  }
  async function finalShow(S) {
    await toScreen(S, 'show');
    S.place('veil', 12, 7);
    S.place('p_janice', 10, 10, 0); S.place('p_percy', 12, 10, 0); S.place('p_skin', 15, 10, 0);
    S.ent('crt').s.k = .3;
    await S.narr('雪花里，所有的木偶都站在沙滩上，脸朝着镜头。\n蜡烛点着。笑柄号停在它们身后。');
    await S.say('海盗佩西', ['你今天四点没来。', '我们等了好久好久。珍妮丝一直在哭。']);
    S.sfx('cry');
    await S.say('珍妮丝', '你说过你明天还来的。你每次都这么说。');
    if (S.f.yes1) await S.say('海盗佩西', '你答应过的。在山洞口，你说你也进来。');
    clack(S, .8); clack(S, .8, .3);
    await shipSay(S, '你得进去。');
    await S.narr('剥皮人一句话也没说。他只是站在后面，下巴一张一合。咔，咔，咔。\n你的手里，还握着那根没插上的插头。');
    for (; ;) {
      const r = await S.ask('雪花沙沙地响。它们都在等你。', ['伸手，把电视关掉', '……进去', '坐下来，再看一会儿']);
      if (r === 1) return endInside(S);
      if (r === 2) return endDeadair(S);
      if (await endOff(S)) return;
    }
  }
  async function endOff(S) {
    await S.narr('你伸手去拧那个电源钮。');
    const c = S.ent('crt'); c.s.mode = 'scream'; S.ent('veil').s.red = 1; S.ent('ship').s.scream = 1;
    for (const id of PUPS) S.bubble(id, '!', 1500);
    shriek(S, 1.2); S.shake(700, 3);
    await S.scare('face', { spr: '@percy', sfx: 'scream' });
    await S.say('海盗佩西', '不要！不要关！你走了，我们去哪儿？', { style: 'big' });
    await S.narr('旋钮很紧。紧得像有另一只手在里面，往反方向拧。');
    const r = await S.ask('它们都在叫。', ['用力，拧到底', '……松手']);
    if (r === 1) {
      c.s.mode = 'show'; S.ent('veil').s.red = 0; S.ent('ship').s.scream = 0;
      await S.narr('你松开了手。\n叫声一下子停了。它们又安安静静地站在雪花里，看着你。');
      return false;
    }
    S.sfx('switch'); crtOff(S); S.amb('none');
    c.s.mode = 'dot';
    for (let i = 0; i <= 32; i++) { c.s.k = i / 32; await S.wait(i < 24 ? 60 : 160); }
    S.tone('sine', 15000, 9000, 1.6, .012); await S.wait(500);
    await S.narr('「咔。」\n\n画面一下子缩成一条白线，又缩成一个白点。');
    await S.narr('白点在黑暗里亮了很久，很久。\n然后，灭了。');
    await S.fade(1, 1200);
    let txtE = '第二天上午九点，收旧家电的卡车准时到了。两个工人把那台老电视抬上车，说这年头还能看到这种木头机壳的，真少见。\n\n那天晚上，你在论坛的帖子底下补了最后一条，把妈妈的话原原本本地写了上去。\n帖子沉下去了。再也没有人回复。\n\n六月十二日，全美的全功率电视台关掉了模拟信号。\n那天下午四点，你在办公室里开会，一次也没有看表。';
    if (S.f.sockShown) txtE += '\n\n那只袜子木偶，你带回了家，放在书架上。\n妈妈说你七岁的时候嫌它不像。你现在觉得，它挺好。它的扣子眼睛一颗高、一颗低，看上去总是有点害怕——可它从来不叫你进哪儿去。';
    if (S.f.phoned) txtE += '\n\n厨房墙上那部老电话，你拆下来，一起交给了收旧家电的人。\n你没有告诉妈妈，那天夜里它响过。';
    if (S.f.yes1) txtE += '\n\n只是有时候，别人家的电视换台的那一瞬间，在那半秒钟的雪花里，你会听见一个很小的声音：\n「你答应过的。」';
    await S.end({ id: 'off', title: '第三夜　完', text: txtE });
    return true;
  }
  async function endInside(S) {
    await S.narr('你朝屏幕伸出手。\n屏幕是软的，凉凉的，像一层水。');
    await S.say('珍妮丝', '进来吧。这里一直都是下午四点。');
    await shipSay(S, '……哈——哈——哈——');
    S.amb('none'); await S.fade(1, 1500);
    await S.end({ bad: true, id: 'inside', title: '你得进去', text: '收旧家电的工人第二天上午到的。\n地下室里没有人。只有那台老电视开着，一片雪花，沙沙沙地响。\n插头掉在地上，没有插。\n\n后来，有人在那个怀旧论坛上翻出了这个老帖子，接着往下回：\n「我也记得这个节目！后来好像还加了一个新角色——是个大人，总是站在山洞口，不进去，也不出来。」\n「他一直在看镜头。」' });
  }
  async function endDeadair(S) {
    await S.narr('你在那块小地毯上坐了下来。盘着腿，跟七岁的时候一模一样。');
    await S.narr('雪花沙沙地响。\n佩西在讲宝藏的事，珍妮丝在笑，笑柄号哈哈大笑。剥皮人站在后面，没有动。\n你看得可认真了。');
    S.amb('none'); await S.fade(1, 1500);
    await S.end({ bad: true, id: 'deadair', title: '半个钟头的雪花', text: '半个钟头以后，你站起来，上楼，给疗养院打了个电话。\n「妈，」你说，「我明天四点再来看你。」\n\n你没有说，四点以前，你要先看一会儿电视。\n\n房子没有卖。收旧家电的卡车，你打电话取消了。\n六月十二日，模拟信号停播了。全国的老电视，在那天下午，一下子全都只剩雪花。\n你觉得那天的节目，特别好看。' });
  }
})();
