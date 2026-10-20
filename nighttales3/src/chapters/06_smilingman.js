/* ================= 第六夜 · 微笑的男人 ================= */
(() => {
  const MAN = 'man';
  const WINS = [[5, 'bakery'], [9, 'dress'], [11, 'glasses'], [15, 'phone'], [17, 'book'], [21, 'tv'], [23, 'pharm'], [27, 'dark'], [33, 'bank'], [36, 'glasses'], [40, 'dark']];   // 长街橱窗 [x, 种类]
  const LAMPX = [7, 13, 19, 25, 31, 37];   // 长街路灯
  const SWX = [2, 4, 6, 8, 13];            // 便利店窗户
  const STANDERS = [['st1', 8], ['st2', 14], ['st3', 20], ['st4', 26]];
  const KEYDESC = '四把钥匙穿在一个旧钥匙圈上：\n· 方头的铜钥匙——楼下单元门\n· 贴着蓝胶布的——家门\n· 银色的长钥匙，缠着黑胶布——单位的抽屉\n· 小小的那把——信箱';
  const GOAL_FINAL = '回家：往西走到单元门。别停下，别回头看他';

  /* ---------- 合成音（S.tone，双方都听得到） ---------- */
  function heel(S, d = 0, v = 1) {   // 一下鞋跟敲在柏油路上：干脆的「嗒」+ 一点闷响
    S.tone('triangle', 1150, 380, .045, .11 * v, d, 3200); S.tone('sine', 150, 70, .09, .13 * v, d);
  }
  function rhythm(S, v = 1, d0 = 0, n = 1) {   // 他的舞步节拍：嗒。嗒嗒。嗒。
    for (let k = 0; k < n; k++) [0, .42, .62, 1.14].forEach(t => heel(S, d0 + k * 1.6 + t, v));
  }
  function glassTap(S, v = 1) { S.tone('triangle', 2500, 2380, .07, .06 * v, 0, 6000); S.tone('sine', 640, 560, .16, .05 * v, .01); }
  function whimper(S) { S.tone('sine', 560, 410, .55, .05, 0, 1400); S.tone('sine', 470, 360, .4, .035, .5, 1200); }

  /* ---------- 双人抉择：单人等同 ask；两人意见不合时走安全项，并交代一句 ---------- */
  async function choose(S, q, opts, o = {}) {
    const r = await S.vote(q, opts, o.who, o.style ? { style: o.style } : {});
    if (!r.agree && o.safe != null) { if (o.split) await S.narr(o.split); return o.safe; }
    return r.v;
  }

  /* ---------- 小工具 ---------- */
  const tileOf = e => [Math.round(e.px / TS), Math.round(e.py / TS)];
  function setS(e, k, v) { if (e && e.s[k] !== v) e.s[k] = v; }
  function looking(p, mx, my, range) {   // 玩家的朝向是否对着 (mx,my)
    const dx = mx - p.x, dy = my - p.y, d = Math.hypot(dx, dy);
    if (d < .5 || d > range) return false;
    const v = DIRS[p.dir]; return (dx * v[0] + dy * v[1]) / d >= .7;
  }
  function movedTile(S, key) {   // 玩家这一帧是否换了格子（传送也算）
    const p = W.pl, k = p.x + ',' + p.y, ch = S.f[key] !== k; S.f[key] = k; return ch;
  }
  function adjFree(S, x, y, who) {
    const m = curMap();
    const c = [[x - 1, y], [x, y + 1], [x + 1, y], [x, y - 1]].filter(([a, b]) => passable(m, a, b, who));
    return c[0] || null;
  }
  // 点阵数字（3×5），画墙上上下颠倒的涂鸦、和水洼里正过来的倒影
  const FONT = { 1: ['010', '110', '010', '010', '111'], 6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'] };
  function glyph(R, ch, ox, oy, col, vflip, sc = 2) {   // vflip：上下颠倒（水面倒影就是上下翻转，左右不变）
    const F = FONT[ch];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (F[r][c] === '1') { const y = vflip ? 4 - r : r; R(ox + c * sc, oy + y * sc, sc, sc, col); }
  }
  const LINE = (R, x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) R(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1, c); };

  /* ---------- 自定义精灵 ---------- */
  const SPRITES = {
    /* 微笑的男人：瘦高，一步一顿一扭的怪异舞步。
       s.mode: dance（默认）| stand | lean（弯腰凑近）| crouch（蹲着）| tiptoe（踮着脚、像动画片里偷偷摸过来的人）
       s.look 0/1 看向你；s.eye 0~1 眼珠往你这边滑；s.spin 原地扭转。
       舞步相位跟着位置走（px/py 会同步给客机；客机上实体没有 mv），走得越快抬腿越快；e.fr 非 0 = 正在走 */
    smiler(g, e, t, R) {
      const mode = e.mode || 'dance', tx0 = Math.round((e.px || 0) / 16), ph = tx0 * 1.7, spin = !!e.spin, walking = !!e.fr;
      const travel = ((e.px || 0) + (e.py || 0)) / 16 * Math.PI * .55;
      const p = mode === 'dance' ? t * 3.2 + travel + ph : mode === 'tiptoe' ? t * 4 + travel * 1.4 : t * .9 + ph;
      const jerk = (mode === 'dance' || mode === 'tiptoe') && hash((t * 7) | 0, tx0, 3) < (walking ? .22 : .14);          // 抽搐似的一顿
      const sway = mode === 'dance' ? Math.round(Math.sin(p) * 2.4) + (jerk ? 1 : 0) : mode === 'stand' ? Math.round(Math.sin(p) * .6) : mode === 'tiptoe' ? Math.round(Math.sin(p) * 1) : 0;
      const cx = 8 + sway, suit = '#353844', suitL = '#4a4e5c', skin = '#e2d9cc', shirt = '#dcdad2';
      const low = mode === 'tiptoe' ? 2 : 0;   // 身子往下沉多少
      R(1, 14, 14, 2, 'rgba(0,0,0,.4)');
      if (mode === 'crouch') {   // 蹲着：膝盖向两边支开、比屁股还高，两只手垂在膝盖中间，像一只青蛙
        for (const sd of [-1, 1]) {
          const hx = cx + sd * 2, kx = cx + sd * 6, fx = cx + sd * 5;
          LINE(R, hx, 8, kx, 4, suit); LINE(R, hx, 9, kx, 5, suit); LINE(R, kx, 4, fx, 15, suit); LINE(R, kx + sd, 5, fx + sd, 15, suitL); R(fx - 1, 15, 3, 1, '#0c0c0e');
        }
        R(cx - 3, 1, 7, 8, suit); R(cx + 3, 2, 1, 6, suitL); R(cx, 1, 1, 5, shirt); R(cx, 2, 1, 3, '#5a1a22');
        LINE(R, cx - 3, 2, cx - 1, 12, suit); LINE(R, cx + 3, 2, cx + 1, 12, suit); R(cx - 1, 12, 1, 2, skin); R(cx + 1, 12, 1, 2, skin);
      } else {
      const legs = (side, q) => {   // 两段腿，膝盖抬得很高
        const lift = mode === 'dance' ? Math.max(0, Math.sin(q)) * (spin ? 3 : 7) : mode === 'tiptoe' ? Math.max(0, Math.sin(q)) * 6 : 0;
        const hx = cx + side, hy = 3 + low;
        const kx = hx + (lift > 2 ? side * 2 : 0), ky = 9 - Math.round(lift) + (mode === 'tiptoe' ? 1 : 0);
        const fx = hx + (lift > 2 ? side : 0), fy = 15 - Math.round(lift * .6) - (mode === 'tiptoe' ? 1 : 0);
        LINE(R, hx, hy, kx, ky, suit); LINE(R, hx, hy + 1, kx, ky + 1, suit); LINE(R, kx, ky, fx, fy, suit);
        if (mode === 'tiptoe') R(fx, fy, 1, 2, '#0c0c0e'); else R(fx - 1, fy, 3, 1, '#0c0c0e');   // 踮着脚尖
      };
      legs(-1, p); legs(1, p + Math.PI);
      const ty = (mode === 'lean' ? -5 : -8) + low;
      R(cx - 2, ty, 5, 12 - (ty + 8) + low, suit); R(cx - 3, ty, 7, 2, suit); R(cx + 2, ty + 1, 1, 10, suitL);
      R(cx, ty, 1, 6, shirt); R(cx, ty + 2, 1, 3, '#5a1a22');
      let a1 = Math.PI * .72 + Math.sin(p) * (mode === 'dance' ? .95 : .08), a2 = Math.PI * .28 - Math.sin(p + 1.3) * (mode === 'dance' ? .95 : .08);
      if (spin) { a1 = Math.PI * 1.1; a2 = -Math.PI * .1; }
      if (mode === 'lean') { a1 = Math.PI * .62; a2 = Math.PI * .38; }
      if (mode === 'tiptoe') { a1 = -Math.PI * .15 + Math.sin(p) * .25; a2 = Math.PI * 1.15 - Math.sin(p) * .25; }   // 两只手缩在胸前，手指耷拉着
      const al = mode === 'tiptoe' ? 6 : 10;
      for (const [x0, a] of [[cx - 3, a1], [cx + 3, a2]]) for (let i = 0; i < al; i++) R(Math.round(x0 + Math.cos(a) * i), Math.round(ty + 1 + Math.sin(a) * i), 1, 1, i > al - 3 ? skin : suit);
      }
      const tilt = mode === 'lean' || mode === 'crouch' ? 0 : Math.round(Math.sin(p * .5) * 1.6) - (jerk ? 1 : 0);
      const hx = cx - 3 + tilt, hy = mode === 'crouch' ? -9 : (mode === 'lean' ? -14 : -19) + low;
      R(cx, hy + 9, 2, 2, skin);
      R(hx, hy, 7, 9, skin); R(hx + 6, hy + 1, 1, 7, shade(skin, -.12));
      R(hx, hy - 1, 7, 2, '#121214'); R(hx - 1, hy, 1, 3, '#121214');
      const look = !!e.look;
      R(hx + 1, hy + 3, 2, 1, '#f0ede4'); R(hx + 4, hy + 3, 2, 1, '#f0ede4');
      if (look) { R(hx + 1, hy + 2, 2, 2, '#f0ede4'); R(hx + 4, hy + 2, 2, 2, '#f0ede4'); R(hx + 2, hy + 3, 1, 1, '#080808'); R(hx + 4, hy + 3, 1, 1, '#080808'); }
      else if ((e.eye || 0) > .5) { R(hx + 2, hy + 3, 1, 1, '#080808'); R(hx + 5, hy + 3, 1, 1, '#080808'); R(hx + 1, hy + 2, 5, 1, shade(skin, -.2)); }
      else { R(hx + 1, hy + 2, 2, 1, '#f0ede4'); R(hx + 4, hy + 2, 2, 1, '#f0ede4'); R(hx + 1, hy + 2, 1, 1, '#080808'); R(hx + 5, hy + 2, 1, 1, '#080808'); }   // 眼睛瞪得很大，眼珠翻上去看天
      const wide = look || mode === 'lean' ? 2 : 1;   // 笑：大得不正常，咧出脸外
      R(hx - wide, hy + 6, 7 + wide * 2, 1, '#f6f2e8'); R(hx - wide - 1, hy + 5, 1, 1, '#f6f2e8'); R(hx + 7 + wide, hy + 5, 1, 1, '#f6f2e8');
      R(hx - wide, hy + 7, 7 + wide * 2, 1, '#3a1214');
      for (let i = hx - wide + 1; i < hx + 7 + wide; i += 2) R(i, hy + 6, 1, 1, '#bdb4a2');
    },
    /* 主街橱窗（墙面）。kind 决定橱窗里摆什么；s.refl = 玻璃里那个人离你几步（0 = 没有） */
    shopwin(g, e, t, R) {
      const k = e.kind || 'dark';
      const sign = { dress: '#c890a8', phone: '#2a5a9a', glasses: '#3a8a8a', book: '#8a6a3a', tv: '#5a5a7a', pharm: '#2a8a4a', bakery: '#b07a3a', dark: '#4a4a50', bank: '#8a2a2a' }[k];
      R(0, -5, 16, 4, sign); R(0, -5, 16, 1, shade(sign, .25)); for (let i = 0; i < 3; i++) R(3 + i * 4, -3, 2, 1, '#e8e4d8');
      R(0, 0, 16, 14, '#24242a'); R(1, 1, 14, 12, '#0f141c');
      if (k === 'dress') { R(7, 2, 2, 2, '#cfc8bc'); R(6, 4, 4, 2, '#e8e2d8'); R(5, 6, 6, 6, '#ece6dc'); R(4, 11, 8, 1, '#d8d0c4'); }
      if (k === 'phone') for (let i = 0; i < 3; i++) { R(3 + i * 4, 6, 2, 4, '#1a1a1e'); R(3 + i * 4, 6, 2, 3, ['#2a4a7a', '#3a6a5a', '#5a3a6a'][i]); }
      if (k === 'glasses') { for (let i = 0; i < 2; i++) { R(3, 4 + i * 4, 3, 2, '#7a7a80'); R(7, 4 + i * 4, 3, 2, '#7a7a80'); R(6, 4 + i * 4, 1, 1, '#7a7a80'); } R(11, 3, 3, 8, '#5a6a78'); R(12, 4, 1, 4, '#8a9aaa'); }
      if (k === 'book') for (let i = 0; i < 6; i++) R(2 + i * 2, 5 + (i % 2), 2, 7 - (i % 2), ['#7a2a2a', '#2a4a6a', '#5a6a2a', '#6a5a2a', '#4a2a5a', '#8a7a5a'][i]);
      if (k === 'tv') { R(2, 4, 5, 4, '#1a2a3a'); R(9, 4, 5, 4, '#1a2a3a'); R(3, 5, 3, 2, '#2a3a5a'); R(10, 5, 3, 2, '#2a3a5a'); }
      if (k === 'pharm') { R(6, 3, 4, 8, '#1a3a2a'); R(7, 4, 2, 6, '#3ac06a'); R(5, 6, 6, 2, '#3ac06a'); }
      if (k === 'bakery') for (let i = 0; i < 3; i++) { R(2 + i * 4, 9, 3, 2, '#a07038'); R(2 + i * 4, 9, 3, 1, '#c89050'); }
      if (k === 'dark') { R(5, 5, 6, 4, '#c8c0a8'); R(6, 6, 4, 1, '#555'); }
      if (k === 'bank') { R(4, 3, 8, 9, '#3a3a40'); R(5, 4, 6, 3, '#5a8aba'); R(6, 9, 4, 1, '#222'); }
      // 玻璃反光
      R(2, 2, 1, 9, 'rgba(255,255,255,.08)'); R(3, 2, 1, 4, 'rgba(255,255,255,.06)');
      const gd = e.refl || 0;
      if (gd > 0) {   // 倒影：一个人站在你身后
        const h = clamp(Math.round(3 + (9 - gd) * 1.15), 3, 12), cx = 8 + (e.rx || 0), top = 13 - h, a = clamp(.25 + (9 - gd) * .07, .25, .8);
        const c = `rgba(214,218,228,${a})`;
        R(cx - 1, top, 2, Math.max(1, Math.round(h * .22)), c);
        R(cx - (h > 7 ? 2 : 1), top + Math.round(h * .25), h > 7 ? 4 : 3, Math.round(h * .5), c);
        R(cx - 1, top + Math.round(h * .75), 1, Math.round(h * .25), c); R(cx + (h > 7 ? 1 : 0), top + Math.round(h * .75), 1, Math.round(h * .25), c);
        if (h > 8) { R(cx - 1, top + 1, 1, 1, 'rgba(0,0,0,.6)'); R(cx, top + 1, 1, 1, 'rgba(0,0,0,.6)'); }
      }
      R(0, 13, 16, 1, '#3a3a40');
    },
    /* 便利店正门（主街墙面） */
    storedoor(g, e, t, R) {
      R(-3, -7, 22, 5, '#1e7a44'); R(-3, -7, 22, 1, '#3aa868'); for (let i = 0; i < 5; i++) R(-1 + i * 4, -5, 2, 2, '#f2f2e8');
      R(1, -1, 14, 15, '#9a9a9a'); R(2, 0, 12, 14, '#cfe6dc'); R(7, 0, 2, 14, '#9a9a9a'); R(5, 6, 1, 3, '#555'); R(10, 6, 1, 3, '#555');
      R(3, 2, 2, 8, 'rgba(255,255,255,.5)');
    },
    storeglass(g, e, t, R) { R(0, 0, 16, 14, '#8a8a8a'); R(1, 1, 14, 12, '#d6ece2'); R(3, 7, 10, 5, '#c8b070'); R(4, 8, 2, 3, '#e05a3a'); R(8, 8, 3, 3, '#3a7ad0'); R(2, 2, 1, 5, 'rgba(255,255,255,.5)'); },
    /* 店里看出去的窗：夜里只是一块黑镜子。s.face 窗外那张脸（很淡）；s.knock 贴上来 */
    storewin(g, e, t, R) {
      R(0, 0, 16, 14, '#9a9a96'); R(1, 1, 14, 12, '#0c1016'); R(8, 1, 1, 12, '#9a9a96');
      R(2, 9, 12, 3, 'rgba(200,210,200,.10)'); R(3, 3, 4, 1, 'rgba(255,255,255,.10)'); R(10, 2, 1, 6, 'rgba(255,255,255,.07)');
      if (e.face) {
        const a = e.knock ? .95 : .13;
        R(5, 3, 6, 8, `rgba(196,196,186,${a})`); R(6, 2, 4, 1, `rgba(196,196,186,${a})`);
        R(6, 6, 1, 1, `rgba(0,0,0,${a * 2.5})`); R(9, 6, 1, 1, `rgba(0,0,0,${a * 2.5})`); R(7, 9, 2, 1, `rgba(40,20,20,${a * 2})`);
        if (e.knock) { R(2, 6, 2, 4, '#c4c4ba'); R(12, 6, 2, 4, '#c4c4ba'); }
      }
    },
    /* 防盗凸面镜：缩小的整间店，窗外那张脸是镜子里的一个白点（s.fi = 第几扇窗，-1 没有） */
    convex(g, e, t, R) {
      R(4, 0, 8, 1, '#5a5a5a'); R(2, 1, 12, 1, '#5a5a5a'); R(1, 2, 14, 9, '#5a5a5a'); R(2, 11, 12, 1, '#5a5a5a'); R(4, 12, 8, 1, '#5a5a5a');
      R(4, 1, 8, 1, '#9aa6ae'); R(2, 2, 12, 9, '#7a8890'); R(4, 11, 8, 1, '#7a8890');
      R(3, 3, 10, 2, '#0a0e14'); for (let i = 0; i < 5; i++) R(4 + i * 2, 3, 1, 2, '#6a6a6a');
      R(2, 7, 12, 4, '#c8c8b8'); R(5, 8, 1, 1, '#2a4a3a'); R(9, 7, 4, 1, '#d0d8e0');
      const fi = e.fi ?? -1;
      if (fi >= 0) { const x = 3 + Math.round(fi * 1.8); R(x, 3, 1, 2, Math.sin(t * 6) > -.5 ? '#f2eee4' : '#a8a49a'); }
      if (e.man) { const s2 = Math.round(Math.sin(t * 7)); R(8 + s2, 8, 1, 1, '#e2d9cc'); R(8 + s2, 9, 1, 2, '#2a2c34'); R(7 + s2, 9 - s2, 1, 1, '#2a2c34'); R(9 + s2, 9 + s2, 1, 1, '#2a2c34'); R(8, 8, 1, 1, '#f6f2e8'); }
      R(4, 2, 2, 1, 'rgba(255,255,255,.55)'); R(3, 3, 1, 1, 'rgba(255,255,255,.35)');
    },
    breadshelf(g, e, t, R) { box(R, 0, -4, 16, 18, '#8a6a48'); R(1, 4, 14, 1, '#4a3420'); const n = e.taken ? 2 : 3; for (let i = 0; i < n; i++) { R(2 + i * 5, -2, 4, 4, '#c89050'); R(2 + i * 5, -2, 4, 1, '#e0b070'); } for (let i = 0; i < 3; i++) { R(2 + i * 5, 6, 4, 5, '#e8d8b0'); R(3 + i * 5, 7, 2, 1, '#c03030'); } },
    magrack(g, e, t, R) { box(R, 0, -2, 16, 16, '#5a5a62'); for (let i = 0; i < 3; i++) { R(1 + i * 5, 0, 4, 6, ['#d84a6a', '#3a8ad0', '#e8c040'][i]); R(1 + i * 5, 7, 4, 6, ['#6ac06a', '#e86a3a', '#8a6ad0'][i]); R(2 + i * 5, 1, 2, 1, '#fff'); } },
    snackshelf(g, e, t, R) { box(R, 0, -4, 16, 18, '#7a7a82'); R(1, 4, 14, 1, '#3a3a40'); for (let i = 0; i < 4; i++) { R(1 + i * 4, -2, 3, 5, ['#e8302a', '#e8c020', '#2a8ae8', '#30c060'][i]); R(1 + i * 4, 6, 3, 6, ['#f08030', '#a040c0', '#e8e030', '#e85080'][i]); } },
    drinkfridge(g, e, t, R) { box(R, 0, -10, 16, 25, '#b8c0c8'); R(2, -8, 12, 21, '#b6dcec'); for (let r = 0; r < 3; r++) { R(2, -8 + r * 7 + 6, 12, 1, '#8aa0aa'); for (let i = 0; i < 4; i++) R(3 + i * 3, -7 + r * 7, 2, 5, ['#e8f0f8', '#e84030', '#30a050', '#f0c030'][(i + r) % 4]); } R(13, -4, 1, 6, '#777'); },
    register(g, e, t, R) { R(3, -6, 10, 7, '#2a2a30'); R(4, -5, 6, 3, '#4ae06a'); R(5, -4, 3, 1, '#1a5a2a'); R(11, -5, 1, 4, '#888'); },
    backdoor(g, e, t, R) { R(2, 0, 12, 14, '#4a4a50'); R(3, 1, 10, 12, e.open ? '#050505' : '#5c5c62'); if (!e.open) { R(4, 3, 8, 3, '#2a7a3a'); R(5, 4, 6, 1, '#d8f0d8'); R(10, 8, 2, 2, '#c9a35a'); } },
    pcdesk(g, e, t, R) { const c = '#4a3a2c'; box(R, 0, 1, 16, 13, c); R(1, 2, 14, 2, shade(c, .18)); R(4, -5, 8, 6, '#1c1c22'); R(5, -4, 6, 4, e.off ? '#16181e' : '#a8c8f0'); if (!e.off) { R(6, -3, 4, 1, '#4a6a9a'); R(6, -1, 3, 1, '#4a6a9a'); } R(3, 1, 10, 2, '#3a3a40'); R(12, 4, 2, 3, '#e8e8e0'); },
    keyhook(g, e, t, R) { R(3, 4, 10, 2, '#6a4a2a'); R(4, 6, 1, 1, '#c9a35a'); R(8, 6, 1, 1, '#c9a35a'); R(11, 6, 1, 1, '#c9a35a'); if (!e.taken) { R(4, 7, 2, 5, '#c9a35a'); R(5, 8, 2, 1, '#2a6ad0'); R(7, 7, 1, 5, '#cfcfd4'); R(9, 7, 1, 3, '#b8b8b8'); } else R(8, 7, 4, 3, '#2a3a5a'); },
    nightstand(g, e, t, R) { box(R, 1, 3, 14, 11, '#5a4030'); R(7, 8, 2, 1, '#c9a35a'); R(3, -2, 3, 5, '#e09030'); R(3, -3, 3, 1, '#f0f0f0'); R(9, 0, 4, 3, '#e8e8e8'); R(10, 1, 2, 1, '#9fc3d3'); },
    trafficlight(g, e, t, R) { R(7, -26, 2, 41, '#34373c'); R(4, 13, 8, 2, '#2a2d32'); box(R, 4, -31, 8, 14, '#18181a'); R(6, -29, 4, 3, '#3a1010'); const on = Math.sin(t * 3.2 + (e.x || 0)) > 0; R(6, -25, 4, 3, on ? '#ffcc30' : '#4a3a10'); R(6, -21, 4, 3, '#103a18'); if (on) R(5, -26, 6, 5, 'rgba(255,200,40,.25)'); },
    barber(g, e, t, R) {   // 理发店橱窗（w=3，墙面）：一整面镜子墙
      R(0, -6, 48, 5, '#e8e4dc'); for (let i = 0; i < 12; i++) R(i * 4, -6, 2, 5, i % 2 ? '#c02a2a' : '#2a4ac0'); R(14, -5, 20, 3, '#f2f0ea'); R(16, -4, 16, 1, '#555');
      R(0, 0, 48, 14, '#2a2a30'); R(1, 1, 46, 12, '#141a22');
      for (let i = 0; i < 3; i++) { R(4 + i * 15, 2, 10, 8, '#4a5866'); R(5 + i * 15, 3, 2, 5, '#6a7a8a'); R(6 + i * 15, 9, 6, 3, '#7a2222'); R(6 + i * 15, 9, 6, 1, '#9a3a3a'); }
      if (e.m) { const i = e.mi ?? 1, x = 8 + i * 15; R(x, 3, 2, 2, '#e2d9cc'); R(x - 1, 5, 4, 4, '#353844'); R(x - 1, 4, 4, 1, '#f6f2e8'); R(x - 2, 6 + Math.round(Math.sin(t * 6)), 1, 2, '#353844'); R(x + 3, 6 - Math.round(Math.sin(t * 6)), 1, 2, '#353844'); }
      R(2, 2, 1, 9, 'rgba(255,255,255,.07)');
    },
    barberpole(g, e, t, R) { R(5, -8, 6, 2, '#ddd'); R(6, -6, 4, 16, '#f2f0ea'); for (let k = 0; k < 5; k++) { const y = ((t * 7 + k * 4) % 16) - 6; R(6, y, 4, 1, '#c02828'); if (y + 2 < 10) R(6, y + 2, 4, 1, '#2a4ac0'); } R(5, 10, 6, 2, '#ddd'); },
    homedoor(g, e, t, R) { R(-1, -6, 18, 4, '#3a3a40'); R(1, -5, 6, 2, '#d8d8d0'); R(2, -5, 1, 2, '#333'); R(4, -5, 2, 2, '#333'); R(1, -1, 14, 15, '#4a4a52'); R(2, 0, 12, 14, e.open ? '#050608' : '#1a2230'); R(8, 0, 1, 14, '#4a4a52'); R(14, 4, 2, 5, '#8a8a8a'); R(14, 5, 1, 1, e.lit ? '#6f6' : '#f44'); R(3, 2, 1, 6, 'rgba(255,255,255,.1)'); },
    tlamp(g, e, t, R) { R(3, 1, 10, 5, '#4a4a4a'); R(4, 2, 8, 3, e.off ? '#2a2a2a' : (e.flicker && Math.random() < .12 ? '#3a3a3a' : '#e8f2e4')); },
    graffiti(g, e, t, R) {   // 墙上上下颠倒着写的四个数字（w=4，墙面）。顺序不变，每个字上下翻过来——水里的倒影正好把它翻正
      const col = '#a8201e';
      ['7', '6', '1', '8'].forEach((ch, i) => glyph(R, ch, i * 16 + 5, 2, col, true));
      R(2, 12, 2, 1, col); R(20, 1, 1, 2, col); R(58, 12, 3, 1, col); R(37, 0, 2, 1, col);
      R(7, 13, 1, 2, col); R(39, 13, 1, 3, col); R(55, 13, 1, 1, col);   // 淌下来的漆痕
    },
    refpuddle(g, e, t, R) {   // 墙根的水洼（w=2）：水面上是墙上那行字的倒影——正过来的 7618
      R(1, 6, 30, 8, 'rgba(40,52,64,.85)'); R(3, 5, 26, 1, 'rgba(40,52,64,.7)'); R(4, 14, 24, 1, 'rgba(40,52,64,.7)');
      const wob = Math.round(Math.sin(t * 1.7));
      ['7', '6', '1', '8'].forEach((ch, i) => glyph(R, ch, 6 + i * 6 + wob, 7, 'rgba(190,40,36,.55)', false, 1));
      R(4, 8 + ((t * 3) | 0) % 5, 6, 1, 'rgba(200,210,220,.12)'); R(18, 12 - ((t * 2) | 0) % 4, 8, 1, 'rgba(200,210,220,.1)');
    },
    gate(g, e, t, R) {   // 铁栅栏门（竖着，h 格高）
      const H = (e.h || 3) * 16;
      if (e.open) { R(12, -6, 3, H + 6, '#3a3c40'); for (let y = 0; y < H; y += 6) R(13, y, 2, 3, '#5a5c60'); return; }
      R(0, -6, 16, 3, '#3a3c40'); R(0, H - 3, 16, 3, '#3a3c40');
      for (let x = 1; x < 16; x += 3) { R(x, -4, 2, H + 2, '#4a4c52'); R(x, -4, 1, H + 2, '#6a6c72'); }
      R(0, Math.round(H * .33), 16, 2, '#3a3c40'); R(0, Math.round(H * .66), 16, 2, '#3a3c40');
      const ly = Math.round(H / 2) - 4; R(5, ly + 3, 6, 7, '#b89a4a'); R(6, ly, 4, 4, '#888'); R(7, ly + 1, 2, 3, '#1a1a1a'); R(6, ly + 5, 4, 2, '#3a3020');
    },
    manhole(g, e, t, R) { R(2, 4, 12, 8, '#1e1e22'); R(3, 5, 10, 6, '#2c2c30'); for (let i = 0; i < 3; i++) R(4, 6 + i * 2, 8, 1, '#232327'); for (let i = 0; i < 3; i++) { const y = ((t * 5 + i * 5) % 14); R(5 + i * 2 + Math.round(Math.sin(t * 2 + i) * 2), 2 - y, 3, 2, `rgba(200,205,215,${.18 * (1 - y / 14)})`); } },
    cone(g, e, t, R) { R(3, 13, 10, 2, '#2a2a2a'); R(5, 4, 6, 9, '#e8602a'); R(6, 1, 4, 3, '#e8602a'); R(5, 7, 6, 2, '#f0f0f0'); },
    barrier(g, e, t, R) { R(1, 4, 14, 4, '#e8c030'); for (let i = 0; i < 4; i++) R(2 + i * 4, 4, 2, 4, '#1a1a1a'); R(2, 8, 2, 7, '#555'); R(12, 8, 2, 7, '#555'); R(7, 2, 2, 2, Math.sin(t * 4) > 0 ? '#ff4020' : '#5a1a10'); },
    atm(g, e, t, R) { R(1, 0, 14, 14, '#5a5e66'); R(3, 1, 10, 6, '#1a2a3a'); R(4, 2, 8, 4, '#3a7aba'); R(4, 8, 8, 3, '#2a2a30'); R(4, 12, 8, 1, '#111'); },
    cat(g, e, t, R) { const b = Math.sin(t * 2) > .9 ? 1 : 0; R(4, 10, 8, 4, '#1a1818'); R(10, 7, 4, 4, '#1a1818'); R(10, 6, 1, 1, '#1a1818'); R(13, 6, 1, 1, '#1a1818'); R(11, 8, 1, 1 - b, '#e8d040'); R(13, 8, 1, 1 - b, '#e8d040'); R(2, 9 + Math.round(Math.sin(t * 3)), 2, 1, '#1a1818'); R(3, 10, 1, 2, '#1a1818'); }
  };

  /* ---------- 惊吓大头像（32×32） ---------- */
  const FACES = {
    grin(R, a, t) {   // 微笑的男人：一开始眼珠翻上去看天，一下子落下来正对着你；嘴咧到脸外面去
      const sk = '#e6dccd', sk2 = '#c4b6a2', dk = '#0a0a0c';
      R(0, 0, 32, 32, '#020203');
      R(1, 28, 30, 4, '#2c2f3a'); R(13, 27, 6, 5, '#dcdad2'); R(15, 28, 2, 4, '#5a1a22'); R(13, 24, 6, 4, sk2);
      R(10, 3, 12, 22, sk); R(9, 5, 14, 18, sk); R(8, 8, 16, 11, sk);
      R(21, 5, 1, 18, sk2); R(22, 8, 1, 11, sk2); R(10, 22, 12, 2, sk2);
      R(9, 2, 14, 3, dk); R(8, 3, 2, 5, dk); R(22, 3, 2, 4, dk); R(12, 2, 6, 1, '#2a2a30');
      R(10, 6, 5, 1, '#4a3c34'); R(17, 6, 5, 1, '#4a3c34'); R(9, 7, 1, 1, '#4a3c34'); R(22, 7, 1, 1, '#4a3c34');   // 眉毛挑得很高
      const down = a > .42, jit = down && Math.sin(t * 40) > .6 ? 1 : 0;
      for (const ex of [10, 17]) {
        R(ex, 8, 5, 5, '#f4f1e8'); R(ex + 1, 7, 3, 1, '#f4f1e8'); R(ex + 1, 13, 3, 1, '#f4f1e8');
        if (down) R(ex + (ex === 10 ? 2 : 1) + jit, 10, 2, 2, dk); else R(ex + 2, 7, 1, 2, dk);
        R(ex, 14, 5, 1, '#b4a48c'); R(ex + 1, 8, 1, 1, '#d89a9a'); R(ex + 4, 12, 1, 1, '#d89a9a');   // 眼袋、眼白上的红血丝
      }
      R(15, 12, 2, 4, sk2); R(14, 15, 1, 1, sk2); R(17, 15, 1, 1, sk2);
      const w = 9 + Math.round(a * 5), cy = 20, open = a > .55 ? 1 + Math.round((a - .55) * 4) : 0;
      for (let i = -w; i <= w; i++) {
        const x = 16 + i, y = cy - Math.round(i * i / (w * w) * 6);
        R(x, y, 1, 1, '#f6f2e8'); if (open) R(x, y + 1, 1, open, '#1a0606'); R(x, y + 1 + open, 1, 1, '#ece6da'); R(x, y + 2 + open, 1, 1, '#4a1418');
        if ((i & 1) === 0) { R(x, y, 1, 1, '#bdb4a2'); R(x, y + 1 + open, 1, 1, '#bdb4a2'); }
      }
      R(16 - w - 1, cy - 7, 1, 2, '#f6f2e8'); R(16 + w + 1, cy - 7, 1, 2, '#f6f2e8');   // 嘴角翘到脸外面的黑里
    },
    stander(R, a, t) {   // 路灯下站着的人：没有脸。可是脸上慢慢陷下去两个坑，对着你
      const sk = '#bcb8b0', sk2 = '#9a968e', dk = '#141416';
      R(0, 0, 32, 32, '#030304');
      R(2, 27, 28, 5, '#46464a'); R(12, 25, 8, 3, sk2);
      R(9, 4, 14, 22, sk); R(8, 7, 16, 15, sk); R(22, 7, 2, 15, sk2); R(9, 24, 14, 2, sk2);
      R(8, 3, 16, 4, dk); R(7, 5, 2, 6, dk); R(23, 5, 2, 6, dk);
      for (let i = 0; i < 9; i++) R(10 + ((hash(i, 2, 7) * 12) | 0), 9 + ((hash(i, 3, 7) * 14) | 0), 1, 1, '#aca8a0');   // 皮肤上细细的纹路，什么五官都没有
      if (a > .35) { const d = Math.min(1, (a - .35) * 2.5); R(11, 12, 4, 2, `rgba(60,58,54,${d * .7})`); R(18, 12, 4, 2, `rgba(60,58,54,${d * .7})`); R(12, 13, 2, 1, `rgba(10,10,12,${d})`); R(19, 13, 2, 1, `rgba(10,10,12,${d})`); }
      if (a > .7) R(12, 20, 8, 1, `rgba(40,30,30,${(a - .7) * 3})`);
    },
    woman2(R, a, t) {   // 问时间的女人：两个黑洞似的眼睛，嘴越张越大
      const sk = '#d8cec4', hr = '#100c0e';
      R(0, 0, 32, 32, '#020203');
      R(5, 2, 22, 30, hr); R(3, 10, 4, 22, hr); R(25, 10, 4, 22, hr);
      R(10, 6, 12, 20, sk); R(9, 9, 14, 13, sk); R(21, 7, 1, 17, '#bcb2a8');
      R(9, 5, 7, 6, hr); R(16, 5, 6, 3, hr); R(13, 8, 1, 10, hr);   // 一绺头发垂下来挡着脸
      const eh = 3 + Math.round(a * 3);
      R(11, 11, 3, eh, '#050505'); R(18, 11, 3, eh, '#050505'); R(11, 11 + eh, 3, 1, '#3a2a2a'); R(18, 11 + eh, 3, 1, '#3a2a2a');
      const mh = 1 + Math.round(a * 5); R(14, 20, 4, mh, '#160404'); R(13, 21, 6, Math.max(1, mh - 2), '#160404');
      R(5, 30, 22, 2, '#5a5448');
    },
    pale(R, a, t) {   // 贴在窗玻璃外面的脸：被玻璃压扁了，两只手按在脸旁边
      const sk = '#dcdcd4', sk2 = '#b8b8b0';
      R(0, 0, 32, 32, '#06080c');
      R(7, 4, 18, 22, sk); R(5, 8, 22, 14, sk); R(24, 6, 1, 18, sk2); R(9, 25, 14, 2, sk2);
      R(9, 21, 14, 1, '#f2f2ec'); R(6, 12, 1, 6, '#f2f2ec');   // 压在玻璃上发白的地方
      R(10, 11, 4, 3, '#050505'); R(18, 11, 4, 3, '#050505');
      const w = 5 + Math.round(a * 4); R(16 - w, 19, w * 2, 1, '#2a0a0a'); R(16 - w - 1, 18, 1, 1, '#2a0a0a'); R(16 + w, 18, 1, 1, '#2a0a0a');
      for (const hx of [0, 26]) { R(hx, 10, 6, 9, sk); R(hx + 1, 8, 1, 3, sk); R(hx + 3, 7, 1, 4, sk); R(hx + 5, 8, 1, 3, sk); R(hx, 18, 6, 1, '#f2f2ec'); }
      if (a > .5) { const c = 'rgba(230,240,250,.8)'; LINE(R, 16, 0, 12, 9, c); LINE(R, 12, 9, 15, 16, c); LINE(R, 12, 9, 4, 13, c); LINE(R, 15, 16, 26, 31, c); }
      R(1, 1, 30, 1, 'rgba(255,255,255,.08)'); R(1, 1, 1, 30, 'rgba(255,255,255,.08)');
    }
  };

  const GRIN = (G, R, d) => {   // 「咧到脸外面」的笑
    if (d === 0) { R(2, G.hT + 6, 12, 1, '#f6f2e8'); R(1, G.hT + 5, 1, 1, '#f6f2e8'); R(14, G.hT + 5, 1, 1, '#f6f2e8'); R(2, G.hT + 7, 12, 1, '#3a1214'); for (let i = 3; i < 14; i += 2) R(i, G.hT + 6, 1, 1, '#bdb4a2'); }
    else if (d === 1) { R(2, G.hT + 6, 6, 1, '#f6f2e8'); R(2, G.hT + 7, 5, 1, '#3a1214'); }
  };

  defChapter({
    id: 'smilingman', n: 6, title: '微笑的男人', sub: '凌晨的空街上，一个瘦高的男人跳着舞朝你走来。他在笑。他一直没看你。', origin: '英文网络怪谈', color: '#1c2632',
    icon: '@grin', amb: 'wind', floor: 'asphalt', wall: 'concrete', dark: .9, plr: 2.8, darkC: '#03050a',
    faces: FACES,
    endings: { home: '第六夜　完', reply: '补完的那句话', street: '你对他笑了', door: '猫眼' },
    people: {
      me: { skin: '#ecc8a6', hair: '#2a2224', hs: 'messy', top: '#5a6474', top2: '#3a404c', bottom: '#2a2e3a', shoes: '#d8d8d0' },
      grin: { key: 'sm-grin', skin: '#e2d9cc', hair: '#121214', hs: 'short', top: '#353844', top2: '#dcdad2', bottom: '#2a2c34', coat: true, shoes: '#0c0c0e', eye: '#080808',
        extra(g, d, fr, G, R) { GRIN(G, R, d); if (d === 0) R(7, G.tT + 1, 2, 4, '#5a1a22'); } },
      stander: { key: 'sm-stander', skin: '#c8c4bc', hair: '#1a1a1c', hs: 'short', top: '#4a4a4e', top2: '#3a3a3e', bottom: '#3a3a3e', shoes: '#1a1a1a',
        extra(g, d, fr, G, R) { if (d === 0) R(4, G.hT + 3, 8, 4, '#c8c4bc'); } },
      woman: { skin: '#e0d6cc', hair: '#141012', hs: 'long', top: '#7a7468', top2: '#5a5448', coat: true, bottom: '#3a3634', shoes: '#2a2222', mouth: '#8a5a5a' },
      woman2: { key: 'sm-woman2', skin: '#d6ccc2', hair: '#141012', hs: 'long', top: '#7a7468', top2: '#5a5448', coat: true, bottom: '#3a3634', shoes: '#2a2222',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 3, 2, 3, '#050505'); R(9, G.hT + 3, 2, 3, '#050505'); R(6, G.hT + 6, 4, 2, '#1a0606'); } } },
      pale: { key: 'sm-pale', skin: '#d8d8d0', hair: '#d8d8d0', hs: 'bald', top: '#2a2a2e', bottom: '#2a2a2e', shoes: '#111',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 3, 2, 2, '#050505'); R(9, G.hT + 3, 2, 2, '#050505'); R(5, G.hT + 6, 6, 1, '#2a0a0a'); R(4, G.hT + 5, 1, 1, '#2a0a0a'); R(11, G.hT + 5, 1, 1, '#2a0a0a'); } } },
      clerk: { skin: '#f0caa8', hair: '#2a1a14', hs: 'messy', top: '#2a8a5a', top2: '#e8e8e0', bottom: '#2a2e3a', shoes: '#e0e0e0' }
    },
    items: {
      keys: { name: '钥匙串', desc: KEYDESC },
      bkey: { name: '后门钥匙', desc: '员工柜里拿的。钥匙牌上用记号笔写着：「后门　夜班用　用完挂回来！！」' },
      milk: { name: '热牛奶', desc: '店员塞给你的一盒热牛奶。捂在手心里，是今晚唯一暖和的东西。' }
    },
    notes: {
      post: { title: '论坛帖子 ·「凌晨的空街上，有个人在跳舞」', text: '（转帖，原帖是英文的　回复 237）\n\n我睡不着的时候，会在凌晨出门走路。那天一两点，我拐进一条很长的空街。\n\n街那头有个人过来。很高，很瘦，一身旧西装。他走路像在跳华尔兹：转一圈，再往前大大地迈一步。\n离近了我才看清：他仰着头看天，眼睛瞪得很大，嘴咧得像动画片里的笑脸，大得不像人。\n\n我穿到马路对面。他停了，一只脚踩在马路上，还是仰着脸，还是在笑。\n我往前看了一眼——就一眼。再回头，他不见了。\n然后我看见他：已经在我这一边了，蹲着。\n他踮着脚朝我过来，像动画片里偷偷摸过来的坏人，可是快得吓人。停在离我一辆车远的地方，还是看着天。\n\n我想冲他喊，喊出来的是一声呜咽。\n他转身跳着舞走了。走出去一截，突然掉头，朝我跑了回来。\n我一路跑到有车的大路上。从那以后，我再也没在夜里出过门。\n\n要是你凌晨遇见他：别停下，别回头看他。还有，千万别——\n\n——————\n2楼：我见过一个不跳舞的，站在路灯底下，脸朝着墙。\n15楼：问你几点了的那种才吓人。别回答。\n41楼：楼主，「千万别」后面是什么？\n42楼：楼主？' },
      missing: { title: '电线杆上的寻人启事', text: '寻　人　启　事\n\n周志远，男，三十四岁，身高一米七五，偏瘦。\n十一月三日凌晨外出散步，至今未归。\n离家时穿灰色连帽衫、白色运动鞋。\n\n他有失眠的毛病，习惯半夜出门走路。常走的路线：长街—十字路口—地下通道。\n如有知情者，请联系家属，必有重谢。\n\n（启事背面，有人用圆珠笔写了几行字，笔迹很用力：\n「他最后一次给我打电话，是凌晨三点十分。\n他说：街上有个人在跳舞。\n他说：老婆，那个人一直在对我笑。」）' },
      rules: { title: '夜班交接本（最后一页）', text: '夜班守则（前辈们一条一条加的，别笑）\n\n1. 三点到五点，别离开收银台。\n2. 路灯底下站着不动的，不进来就别管。从它旁边过，别停下——它最在意别人停下。\n3. 有人问几点了、问你睡不着吗，别回答。它们分不清谁是人，除非你开口。\n4. 窗户上贴着脸，别抬头。想知道在哪扇，看墙角那面凸面镜。\n5. 路口有人在跳舞——别走正门，他从来不进来。\n　 他不看你，你也别回头看他。\n　 不管他离你多近，千万，千万，别对他笑。\n\n（字迹换了好几种。最后一条，有人用红笔描了三遍。）' },
      walker: { title: '压在铁门下面的纸条', text: '给下一个夜里走路的人：\n\n这扇门的锁是我换的。密码写在巷子墙上了——上下颠倒着写的。\n别直着看它。低头，看水。\n直着看的东西，都会骗你。\n\n这座城里还有别人跟我一样，半夜睡不着，出来走。我们在网上互相讲见过的东西：脸朝着墙站一整夜的人；跟在你身边问几点的女人；贴在窗外的脸；在路中间跳舞、一直在笑的男人。\n有人说它们是一回事，有人说不是。也有人说，它们只是喝醉的、病了的、和我们一样睡不着的人。\n\n我只知道规则：\n别停下。别回答。别对视。\n还有——别笑。\n\n——一个以后再也不会在夜里走路的人' }
    },
    legend: '「微笑的男人」（The Smiling Man）是 2012 年发在 Reddit 上的一篇「亲历」故事。一般认为最早贴在专门讲「遇到可怕陌生人」的版块，后来又在恐怖故事版块被大量转载。讲述者说自己当年住在美国一座大城市的市中心，睡不着就在深夜出门散步。一个凌晨一两点，他在一条空荡荡的小街上，看见一个又高又瘦、穿着旧西装的男人朝他过来：步子像在跳华尔兹，转一圈，再往前大大地迈一步；头往后仰，看着天，眼睛瞪得很大，脸上挂着一个大得像动画片里的笑容。\n\n讲述者躲到马路对面，那人停下，一只脚踩在马路上，仍然仰头笑着。讲述者往前看了一眼再回头，他已经不见了——下一刻却出现在讲述者这一侧，蹲着，接着用一种夸张的、动画片里偷偷摸过来似的踮脚步子飞快逼近，停在大约一辆车远的地方，始终看着天。讲述者想喝问他，喊出来的却只是一声呜咽。那人转身跳着舞走开，又突然掉头冲了回来。讲述者一路跑到有车的大路上，再没见过他，之后在那座城市住了半年，再也没有在夜里出过门。\n\n故事没有任何解释：没有凶案，没有来历，只有一条街和一个笑容。正因为这样，它被不断转载、朗读、配图，还被拍成了几分钟的恐怖短片。有人说他是鬼，有人说是疯子，也有人觉得只是一个失眠太久的人的幻觉；还有人把他和 1960 年代美国 UFO 传闻里「咧嘴笑的男人」扯在一起，但两者并没有可靠的渊源。帖子走红后，网上出现了大量类似的深夜遭遇：路灯下一动不动的人、窗外的脸、问你几点的陌生人……大多无法查证，有的显然是编的，但都说出了同一种不安：深夜的城市并不只属于你。\n\n（本章的主角、便利店店员、寻人启事上的人、夜班守则和各种「夜行者」规则、问时间的女人、铁门密码、地下通道、「别对他笑」这条禁忌，以及他会在门外跳舞的结局，均为游戏虚构。）',
    start: { map: 'home', x: 6, y: 5, dir: 3 },
    async intro(S) {
      await S.card('第六夜　微笑的男人', '2012年11月　凌晨两点四十分', '失眠第十七天。\n\n这座城市睡着以后，街道才是你的。\n路灯是白的，马路是空的。\n你喜欢在这种时候出门走一走——\n\n整条街，好像只有你一个人。');
    },
    resume: {
      walk: async S => { resetStanders(S); S.amb('wind'); },
      cross: async S => { const w = S.ent('woman'); S.stop('woman'); S.follow('woman', false); w.hidden = true; w.spr = '@woman'; S.amb('wind'); },
      store1: async S => { S.f.ws = 0; S.f._ws2 = 0; S.f._fwT = 3.5; S.f._wsWarn = 0; setFace(S, 1); S.amb('room'); },
      lane: async S => { S.amb('wind'); },
      final: async S => { resetMan(S); S.f.caught = 0; S.f.wrong = 0; },
      sprint: async S => { sprintStart(S, true); },
      locked: async S => { S.f.peeped = false; S.amb('room'); }
    },
    tick(S, dt) {
      if (W.busy || W.ended || W.paused) return;
      if (S.map === 'street') { if (S.f.phase === 'walk') standerTick(S, dt); else if (S.f.phase === 'final') manTick(S, dt); }
      else if (S.map === 'store' && S.f.phase === 'store1') storeTick(S, dt);
    },
    sprites: SPRITES,
    maps: {
      /* ---------------- 出租屋 ---------------- */
      home: {
        amb: 'room', dark: .78, plr: 3, wall: 'plain', floor: 'wood',
        rows: [
          '############',
          '############',
          '#wwwwwwwwww#',
          '#wwwwwwwwww#',
          '#wwwwwwwwww#',
          '#wwwwwwwwww#',
          '#wwwwwwwwww#',
          '############'],
        tileOpts: { woodC: '#5a4636' },
        ents: [
          { id: 'bed', x: 1, y: 2, h: 2, spr: 'bed', col: '#46566a', on: S => bedOn(S) },
          { x: 2, y: 2, spr: 'nightstand', on: S => S.narr(S.f.phase === 'home' ? '闹钟的秒针走得很响。\n药板上的安眠药，只剩最后一格了。' : '闹钟：2:41。旁边是一板安眠药，抠掉了一半。\n医生说别多吃。你已经很久没多吃了——吃了也没用。') },
          { id: 'hwin', x: 4, y: 1, spr: 'window', light: { r: 2.2, col: 'rgba(170,190,230,.10)', dy: 18 }, async on(S) {
            if (S.f.phase === 'home') { S.sfx('heart'); return S.narr('你没有拉开窗帘。\n你不想知道，楼下那盏路灯底下，现在站着谁。'); }
            await S.narr('六楼的窗户。楼下的长街一眼望不到头，一盏一盏的路灯，白得像医院走廊。\n一个人也没有。连出租车都没有。');
          } },
          { x: 5, y: 2, spr: 'bookshelf', on: S => S.narr('书架上一半是工作用的资料，一半是《失眠的认知行为疗法》之类的书。\n每一本都只看了前三十页。') },
          { id: 'pc', x: 7, y: 2, spr: 'pcdesk', light: { r: 2, col: 'rgba(140,180,255,.16)', dy: 0 }, async on(S) {
            if (S.f.phase === 'home') return pcReply(S);
            if (S.once('pc1')) await S.narr('电脑还开着。睡不着的时候，你就刷那个讲怪事的论坛。\n首页飘着一个老帖子，回复刚刚又多了一条。');
            await S.note('post');
            if (S.once('pc2')) { await S.think('……又是这种帖子。凌晨的街上全是怪人，这种话谁都能编。\n可是最后那句「千万别」，后面到底是什么？'); S.f.readPost = true; }
          } },
          { x: 3, y: 4, w: 2, spr: 'lowtable', col: '#3a2a20', on: S => S.narr('矮桌上摆着吃了一半的泡面，汤已经凉透了，结了一层白油。') },
          { x: 9, y: 1, id: 'hook', spr: 'keyhook', async on(S) {
            if (S.has('keys') || S.ent('hook').s.taken) return S.narr('挂钩上只挂着一个空了的口罩挂绳。');
            S.ent('hook').s.taken = 1; S.give('keys');
            await S.narr('你摘下钥匙串。四把钥匙碰在一起，叮当一声。\n方头的铜钥匙开楼下单元门，贴蓝胶布的开家门，缠黑胶布的长钥匙是单位抽屉的，小的那把开信箱。');
            S.toast('钥匙串的说明随时能在「囊」里看');
            S.goal('出门走走（门在右上角）');
          } },
          { x: 9, y: 2, spr: 'shoes', col: '#d8d8d0', decal: true },
          { id: 'door', x: 10, y: 1, spr: 'door', col: '#4a4a52', on: S => homeDoorIn(S) },
          { x: 10, y: 5, spr: 'fridge', on: S => S.narr('冰箱里只有两罐啤酒和半瓶辣酱。\n压缩机「嗡」地响了一声，又停了。') },
          { x: 1, y: 6, spr: 'plant', on: S => S.narr('同事送的绿萝。你总忘了浇水，它倒是一直没死。') }
        ],
        async enter(S, first) {
          if (S.f.phase === 'home') return homeFinal(S);
          if (!first) return;
          await S.narr('天花板。\n……又是天花板。');
          await S.think('两点四十一。明天八点还要上班。\n躺着也是躺着。出去走走吧——走累了，说不定就能睡着。');
          S.goal('拿上钥匙，出门走走');
        }
      },
      /* ---------------- 长街 ---------------- */
      street: {
        amb: 'wind', dark: .9, plr: 2.8, wall: 'concrete', floor: 'asphalt', fog: .08,
        rows: [
          '############################################',
          '############################################',
          '____________________________________________',
          '____________________________________________',
          '::::::::::::::::::::::::::::::::::::::::::::',
          '============================================',
          '::::::::::::::::::::::::::::::::::::::::::::',
          '____________________________________________',
          'ffffffffffffffffffffffffffffffffffffffffffff',
          'T"TT"TT"T"TTT"TT"TT"T"TTT"TT"TT"TT"T"TT"TT"T'],
        tileOpts: { fenceBase: 'sidewalk', grassC: '#1e2a22', treeC: '#152018' },
        ents: [
          { id: 'hdoor', x: 3, y: 1, spr: 'homedoor', on: S => homeDoorOut(S) },
          { x: 1, y: 1, spr: 'poster', col: '#d8d4c8', on: S => S.narr('楼道口贴着物业通知：「近期夜间请锁好单元门，勿为陌生人开门。」\n下面不知谁添了一句：「也别为熟人开。」') },
          ...WINS.map(([x, kind], i) => ({ id: 'mw' + (i + 1), x, y: 1, spr: 'shopwin', kind, on: S => winOn(S, i) })),
          { x: 30, y: 1, spr: 'atm', on: S => S.narr('自动取款机。屏幕亮着蓝光：「欢迎使用」。\n屏幕的反光里，你的脸是蓝的。') },
          ...LAMPX.map((x, i) => ({ id: 'lamp' + i, x, y: 3, spr: 'streetlamp', light: { r: 3.3, col: 'rgba(215,230,255,.17)', dy: -4 }, on: S => S.narr(['路灯。冷白色的光，照在地上像一层霜。', '这盏灯的灯罩里，积着一层死掉的小飞蛾。', '灯杆上贴满了开锁、通下水道的小广告。', '灯光嗡嗡地响。', '这盏灯底下的地面特别干净，像是有人一直站在这里。', '灯杆被人用粉笔画了一个笑脸。'][i]) })),
          ...STANDERS.map(([id, x]) => ({ id, x, y: 2, spr: '@stander', dir: 3, on: S => standerOn(S, id) })),
          { id: 'missing', x: 16, y: 7, spr: 'sign', col: '#e8e4d0', async on(S) { await S.note('missing'); S.f._r_missing = true; } },
          { x: 11, y: 5, spr: 'manhole', decal: true, solid: false, on: S => S.narr('井盖的缝里冒着白汽。\n底下，好像有很远很远的水声。') },
          { id: 'cat', x: 21, y: 7, spr: 'cat', on: S => S.narr(S.f.phase === 'final' ? '……' : '一只黑猫蹲在栏杆底下，盯着长街的东头。\n它的毛是竖着的。') },
          { id: 'umouth', x: 23, y: 7, spr: 'stairsdown', solid: false, on: S => umouthOn(S) },
          { x: 30, y: 4, spr: 'barrier', on: S => S.narr('「前方施工　车辆绕行」。\n黄黑相间的路障上，红灯一闪一闪。') }, { x: 30, y: 5, spr: 'barrier' }, { x: 30, y: 6, spr: 'barrier' },
          { x: 29, y: 4, spr: 'cone' }, { x: 29, y: 6, spr: 'cone' },
          { x: 34, y: 7, spr: 'busstop', on: S => S.narr('公交站牌。末班车 23:10。首班车 05:30。\n中间这六个多小时，这条街上没有车。') },
          { x: 35, y: 7, w: 2, spr: 'bench', on: S => S.narr('公交站的长椅。冰凉。\n椅背上有人用刀刻了一行小字：「别坐着」。') },
          { x: 40, y: 7, spr: 'barrel', on: S => S.narr('垃圾桶。盖子没盖严，飘出一股馊味。') },
          { x: 9, y: 6, spr: 'puddle', decal: true }, { x: 28, y: 2, spr: 'puddle', decal: true }, { x: 38, y: 5, spr: 'puddle', decal: true },
          ...[2, 3, 4, 5, 6, 7].map(y => ({ x: 43, y, spr: 'invisible', async touch(S) {
            if (S.f.phase === 'final') { S.pos(42, y, 1); return S.think('不能往那边走——他就是从那边来的。'); }
            await S.go('cross', 1, clamp(y + 4, 6, 10), 2);
          } })),
          { id: MAN, x: 40, y: 4, spr: 'smiler', hidden: true, solid: false }
        ],
        async enter(S, first) {
          if (S.f.phase === 'final') { if (S.once('finalIntro')) await finalStart(S); return; }
          if (!first) return;
          S.f.phase = 'walk';
          await S.narr('楼道的声控灯在你身后灭了。\n长街。冷白色的路灯一盏接一盏，一直排到看不见的地方。');
          await S.think('空气是凉的，干净的。整条街只有你的脚步声。\n……这才是凌晨该有的样子。');
          S.goal('往东走走（路的尽头是十字路口）');
          S.cp('walk');
        },
        step(S, x, y) {
          if (S.f.phase === 'walk' && x >= 5 && S.once('standIntro')) return standIntro(S);
          if (S.f.phase === 'final' && y === 7 && x === 23) { S.pos(23, 6, 3); return S.think('不能回到下面去。灯都灭了。'); }
          if (S.f.phase === 'final' && S.f.manOn && x <= 11 && S.once('climax')) return climax(S);
        }
      },
      /* ---------------- 十字路口 ---------------- */
      cross: {
        amb: 'wind', dark: .88, plr: 2.8, wall: 'concrete', floor: 'asphalt', fog: .1,
        rows: [
          '############_:|:_#############',
          '############_:|:_#############',
          '############_:|:_#############',
          '############_:|:_#############',
          '############_:|:_#############',
          '############_:|:_#############',
          '_____________---______________',
          '::::::::::::::::::::--::::::::',
          '====================--========',
          '::::::::::::::::::::--::::::::',
          '_____________---______________',
          '############_:|:_#############',
          '############_:|:_#############',
          '############_:|:_#############',
          '############_:|:_#############',
          '############_:|:_#############'],
        tileOpts: { fenceBase: 'sidewalk' },
        ents: [
          ...[3, 6, 9].map((x, i) => ({ x, y: 5, spr: 'window', on: S => S.narr(['写字楼一楼的窗户，百叶窗拉得严严实实。', '窗玻璃上贴着「旺铺招租」，已经褪成了粉色。', '黑着的窗户里，饮水机的绿灯一亮一亮。'][i]) })),
          { x: 7, y: 6, spr: 'vending', col: '#2a5a9a', light: { r: 1.6, col: 'rgba(200,230,255,.14)' }, on: S => S.narr('自动售货机。所有的饮料下面都亮着红色的「售罄」。\n只有最角落那一格，什么也没摆，却亮着绿灯。') },
          { x: 2, y: 6, spr: 'payphone', on: S => S.narr('街边的公用电话。听筒挂得好好的。\n你经过的时候，它「叮」地轻响了一下，像是要响，又没响。') },
          { id: 'tl1', x: 12, y: 6, spr: 'trafficlight', on: S => S.narr('红绿灯。凌晨只剩黄灯在闪。\n闪。灭。闪。灭。像在数数。') },
          { x: 16, y: 6, spr: 'trafficlight' }, { x: 12, y: 10, spr: 'trafficlight' }, { x: 16, y: 10, spr: 'trafficlight' },
          ...[13, 14, 15].map(x => ({ x, y: 1, spr: 'barrier', on: S => S.narr('北边的路在修，路障一直排到看不见的地方。') })),
          ...[13, 14, 15].map(x => ({ x, y: 14, spr: 'barrier', on: S => S.narr('南边是高架桥底下，黑得什么也看不见。路障拦着。') })),
          ...[20, 21, 23, 24].map(x => ({ x, y: 5, spr: 'storeglass', light: { r: 2.4, col: 'rgba(210,255,230,.2)', dy: 22 }, on: S => S.narr('便利店的玻璃墙。里面的灯白得发亮，货架整整齐齐。\n收银台后面，有个人趴着。') })),
          { id: 'sdoor', x: 22, y: 5, spr: 'storedoor', light: { r: 3.6, col: 'rgba(200,255,220,.24)', dy: 22 }, on: S => storeDoor(S) },
          { x: 26, y: 5, spr: 'poster', col: '#c8d8c0', on: S => S.narr('便利店门口的海报：「关东煮　第二件半价」。\n画上的萝卜都在笑。') },
          { x: 5, y: 10, spr: 'streetlamp', light: { r: 3.2, col: 'rgba(215,230,255,.16)', dy: -4 }, on: S => S.narr('路灯在地上照出一个圆。圆外面，什么都看不清。') },
          { x: 25, y: 10, spr: 'streetlamp', flicker: true, light: { r: 3.2, col: 'rgba(215,230,255,.16)', dy: -4 }, on: S => S.narr('这盏灯接触不良，一闪一闪的。') },
          { x: 9, y: 8, spr: 'puddle', decal: true }, { x: 22, y: 9, spr: 'puddle', decal: true },
          ...[6, 7, 8, 9, 10].map(y => ({ x: 0, y, spr: 'invisible', async touch(S) {
            if (S.f.wStart && !S.f.wDone) { S.pos(1, y, 2); return S.think('她就在旁边……别回头，别往回走。'); }
            await S.go('street', 42, clamp(y - 4, 2, 7), 1);
          } })),
          ...[6, 7, 8, 9, 10].map(y => ({ x: 29, y, spr: 'invisible', async touch(S) { S.pos(28, y, 1); await S.narr('再往东是工地，围挡把整条路都堵死了。'); } })),
          { id: 'woman', x: 14, y: 8, spr: '@woman', hidden: true, solid: false, dir: 0 }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('十字路口。四个方向都是空的。\n红绿灯早就不变色了，只剩黄灯一下一下地闪。');
          await S.think('东北角那家便利店还亮着。二十四小时的。\n……买罐热的喝，然后回家。');
          S.goal('去路口东北角的便利店');
          S.cp('cross');
        },
        step(S, x, y) {
          if (!S.f.wStart && x >= 6) return womanStart(S);
          if (S.f.wStart && !S.f.wDone && !S.f.wKnow) { S.f._wst = (S.f._wst || 0) + 1; if (S.f._wst % 3 === 0) return womanAsk(S); }
        }
      },
      /* ---------------- 二十四小时便利店 ---------------- */
      store: {
        amb: 'room', dark: .18, plr: 3.4, wall: 'plain', floor: 'tile',
        rows: [
          '##################',
          '##################',
          '#++++++++++++++++#',
          '#++++++++++++++++#',
          '#++++++++++++++++#',
          '#++++++++++++++++#',
          '#++++++++++++++++#',
          '#++++++++++++++++#',
          '#++++++++++++++++#',
          '########+#########'],
        tileOpts: { tileC: '#d8dcd4' },
        ents: [
          ...SWX.map((x, i) => ({ id: 'sw' + i, x, y: 1, spr: 'storewin', on: S => swOn(S, i) })),
          { id: 'bdoor', x: 10, y: 1, spr: 'backdoor', on: S => backDoor(S) },
          { id: 'locker', x: 15, y: 2, spr: 'locker', on: S => lockerOn(S) },
          { id: 'convex', x: 16, y: 1, spr: 'convex', on: S => convexOn(S) },
          ...[4, 5, 6].map(y => ({ x: 1, y, spr: 'drinkfridge', on: S => S.narr(['冷柜里的饮料排得整整齐齐，标签全都朝外。', '冷柜的玻璃门上起了一层雾。有人在雾上画过一道弧线——像一张咧开的嘴。', '冷柜嗡嗡地响。最里面那一排，少了一瓶。'][y - 4]) })),
          ...[3, 4, 5].map(x => ({ x, y: 4, spr: 'snackshelf', on: S => S.narr(['薯片、饼干、辣条。包装袋上的卡通人物都在笑。', '货架最下层塞着一个落满灰的手电筒，标价十五块。', '一整排口香糖。有一盒被拆开了，里面空空的。'][x - 3]) })),
          { id: 'bread', x: 3, y: 6, spr: 'breadshelf', on: S => S.narr('面包架。临期的面包贴着黄色的半价标签。') },
          { x: 4, y: 6, spr: 'magrack', on: S => S.narr('杂志架。最上面那本周刊的封面标题：\n「都市失眠人口突破一亿：深夜的城市里都有谁？」') },
          { x: 7, y: 7, spr: 'barrel', col: '#5a6a7a', on: S => S.narr('拖把桶。水是灰的，拖把头上缠着几根长长的黑头发。') },
          { x: 10, y: 5, spr: 'counter', col: '#c8ccc4', on: S => clerkTalk(S) },
          { id: 'counter', x: 11, y: 5, spr: 'counter', col: '#c8ccc4', on: S => clerkTalk(S) },
          { x: 12, y: 5, spr: 'counter', col: '#c8ccc4', on: S => clerkTalk(S) },
          { x: 11, y: 5, spr: 'register', z: 1 },
          { x: 13, y: 4, spr: 'stove', on: S => S.narr('关东煮的锅咕嘟咕嘟地响。汤面上浮着一层油，萝卜都煮透了。') },
          { id: 'clerk', x: 11, y: 4, spr: '@clerk', dir: 0 },
          { x: 14, y: 7, spr: 'box', on: S => S.narr('还没拆的货。纸箱上的送货单写着：「到货时间 03:00　签收人：（空）」。') },
          { x: 5, y: 3, spr: 'invisible', solid: false, light: { r: 4, col: 'rgba(230,255,240,.08)' } },
          { x: 12, y: 7, spr: 'invisible', solid: false, light: { r: 4, col: 'rgba(230,255,240,.08)' } },
          { x: 8, y: 9, spr: 'invisible', touch: S => storeExit(S) }
        ],
        async enter(S, first) {
          if (!first) return;
          S.sfx('chime');
          await S.narr('「欢迎光临——」\n门口的电子提示音响了一声。日光灯白得晃眼，暖气烘在脸上。');
          await S.narr('收银台后面，穿绿马甲的店员趴在台面上睡着了，耳机线垂到地上。');
          S.f.phase = 'store0';
          S.goal('叫醒收银台后面的店员');
        }
      },
      /* ---------------- 后巷 ---------------- */
      lane: {
        amb: 'wind', dark: .93, plr: 2.6, wall: 'concrete', floor: 'concrete',
        rows: [
          '##############################',
          '##############################',
          '#xxxxxxxxxxxxxxxxxxxxxxxxxxxx_',
          '#xxxxxxxxxxxxxxxxxxxxxxxxxxxx_',
          '#xxxxxxxxxxxxxxxxxxxxxxxxxxxx_',
          '##############################'],
        ents: [
          { id: 'ldoor', x: 2, y: 1, spr: 'backdoor', on: S => S.narr('便利店的后门。门从里面锁上了。\n门缝底下透出一线白光，你能听见关东煮锅咕嘟咕嘟的声音。') },
          { id: 'graf', x: 5, y: 1, w: 4, spr: 'graffiti', on: S => grafOn(S) },
          { id: 'pud', x: 6, y: 3, w: 2, spr: 'refpuddle', decal: true, solid: false, on: S => puddleOn(S) },
          { x: 10, y: 1, spr: 'door', col: '#3a3a40', locked: true, on: S => S.narr('别家店的后门，挂着一把生锈的大锁。\n门上用粉笔写着：「凌晨不收货，敲门的不是送货的」。') },
          { x: 12, y: 2, spr: 'barrel', on: S => S.narr('泔水桶。苍蝇都冻僵了。') }, { x: 13, y: 2, spr: 'barrel', on: S => S.narr('另一个泔水桶。盖子上用红漆写着「勿看」。……看什么？') },
          { x: 15, y: 4, spr: 'crate', on: S => S.narr('一摞空啤酒箱。最上面那个箱子里，整整齐齐码着一排空瓶子，瓶口全朝着巷子口。') },
          { x: 17, y: 2, spr: 'box', on: S => S.narr('空调外机，呼呼地往外吐热风。\n这是整条巷子唯一暖和的地方。') },
          { id: 'wnote', x: 19, y: 4, spr: 'note', on: S => noteWalker(S) },
          { id: 'gate', x: 20, y: 2, h: 3, spr: 'gate', on: S => gateOn(S) },
          { id: 'gateO', x: 20, y: 2, h: 3, spr: 'gate', open: true, solid: false, hidden: true, on: S => S.narr('铁门开着，在风里吱呀吱呀地晃。') },
          { x: 23, y: 1, spr: 'tlamp', flicker: true, light: { r: 2.4, col: 'rgba(220,240,230,.12)', dy: 20 } },
          { x: 24, y: 1, spr: 'poster', col: '#2a6a3a', on: S => S.narr('绿色的指示牌：「人行地下通道　↓」。\n牌子底下有人贴了一张小纸条：「夜间关闭」。') },
          { id: 'sdown', x: 26, y: 4, spr: 'stairsdown', solid: false, touch: S => intoTunnel(S), on: S => intoTunnel(S) },
          ...[2, 3, 4].map(y => ({ x: 29, y, spr: 'invisible', async touch(S) { S.pos(28, y, 1); S.sfx('heart'); await S.think('巷子口外面，就是那个路口。\n……他在那里。不能出去。'); } })),
          { id: 'man_l', x: 28, y: 2, spr: 'smiler', hidden: true, solid: false }
        ],
        async enter(S, first) {
          if (!first) return;
          S.sfx('close');
          await S.narr('后门在你身后「咔哒」一声锁上了。\n后巷很窄，又黑，空调外机呼呼地吹着热风，地上全是水。');
          await S.think('店员说，巷子那头有个地下通道，能绕到长街中段……\n得先过那道铁门。');
          S.goal('穿过后巷，去地下通道（铁门挡着路）');
          S.f.phase = 'lane';
          S.cp('lane');
        },
        step(S, x, y) {
          if (y <= 4 && x >= 22 && S.once('passBy')) return manPass(S);
        }
      },
      /* ---------------- 地下通道（原来和后巷画在同一张图上，站在巷子里就能看见底下亮着灯的通道，现在拆开） ---------------- */
      tunnel: {
        amb: 'drone', dark: .9, plr: 2.6, wall: 'tile', floor: 'tile',
        rows: [
          '##############################',
          '##############################',
          '#+++++++++++++++++++++++++++##',
          '#+++++++++++++++++++++++++++##',
          '#+++++++++++++++++++++++++++##',
          '##############################'],
        tileOpts: { tileC: '#8e948a' },
        ents: [
          ...[3, 8, 13, 18, 23].map((x, i) => ({ id: 'tl' + i, x, y: 1, spr: 'tlamp', light: { r: 3, col: 'rgba(220,240,230,.12)', dy: 20 }, on: S => S.narr('通道顶上的灯管，嗡嗡地响，一闪一闪。') })),
          { x: 6, y: 1, spr: 'poster', col: '#8a3a5a', on: S => S.narr('一张十年前的演唱会海报，被人撕掉了一半。\n剩下那一半上，歌手的嘴角被人用圆珠笔一直描到了耳朵。') },
          { x: 16, y: 1, spr: 'poster', col: '#c8c0a8', on: S => S.narr('「人行地下通道　禁止摆摊　禁止留宿」。\n下面，有人在瓷砖上用很小的字写满了：别停　别停　别停　别停……') },
          { x: 11, y: 3, h: 2, spr: 'futon', col: '#5a5444', on: S => S.narr('一卷铺盖，摊在通道墙根。被子还是鼓的。\n……你没有掀开看。') },
          { x: 7, y: 3, spr: 'shoes', col: '#e8e8e2', decal: true, on: S => S.narr(S.f._r_missing ? '一双白色的运动鞋，整整齐齐地摆在墙根，鞋尖朝着出口。\n……寻人启事上写着：离家时穿白色运动鞋。' : '一双白色的运动鞋，整整齐齐地摆在墙根，鞋尖朝着出口。\n左脚那只的鞋带，系的是双结。') },
          { x: 27, y: 3, spr: 'stairsup', solid: false, on: S => S.think('回巷子里去？……不。他刚刚就在巷子口。') },
          { id: 'sup', x: 1, y: 3, spr: 'stairsup', solid: false, touch: S => outTunnel(S), on: S => outTunnel(S) }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('台阶往下，越走越冷。\n通道里的灯管一闪一闪，白瓷砖墙上全是水渍，像一张张哭过的脸。');
          S.goal('穿过地下通道（往西走，尽头的台阶上去就是长街中段）');
        },
        step(S, x, y) {
          if (x <= 16 && S.once('dance')) return tunnelDance(S);
        }
      }
    }
  });

  /* ================= 家 ================= */
  async function homeDoorIn(S) {
    if (S.f.phase === 'home') return lockDoor(S);
    if (!S.has('keys')) { S.sfx('locked'); return S.narr('钥匙还挂在门边的挂钩上。\n不带钥匙出门，回来就只能在楼道里坐到天亮。'); }
    if (!S.f.readPost && S.once('noPost')) await S.think('电脑还亮着……算了，回来再关。');
    S.sfx('open'); await S.go('street', 3, 2, 0);
  }
  async function bedOn(S) {
    if (S.f.phase === 'home') { if (!S.f.locked) return S.narr('门还没锁！'); return dawnEnd(S); }
    if (S.has('keys')) return S.narr('你躺下去，又坐了起来。\n……还是出去走走吧。');
    await S.narr('床单是凉的。你在上面躺了快两个小时，翻了四十多次身。\n闭上眼睛，脑子里就像开着一台停不下来的电视。');
  }
  async function homeFinal(S) {
    S.amb('room');
    await S.narr('你反手关上门，背靠在门板上，大口大口地喘气。\n屋里和你出门时一模一样：凉掉的泡面，没关的电脑，挂钩上空空的。');
    S.goal('把门锁上');
  }
  async function lockDoor(S) {
    const f = S.f, d = S.ent('door');
    if (!f.locked) {
      f.locked = true; d.locked = true; S.sfx('locked'); await S.wait(200); S.sfx('switch');
      await S.narr('咔哒。咔哒。两道锁。\n你又挂上了防盗链——手抖得厉害，挂了三次才挂上。');
      await S.wait(700); S.amb('none');
      rhythm(S, .7, 0, 2); await S.wait(3000);
      await S.narr('门外，楼道里，传来一种很轻的、有节奏的声音。\n嗒。嗒嗒。嗒。');
      await S.narr('楼道的声控灯亮了。\n门缝底下透进来一线光。光里，有两道细长的影子，一抬，一落。一抬，一落。');
      await S.think('……他在门外。\n他在跳舞。');
      S.amb('room');
      S.goal('天亮之前，别开门（上床去）');
      S.cp('locked');
      return;
    }
    if (f.peeped) return S.narr('门外的节拍还在。\n你不敢再看第二次。');
    rhythm(S, .6);
    const r = await choose(S, '门外的声音还在。嗒。嗒嗒。嗒。', ['（凑到猫眼上，看一眼）', '（不看。离门远一点）'], { safe: 1, split: '你往猫眼凑过去——又硬生生地停住了。\n别看。你退开了。' });
    if (r === 1) return S.narr('你退开了。\n门外的节拍，一下也没有乱。');
    f.peeped = true;
    await S.narr('你屏住呼吸，把眼睛凑到猫眼上。\n楼道的灯是亮的。楼道是空的。');
    await S.wait(900);
    await S.narr('……不对。猫眼的正下方，有一缕头发。\n有人蹲在你家门口。现在，他正慢慢地、慢慢地站起来。');
    await S.scare('face', { spr: '@grin', dur: 1.2 });
    await S.narr('一只眼睛，贴在猫眼的另一边。\n眼睛下面，是一张一直咧到耳根的嘴。\n这是他第一次，正正地看着你。');
    const r2 = await choose(S, '他在等。', ['（死死捂住自己的嘴，退回床边）', '（对他笑一下）'], { safe: 0, split: '你的嘴角抽了一下——又被你用手死死按住了。' });
    if (r2 === 1) return badDoor(S);
    S.sfx('heart');
    await S.narr('你用两只手捂住嘴，一步一步退到床边。\n猫眼后面那张脸停了很久，很久。然后，节拍声又响了起来。');
    S.goal('上床去，等天亮');
  }
  async function badDoor(S) {
    await S.narr('你没忍住。\n你的嘴角，自己往上动了一下。');
    S.sfx('laugh');
    await S.narr('猫眼另一边，那只眼睛弯了起来。\n然后你听见，门锁——从外面——「咔哒」一声，开了。');
    await S.fade(1, 1200);
    return S.end({ bad: true, id: 'door', title: '猫眼', text: '第二天中午，物业来敲门，没有人应。\n\n门没有锁，防盗链好好地挂着。屋里的东西一样不少，电脑还开着，停在一个论坛帖子上。\n\n帖子最下面多了一条新回复，回复人是你：\n「千万别对他笑。」' });
  }
  async function dawnEnd(S) {
    await S.narr('你和衣躺下，把被子拉过头顶。\n门外那个声音，一直响到窗帘缝里透进灰白色的光。');
    await S.fade(1, 1400);
    S.amb('none');
    await S.card('早上六点十二分', '', '天亮了。\n楼下早点摊的鼓风机呼呼地响，送奶的电动车滴滴地叫。\n\n你打开门。楼道里空空的。\n门口的地砖上，有一串细长的鞋印。\n鞋尖朝外，一步一转，像一支刚刚跳完的舞。');
    if (S.f.replied) return S.end({ id: 'reply', title: '第六夜　完　·　补完的那句话', text: '从那以后，你再也没有在夜里出过门。\n\n那个帖子你一直收着。每隔一阵，下面就会多出一条新回复，都是凌晨两三点发的，回复的人都不一样，说的都是同一句话：\n「千万别对他笑。」\n\n楼主再也没有出现过。\n可你知道，这座城里，还有人在夜里走。' });
    await S.end({ id: 'home', title: '第六夜　完', text: '从那以后，你再也没有在夜里出过门。\n\n失眠还是会来。睡不着的时候，你就坐在床上，看着窗帘。\n窗帘外面那条长街，路灯一盏一盏地亮着，一直亮到看不见的地方。\n\n你从来没有拉开过它。' });
  }
  async function pcReply(S) {   // 隐藏结局：回到家以后，把帖子里那句「千万别——」补完
    const f = S.f, pc = S.ent('pc');
    if (pc.s.off) return S.narr('显示器黑着。黑玻璃里映出你自己的脸——嘴角是往下撇的。很好。');
    if (!f.locked) return S.narr('电脑还亮着。……先把门锁上。');
    await S.narr('显示器还亮着。论坛那个帖子还开着，停在楼主的最后一句：\n「还有，千万别——」\n下面一排「楼主？」「楼主？」。');
    const r = await choose(S, '你的手放在键盘上。', ['（把那句话补完，发出去）', '（关掉显示器）'], { safe: 1, split: '你的手指在键盘上停了很久。\n……算了。你按灭了显示器。' });
    if (r === 1) { pc.s.off = 1; return S.narr('你把显示器关了。\n屏幕黑下去的那一瞬，你在玻璃里看见自己的脸——嘴角是往下撇的。很好。'); }
    S.sfx('blip'); await S.wait(200); S.sfx('blip');
    await S.narr('你打了几个字：\n「千万别对他笑。」\n按下发送。');
    await S.wait(600); S.sfx('ding');
    await S.narr('页面刷新了一下。你的回复下面，立刻多了一条。\n回复人：楼主。');
    await S.say('楼主', '你也看见他了？', { style: 'whisper' });
    S.amb('none'); await S.wait(500); rhythm(S, 1.3);
    await S.narr('门外的节拍声，停了一下。\n……又响了起来。比刚才近，像是贴着门板在跳。');
    f.replied = true; pc.s.off = 1;
    S.amb('room');
    await S.think('……关掉。睡觉。天亮就好了。');
  }

  /* ================= 长街：第一次散步 ================= */
  const WDESC = [
    '面包店。橱窗里的托盘空空的，只剩几粒芝麻。',
    '婚纱店。橱窗里的模特穿着白纱，没有头。',
    '眼镜店。一排排的镜片在黑暗里反着光，像很多只眼睛。',
    '手机店。展示机的屏幕都黑着，每一块黑屏里，都有一个小小的你。',
    '书店。橱窗正中摆着一本畅销书：《如何在二十分钟内入睡》。',
    '电器行。两台电视并排摆着，屏幕灰蒙蒙的，像两只没睡醒的眼睛。',
    '药店。绿十字灯箱关了。门上贴着「夜间售药请按铃」，门铃被人用胶布封住了。',
    '一家倒闭的店。玻璃上糊满了旧报纸，有一条标题被人用红笔圈了出来：「深夜散步男子失踪」。',
    '银行。卷帘门拉下了一半，里面的自助区亮着惨白的光。',
    '另一家眼镜店。验光机屏幕上那座小红房子，在黑暗里一直亮着。',
    '空店铺。玻璃上用白漆写着「转让」，电话号码被人刮掉了。'];
  async function winOn(S, i) {
    const f = S.f, p = W.pl;
    if (f.phase === 'final') {
      const m = S.ent(MAN), [mx, my] = tileOf(m), d = Math.round(Math.hypot(mx - p.x, my - p.y));
      S.sfx('heart');
      const how = { crouch: '\n他蹲着。仰着脸，在笑。', tiptoe: '\n他踮着脚，弓着背，两只手缩在胸前——像动画片里偷偷摸过来的坏人。' }[m.s.mode] || (d <= 3 ? '\n他在笑。' : '');
      return S.narr(m.hidden || d > 9 ? '玻璃里，只有你自己，和身后一长串路灯。\n……他在哪儿？' : `玻璃里，你的身后，那个细长的影子——\n大概还有 ${d} 步。${how}`);
    }
    const st = STANDERS.find(([, x]) => Math.abs(x - p.x) <= 4);
    if (st && !S.ent(st[0]).hidden && S.once('reflSt')) {
      await S.narr(WDESC[i]);
      S.sfx('sting');
      await S.narr('……玻璃里，映着你身后那个站在路灯底下的人。\n倒影里，它的脸，正对着你。');
      await S.think('可它明明是背对着我站的。\n……别停。走。');
      return;
    }
    await S.narr(WDESC[i]);
  }
  async function homeDoorOut(S) {
    const f = S.f;
    if (f.phase !== 'final') return S.narr('你家那栋楼的单元门。六楼的窗户黑着——那是你自己的。\n……再走一会儿吧。反正回去也睡不着。');
    const r = await S.ask('钥匙串在手里哗啦啦地抖。哪一把是单元门的？', ['方头的铜钥匙', '贴着蓝胶布的', '缠着黑胶布的银色长钥匙', '小小的那把']);
    if (r !== 0) {
      S.sfx('locked'); f.wrong = (f.wrong || 0) + 1;
      const m = S.ent(MAN), p = W.pl, [mx] = tileOf(m), want = Math.max(1, 5 - f.wrong * 2);
      if (!m.hidden && mx - p.x > want) { const y = [2, 4, 5].find(yy => passable(curMap(), p.x + want, yy, m)) ?? 4; S.place(MAN, p.x + want, y, 1); }
      if (want <= 1) { await S.narr('插不进去——又不是这把！'); return faceToFace(S); }
      await S.narr(`插不进去——不是这把！\n单元门的玻璃上，映出一个细长的影子。……离你只有 ${want} 步。`);
      return;
    }
    f.manOn = false; f._sprint = false;
    S.sfx('open'); S.ent('hdoor').lit = true;
    await S.narr('方头的铜钥匙「咔」地拧开了锁。门禁的小灯跳成了绿色。\n你闪身进门，用后背把门死死顶住。门上的玻璃里——没有人。');
    S.hide(MAN);
    await S.fade(1, 600);
    await S.card('', '', '六楼。\n你一步两级台阶往上跑，声控灯一层一层在你脚下亮起来，\n又一层一层，在你身后灭掉。\n\n你没有回头看。');
    f.phase = 'home';
    await S.go('home', 10, 2, 0);
  }
  async function umouthOn(S) {
    if (S.f.phase === 'final') return S.think('不能回去。下面的灯都灭了。');
    await S.narr('地下通道的入口。台阶往下，一片漆黑。\n下面传来很远很远的滴水声。');
    await S.think('……白天走过很多次。晚上，还是算了。');
  }

  /* ---------- 站着的人：别停下 ---------- */
  function resetStanders(S) {
    for (const [id] of STANDERS) { const e = S.ent(id); if (!e) continue; e.dir = 3; e.s.turn = 0; S.f['_m_' + id] = 0; }
  }
  async function standIntro(S) {
    S.sfx('heart'); S.focus(8, 2);
    await S.narr('前面那盏路灯底下，站着一个人。\n灰衣服，脸贴着墙，一动不动。');
    S.focus(null);
    await S.think('……喝醉了？还是在等人？\n凌晨三点，脸朝着墙，等什么人？');
    await S.think('论坛上有人说过：「不跳舞，就站在路灯底下，脸朝着墙。」\n那个人还说，从它旁边过的时候——别停下。');
    S.goal('往东走。经过站着的人时，别停下');
  }
  function standerTick(S, dt) {
    const p = W.pl, f = S.f, moved = movedTile(S, '_stp') || S.moving;   // S.moving：客机操作时主机上的 p.mv 是空的，不能用
    for (const [id] of STANDERS) {
      const e = S.ent(id); if (!e || e.hidden) continue;
      const [ex, ey] = tileOf(e), d = Math.abs(ex - p.x) + Math.abs(ey - p.y), k = '_m_' + id;
      let v = f[k] || 0;
      if (d <= 3 && !moved) v += dt; else v = Math.max(0, v - dt * (moved ? 3 : 1.5));
      f[k] = v;
      if (v > 1.1 && !e.s.turn) { e.s.turn = 1; S.face(id, 'pl'); S.sfx('whisper'); S.bubble(id, '…', 900); S.toast('……它的头，慢慢转过来了。别停！'); }
      else if (v < .3 && e.s.turn) { e.s.turn = 0; e.dir = 3; }
      if (v > 2.6) { f[k] = 0; runScript(S2 => standerCaught(S2, id)); return; }
    }
  }
  async function standerOn(S, id) {
    S.f['_m_' + id] = Math.max(S.f['_m_' + id] || 0, 1.6);
    await S.narr('你在它背后站住了。\n它没有动。你能听见它在呼吸——很慢，很深，像是在闻什么。');
    await S.think('……别停。别停下！');
  }
  async function standerCaught(S, id) {
    const e = S.ent(id); S.face(id, 'pl'); e.s.turn = 1;
    S.sfx('sting');
    await S.narr('它转过身来了。');
    await S.scare('face', { spr: '@stander', dur: 1 });
    await S.die('它没有脸。\n可你知道，它在看你。\n\n「……你停下来了。」', '你停下了');
  }

  /* ================= 长街：回家（最终段） ================= */
  function resetMan(S) {
    const f = S.f, m = S.ent(MAN);
    S.place(MAN, 34, 4, 1); m.alpha = 1; m.mv = null;
    Object.assign(m.s, { mode: 'dance', look: 0, eye: 0, spin: 0 });
    Object.assign(f, { manOn: true, _mt: 1.2, _still: 0, _stare: 0, _lurch: 0, _tp: 2.5, _crouch: 0, _tip: 0, _sprint: false });
    for (const [id] of STANDERS) S.hide(id);
    S.hide('cat');
    WINS.forEach((w, i) => { const e = S.ent('mw' + (i + 1)); e.s.refl = 0; });
    S.dark(.95); S.plr(2.4); S.amb('wind');
  }
  async function finalStart(S) {
    const f = S.f;
    for (const [id] of STANDERS) S.hide(id);
    S.hide('cat'); S.dark(.95); S.plr(2.4); S.amb('none');
    await S.narr('台阶的尽头，是长街。\n你认得这里——往西再走二十来步，就是你家楼下。');
    rhythm(S, .55); await S.wait(1300);
    const m = S.ent(MAN); S.place(MAN, 34, 4, 1); m.alpha = 1; Object.assign(m.s, { mode: 'dance', look: 0, eye: 0 });
    S.focus(33, 4);
    await S.narr('嗒。嗒嗒。嗒。\n东边，路灯底下——');
    await S.wait(700);
    await S.narr('他在那里。\n转一圈，再往前大大地迈一步。一下，一下，朝这边来了。\n他的脸仰着，看着天。他在笑。');
    S.focus(null);
    await S.think('别停下。别回头看他。\n想知道他离我多远……就贴着橱窗走，看玻璃。');
    f.caught = 0; f.wrong = 0;
    resetMan(S);
    S.goal(GOAL_FINAL);
    S.toast('贴着北边的橱窗走，玻璃里映得出身后');
    S.cp('final');
  }
  function manTick(S, dt) {
    const f = S.f; if (!f.manOn) return;
    const m = S.ent(MAN), p = W.pl; if (!m || m.hidden) return;
    const [mx, my] = tileOf(m), dist = Math.hypot(mx - p.x, my - p.y);
    WINS.forEach(([wx], i) => {   // 橱窗倒影
      const w = S.ent('mw' + (i + 1)), near = p.y <= 3 && Math.abs(p.x - wx) <= 1;
      setS(w, 'refl', near && dist < 10 ? Math.max(1, Math.round(dist)) : 0); setS(w, 'rx', clamp(Math.round((mx - wx) / 2), -4, 4));
    });
    setS(m, 'eye', Math.round(clamp(1 - (dist - 2) / 7, 0, 1) * 10) / 10);
    if (Math.abs(m.px - p.px) + Math.abs(m.py - p.py) < 14) { f.manOn = false; runScript(S2 => faceToFace(S2)); return; }
    if (looking(p, mx, my, 7)) {   // 回头看他
      f._stare = (f._stare || 0) + dt; if (!m.s.look) { m.s.look = 1; S.sfx('sting'); }
      if (f._stare > .8) { f._stare = 0; f.manOn = false; runScript(S2 => faceToFace(S2, true)); return; }
    } else { f._stare = Math.max(0, (f._stare || 0) - dt); if (m.s.look && f._stare <= 0) m.s.look = 0; }
    const moved = movedTile(S, '_fp') || S.moving;   // 停下（S.moving 在客机操作时也准）
    if (!moved) f._still = (f._still || 0) + dt; else f._still = 0;
    if (f._still > 1.3 && !(f._lurch > 0) && !f._sprint) { f._lurch = 2.2; heel(S, 0, 1.3); S.shake(200, 1); setS(m, 'mode', 'tiptoe'); }
    if (f._lurch > 0) { f._lurch -= dt; if (f._lurch <= 0 && !(f._tip > 0)) setS(m, 'mode', 'dance'); }
    if (f._crouch > 0) {   // 刚出现在你身后：先蹲着
      f._crouch -= dt; if (f._crouch > 0) return;
      setS(m, 'mode', 'tiptoe'); f._tip = 1.8;
    }
    if (f._tip > 0) { f._tip -= dt; if (f._tip <= 0 && !(f._lurch > 0)) setS(m, 'mode', 'dance'); }
    f._tp = (f._tp ?? 3) - dt;   // 落得太远：你一不注意，他就蹲在你身后那盏路灯底下了
    if (f._tp <= 0 && !m.mv && !f._sprint) {
      const L = LAMPX.filter(x => x > p.x + 4 && x <= p.x + 8 && x < mx - 2)[0];
      if (dist > 8.5 && L != null && passable(curMap(), L, 4, m)) {
        S.place(MAN, L, 4, 1); m.alpha = .15; setS(m, 'mode', 'crouch'); setS(m, 'spin', 0); f._crouch = .8; f._tp = 4.5; f._mt = 0;
        if (S.once('crouchHint')) S.toast('……身后，路灯底下，好像蹲着一个人');
      } else f._tp = 1.2;
    }
    if (m.alpha < 1) m.alpha = Math.min(1, m.alpha + dt * 1.6);
    if (m.mv) return;
    f._mt = (f._mt || 0) - dt; if (f._mt > 0) return;
    const d = bfsStep(curMap(), mx, my, p.x, p.y, m); if (d < 0) { f._mt = .3; return; }
    const sneak = f._lurch > 0 || f._tip > 0;
    f._mb = ((f._mb || 0) + 1) % 5;
    const spd = f._sprint ? 6.3 : sneak ? 5.6 : [5.0, 5.2, 3.4, 2.0, 4.6][f._mb];
    setS(m, 'spin', !f._sprint && !sneak && f._mb === 3 ? 1 : 0);
    startMove(m, d, spd); m.dir = d; f._mt = !f._sprint && !sneak && f._mb === 3 ? .6 : 0;
    if (f._sprint) heel(S, 0, .9);   // 跑起来的鞋跟声
    else if (!sneak && f._mb !== 2 && dist < 9) heel(S, 0, .35 + (9 - dist) / 14);   // 踮脚的时候没有声音
  }
  async function climax(S) {   // 原帖的结尾：停在一辆车远的地方 → 呜咽 → 他跳着走开 → 突然掉头跑回来
    const f = S.f, m = S.ent(MAN), p = W.pl, map = curMap();
    f.manOn = false; m.mv = null; S.amb('none');
    let sx = Math.min(42, p.x + 5), sy = 4;
    for (const y of [p.y, 4, 5, 3, 6, 2, 7]) if (passable(map, sx, y, m)) { sy = y; break; }
    S.place(MAN, sx, sy, 1); m.alpha = 1; Object.assign(m.s, { mode: 'stand', look: 0, eye: 0, spin: 0 });
    heel(S, 0, 1.4); await S.wait(500);
    await S.narr('嗒。\n节拍声停了。就停在你身后。');
    S.focus(sx, sy);
    await S.narr('你没有回头。可余光里看得见——他就站在那儿，隔着大概一辆车那么远。\n脸仰着，看着天。还在笑。');
    const r = await choose(S, '你的喉咙发紧。', ['（冲他吼：「你到底想干什么！」）', '（咬紧牙，什么也不说）'], { safe: 1, split: '你张开嘴——又闭上了。' });
    if (r === 0) { whimper(S); await S.narr('你张开嘴，想冲他吼。\n出来的却是一声很小、很难听的呜咽。\n他好像根本没听见。'); }
    else await S.narr('你咬着牙。上下牙在打架。');
    m.s.mode = 'dance'; rhythm(S, .8);
    await S.narr('他转过身去，一条腿抬得高高的——\n跳着舞，往东边走远了。');
    await S.walk(MAN, [Math.min(42, sx + 5), sy], 2.6);
    S.focus(null);
    await S.wait(500);
    await S.think('……走了？');
    S.sfx('sting'); S.shake(350, 2);
    return sprintStart(S);
  }
  async function sprintStart(S, resumed) {
    const f = S.f, m = S.ent(MAN), p = W.pl;
    if (resumed) {
      resetMan(S); f.caught = 0; f.wrong = 0;
      let y = 4; for (const yy of [p.y, 4, 5, 3, 6]) if (passable(curMap(), Math.min(42, p.x + 9), yy, m)) { y = yy; break; }
      S.place(MAN, Math.min(42, p.x + 9), y, 1);
    }
    f.manOn = false;
    Object.assign(m.s, { mode: 'tiptoe', look: 0, eye: 0, spin: 0 }); m.dir = 1;
    if (!resumed) S.cp('sprint');
    await S.narr(resumed ? '他朝你跑过来了——' : '他突然停住，整个人一扭，掉过头来——\n朝你跑了过来。');
    Object.assign(f, { manOn: true, _sprint: true, _mt: .2, _still: 0, _stare: 0, _lurch: 0, _tp: 99, _crouch: 0, _tip: 0 });
    S.amb('wind');
    S.goal('跑！回单元门！');
  }
  async function faceToFace(S, stared) {
    const f = S.f, m = S.ent(MAN), p = W.pl;
    f.manOn = false; m.mv = null;
    const sp = passable(curMap(), p.x + 1, p.y, m) ? [p.x + 1, p.y] : (adjFree(S, p.x, p.y, m) || [p.x + 1, p.y]);
    S.place(MAN, sp[0], sp[1], 1);
    S.amb('none'); S.sfx('heart');
    Object.assign(m.s, { mode: 'lean', look: 1, spin: 0 });
    if (stared) await S.narr('你没忍住，回头看了他一眼。\n就一眼。\n他也正好在那一刻，第一次，低下头看向你。');
    await S.narr('他停下来了。\n停在离你不到一臂远的地方，慢慢地弯下腰，把脸凑到和你一样高。');
    await S.scare('face', { spr: '@grin', dur: 1.1, sfx: 'sting' });
    await S.narr('那个笑容就在你眼前。嘴角咧开，一直咧到脸的外面去。\n他没有呼吸。他在等。');
    const r = await choose(S, '他在等你做点什么。', ['（低下头，盯着自己的鞋尖）', '（对他笑一下）'], { safe: 0, split: '你的嘴角抽了一下——又被你死死咬住了。\n你低下头，盯着鞋尖。' });
    if (r === 1) return badSmile(S);
    f.caught = (f.caught || 0) + 1;
    if (f.caught >= 3) {
      await S.narr('你又低下了头……\n这一次，他没有退开。一只冰凉的手，轻轻托起了你的下巴。');
      return S.die('「笑一个嘛。」\n\n天亮以后，早点摊的老板说，凌晨看见两个人手拉着手，在长街正中间跳舞。', '他不肯走了');
    }
    await S.narr(f.caught === 1 ? '你盯着自己的鞋尖。一秒。两秒。十秒。\n耳边传来一声很轻的「咯」——像关节错了位。' : '你又低下了头。\n他「咯、咯」地扭了扭脖子，像是有点不耐烦了。');
    Object.assign(m.s, { mode: f._sprint ? 'tiptoe' : 'dance', look: 0 });
    await S.alpha(MAN, 0, 400);
    let bx = null, by = 4;
    for (const dx of [7, 8, 9, 6]) { for (const y of [4, 5, 6, 2, 7]) if (passable(curMap(), p.x + dx, y, m)) { bx = p.x + dx; by = y; break; } if (bx != null) break; }
    S.place(MAN, bx ?? Math.min(42, p.x + 7), by, 1); m.alpha = 0; await S.alpha(MAN, 1, 400);
    S.amb('wind');
    await S.think(f.caught === 1 ? '……他退开了。可他没有走。\n别停下。别看他。回家。' : '下一次……他不会再退了。');
    Object.assign(f, { manOn: true, _still: 0, _stare: 0, _lurch: 0, _mt: 1.2, _tp: f._sprint ? 99 : 3, _crouch: 0, _tip: 0 });
    S.goal(f._sprint ? '跑！回单元门！' : GOAL_FINAL);
  }
  async function badSmile(S) {
    await S.narr('你的嘴角，自己动了一下。\n就那么一下。');
    S.sfx('laugh');
    await S.narr('他的笑容，更大了。\n他直起腰，向你伸出一只手——像在邀请你跳一支舞。');
    await S.fade(1, 1200);
    return S.end({ bad: true, id: 'street', title: '你对他笑了', text: '早上五点半，第一班公交车开过长街。\n司机后来跟人说，那天他看见路中间有两个人在跳舞。\n一个很高，一个矮一点。\n两个人，都在笑。\n\n……他没敢停车。' });
  }

  /* ================= 十字路口：问时间的女人（别回答） ================= */
  const WQ = [
    ['「……现在几点了？」', ['（不出声，继续走）', '「三点多了。」'], 0],
    ['「你也睡不着，对不对？」', ['「……嗯。」', '（看着前面，不出声）'], 1],
    ['「你看得见我吧？」', ['（不出声，继续走）', '「……看得见。」'], 0]];
  async function womanStart(S) {
    const f = S.f; f.wStart = true; f._wst = 0; f.wq = 0;
    S.amb('none'); S.sfx('heart');
    const w = S.ent('woman'); S.place('woman', 14, 8, 1); w.alpha = 0; w.spr = '@woman';
    S.focus(14, 8);
    await S.alpha('woman', 1, 1000);
    await S.narr('路口正中间，黄灯底下，站着一个女人。\n灰色的长大衣，头发很长。她背对着你，像是在等红绿灯——可红绿灯早就不变色了。');
    S.focus(null);
    await S.think('……凌晨三点，一个人站在马路中间。\n帖子底下有人说过：「问你几点了的那种才吓人。别回答。」');
    const p = W.pl, spot = adjFree(S, p.x, p.y, w) || [p.x - 1, p.y];
    await S.walk('woman', spot, 2.6);
    S.face('woman', 'pl');
    await S.narr('她朝你走了过来，走到你身边，停下。\n然后和你并排，一步一步，跟着你走。');
    S.follow('woman', true);
    S.amb('wind');
    S.goal('去便利店。她问什么，都别回答');
  }
  async function womanAsk(S) {
    const f = S.f, q = WQ[f.wq || 0]; if (!q) return;
    S.sfx('whisper'); S.bubble('woman', '…', 1200);
    const r = await choose(S, q[0], q[1], { who: '女人', style: 'whisper', safe: q[2], split: '话已经到了嘴边——你又把它咽了回去。\n她的头歪得更厉害了。' });
    if (r !== q[2]) return womanKnows(S, q[1][r]);
    f.wq = (f.wq || 0) + 1;
    if (f.wq === 1) await S.narr('你盯着前面的路，一个字也没说。\n她歪着头看了你一会儿，又跟了上来。');
    else if (f.wq === 2) await S.narr('她靠得更近了。你能闻到她大衣上的味道——像被雨泡过的旧报纸。');
    else return womanLeave(S);
  }
  async function womanKnows(S, said) {
    const f = S.f; f.wKnow = true; S.follow('woman', false);
    await S.say('你', said.replace(/[「」]/g, ''));
    await S.narr('话一出口，你就知道错了。');
    const w = S.ent('woman'); w.spr = '@woman2'; S.face('woman', 'pl');
    await S.scare('face', { spr: '@woman2', dur: .9 });
    await S.say('女人', '……原来你是人啊。', { style: 'big' });
    const p = W.pl, m = curMap();
    const c = [[p.x - 3, p.y], [p.x - 2, p.y], [p.x, p.y + 2], [p.x + 3, p.y], [p.x - 1, p.y]].find(([x, y]) => passable(m, x, y, w)) || [p.x - 2, p.y];
    S.place('woman', c[0], c[1]); S.face('woman', 'pl');
    S.chase('woman', { spd: 2.8, wait: .7, catch: womanCaught });
    S.amb('wind'); S.goal('跑！躲进便利店！');
  }
  async function womanCaught(S) {
    await S.scare('face', { spr: '@woman2', dur: 1 });
    await S.die('冰凉的手指扣住了你的手腕。\n「陪我走走吧。」她说。「天亮之前，我们一直走。一直走。」', '你回答了她');
  }
  async function womanLeave(S) {
    S.f.wDone = true; S.follow('woman', false);
    await S.say('女人', '……原来不是啊。', { style: 'whisper' });
    await S.narr('她停下了。\n你没有回头，可你听见她的脚步慢慢转了个方向，往南边那片黑里去了。');
    await S.alpha('woman', 0, 900);
    S.goal('去路口东北角的便利店');
  }
  async function storeDoor(S) {
    const f = S.f;
    if (f.wStart && !f.wDone) {
      S.stop('woman'); S.follow('woman', false); f.wDone = true;
      if (!f.wKnow) await S.narr('她在店门口的光外面停下了。\n……没有跟进来。');
      S.hide('woman');
    }
    S.sfx('open'); await S.go('store', 8, 8, 3);
  }

  /* ================= 便利店：窗上的脸（别对视） ================= */
  function setFace(S, n) {
    SWX.forEach((x, i) => { const e = S.ent('sw' + i); e.face = i === n ? 1 : null; e.s.knock = 0; });
    S.f.fw = n; S.ent('convex').s.fi = n;
  }
  function storeTick(S, dt) {
    const f = S.f; f._fwT = (f._fwT ?? 6) - dt;   // 只在玩家能动的时候计时；换窗时玻璃轻轻「嗒」一声
    const p = W.pl;
    if (f._fwT <= 0) {   // 它喜欢挪到离你最近的那扇窗外面（六成），其余时候随便换一扇
      f._fwT = 5 + Math.random() * 3;
      const near = SWX.reduce((b, x, i) => Math.abs(x - p.x) < Math.abs(SWX[b] - p.x) ? i : b, 0);
      let n = Math.random() < .6 ? near : (Math.random() * 5) | 0;
      if (n === f.fw) n = (n + 1 + ((Math.random() * 4) | 0)) % 5;
      setFace(S, n); glassTap(S, .6);
    }
    const wx = SWX[f.fw ?? 0];
    if (p.dir === 3 && p.y <= 3 && Math.abs(p.x - wx) <= 2) {
      f._ws2 = (f._ws2 || 0) + dt;
      if (f._ws2 > .55 && !f._wsWarn) { f._wsWarn = 1; glassTap(S, 1.4); S.sfx('heart'); S.toast('头顶的玻璃「嗒」地响了一下……别抬头！'); }
      if (f._ws2 > 1.4) { f._ws2 = 0; f._wsWarn = 0; runScript(windowStare); }
    } else { f._ws2 = Math.max(0, (f._ws2 || 0) - dt * 2); if (f._ws2 <= 0) f._wsWarn = 0; }
  }
  async function windowStare(S) {
    const f = S.f, e = S.ent('sw' + f.fw);
    f.ws = (f.ws || 0) + 1; e.s.knock = 1; S.sfx('knock'); glassTap(S, 2); S.shake(300, 3); S.fx('flash');
    await S.wait(300);
    if (f.ws === 1) await S.narr(`你抬眼的一瞬间，窗外那张脸「咚」地贴上了玻璃。\n${f.wKnow ? '是路口那个女人。' : '一张灰白的、光秃秃的脸。'}它在笑。它知道你看见它了。`);
    else if (f.ws === 2) { await S.narr('咚。咚。\n玻璃上，裂开了一道白色的细纹。'); await S.say('小柯', '别看……求你了，别再看了！', { style: 'whisper' }); }
    else {
      await S.scare('face', { spr: f.wKnow ? '@woman2' : '@pale', dur: 1 });
      return S.die('窗户碎了。\n冷风灌进来的时候，有个声音贴着你的耳朵说：\n「看见了。」', '你和它对视了');
    }
    e.s.knock = 0; setFace(S, (f.fw + 2) % 5); f._fwT = 6;
  }
  async function swOn(S, i) {
    if (S.f.phase === 'store1') { if (S.f.fw === i) return windowStare(S); return S.narr('黑漆漆的玻璃，只映出店里的日光灯，和你自己。\n……这一扇外面，什么也没有。'); }
    return S.narr(['窗外是后巷，黑的。玻璃上映出货架，和你。', '玻璃上贴着「本店 24 小时营业」，从里面看，字是反的。', '玻璃上有一个手掌印。\n……印在外面。', '窗台上躺着一只死飞蛾，翅膀还在微微地颤。', '窗外，后巷里的一根灯管一闪一闪。'][i]);
  }
  async function clerkTalk(S) {
    const f = S.f;
    S.face('clerk', 0);
    if (f.phase === 'store0') {
      if (f.woke) return S.say('小柯', '……别回头。看那面镜子。墙角那面。', { style: 'whisper' });
      f.woke = true; S.sfx('knock');
      await S.narr('你敲了敲收银台。');
      S.bubble('clerk', '!', 900);
      await S.say('店员', '——啊！……吓死我了。这个点还有人来啊。');
      await S.narr('他二十出头，眼睛熬得通红。胸口的名牌上写着：「夜班　小柯」。');
      if (f.wKnow) await S.say('小柯', ['……刚才门口那个女的，一直跟着你？', '你跟她说话了？……完了。完了完了。']);
      else if ((f.wq || 0) >= 3) await S.say('小柯', '刚才路口那个女的……你没理她吧？没理就好。没理就好。');
      else await S.say('小柯', '……你从长街那边过来的？一个人？');
      await S.say('小柯', '你别笑我。这家店的夜班有规矩，前面的人一条一条传下来的。……你自己看吧。');
      await S.narr('他从收银台底下抽出一本卷了边的交接本，翻到最后一页，推到你面前。');
      await S.note('rules');
      S.give('milk');
      await S.say('小柯', '热牛奶，算我请的。喝完赶紧回家。——等一下。');
      S.bubble('clerk', '…', 1600);
      await S.narr('他的眼睛越过你的肩膀，看向你身后的玻璃门。\n脸一点一点地白了。');
      await S.say('小柯', '别回头。……看镜子。墙角那面凸面镜。', { style: 'whisper' });
      S.goal('别回头。看墙角的凸面镜');
      return;
    }
    if (S.has('bkey')) return S.say('小柯', ['钥匙拿到了？走后门。出去往右，铁门那头就是地下通道。', '……用完记得挂回来啊。我开玩笑的。你别回来了。'], { style: 'whisper' });
    await S.say('小柯', ['员工柜在右边墙角。后门钥匙挂在里面。我不能离开收银台……对不起。', '别抬头看窗户。要看，就看镜子。'], { style: 'whisper' });
    if (S.coop) await S.say('小柯', '你们两个人？那好——一个盯着镜子报位置，一个去拿钥匙。', { style: 'whisper' });
    else await S.say('小柯', '走之前先看一眼镜子：它贴在哪扇窗外面，就别在那扇窗底下抬头。', { style: 'whisper' });
  }
  async function convexOn(S) {
    const f = S.f, e = S.ent('convex');
    if (f.phase === 'store0' && f.woke) {
      S.amb('none'); e.s.man = 1;
      await S.narr('凸面镜把整间店缩成了一只鱼眼。镜子的下沿，是店门的玻璃。\n玻璃外面，那个十字路口，黄灯底下，站着一个人。');
      rhythm(S, .5); await S.wait(1200);
      await S.narr('很高。很瘦。穿着旧西装。他在跳舞——转一圈，再往前大大地迈一步，脸仰着看天。\n镜子太小，看不清他的脸。可你看得清他在笑。');
      await S.say('小柯', ['他每隔一阵子就来一次。他不进来，从来不进来。……可他看见你进来了。', '别走正门。后门出去是后巷，巷子那头有地下通道，能通到长街中段。后门钥匙在员工柜里，右边墙角。'], { style: 'whisper' });
      f.phase = 'store1'; f.ws = 0; f._fwT = 3.5; f._ws2 = 0; f._wsWarn = 0; setFace(S, 1);
      S.sfx('knock'); glassTap(S, 1.5); S.shake(300, 2);
      await S.narr('「咚。」\n左边的窗户上，有什么东西轻轻碰了一下玻璃。');
      await S.say('小柯', '……来了。别抬头看窗户。想知道它贴在哪扇窗外面，就看这面镜子。', { style: 'whisper' });
      S.amb('room');
      S.goal('去员工柜拿后门钥匙（先看凸面镜）');
      S.toast('凸面镜上沿的白点 = 窗外那张脸的位置');
      S.cp('store1');
      return;
    }
    if (f.phase === 'store1') {
      const n = f.fw ?? 0;
      return S.narr(`镜子里，窗户那一排缩成了一道黑边。\n左数第${'一二三四五'[n]}扇窗户外面，贴着一个小小的白点。${n === 4 ? '\n……就是员工柜旁边那一扇。' : n === 3 ? '\n……那扇窗户紧挨着后门。' : ''}\n路口那个人影还在跳。`);
    }
    await S.narr('墙角的防盗凸面镜。整间店在里面缩成一团，收银台后面趴着一个绿色的人影。');
  }
  async function lockerOn(S) {
    if (S.f.phase !== 'store1') return S.narr('员工柜。门上贴着「闲人免进」。');
    if (S.has('bkey')) return S.narr('员工柜里挂着小柯的外套，口袋里露出半包烟和一张考研单词卡。');
    S.sfx('open'); S.give('bkey');
    await S.narr('你拉开员工柜最上面那格。\n挂钩上挂着一把钥匙，钥匙牌上写着「后门」。');
    S.goal('从后门出去（先看镜子，别在有脸的窗下抬头）');
  }
  async function backDoor(S) {
    if (S.f.phase !== 'store1') return S.narr('员工通道的门。上面贴着「非工作人员禁止入内」。');
    if (!S.has('bkey')) { S.sfx('locked'); return S.narr('锁着的。钥匙在员工柜里。'); }
    await S.say('小柯', '……走吧。别回头。千万，千万别对他笑。', { style: 'whisper' });
    S.sfx('open'); S.ent('bdoor').open = true;
    await S.go('lane', 2, 2, 0);
  }
  async function storeExit(S) {
    const f = S.f;
    if (f.phase === 'store1') { S.pos(8, 8, 3); return S.think('门外就是那个路口。他就在那里。\n……不能走正门。'); }
    if (f.woke) { S.pos(8, 8, 3); return S.say('小柯', '别动……别往门口走。', { style: 'whisper' }); }
    await S.go('cross', 22, 6, 0);
  }

  /* ================= 后巷与地下通道 ================= */
  async function grafOn(S) {
    await S.narr('墙上用红漆刷着四个歪歪扭扭的大字，每一个都上下颠倒着：\n\nㄥ　ə　T　8\n\n……是字母？还是什么符号？');
    await S.think('盯久了，眼睛发酸。那几个字好像在墙上慢慢地扭。');
    if (S.f.readWalker) await S.think('纸条上说：「别直着看它。低头，看水。」\n……墙根底下，正好有一滩水。');
  }
  async function puddleOn(S) {
    await S.narr('墙根底下积着一滩水。你蹲下去。\n水面上，倒映着墙上那行红字——');
    S.sfx('drip');
    await S.narr('水把它们上下翻了过来。在水里，它们是正的：\n\n7　6　1　8');
    S.f.code = true;
    await S.think('7618。……铁门上那把锁？');
    S.goal('用 7618 打开铁门');
  }
  async function noteWalker(S) {
    await S.note('walker'); S.f.readWalker = true;
    if (!S.f.code) S.goal('找铁门的密码（纸条说：别直着看，低头看水）');
  }
  async function gateOn(S) {
    if (S.once('gate1')) await S.narr('一道铁栅栏门，把巷子拦腰截断。门上挂着一把四位数的密码锁。\n门那头，能看见「地下通道」的绿色指示牌。');
    const v = await S.keypad('密码锁（四位）', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 4);
    if (v == null) return;
    if (v !== '7618') {
      const f = S.f; S.sfx('locked'); f.gateWrong = (f.gateWrong || 0) + 1;
      if (['8196', '8190', '8167', '7918', '1918', '8197'].includes(v)) await S.narr('锁纹丝不动。\n……直着看的东西，都会骗你。转过来、反过来猜，都不对。');
      else await S.narr('锁纹丝不动。');
      if (!f.readWalker) return S.think('铁门底下，好像压着一张纸。');
      if (f.code) return S.think('水里映出来的是……7、6、1、8。');
      if (f.gateWrong >= 2) return S.think('「低头，看水」……墙上那行字的正下方，墙根那滩水。\n水面会把字上下翻过来。');
      return S.think('纸条上说，密码写在巷子墙上——上下颠倒着写的。');
    }
    S.sfx('open'); S.hide('gate'); S.show('gateO');
    await S.narr('「咔」。锁开了。\n你把铁门推开一条缝，侧身挤了过去。铁门在身后吱呀吱呀地晃。');
    S.goal('下到地下通道里去（台阶在巷子尽头）');
  }
  async function manPass(S) {
    S.amb('none'); S.sfx('heart');
    rhythm(S, .7); await S.wait(1300);
    await S.narr('巷子口外面，传来一种声音。\n嗒。嗒嗒。嗒——像鞋跟敲在柏油路上，又像有人在打拍子。');
    const m = S.ent('man_l'); S.place('man_l', 28, 2, 0); m.alpha = 0; Object.assign(m.s, { mode: 'dance', eye: 0, look: 0 });
    S.focus(26, 3);
    await S.alpha('man_l', 1, 600);
    heel(S, 0, .9);
    await S.walk('man_l', [28, 3], 1.6);
    m.s.mode = 'stand';
    await S.narr('他从巷子口经过。\n就在你前面几步远的地方——停下了。');
    m.s.eye = .6;
    await S.wait(900);
    await S.narr('他的头，一点一点，转向巷子里。\n可他的眼睛，看着的是巷子上面那一线天。');
    S.sfx('whisper');
    const r = await choose(S, '……', ['（屏住呼吸，一动不动）', '（往后退一步）'], { safe: 0, split: '你的脚跟抬起来一点——又轻轻落回了原地。' });
    if (r === 1) { S.sfx('step'); S.sfx('drip'); await S.narr('你的鞋底在水洼里「啪」地响了一声。\n他的嘴角，又往上咧了一点。'); m.s.look = 1; await S.wait(700); m.s.look = 0; await S.wait(500); }
    else await S.narr('你连心跳都想按住。');
    Object.assign(m.s, { mode: 'dance', eye: 0 });
    rhythm(S, .6);
    await S.walk('man_l', [28, 4], 2.2);
    await S.alpha('man_l', 0, 500);
    S.focus(null); S.amb('wind');
    await S.think('他往南边去了……还是往长街那边去了？\n快。下通道。');
    S.goal('下到地下通道里去（台阶在巷子尽头）');
  }
  async function intoTunnel(S) {
    if (!S.ent('gate').hidden) return;
    S.sfx('step');
    await S.go('tunnel', 26, 3, 1);
  }
  async function tunnelDance(S) {
    S.amb('none');
    await S.narr('走到通道中间的时候，你听见头顶上传来声音。');
    rhythm(S, .9, 0, 2); await S.wait(3200);
    await S.narr('嗒。嗒嗒。嗒。\n就在你正上方。地面上，有人在跳舞。');
    S.shake(400, 1);
    await S.narr('天花板的缝里，簌簌地落下一点灰。\n那个节拍，正往西边移——和你同一个方向。');
    for (const i of [4, 3]) { S.ent('tl' + i).off = true; S.sfx('switch'); await S.wait(380); }
    rhythm(S, .5, .2);
    await S.think('他在上面，跟着我走。\n……他知道我在下面。');
    S.amb('drone');
    S.goal('走出通道（西头的台阶上去，就是长街中段）');
  }
  async function outTunnel(S) {
    S.f.phase = 'final';
    S.sfx('step');
    await S.go('street', 23, 6, 1);
  }
})();
