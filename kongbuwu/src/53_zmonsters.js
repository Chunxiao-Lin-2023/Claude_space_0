/* ================= 小剧场里的怪物（手画像素，比普通小人大 2–3 倍） =================
   都是通用的恐怖原型（长发红衣女鬼、瘦长无脸、两张脸的影子、半边塌掉的脸……），不照搬任何改编作品的造型。
   GH[形象](R, t, o)：R(x, y, w, h, 颜色) 以精灵左上角为原点；o = { dir, moving, talk, glow, k }。
   GHOST_OF：剧本里的名字 → 形象。画两遍：先画身体（会被黑暗盖住），黑暗之后再画一遍“发光”的部分（脸、眼、红衣），
   所以它们在黑里也看得见——像真的站在那儿。 */
const GH = {
  /* 长发红衣女鬼：头发盖住脸，从发缝里露出一只红眼；手垂到膝盖；裙摆破烂，脚不沾地 */
  redwoman: { w: 20, h: 38, draw(R, t, o) { const b = Math.round(Math.sin(t * 1.7)) - 2, sw = Math.sin(t * 2.3), H = o.hair || '#0b0707', D = o.dress || '#8e0c0c', D2 = o.dress2 || '#560505', S = o.skin || '#e6dfd8', gl = o.glow;
    if (!gl || o.k !== 'dim') { R(6, 12 + b, 8, 7, D); R(5, 18 + b, 10, 7, D); R(4, 24 + b, 12, 7, D); R(3, 30 + b, 14, 4, D2); R(6, 12 + b, 2, 20, D2); R(12, 17 + b, 1, 14, o.dressHi || '#b01a1a');
      for (let i = 0; i < 14; i += 2) R(3 + i, 34 + b, 1, ((i * 7 + Math.floor(t * 5)) % 3) ? 2 : 1, D2); }
    R(4, 13 + b, 2, 12, S); R(14, 13 + b, 2, 12, S); R(3, 25 + b, 1, 3, S); R(5, 25 + b, 1, 4, S); R(14, 25 + b, 1, 4, S); R(16, 25 + b, 1, 3, S);
    R(6, 0 + b, 8, 3, H); R(5, 2 + b, 10, 10, H); R(4, 4 + b, 2, 22, H); R(14, 4 + b, 2, 20, H); R(9, 4 + b, 2, 7, S);
    for (let i = 0; i < 5; i++) R(5 + i * 2 + (i % 2 ? 0 : Math.round(sw * .7)), 10 + b, 1, 7 + (i * 5) % 8, H);
    if (Math.sin(t * 1.3) > -.7) R(9, 6 + b, 1, 1, '#ff2a2a'); if (o.drip) for (let i = 0; i < 3; i++) R(5 + i * 5, 34 + b + ((t * 18 + i * 7) % 10), 1, 2, D2); } },
  /* 镜鬼：灰白的女人，脸是一块裂开的镜子，镜片绕着她转 */
  mirrorghost: { w: 18, h: 36, draw(R, t, o) { const b = Math.round(Math.sin(t * 1.5)) - 1, G = '#9aa0aa', G2 = '#5e6470', M = '#c8d4dc';
    R(5, 12 + b, 8, 22, G2); R(6, 12 + b, 6, 20, G); R(4, 14 + b, 2, 12, G); R(12, 14 + b, 2, 12, G); R(5, 2 + b, 8, 10, '#20242a');
    R(6, 3 + b, 6, 8, M); R(7, 4 + b, 1, 6, '#ffffff'); R(6, 6 + b, 6, 1, '#1a1e24'); R(9, 3 + b, 1, 8, '#1a1e24'); R(10, 8 + b, 2, 1, '#1a1e24'); R(8, 5 + b, 1, 1, '#ff3030');
    for (let i = 0; i < 4; i++) { const a = t * 1.4 + i * 1.57, x = 9 + Math.cos(a) * 9, y = 18 + b + Math.sin(a) * 6; R(Math.round(x), Math.round(y), 2, 3, M); R(Math.round(x), Math.round(y), 1, 1, '#fff'); } } },
  /* 两张脸的影子：黑色的人形，一个头上并排两张白脸，嘴都张着 */
  twoface: { w: 22, h: 40, draw(R, t, o) { const b = Math.round(Math.sin(t * 1.2)), K = '#141016', K2 = '#2a2430', F = '#e4dcd4', tw = Math.sin(t * 7) > .92 ? 1 : 0;
    R(6, 14 + b, 10, 24, K); R(7, 14 + b, 8, 22, K2); R(3, 16 + b, 3, 18, K); R(16, 16 + b, 3, 18, K); R(2, 33 + b, 2, 4, K); R(18, 33 + b, 2, 4, K);
    R(3, 1 + b, 16, 13, K); R(4, 3 + b + tw, 6, 9, F); R(12, 2 + b - tw, 6, 9, F);
    R(5, 5 + b + tw, 1, 2, '#000'); R(8, 5 + b + tw, 1, 2, '#000'); R(6, 9 + b + tw, 2, 2, '#300'); R(13, 4 + b - tw, 1, 2, '#000'); R(16, 4 + b - tw, 1, 2, '#000'); R(14, 8 + b - tw, 2, 3, '#300');
    R(5, 6 + b + tw, 1, 3, '#555'); R(16, 6 + b - tw, 1, 3, '#555'); } },
  /* 半边塌掉的脸：病号服的壮汉，右半张脸凹下去，一只眼睛鼓出来，手里提着刀 */
  deformed: { w: 22, h: 38, draw(R, t, o) { const b = 0, P = '#8aa0b4', P2 = '#6a8094', S = '#d8bea4', B = '#6a1010', sw = Math.round(Math.sin(t * 2) * .6);
    R(4, 14, 14, 16, P); R(4, 14, 3, 16, P2); R(9, 18, 4, 6, B); R(14, 22, 3, 5, B); R(5, 30, 5, 7, P2); R(12, 30, 5, 7, P2); R(5, 36, 5, 2, '#2a2420'); R(12, 36, 5, 2, '#2a2420');
    R(1, 15, 3, 12, S); R(18, 15, 3, 10, S); R(19 + sw, 22, 2, 14, '#b8bcc4'); R(18 + sw, 22, 4, 2, '#4a3020'); R(20 + sw, 30, 1, 5, B);
    R(5, 1, 12, 13, S); R(5, 0, 12, 3, '#2a2420'); R(11, 3, 6, 10, '#7a3a44'); R(12, 5, 4, 6, '#4a1a24'); R(13, 6, 3, 3, '#f0ece0'); R(14, 7, 1, 1, '#000'); R(7, 6, 2, 1, '#000'); R(7, 10, 6, 1, '#300'); R(9, 11, 3, 1, '#300'); R(10, 1, 1, 12, '#3a1a20'); } },
  /* 独臂：病号服，左袖子空着往下滴血 */
  onearm: { w: 18, h: 34, draw(R, t, o) { const P = '#8aa0b4', P2 = '#6a8094', S = '#d6c0aa';
    R(4, 12, 10, 14, P); R(4, 12, 2, 14, P2); R(3, 12, 2, 6, P); R(3, 17, 2, 2, '#c8c0b0'); R(3, 19 + ((t * 10) % 8 | 0), 1, 1, '#7a0a0a'); R(14, 13, 2, 11, S);
    R(5, 26, 4, 7, P2); R(10, 26, 4, 7, P2); R(5, 2, 9, 10, S); R(5, 1, 9, 3, '#2a2420'); R(7, 6, 1, 1, '#000'); R(11, 6, 1, 1, '#000'); R(8, 9, 3, 1, '#4a2020'); } },
  /* 瘦长怪物：很高很瘦，头垂在胸前看不见脸，手垂到小腿，手指很长 */
  slender: { w: 20, h: 60, draw(R, t, o) { const sway = Math.round(Math.sin(t * .9) * 1.2), C = o.col || '#d2ccc2', C2 = '#9a948a', K = '#141214', one = o.oneEye;
    R(8, 18, 4, 30, C); R(8, 18, 1, 30, C2); R(7, 46, 2, 14, C2); R(11, 46, 2, 14, C2); R(6, 58, 3, 2, C2); R(11, 58, 3, 2, C2);
    R(6, 18, 2, 2, C); R(5, 19, 2, 24, C2); R(13, 18, 2, 2, C); R(13, 19, 2, 24, C2);
    for (let i = 0; i < 4; i++) { R(4 + i, 43, 1, 6 + (i % 2) * 2, C); R(12 + i, 43, 1, 6 + ((i + 1) % 2) * 2, C); }
    R(7 + sway, 9, 6, 9, K); R(6 + sway, 6, 8, 5, K); for (let i = 0; i < 4; i++) R(6 + sway + i * 2, 14, 1, 6 + (i * 3) % 5, K);
    R(9 + sway, 12, 2, 5, '#000'); if (one) { R(10 + sway, 9, 3, 3, '#e8e0c8'); R(11 + sway, 10, 1, 1, Math.sin(t * 3) > 0 ? '#f02020' : '#a00'); } } },
  /* 护士：歪着脖子，口罩，黑眼窝，手里一支针管，裙子上有血 */
  nurse: { w: 18, h: 36, draw(R, t, o) { const tl = Math.round(Math.sin(t * .8) * 1) + 3, W = '#e2e0d8', W2 = '#b8b6ae', S = '#d8d0cc', B = '#7a0c0c';
    R(5, 13, 8, 16, W); R(5, 13, 2, 16, W2); R(4, 26, 10, 4, W); R(9, 20, 2, 3, B); R(6, 25, 3, 2, B); R(6, 30, 2, 6, S); R(10, 30, 2, 6, S);
    R(3, 14, 2, 10, S); R(13, 14, 2, 9, S); R(14, 21, 4, 1, '#c8d8e0'); R(17, 20, 1, 3, '#8a8a90'); R(14, 21, 1, 1, B);
    R(4 + tl, 2, 9, 10, S); R(4 + tl, 0, 9, 4, '#e8e8e0'); R(4 + tl, 1, 9, 1, '#c03030'); R(5 + tl, 8, 7, 3, '#f0f0ea'); R(6 + tl, 5, 2, 2, '#0a0808'); R(10 + tl, 5, 2, 2, '#0a0808'); R(6 + tl, 7, 1, 2, '#300'); } },
  /* 老院长：红衣的老人，白头发，眼窝是空的，嘴张着合不上 */
  dean: { w: 20, h: 40, draw(R, t, o) { const b = Math.round(Math.sin(t * 1.1)) - 1, Rr = '#8e1212', R2 = '#5a0808', S = '#e0d8d2';
    R(5, 13 + b, 10, 22, Rr); R(4, 20 + b, 12, 16, Rr); R(5, 13 + b, 2, 22, R2); R(3, 34 + b, 14, 3, R2); R(3, 14 + b, 2, 14, Rr); R(15, 14 + b, 2, 14, Rr); R(3, 28 + b, 2, 3, S); R(15, 28 + b, 2, 3, S);
    R(6, 2 + b, 8, 11, S); R(5, 1 + b, 10, 3, '#d0d0cc'); R(5, 3 + b, 1, 5, '#d0d0cc'); R(14, 3 + b, 1, 5, '#d0d0cc'); R(7, 5 + b, 2, 3, '#080606'); R(11, 5 + b, 2, 3, '#080606'); R(8, 9 + b, 4, 3, '#200404'); R(7, 11 + b, 6, 1, '#b8b0a8'); } },
  /* 拿斧子的人：衣服上溅着血，眼睛瞪得太大 */
  axeman: { w: 22, h: 34, draw(R, t, o) { const S = '#e2c2a2', T = '#5a4a3a', B = '#7a0e0e', sw = o.moving ? Math.round(Math.sin(t * 9) * 2) : 0;
    R(6, 12, 10, 12, T); R(8, 15, 3, 2, B); R(12, 19, 2, 3, B); R(7, 24, 4, 9, '#3a3530'); R(11, 24, 4, 9, '#3a3530'); R(7, 32, 4, 2, '#1a1614'); R(11, 32, 4, 2, '#1a1614');
    R(4, 13, 2, 9, S); R(16, 13, 2, 8, S); R(17, 4 + sw, 2, 18, '#5a3a20'); R(18, 3 + sw, 4, 6, '#aab0b8'); R(21, 3 + sw, 1, 6, '#d8dce0'); R(18, 7 + sw, 3, 2, B);
    R(6, 2, 10, 10, S); R(5, 0, 12, 4, '#2a2420'); R(5, 2, 2, 5, '#2a2420'); R(7, 5, 3, 2, '#f8f8f0'); R(12, 5, 3, 2, '#f8f8f0'); R(8, 5, 1, 1, '#000'); R(13, 6, 1, 1, '#000'); R(8, 9, 6, 1, '#4a1010'); R(14, 8, 1, 2, B); } },
  /* 拿刀的人：兜帽压得很低，只看得见一张咧到耳根的笑 */
  knifeman: { w: 18, h: 34, draw(R, t, o) { const H = '#5a1c18', H2 = '#3a100e', S = '#d8bca0';
    R(4, 11, 10, 14, H); R(4, 11, 2, 14, H2); R(5, 25, 4, 8, '#2a2a30'); R(10, 25, 4, 8, '#2a2a30'); R(2, 12, 2, 10, H); R(14, 12, 2, 9, H); R(14, 20, 1, 9, '#d0d4d8'); R(14, 19, 2, 2, '#2a2020');
    R(4, 1, 10, 11, H2); R(5, 3, 8, 8, '#120808'); R(6, 8, 6, 2, S); R(6, 8, 6, 1, '#f0e8d8'); for (let i = 0; i < 3; i++) R(7 + i * 2, 9, 1, 1, '#200'); R(7, 5, 1, 1, Math.sin(t * 2) > .8 ? '#f0f0f0' : '#555'); R(11, 5, 1, 1, Math.sin(t * 2) > .8 ? '#f0f0f0' : '#555'); } },
  /* 死去的孩子：脸白得发青，眼睛是两个黑洞，往下淌黑水 */
  deadchild: { w: 14, h: 26, draw(R, t, o) { const C = o.col || '#9a1818', S = '#e8e4e0', b = Math.round(Math.sin(t * 2) * .6);
    R(3, 10 + b, 8, 9, C); R(3, 10 + b, 2, 9, '#5a0a0a'); R(4, 19 + b, 2, 6, '#7a1010'); R(8, 19 + b, 2, 6, '#7a1010'); R(1, 11 + b, 2, 7, S); R(11, 11 + b, 2, 7, S);
    R(3, 1 + b, 8, 9, S); R(3, 0 + b, 8, 3, '#141214'); R(4, 4 + b, 2, 2, '#000'); R(8, 4 + b, 2, 2, '#000'); R(4, 6 + b, 1, 3 + ((t * 2 | 0) % 2), '#1a1010'); R(9, 6 + b, 1, 2, '#1a1010'); R(6, 8 + b, 2, 1, '#300'); } },
  /* 淹死的人：泡得发白发青，头发贴在脸上，一直在滴水 */
  drowned: { w: 18, h: 36, draw(R, t, o) { const S = '#b8c8cc', S2 = '#8aa0a8', H = '#0e1416', C = o.col || '#4a5a6a';
    R(5, 12, 8, 14, C); R(5, 12, 2, 14, '#34404c'); R(6, 26, 2, 9, S2); R(10, 26, 2, 9, S2); R(3, 13, 2, 12, S); R(13, 13, 2, 12, S);
    R(5, 1, 8, 11, S); R(4, 0, 10, 4, H); R(4, 3, 2, 12, H); R(12, 3, 2, 10, H); R(6, 4, 1, 6, H); R(10, 4, 1, 7, H); R(7, 5, 1, 1, '#f0f8f8'); R(10, 5, 1, 1, '#f0f8f8'); R(7, 9, 3, 2, '#203030');
    for (let i = 0; i < 4; i++) R(4 + i * 3, 26 + ((t * 20 + i * 9) % 12), 1, 2, '#7ab0c8'); } },
  /* 学生的影子：校服，脖子歪成不该有的角度 */
  student: { w: 16, h: 32, draw(R, t, o) { const U = '#2e3e5e', W = '#e8e8e8', S = '#d8d2cc', tl = o.tilt ?? 4;
    R(4, 11, 8, 11, U); R(6, 11, 4, 4, W); R(4, 22, 3, 9, U); R(9, 22, 3, 9, U); R(2, 12, 2, 10, S); R(12, 12, 2, 10, S);
    R(3 + tl, 2, 8, 9, S); R(3 + tl, 1, 8, 3, '#141214'); R(5 + tl, 5, 1, 2, '#000'); R(8 + tl, 5, 1, 2, '#000'); R(5 + tl, 8, 4, 1, '#300'); R(6, 10, 3, 2, S); } }
};
/* 剧本里的名字 → 怪物形象（没列的照旧用普通像素小人） */
const GHOST_OF = { 张雅: ['redwoman'], 红影: ['redwoman', { hair: '#2a0404', dress: '#5a0404', dress2: '#300202', dressHi: '#7a0808', skin: '#8a3030', drip: 1 }], 舞蹈室的女孩: ['redwoman', { dress: '#d8ccd0', dress2: '#9a8a90', dressHi: '#f0e8ea', hair: '#141214' }],
  镜鬼: ['mirrorghost'], 黑影: ['twoface'], 畸形脸: ['deformed'], 独臂: ['onearm'], 瘦长怪物: ['slender'], 瘦长怪物乙: ['slender', { col: '#c8c2b6' }], 独眼的瘦长怪物: ['slender', { oneEye: 1, col: '#bfb8ae' }],
  女护士: ['nurse'], 戴口罩的护士: ['nurse'], 老院长: ['dean'], 王琦: ['axeman'], 张鹏: ['knifeman'], 男孩: ['deadchild'], 小男孩: ['deadchild', { col: '#5a6a7a' }], 小女孩: ['deadchild', { col: '#c88a9a' }],
  湿透的男人: ['drowned'], 雨衣女孩: ['drowned', { col: '#c8a818' }], 学生: ['student'], 学生乙: ['student', { tilt: -3 }], 学生丙: ['student', { tilt: 5 }] };
/* 发光的颜色：红鬼泛红光，别的泛冷白光 */
function ghAura(name) { const k = (GHOST_OF[name] || [])[0]; return k === 'redwoman' || k === 'dean' || k === 'deadchild' ? 'rgba(170,10,10,' : k === 'axeman' || k === 'knifeman' || k === 'deformed' ? 'rgba(120,20,10,' : 'rgba(160,190,210,'; }
/* 画一个怪物；pass = 'body' | 'glow' */
function ghDraw(g, a, pass) { const def = GHOST_OF[a.name]; if (!def) return false; const G = GH[def[0]], o = Object.assign({ dir: a.dir, moving: a.moving, talk: a.talk, glow: pass === 'glow' }, def[1] || {}); const flip = a.dir === 1, x0 = Math.round(a.x - G.w / 2), y0 = (a.feet ?? FEET) - G.h + 2;
  g.save(); if (a.down) { g.translate(x0 + G.w / 2 + G.h / 2, FEET - 2); g.rotate(-Math.PI / 2); g.translate(-G.w / 2, -G.h); } else g.translate(x0, y0);
  const R = (x, y, w, h, c) => { if (!c) return; g.fillStyle = c; g.fillRect(flip ? G.w - x - w : x, y, w, h); }; G.draw(R, STG.t + a.x * .01, o); g.restore(); return true; }
function ghIs(name) { return !!GHOST_OF[name]; }

/* ================= 怪物发光、新效果、镜头推近 ================= */
function stGhostGlow(g, list, dark, off) { for (const a of list) { if (!ghIs(a.name) || a.alpha < .05) continue; const G = GH[GHOST_OF[a.name][0]], cx = a.x, cy = FEET - G.h / 2, r = G.h * .85, au = ghAura(a.name);
    const gr = g.createRadialGradient(cx, cy, 2, cx, cy, r); gr.addColorStop(0, au + ((dark ? (au.startsWith('rgba(160') ? .16 : .3) : .1) * a.alpha) + ')'); gr.addColorStop(1, au + '0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2); g.globalCompositeOperation = 'source-over';
    if (dark) { g.globalAlpha = a.alpha * (off ? .2 : .5 + .15 * Math.sin(STG.t * 3 + a.x)); ghDraw(g, a, 'glow'); g.globalAlpha = 1; } } }
/* 效果：blood 血从上往下淌 · fog 地上的雾 · eyes 黑暗里的眼睛 · hands 地上伸出来的手 · crack 屏幕裂开 · ash 黑色的雪 · pulse 心跳红晕 · chroma 重影 · lightning 打雷
   另外：台上有怪物、又是黑的时候，四周自动压一圈暗红，偶尔闪一下 */
function stFxOver(g, list, dark) { const F = STG.fx, t = STG.t, H = (i, k) => hash(i, k, 31);
  if (F.fog) for (let i = 0; i < 14; i++) { const L = i % 3, x = ((H(i, 1) * (SW + 120) + t * (5 + L * 4)) % (SW + 120)) - 60, y = 78 + L * 9 + Math.sin(t * .6 + i) * 3, rw = 46 + H(i, 2) * 40, gr = g.createRadialGradient(x, y, 2, x, y, rw); gr.addColorStop(0, 'rgba(170,180,190,' + (.12 + L * .03) + ')'); gr.addColorStop(1, 'rgba(170,180,190,0)'); g.fillStyle = gr; g.fillRect(x - rw, y - rw * .45, rw * 2, rw * .9); }
  if (F.blood) { STG.bloodT0 = STG.bloodT0 || t; const k = Math.min(1, (t - STG.bloodT0) / 3.5); for (let i = 0; i < 22; i++) { const x = (H(i, 1) * SW) | 0, len = (8 + H(i, 2) * 58) * Math.min(1, k * (1.3 - H(i, 3) * .6)), w = H(i, 4) > .7 ? 2 : 1; g.fillStyle = '#5c0404'; g.fillRect(x, 0, w + 1, 3 + H(i, 5) * 4); g.fillStyle = '#7a0808'; g.fillRect(x, 0, w, len | 0); g.fillRect(x - (w > 1 ? 0 : 0), len | 0, w + 1, 2); }
    g.fillStyle = 'rgba(90,4,4,' + .5 * k + ')'; for (let i = 0; i < 6; i++) g.fillRect((H(i, 9) * SW) | 0, FEET + 2 + ((H(i, 8) * 10) | 0), (10 + H(i, 7) * 24) | 0, 2); } else STG.bloodT0 = 0;
  if (F.eyes && dark) for (let i = 0; i < 9; i++) { const ph = (t * (.35 + H(i, 2) * .4) + H(i, 3)) % 1; if (ph > .72) continue; const x = (12 + H(i, 1) * (SW - 24)) | 0, y = (18 + H(i, 4) * 48) | 0, blink = ph > .68 || (ph % .23) < .012; if (blink) continue; g.fillStyle = H(i, 5) > .4 ? '#e01818' : '#e8e2c8'; g.fillRect(x, y, 1, 1); g.fillRect(x + 3, y, 1, 1); }
  if (F.hands) { STG.handT0 = STG.handT0 || t; for (let i = 0; i < 8; i++) { const up = Math.min(1, Math.max(0, (t - STG.handT0) * .7 - H(i, 3) * .8)), x = (10 + H(i, 1) * (SW - 20)) | 0, h = (6 + up * (12 + H(i, 2) * 10) + Math.sin(t * 3 + i) * 1.5) | 0, y = SH - h, S = '#cfc6ba';
      g.fillStyle = S; g.fillRect(x, y + 4, 3, h); g.fillRect(x - 1, y + 2, 5, 3); for (let f = 0; f < 4; f++) g.fillRect(x - 1 + f + (f > 1 ? 1 : 0) - (f === 0 ? 1 : 0), y - 2 + (f % 2), 1, 3 + (f === 3 ? -1 : 0)); g.fillStyle = '#6a0a0a'; g.fillRect(x, y + h - 2, 3, 2); } } else STG.handT0 = 0;
  if (F.ash) { for (let i = 0; i < 60; i++) { const x = ((H(i, 1) * SW + Math.sin(t * .8 + i) * 10 + t * 6) % SW) | 0, y = ((H(i, 2) * SH + t * (14 + H(i, 3) * 16)) % SH) | 0; g.fillStyle = H(i, 4) > .5 ? '#0a0808' : '#2a2626'; g.fillRect(x, y, 2, 2); } }
  if (F.crack) { g.strokeStyle = 'rgba(230,236,240,.75)'; g.lineWidth = 1; const cx = SW * .62, cy = 34; for (let i = 0; i < 9; i++) { let x = cx, y = cy, a = i / 9 * 6.28 + H(i, 1); g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 6; s++) { a += (H(i, s + 2) - .5) * .9; const l = 6 + H(i, s + 9) * 14; x += Math.cos(a) * l; y += Math.sin(a) * l; g.lineTo(x | 0, y | 0); } g.stroke(); } g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(cx - 6, cy - 6, 12, 12); }
  const ghosts = list.filter(a => ghIs(a.name) && a.alpha > .6 && !a.leaving), pres = ghosts.length && (dark || F.red);
  if (F.pulse || pres) { const beat = Math.max(0, Math.sin(t * 7.5)) ** 8 + Math.max(0, Math.sin(t * 7.5 - .9)) ** 8 * .6, A = (F.pulse ? .45 : .22) * (.55 + beat * .45); const gr = g.createRadialGradient(SW / 2, SH / 2, SH * .35, SW / 2, SH / 2, SW * .62); gr.addColorStop(0, 'rgba(90,0,0,0)'); gr.addColorStop(1, 'rgba(90,0,0,' + A + ')'); g.fillStyle = gr; g.fillRect(0, 0, SW, SH); if (pres && Math.random() < .006) STG.glitch = Math.max(STG.glitch || 0, .18); }
  if (F.water) { g.fillStyle = 'rgba(20,60,90,.35)'; g.fillRect(0, 0, SW, SH); const T = STG.wt || (STG.wt = mk(SW, SH)), tg = T.getContext('2d'); tg.clearRect(0, 0, SW, SH); tg.drawImage(g.canvas, 0, 0); for (let y = 0; y < SH; y += 4) g.drawImage(T, 0, y, SW, 4, Math.round(Math.sin(y * .12 + t * 3) * 2), y, SW, 4); g.fillStyle = 'rgba(200,230,240,.5)'; for (let i = 0; i < 14; i++) { const x = (H(i, 1) * SW) | 0, y = SH - ((t * (16 + H(i, 2) * 20) + H(i, 3) * SH) % SH); g.fillRect(x + Math.round(Math.sin(t * 4 + i) * 2), y | 0, 2, 2); } }
  if (F.lightning) { STG.ltT = (STG.ltT ?? 2) - 1 / 30; if (STG.ltT <= 0) { STG.ltT = 3 + Math.random() * 4; STG.flash = .9; sfx('boom'); } }
  if (F.chroma || STG.glitch > .3) { const T = STG.ct || (STG.ct = mk(SW, SH)), tg = T.getContext('2d'); tg.clearRect(0, 0, SW, SH); tg.drawImage(g.canvas, 0, 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .16; g.drawImage(T, 2, 0); g.drawImage(T, -2, 1); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } }
/* 镜头推近某个人（^zoom 名字 [倍数] / ^zoom off） */
function stZoom(full, g) { const Z = STG.zoom; if (!Z) return; Z.z += (Z.k - Z.z) * .14; const a = stFind(Z.n), ax = a ? a.x : SW / 2, ay = a ? FEET - (GHOST_OF[Z.n] ? GH[GHOST_OF[Z.n][0]].h * .7 : 18) : SH / 2;
  const T = STG.zt || (STG.zt = mk(SW, SH)), tg = T.getContext('2d'); tg.clearRect(0, 0, SW, SH); tg.drawImage(full, 0, 0); const w = SW / Z.z, h = SH / Z.z, sx = clamp(ax - w / 2, 0, SW - w), sy = clamp(ay - h / 2, 0, SH - h);
  g.imageSmoothingEnabled = false; g.drawImage(T, sx, sy, w, h, 0, 0, SW, SH); STG.zoomX = (ax - sx) * Z.z; }

/* ================= 新道具：墙里的脸、吊着的布偶、血字、三个人的合影 ================= */
Object.assign(SPR, {
  wallface(g, e, t, R) { const k = Math.sin(t * .9) * .5 + .5; R(3, 1, 10, 13, 'rgba(0,0,0,.25)'); R(4, 2, 8, 11, '#8a7e72'); R(5, 3, 6, 9, '#a49688'); R(5, 5, 2, 2, '#1a1412'); R(9, 5, 2, 2, '#1a1412'); R(6, 9, 4, 2 + Math.round(k), '#2a1612'); R(4, 1, 1, 13, '#6a6058'); R(11, 1, 1, 13, '#6a6058'); R(2, 13, 2, 1, '#6a6058'); R(12, 0, 2, 1, '#6a6058'); },
  hangdoll(g, e, t, R) { const s = Math.round(Math.sin(t * 1.3) * 2); R(8, -16, 1, 18 + 0, '#8a7a5a'); R(5 + s, 2, 6, 6, e.col || '#d8c8b0'); R(4 + s, 1, 2, 2, e.col || '#d8c8b0'); R(10 + s, 1, 2, 2, e.col || '#d8c8b0'); R(6 + s, 4, 1, 1, '#111'); R(9 + s, 4, 1, 1, '#a00'); R(4 + s, 8, 8, 6, e.col || '#d8c8b0'); R(5 + s, 14, 2, 3, '#b8a890'); R(9 + s, 14, 2, 3, '#b8a890'); R(7 + s, 9, 1, 5, '#8a1010'); },
  scrawl(g, e, t, R) { const x = e.x * 16, y = e.y * 16; g.save(); g.font = (e.size || 10) + 'px serif'; g.fillStyle = e.col || '#7a0a0a'; g.globalAlpha = .9; g.fillText(e.t || '救我', x, y + 11); g.globalAlpha = 1; g.fillStyle = e.col || '#7a0a0a'; const n = (e.t || '救我').length; for (let i = 0; i < n * 2; i++) g.fillRect(x + 2 + i * (e.size || 10) / 2, y + 11, 1, 2 + (hash(i, 3, 5) * 9 | 0)); g.restore(); },
  famphoto(g, e, t, R) { R(1, 0, 14, 12, '#3a2a1a'); R(2, 1, 12, 10, '#d8d0c0'); for (let i = 0; i < 3; i++) { const x = 3 + i * 4; R(x, 3, 2, 2, '#c8a890'); R(x, 2, 2, 1, '#2a2020'); R(x - (i === 2 ? 0 : 0), 5, 2, 4, ['#4a5a7a', '#8a3a4a', '#d8c8a0'][i]); } if (e.cross) { R(10, 2, 4, 1, '#000'); R(11, 1, 1, 9, '#7a0a0a'); R(13, 1, 1, 9, '#7a0a0a'); } if (e.four) { R(13, 6, 1, 4, '#1a1a1a'); R(13, 5, 1, 1, '#e8e0d0'); } },
  bloodpool(g, e, t, R) { R(1, 11, 14, 4, '#5a0606'); R(3, 10, 9, 2, '#6a0808'); R(4, 12, 4, 1, '#8a1010'); }
});
/* 墙上和地上的脏污、裂缝、霉斑（grime 1–3），画进背景缓存 */
function stGrime(g, n, key) { const H = (i, k) => hash(i, k, key.length * 7);
  for (let i = 0; i < 6 * n; i++) { const x = (H(i, 1) * SW) | 0, y = (6 + H(i, 2) * 34) | 0, w = (4 + H(i, 3) * 16) | 0, h = (3 + H(i, 4) * 10) | 0; g.fillStyle = 'rgba(20,14,8,' + (.12 + H(i, 5) * .18) + ')'; g.fillRect(x, y, w, h); g.fillRect(x + (w / 3 | 0), y + h, 2, (H(i, 6) * 10) | 0); }
  for (let i = 0; i < 3 * n; i++) { let x = (H(i, 7) * SW) | 0, y = (2 + H(i, 8) * 20) | 0; g.fillStyle = 'rgba(0,0,0,.45)'; for (let s = 0; s < 8; s++) { g.fillRect(x, y, 1, 2); x += Math.round((H(i, s + 9) - .5) * 3); y += 2; } }
  for (let i = 0; i < 4 * n; i++) { g.fillStyle = 'rgba(10,8,4,' + (.1 + H(i, 20) * .15) + ')'; g.fillRect((H(i, 21) * SW) | 0, (52 + H(i, 22) * 56) | 0, (6 + H(i, 23) * 22) | 0, (2 + H(i, 24) * 4) | 0); }
  if (n >= 2) for (let i = 0; i < n; i++) { const x = (20 + H(i, 30) * (SW - 40)) | 0, y = (14 + H(i, 31) * 20) | 0; g.fillStyle = 'rgba(100,6,6,.75)'; g.fillRect(x, y, 3, 4); g.fillRect(x - 1, y - 2, 1, 3); g.fillRect(x + 1, y - 3, 1, 3); g.fillRect(x + 3, y - 2, 1, 3); g.fillRect(x + 1, y + 4, 1, 4 + (H(i, 32) * 8 | 0)); }
  if (n >= 3) { g.fillStyle = 'rgba(90,4,4,.55)'; for (let i = 0; i < 3; i++) { const x = (H(i, 40) * SW) | 0; g.fillRect(x, 60 + (H(i, 41) * 30 | 0), 18 + (H(i, 42) * 20 | 0), 2); g.fillRect(x + 4, 62 + (H(i, 41) * 30 | 0), 10, 1); } } }

/* ================= 按剧情地点细化的布景 ================= */
Object.assign(STAGES, {
  /* 员工休息室：储物柜、旧沙发、桌上一部黑色手机、监控屏、恐怖屋海报 */
  staffroom: { wall: 'plain', floor: 'wood', grime: 1, props: [['locker', 1, 3], ['locker', 2, 3], ['poster', 4, 1, { col: '#5a1a1a' }], ['sofa', 5, 4], ['table', 9, 4], ['phone', 9, 3], ['wallclock', 9, 1], ['tv', 12, 2, { power: 'static' }], ['desk', 12, 3], ['window', 15, 1], ['lamp', 17, 3], ['doll', 18, 4, { col: '#b8a080' }]] },
  /* 平安公寓 208：发霉起皮的墙、破窗、旧床、墙上划痕和血手印 */
  apt208: { wall: 'paper', floor: 'darkwood', grime: 3, props: [['curtain', 3, 1], ['window', 4, 1], ['wardrobe', 1, 3], ['table', 7, 4], ['chair', 6, 4], ['mirror', 10, 1], ['bed', 14, 3, { col: '#5a4a44' }], ['newspaper', 10, 5], ['handprint', 16, 1], ['door', 18, 2, { col: '#3a2a20' }]],
    paint(g) { SPR.scrawl(g, { x: 12, y: 1, t: '五', col: '#4a0606', size: 9 }, 0, () => {}); } },
  /* 海明公寓 303：三个人的家——三把椅子、三副碗筷、全家福，镜子 */
  apt303: { wall: 'paper', floor: 'wood', grime: 1, props: [['sofa', 1, 4], ['tv', 2, 2], ['famphoto', 7, 1], ['table', 8, 4], ['chair', 7, 4], ['chair', 9, 4], ['cup', 7, 4], ['cup', 8, 4], ['cup', 9, 4], ['wallclock', 11, 1], ['mirror', 14, 1], ['shoes', 12, 5, { col: '#3a3a40' }], ['shoes', 13, 5, { col: '#6a3a4a' }], ['shoes', 14, 5, { col: '#c8b8a0' }], ['door', 17, 2], ['lamp', 5, 3]] },
  /* 浴室：浴缸、裂开的镜子、瓷砖缝发黑 */
  bathroom: { wall: 'tile', floor: 'tile', grime: 2, props: [['mirror', 10, 1], ['sink', 10, 3], ['bathtub', 13, 4], ['toilet', 4, 3], ['towel', 6, 2], ['puddle', 12, 5], ['door', 1, 2]] },
  /* 西城体育器材室：垫子、球筐、带铁栏的窗，柜子后面一张单人床 */
  storage: { wall: 'concrete', floor: 'concrete', grime: 2, props: [['shelf', 1, 3], ['shelf', 2, 3], ['basket', 4, 4], ['futon', 5, 5, { col: '#3a5a3a' }], ['box', 7, 4], ['crate', 8, 3], ['window', 13, 1], ['locker', 16, 3], ['locker', 17, 3], ['locker', 18, 3]],
    paint(g) { g.fillStyle = '#2a2a2a'; for (let i = 0; i < 4; i++) g.fillRect(13 * 16 + 4 + i * 3, 18, 1, 9); } },
  /* 院长办公室：书柜、档案、一张眼睛会动的旧画像、拉死的红窗帘 */
  deanroom: { wall: 'paper', floor: 'darkwood', grime: 2, props: [['bookshelf', 1, 3], ['bookshelf', 2, 3], ['cabinet', 4, 3], ['portrait', 8, 1, { eyes: 1 }], ['wallclock', 12, 1], ['curtain', 15, 1], ['curtain', 16, 1], ['stain', 6, 5], ['plant', 18, 3]] },
  /* 门后的三号病房：红色的世界，三张床，铁笼，墙上全是手印 */
  sickroom: { wall: 'red', floor: 'redfloor', red: 1, grime: 3, props: [['bed', 2, 3, { col: '#6a0a0a' }], ['bed', 6, 3, { col: '#5a0808' }], ['wheelchair', 10, 4], ['curtain', 12, 1], ['handprint', 5, 1], ['handprint', 8, 2], ['handprint', 16, 1], ['cage', 17, 4]] },
  /* 后山的深井：雨里，荒草，一口封着的井 */
  wellyard: { out: 1, floor: 'dirt', back: 'woods', tiles: [['tree', 0, 3], ['tree', 1, 5], ['pine', 18, 3], ['tree', 19, 5], ['bushes', 3, 6], ['reeds', 15, 6]], props: [['well', 10, 4], ['rope', 12, 5], ['gravestone', 16, 3], ['paper', 7, 5]] },
  /* 最后一间教室：一排排课桌，黑板上没擦掉的字 */
  lastclass: { wall: 'school', floor: 'wood', grime: 2, props: [['blackboard', 9, 1, { text: 1 }], ['schooldesk', 3, 4], ['schooldesk', 5, 4], ['schooldesk', 7, 4], ['schooldesk', 11, 4], ['schooldesk', 13, 4], ['schooldesk', 15, 4], ['schooldesk', 3, 6], ['schooldesk', 5, 6], ['schooldesk', 13, 6], ['schooldesk', 15, 6], ['wallclock', 16, 1], ['window', 2, 1]],
    paint(g) { SPR.scrawl(g, { x: 5, y: 1, t: '回不去', col: '#5a0606', size: 8 }, 0, () => {}); } }
});
/* 已有的布景再加些细节 */
STAGES.hut.props.push(['linen', 3, 4], ['knife', 6, 5], ['handprint', 12, 1], ['stain', 9, 5], ['photo', 16, 4]); STAGES.hut.grime = 3; STAGES.hut.paint = g => SPR.scrawl(g, { x: 2, y: 1, t: '救我', size: 10 }, 0, () => {});
STAGES.burnt.props.push(['hangdoll', 14, 2], ['wallface', 19, 1]); STAGES.burnt.grime = 3;
STAGES.attic.props.push(['mannequin', 15, 3], ['mannequin', 16, 3], ['box', 9, 4], ['hangdoll', 6, 2, { col: '#a89880' }]); STAGES.attic.grime = 2;
STAGES.wardhall.grime = 3; STAGES.wardhall.props.push(['wheelchair', 9, 4], ['handprint', 5, 1], ['handprint', 14, 2]);
STAGES.doorhall.grime = 3; STAGES.laundry.grime = 3; STAGES.laundry.props.push(['stain', 8, 5], ['handprint', 9, 1]);
STAGES.toilet.grime = 2; STAGES.wc.grime = 1; STAGES.dorm.grime = 2; STAGES.classroom.grime = 1; STAGES.corridor.grime = 1; STAGES.parking.grime = 2; STAGES.inside.grime = 3; STAGES.prop.grime = 1; STAGES.hall.grime = 1;
Object.assign(STAGE_PLACE, { hh_rest: 'staffroom', pa_208: 'apt208', hm_303: 'apt303', xc_office: 'storage', kf_dean: 'deanroom', kf_in3: 'sickroom', my_last: 'lastclass' });
/* 影子：没有脸的黑色人形，只有两点白（镜头里、身后、楼梯底下“多出来的那个人”） */
GH.shadow = { w: 16, h: 36, draw(R, t, o) { const K = '#060508', K2 = '#121016', b = Math.round(Math.sin(t * 1.4)); R(4, 11 + b, 8, 24, K); R(5, 12 + b, 6, 20, K2); R(2, 13 + b, 2, 16, K); R(12, 13 + b, 2, 16, K); R(4, 1 + b, 8, 10, K); R(3, 3 + b, 10, 6, K);
  if (Math.sin(t * 1.9) > -.6) { R(5, 5 + b, 1, 1, '#e8e4dc'); R(10, 5 + b, 1, 1, '#e8e4dc'); } for (let i = 0; i < 6; i++) R(3 + i * 2, 35 - ((t * 8 + i * 3) % 4 | 0), 1, 1, K); } };
Object.assign(GHOST_OF, { 影子: ['shadow'], 人影: ['shadow'] });
PPL.影子 = PPL.人影 = P_({ sil: '#060508', ghost: 1 });
