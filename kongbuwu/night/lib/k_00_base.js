/* ================= 恐怖屋 · 夜晚任务（百物语引擎） · 共用底座 =================
   这一份引擎从百物语（nighttales/src/js）原样搬来，只改了存档前缀（kbw.nt.）。恐怖屋的每个夜晚任务是 chapters/ 里的一个 defChapter。
   恐怖屋主程序（src/57_night.js）把这页放进全屏 iframe：发 {t:'play', id, env} 开始一夜；这一夜结束时这里发回
   {t:'done', id, kind:'end'|'skip'|'quit', f:{k_*}, inv}。章节里用 S.f.k_xxx 记下要带回恐怖屋的结果。 */
let KENV = { lv: 1, items: [], pets: [], flags: {}, diff: 1 };   // 恐怖屋传进来的状态（等级、道具、员工、旗标）
const kHas = id => (KENV.items || []).includes(id);
const kPet = id => (KENV.pets || []).includes(id);
const kFlag = id => !!(KENV.flags || {})[id];

/* 人物：和恐怖屋小剧场里的通用像素小人一致（不照着原著插画或改编作品画） */
const KP = {
  chen: { skin: '#f0c8a0', hair: '#1c1a1e', hs: 'short', top: '#2d333d', top2: '#d8dadc', bottom: '#26262c', shoes: '#141414' },
  xuwan: { skin: '#f0c8a0', hair: '#3a2420', hs: 'bob', top: '#e8e4e0', top2: '#c84040', skirt: true, bottom: '#e8e4e0' },
  landlord: { skin: '#e8c4a0', hair: '#2a2420', hs: 'messy', top: '#8a8a80', bottom: '#3a3a34' },
  wangqi: { skin: '#e2c2a2', hair: '#2a2420', hs: 'messy', top: '#5a4a3a', bottom: '#3a3530' },
  tattoo: { skin: '#e0b890', hair: '#141414', hs: 'short', top: '#1e1e22', bottom: '#2e3448' },
  fat: { skin: '#e8c0a0', hair: '#2a2420', hs: 'short', top: '#7a7a6a', bottom: '#3a3a40' },
  woman: { skin: '#f0c8a8', hair: '#2a1a14', hs: 'long', top: '#8a3a5a', skirt: true, bottom: '#3a2a30' },
  oldman: { skin: '#e0c0a0', hair: '#d8d8d4', hs: 'bald', top: '#6a6a60', bottom: '#4a4a44' },
  police: { skin: '#e8c4a0', hair: '#1c1a18', hs: 'short', top: '#2f3e5a', bottom: '#232c3e', hat: 'cap', hatC: '#22304a' },
  zhangpeng: { skin: '#e0b898', hair: '#141414', hs: 'short', top: '#6a2420', bottom: '#2a2a30' },
  xiaoxiao: { key: 'k-xiaoxiao', skin: '#f4e4e0', hair: '#1a1416', hs: 'bob', top: '#d88aa0', dress: true, child: true, ghost: true },
  fanyu: { skin: '#f0d0b0', hair: '#1a1614', hs: 'short', top: '#c8a43a', bottom: '#3a4a6a', child: true },
  aunt: { skin: '#e8c4a0', hair: '#2a2018', hs: 'bun', top: '#6a6a70', bottom: '#3a3a40' },
  gaodoc: { skin: '#e8c8a8', hair: '#7a7a78', hs: 'short', top: '#e8e8e4', coat: true, bottom: '#3a3a40' },
  mennan: { skin: '#e8ccb0', hair: '#2a2826', hs: 'messy', top: '#4a6a8a', bottom: '#2a3040' },
  liudao: { skin: '#e0c0a0', hair: '#141414', hs: 'short', top: '#222226', coat: true, bottom: '#222226' },
  student: { skin: '#f0d0b0', hair: '#141214', hs: 'short', top: '#2e3e5e', top2: '#e8e8e8', bottom: '#2e3e5e' },
  studentg: { skin: '#f0d0b0', hair: '#141214', hs: 'long', top: '#2e3e5e', top2: '#e8e8e8', skirt: true, bottom: '#2e3e5e' },
  patient: { skin: '#d8d0cc', hair: '#3a3430', hs: 'messy', top: '#a8b8c8', bottom: '#a8b8c8' },
  boy: { key: 'k-boy', skin: '#ece4e0', hair: '#141214', hs: 'short', top: '#a01818', bottom: '#7a1010', child: true, ghost: true },
  shadow: { key: 'k-shadow', skin: '#0c0a10', hair: '#0c0a10', hs: 'short', top: '#0c0a10', bottom: '#0c0a10', ghost: true, extra(g, d, fr, G, R) { if (d !== 3) { R(6, G.hT + 5, 1, 1, '#d8d8e8'); R(9, G.hT + 5, 1, 1, '#d8d8e8'); } } }
};
/* 怪物身上那圈冷光 / 红光（在黑暗里也看得见轮廓） */
const KGLOW = { r: 1.6, col: 'rgba(170,190,230,.18)', a: .5 }, KRED = { r: 1.8, col: 'rgba(200,30,30,.2)', a: .55 };

/* 惊吓大头像（32×32）：长发红衣、瘦长的东西、空眼窝的老院长、拿斧子的人、黑影 */
const KFACES = {
  red(R, a) { const H = '#140808', S = '#e8dcd6', S2 = '#bcaea8', M = '#140204';
    R(6, 0, 20, 32, H); R(3, 8, 26, 24, H); R(10, 6, 12, 18, S); R(9, 9, 14, 12, S); R(19, 7, 3, 16, S2);
    R(9, 5, 4, 14, H); R(19, 5, 4, 10, H); R(13, 4, 6, 3, H);
    const w = a < .2 ? 1 : 3; R(11, 12, 4, 4, '#2a0a0a'); R(17, 12, 4, 4, '#2a0a0a'); R(12, 14 - (w >> 1), 2, w, '#f4eee8'); R(18, 14 - (w >> 1), 2, w, '#f4eee8'); R(12, 14, 1, 1, '#e01010'); R(18, 14, 1, 1, '#e01010');
    R(12, 17, 1, 3 + Math.round(a * 5), '#900a0a'); R(18, 17, 1, 2 + Math.round(a * 4), '#900a0a');
    const mh = 1 + Math.round(a * 4); R(13, 20, 6, mh, M); R(13, 20, 6, 1, '#7a0a0a'); R(4, 26, 24, 6, '#8a0a0a'); R(8, 26, 4, 6, '#a01010'); },
  slender(R, a) { R(0, 0, 32, 32, '#0a0a0c'); R(8, 2, 16, 26, '#d8d4cc'); R(7, 6, 18, 18, '#d8d4cc'); R(20, 4, 3, 22, '#a8a49c');
    const o = Math.round(a * 3); R(11, 10 + o, 4, 6, '#000'); R(18, 10 + o, 4, 6, '#000'); R(12, 13 + o, 1, 1, '#fff'); R(19, 13 + o, 1, 1, '#fff');
    R(12, 20, 9, 2 + Math.round(a * 6), '#100'); for (let i = 0; i < 4; i++) R(13 + i * 2, 20, 1, 2, '#e8e0d0'); },
  dean(R, a) { R(4, 0, 24, 6, '#c8c8c4'); R(6, 4, 20, 22, '#e0d8d4'); R(5, 8, 22, 14, '#e0d8d4'); R(21, 6, 4, 18, '#b8aea8');
    R(9, 10, 5, 6, '#000'); R(18, 10, 5, 6, '#000'); if (a > .3) { R(11, 12, 1, 1, '#c00'); R(20, 12, 1, 1, '#c00'); }
    R(12, 19, 8, 3 + Math.round(a * 7), '#100'); R(2, 26, 28, 6, '#8a1414'); R(14, 26, 4, 6, '#e8e8e0'); },
  axe(R, a) { R(0, 0, 32, 32, '#0c0808'); R(9, 4, 14, 20, '#e2c2a2'); R(8, 2, 16, 6, '#2a2420'); R(10, 12, 4, 2, '#1a1010'); R(18, 12, 4, 2, '#1a1010'); R(11, 12, 2, 1, '#fff'); R(19, 12, 2, 1, '#fff');
    R(12, 19, 8, 1, '#5a2020'); R(14, 20, 4, 1, '#300'); R(5, 24, 22, 8, '#5a4a3a'); R(24, 2 - Math.round(a * 2), 3, 26, '#6a4a2a'); R(20, 0 - Math.round(a * 2), 10, 7, '#9a9aa2'); R(20, 6 - Math.round(a * 2), 10, 1, '#7a1010'); },
  shadow(R, a) { R(0, 0, 32, 32, '#000'); R(9, 2, 14, 25, '#0b0a0e'); R(6, 12, 20, 20, '#0b0a0e'); R(4, 22, 24, 10, '#08070a');
    const k = a < .25 ? 0 : 1; R(12, 13, 3, 1, '#9a9aa8'); R(18, 13, 3, 1, '#9a9aa8'); R(13, 13, 1, 1 + k, '#f0f0ff'); R(19, 13, 1, 1 + k, '#f0f0ff');
    if (a > .4) { const w = 4 + Math.round(a * 6); R(16 - (w >> 1), 20, w, 1, '#2a1018'); R(16 - (w >> 1), 21, 1, 1, '#2a1018'); R(15 + (w >> 1), 21, 1, 1, '#2a1018'); } },
  /* 镜子里的“你”：和陈歌一样的脸，眼睛睁得太大，嘴角一直咧到耳根，脸上有镜面的裂纹 */
  mirror(R, a) { R(0, 0, 32, 32, '#06080c'); R(7, 3, 18, 26, '#d8cfc6'); R(6, 9, 20, 15, '#d8cfc6'); R(20, 5, 4, 22, '#b8aea6'); R(6, 1, 20, 7, '#1c1a1e'); R(5, 4, 3, 9, '#1c1a1e'); R(24, 4, 3, 8, '#1c1a1e');
    R(10, 15, 5, 2, '#a8988e'); R(17, 15, 5, 2, '#a8988e'); R(10, 12, 5, 3, '#f4f0ea'); R(17, 12, 5, 3, '#f4f0ea'); R(12, 13, 1, 1, '#000'); R(19, 13, 1, 1, '#000');
    const w = 10 + Math.round(a * 8), x0 = 16 - (w >> 1); R(x0 + 2, 22, w - 4, 1, '#2a080c'); R(x0, 21, 2, 1, '#2a080c'); R(x0 + w - 2, 21, 2, 1, '#2a080c'); R(x0 - 1, 20, 1, 1, '#2a080c'); R(x0 + w, 20, 1, 1, '#2a080c'); if (a > .6) R(x0 + 4, 23, w - 8, 1, '#5a1418');
    for (let i = 0; i < 9; i++) R(3 + i * 3, 6 + ((i * 7) % 11) + (i & 1), 2, 1, 'rgba(230,240,255,.55)'); R(4, 18, 1, 10, 'rgba(230,240,255,.4)'); R(27, 3, 1, 14, 'rgba(230,240,255,.4)'); },
  child(R, a) { R(4, 2, 24, 26, '#141214'); R(8, 6, 16, 20, '#ece4e0'); R(7, 10, 18, 12, '#ece4e0'); R(8, 4, 16, 6, '#141214');
    R(10, 12, 5, 5, '#000'); R(17, 12, 5, 5, '#000'); R(11, 17, 1, 3 + Math.round(a * 6), '#100'); R(20, 17, 1, 3 + Math.round(a * 6), '#100'); R(13, 21, 6, 1 + Math.round(a * 3), '#3a0808'); R(6, 28, 20, 4, '#a01818'); }
};

/* 通用：在门口存检查点（玩家看不出瞬移） */
function kCpAt(S, name, x, y, dir) { const p = S.pl, o = [p.x, p.y, p.dir]; if (x != null) S.pos(x, y, dir ?? p.dir); S.cp(name); if (x != null) S.pos(o[0], o[1], o[2]); }
/* 通用：被追上 */
function kCaught(face, text, title) { return async S => { await S.scare('face', { face }); await S.die(text, title || '你被抓住了'); }; }
/* 巡逻：NPC 按路线一格一格走，不占用剧本（玩家照样能动）。在章节 tick 里每帧调用 */
function kPatrol(id, route, spd) {
  const m = curMap(), e = m.ents.find(z => z.id === id); if (!e || e.hidden || e.mv || e.chase || e.frozen || W.paused) return;
  const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS), r = e._pr || 0, [tx, ty] = route[r];
  if (ex === tx && ey === ty) { e._pr = (r + 1) % route.length; return; }
  const d = bfsStep(m, ex, ey, tx, ty, e); if (d < 0) { e._pr = (r + 1) % route.length; return; }
  startMove(e, d, spd); e.dir = d; }
