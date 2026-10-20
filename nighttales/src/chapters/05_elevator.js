/* ================= 第五夜 · 电梯游戏 ================= */
(() => {
  const SEQ = [4, 2, 6, 2, 10, 5, 1];
  const KEYS = ['10', '11', '12', '7', '8', '9', '4', '5', '6', '1', '2', '3', '开', '关'];
  const PROPS = ['wallman', 'faceless', 'runner', 'ball', 'dbl', 'woman', 'thing2', 'owoman', 'zrun', 'c_pl1', 'c_pl2'];
  const HOLD_T = { runner: 3.2, zhou: 3.5 };   // 「有人要进来」的实时限时（秒）
  const CHK = ['chkGuard', 'chkMir', 'chkClk', 'chkLog', 'chkPlq'];
  const nChk = f => CHK.filter(k => f[k]).length;
  /* 3×5 像素数字 */
  const FONT = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111' };
  function digits(R, s, x, y, col, k = 1) {
    s = String(s);
    for (let i = 0; i < s.length; i++) { const f = FONT[s[i]]; if (!f) continue; for (let j = 0; j < 15; j++) if (f[j] === '1') R(x + (i * 4 + (j % 3)) * k, y + ((j / 3) | 0) * k, k, k, col); }
  }

  /* ---------------- 电梯：门、场景、运行 ---------------- */
  async function doors(S, to) {
    const d = S.ent('edoor'); const from = d.open || 0;
    if (from === to) { S.f.dopen = to; return; }
    S.sfx(to ? 'open' : 'close');
    for (let i = 1; i <= 6; i++) { d.open = from + (to - from) * i / 6; await S.wait(70); }
    d.open = to; S.f.dopen = to; setSolid(S);
  }
  function canExit(S) {
    const f = S.f;
    if (f.ritOn || f.woman) return false;
    if (f.world === 'o') return f.floor === 12 ? !f.got12 : !f.fled && f.floor === 10;
    return f.floor === 1 || f.floor === 10;
  }
  /* 门口三格：门关着或不能出去时改成墙（地图格子会同步给客机；实体的 solid 不进快照） */
  function setSolid(S) {
    const open = !!(S.f.dopen && canExit(S)), m = W.maps.elev, want = open ? 'm' : '#';
    for (let x = 4; x <= 6; x++) if ((m.mods[4 * m.w + x] ?? m.rows[4][x]) !== want) S.tile(x, 4, want, 'elev');
  }
  function shut(S) {   // 门关上：外面一片黑
    for (const id of PROPS) { const e = S.ent(id); if (e && !e.s.keep) { e.hidden = true; e.alpha = 1; } }
    S.show('shaft'); S.ent('clight').off = true; setSolid(S);
  }
  function scene(S, fl, world) {   // 门外的走廊
    for (const id of PROPS) { const e = S.ent(id); if (e && !e.s.keep) { e.hidden = true; e.alpha = 1; } }
    S.hide('shaft');
    for (let x = 0; x < 11; x++) for (let y = 2; y < 4; y++) S.tile(x, y, world === 'o' ? 'D' : fl === 1 ? 'q' : fl === 10 ? 'c' : 'n', 'elev');
    const o = world === 'o', L = S.ent('clight');
    S.ent('sgnL').num = o ? 'x' : String(fl); S.ent('sgnR').num = o ? 'x' : String(fl);   // 另一边：门牌只剩空框
    S.ent('led').num = String(fl);
    const il = S.ent('ilight'); il.off = false;
    il.light = o ? { r: 3, col: 'rgba(220,60,60,.14)' } : { r: 3.2, col: 'rgba(230,240,255,.12)' };
    L.off = false;
    if (o) L.light = { r: 2.6, col: 'rgba(200,20,30,.3)' };
    else if (fl === 1) { L.light = { r: 4.2, col: 'rgba(255,220,160,.18)' }; S.show('c_pl1'); S.show('c_pl2'); }
    else if (fl === 10) L.light = { r: 3.4, col: 'rgba(255,210,140,.12)' };
    else L.light = { r: 1.6, col: 'rgba(140,160,200,.1)' };
  }
  async function ride(S, to, mid, pre) {
    const f = S.f;
    await doors(S, 0); shut(S);
    if (!f.woman) S.amb(f.world === 'o' ? 'otherworld' : 'elevator');
    await S.wait(450);
    const step = to > f.floor ? 1 : -1;
    while (f.floor !== to) {
      f.floor += step; S.ent('led').num = String(f.floor); S.sfx('tick');
      await S.wait(480);
      if (mid) await mid(f.floor);
    }
    S.sfx('ding'); S.shake(180, 1);
    scene(S, to, f.world);
    if (pre) pre(S);
    await S.wait(250);
    await doors(S, 1);
  }
  async function autoClose(S) { await S.wait(500); await doors(S, 0); shut(S); rgoal(S); }
  async function glide(S, id, x, y, spd = 3) {   // 不受碰撞限制地滑到某格（进出电梯门用）
    const e = S.ent(id); e.hidden = false;
    const sx = e.px / 16, sy = e.py / 16, n = Math.max(1, Math.round(Math.hypot(x - sx, y - sy) * 8));
    if (x !== sx) e.dir = x < sx ? 1 : 2; else if (y !== sy) e.dir = y < sy ? 3 : 0;
    for (let i = 1; i <= n; i++) { e.px = (sx + (x - sx) * i / n) * 16; e.py = (sy + (y - sy) * i / n) * 16; e.fr = [1, 0, 3, 0][i % 4]; await S.wait(1000 / (spd * 8)); }
    e.x = x; e.y = y; e.fr = 0;
  }
  function farCell(S) {   // 轿厢里离玩家最远的空格
    let best = [2, 7], bd = -1; const p = S.pl;
    for (let y = 5; y <= 7; y++) for (let x = 2; x <= 8; x++) { if (x === p.x && y === p.y) continue; const d = Math.abs(x - p.x) + Math.abs(y - p.y); if (d > bd) { bd = d; best = [x, y]; } }
    return best;
  }
  function rgoal(S) {
    const f = S.f;
    if (f.hold === 'runner') return S.goal('有人要进来——快按「关」！');
    if (f.hold === 'zhou') return S.goal('有人要进来——开，还是关？');
    if (f.home2) return S.goal(S.map === 'elev' ? '走出电梯' : '去值班台，跟老郑说句话');
    if (f.home) return S.goal(f.floor === 1 && S.map === 'elev' ? '走出电梯' : homeGoal(f));
    if (f.woman) return S.goal('背对她 · 按 1 · 别出声');
    if (f.world === 'o' && !f.ritOn) return S.goal(f.floor === 12 && S.map === 'elev' && !f.got12 ? '走出电梯' : f.gotNb ? '回电梯' : '走出电梯');
    if (f.ritOn) return S.goal(f._wrong >= 2 ? `按 ${SEQ[f.seq]}（${f.seq + 1}/7）` : `按规则的下一层（${f.seq + 1}/7 · J看便签）`);
    if (f.floor === 1 && f.knows) return S.goal(f.card ? '按 4，开始游戏' : f.readLog ? '打开钥匙箱，拿全层卡' : '先去值班台找全层卡');
    if (f.floor === 10 && f.knows) return S.goal('按 1，下到一楼');
  }
  function homeGoal(f) { const n = nChk(f); return n >= 3 ? '推门回家？还是……再走一遍？' : n === 2 ? '还有哪里不对劲？' : '仔细确认：一切还是原来的样子吗？'; }
  /* 五楼的女人：挡住玩家左右和身后，只能原地转身，不能走动 */
  function pinPlayer(S, on) {
    const p = S.pl, at = [[p.x - 1, p.y], [p.x + 1, p.y], [p.x, p.y + 1]];
    ['blk1', 'blk2', 'blk3'].forEach((id, i) => on ? S.place(id, at[i][0], at[i][1]) : S.hide(id));
  }
  function womanReset(S) {
    const w = S.ent('woman'); w.hidden = true; w.alpha = 1; w.s.keep = false; w.s.pf = 'woman'; w.s.reveal = false; w.light = null;
    pinPlayer(S, false); S.ent('ilight').off = false;
  }
  function elevReset(S) {
    const f = S.f;
    f.hold = null; f._holdT = 0; f.woman = false; f._look = 0; f._side = 0; f._fail = false; f._w2 = false;
    womanReset(S);
    S.clearTimer();
    S.ent('edoor').open = 0; f.dopen = 0; shut(S);
    if (canExit(S)) { S.ent('edoor').open = 1; f.dopen = 1; scene(S, f.floor, f.world); setSolid(S); }
    S.ent('led').num = String(f.floor);
    S.amb(f.world === 'o' ? 'otherworld' : 'elevator');
    rgoal(S);
  }

  /* ---------------- 人物外观 ---------------- */
  const PEOPLE5 = {
    me: { skin: '#f1cdb0', hair: '#2a1c18', hs: 'bob', top: '#8a9ab0', top2: '#e8e8ee', bottom: '#2e3038', skirt: true, shoes: '#1e1a1a' },
    guard: { skin: '#d8b090', hair: '#3a3434', hs: 'short', top: '#2a3550', top2: '#c8c8d0', bottom: '#232838', shoes: '#111', hat: 'cap', hatC: '#1e2840' },
    wallman: { skin: '#cfc4b8', hair: '#151214', hs: 'short', top: '#22252c', top2: '#d8d8d8', bottom: '#1c1e24', shoes: '#0e0e10' },
    faceless: { skin: '#cfc4b8', hair: '#151214', hs: 'short', top: '#22252c', top2: '#d8d8d8', bottom: '#1c1e24', shoes: '#0e0e10', eye: '#cfc4b8' },
    runner: { skin: '#e0bfa0', hair: '#2a2020', hs: 'messy', top: '#5a5e66', top2: '#e8e8e8', bottom: '#3a3d44', shoes: '#2a1a12' },
    woman: { key: 'el-woman', skin: '#e8dcd4', hair: '#0c0a0c', hs: 'long', top: '#d8d4cc', top2: '#c8c0b8', bottom: '#2a2a30', skirt: true, shoes: '#1a1214', eye: '#0a0808',
      extra(g, d, fr, G, R) { if (d === 3) { R(3, G.hT + 4, 10, G.tB - G.hT - 3, '#0c0a0c'); R(4, G.tB + 1, 8, 1, '#0c0a0c'); R(6, G.tB + 2, 4, 1, '#0c0a0c'); } } },   // 背影：头发一直垂到腰
    womanF: { skin: '#d8ccc6', hair: '#0c0a0c', hs: 'long', cover: true, redEye: true, top: '#d8d4cc', bottom: '#2a2a30', skirt: true },
    thing: { key: 'el-thing', skin: '#120e12', hair: '#060406', hs: 'long', top: '#0b090b', top2: '#0b090b', bottom: '#0b090b', shoes: '#050405', eye: '#ff3a3a', big: true,
      extra(g, d, fr, G, R) {
        if (d !== 3) { R(2, G.tT + 1, 1, 13, '#0b090b'); R(13, G.tT + 1, 1, 13, '#0b090b'); R(2, G.tT + 13, 1, 2, '#2a2228'); R(13, G.tT + 13, 1, 2, '#2a2228'); }
        if (d === 0) { R(5, G.hT + 4, 2, 1, '#ff3a3a'); R(9, G.hT + 4, 2, 1, '#ff3a3a'); R(5, G.hT + 5, 2, 1, '#7a0a10'); R(9, G.hT + 5, 2, 1, '#7a0a10'); }
        else if (d === 1) R(4, G.hT + 4, 2, 1, '#ff3a3a');
      } },
    zhou: { skin: '#e0bfa0', hair: '#2a2020', hs: 'messy', top: '#44474f', top2: '#55585f', bottom: '#2e3038', shoes: '#d8d8d8', hat: 'hood', hatC: '#3c3f46' }
  };

  /* ---------------- 惊吓大头像（32×32） ---------------- */
  function faceThing(R, a, t) {
    R(3, 2, 26, 30, 'rgba(110,0,14,.35)'); R(7, 0, 18, 32, 'rgba(150,0,20,.3)');
    R(8, 1, 16, 31, '#3a0a0e'); R(9, 0, 14, 32, '#3a0a0e');           // 描边
    R(9, 2, 14, 30, '#060406'); R(10, 1, 12, 31, '#060406');           // 又长又窄的黑脸
    R(5, 7, 3, 25, '#060406'); R(24, 7, 3, 25, '#060406'); R(4, 14, 1, 18, '#3a0a0e'); R(27, 14, 1, 18, '#3a0a0e');   // 垂下来的头发
    const ey = 11, gl = .35 + Math.sin(t * 20) * .1;
    R(10, ey - 1, 6, 4, `rgba(255,58,58,${gl})`); R(17, ey - 1, 6, 4, `rgba(255,58,58,${gl})`);
    R(11, ey, 4, 2, '#ff3a3a'); R(18, ey, 4, 2, '#ff3a3a'); R(12, ey, 1, 1, '#ffd8d0'); R(19, ey, 1, 1, '#ffd8d0');
    const mh = 2 + Math.round(a * 11);                                  // 嘴：一道竖着裂开的缝
    R(14, 19, 4, mh, '#1a0000'); R(15, 19, 2, mh + 1, '#2a0004'); R(13, 19, 1, Math.max(1, mh - 2), '#5a0a10'); R(18, 19, 1, Math.max(1, mh - 2), '#5a0a10');
  }
  const FACES5 = {
    thing: faceThing,
    thingUp(R, a, t) { faceThing((x, y, w, h, c) => R(x, 32 - y - h, w, h, c), a, t); },   // 倒挂在检修口上
    womanF(R, a, t) {
      R(2, 0, 28, 32, 'rgba(110,130,170,.22)');                         // 冷光把轮廓勾出来
      R(4, 0, 24, 32, '#0a080a'); R(2, 8, 28, 24, '#0a080a');            // 长发的大轮廓
      for (const x of [5, 8, 24, 27]) R(x, 6 + (x % 3), 1, 24, '#24202a');   // 发丝的反光
      R(9, 5, 14, 16, '#ddd2cc'); R(10, 21, 12, 2, '#d2c6c0'); R(11, 23, 10, 2, '#c4b8b2'); R(13, 25, 6, 1, '#b8aca6');   // 尖下巴的白脸
      R(9, 5, 14, 2, '#b8aca6');
      for (const [x, h] of [[9, 19], [10, 14], [12, 10], [13, 5], [20, 8], [21, 16], [22, 20]]) R(x, 2, 1, h, '#0a080a');   // 盖住脸的发缕
      const eo = 2 + Math.round(a * 2);                                  // 发缝里的那只眼睛，越睁越大
      R(14, 12 - (eo >> 1), 6, eo + 1, '#f4f0e8'); R(16, 12 - (eo >> 1), 3, eo + 1, '#b00e0e'); R(17, 12, 1, 2, '#000'); R(16, 12 - (eo >> 1), 1, 1, '#ff6060');
      R(14, 14 + (eo >> 1), 6, 1, '#7a5a5a'); R(14, 11 - (eo >> 1), 6, 1, '#6a4a4a');
      R(10, 13, 2, 1, '#6a0a0a');                                       // 另一只，藏在头发后面
      R(14, 19, 5, 1, '#5a1a1a'); R(14, 20, 5, 1 + Math.round(a * 3), '#140404'); R(15, 20 + Math.round(a * 3), 3, 1, '#140404');
    },
    zhou(R, a, t) {
      R(3, 25, 26, 7, '#3c3f46'); R(5, 2, 22, 25, '#3c3f46'); R(7, 3, 18, 2, '#4a4d55');   // 卫衣帽子
      R(8, 6, 16, 18, '#cdb8a4'); R(9, 24, 14, 1, '#b8a28e'); R(12, 25, 8, 1, '#b8a28e');   // 没有血色的脸
      R(8, 6, 16, 4, '#8a7a6c'); R(8, 5, 16, 2, '#2a2020'); R(9, 7, 2, 2, '#2a2020'); R(14, 7, 3, 1, '#2a2020'); R(21, 7, 2, 2, '#2a2020');   // 帽檐下的阴影、乱发
      const ew = 4 + Math.round(a);
      R(10, 11, ew, 4, '#050304'); R(22 - ew, 11, ew, 4, '#050304');     // 黑洞一样的眼睛
      if (a > .5) { R(11, 12, 1, 1, '#e8e4dc'); R(20, 12, 1, 1, '#e8e4dc'); }
      R(10, 15, ew, 1, '#a8927e'); R(22 - ew, 15, ew, 1, '#a8927e');
      const s = Math.round(a * 2);                                       // 笑，一直咧到耳根
      R(7, 15 - s, 1, 2, '#3a0a0a'); R(24, 15 - s, 1, 2, '#3a0a0a'); R(8, 17 - s, 2, 1, '#3a0a0a'); R(22, 17 - s, 2, 1, '#3a0a0a');
      R(9, 18, 14, 1, '#3a0a0a'); R(10, 19, 12, 2 + s, '#2a0606'); R(10, 19, 12, 1, '#e8e2d4');
      for (let i = 0; i < 6; i++) R(11 + i * 2, 19, 1, 1, '#6a5a50');
      R(11, 21 + s, 10, 1, '#d8d0c0');
    }
  };

  /* ---------------- 自定义精灵 ---------------- */
  const SPR5 = {
    edoor(g, e, t, R) {   // 电梯门（俯视，3 格宽）
      const o = e.open || 0, w = Math.round(23 * (1 - o));
      R(0, 0, 48, 16, '#2a2d32'); R(1, 1, 46, 13, '#050507');
      if (w) { R(1, 1, w, 13, '#8d939b'); R(47 - w, 1, w, 13, '#8d939b'); R(1, 1, w, 1, '#b4bac2'); R(47 - w, 1, w, 1, '#b4bac2'); R(w, 1, 1, 13, '#5a6068'); R(47 - w, 1, 1, 13, '#5a6068'); }
      R(0, 14, 48, 2, '#3a3d42');
    },
    shaft(g, e, t, R) { R(0, 0, 176, 64, '#050507'); R(64, 63, 48, 1, '#1a1c20'); },
    led(g, e, t, R) { R(2, 2, 12, 9, '#2a2d32'); R(3, 3, 10, 7, '#0c0606'); const s = String(e.num ?? ''); digits(R, s, 8 - (s.length * 4 - 1) / 2 | 0, 4, '#ff4a2a'); },
    flnum(g, e, t, R) {
      if (e.num === 'x') { R(3, 2, 10, 1, '#4a1418'); R(3, 10, 10, 1, '#4a1418'); R(3, 2, 1, 9, '#4a1418'); R(12, 2, 1, 9, '#4a1418'); return; }   // 只剩一个空框
      R(3, 2, 10, 9, '#2a2a2e'); R(4, 3, 8, 7, '#c8c4b8'); const s = String(e.num ?? ''); if (s) digits(R, s, 8 - (s.length * 4 - 1) / 2 | 0, 4, '#2a2a2e');
    },
    panel(g, e, t, R) { R(0, -4, 6, 18, '#5a5e66'); R(1, -3, 4, 16, '#9aa0a8'); for (let i = 0; i < 7; i++) { R(1, -2 + i * 2, 1, 1, i === 3 ? '#ffb040' : '#3a3a3a'); R(3, -2 + i * 2, 1, 1, '#3a3a3a'); } R(1, 12, 4, 1, '#c84030'); },
    ball(g, e, t, R) { R(5, 8, 6, 6, '#a82024'); R(4, 9, 8, 4, '#a82024'); R(6, 9, 2, 2, '#e86a5a'); R(5, 13, 6, 1, 'rgba(0,0,0,.35)'); },
    workdesk(g, e, t, R) {
      const c = e.col || '#8a7a66';
      R(0, -7, 16, 3, '#4a4e56'); R(0, -4, 1, 6, '#4a4e56'); R(15, -4, 1, 6, '#4a4e56');
      box5(R, 0, 2, 16, 12, c); R(1, 3, 14, 2, shade(c, .15));
      R(4, -5, 8, 7, '#1a1a1e'); R(5, -4, 6, 5, e.s.scr ? '#6a8ab0' : '#0e1216'); if (e.s.scr) R(6, -3, 3, 1, '#c8d8e8'); R(7, 2, 2, 2, '#2a2a2e');
      if (e.lit) { R(12, -2, 1, 6, '#333'); R(11, -4, 4, 3, '#e8d08a'); }
      if (e.s.cup) R(2, 5, 2, 3, '#e8e4dc');
      if (e.s.note) R(11, -4, 3, 3, '#f0d850');
    },
    printer(g, e, t, R) { box5(R, 1, 2, 14, 12, '#c8c6c0'); R(3, 1, 10, 3, '#9a988f'); R(4, 6, 8, 2, '#2a2a2e'); R(4, 8, 8, 1, e.s.paper ? '#f0ece0' : '#2a2a2e'); R(12, 10, 1, 1, e.s.red ? '#ff3030' : '#40d060'); },
    dispenser(g, e, t, R) { box5(R, 3, -2, 10, 16, '#d8d8d8'); R(4, -9, 8, 8, e.s.red ? 'rgba(160,20,20,.85)' : 'rgba(120,170,220,.75)'); R(5, -8, 2, 6, 'rgba(255,255,255,.3)'); R(5, 3, 2, 2, '#c03030'); R(9, 3, 2, 2, '#3060c0'); },
    owin(g, e, t, R) {   // 大窗（墙面）
      box5(R, 1, 0, 14, 13, '#3a3d42');
      if (e.s.red) {
        R(2, 1, 12, 11, '#2a0608'); R(2, 8, 12, 4, '#1a0405');
        if (e.s.cross) { const on = e.s.fast ? Math.sin(t * 11) > .1 && Math.random() > .08 : Math.sin(t * 2) > -.6, a = on ? '#ff2a2a' : '#4a0a0a'; R(9, 3, 1, 4, a); R(8, 4, 3, 1, a); }
      } else {
        R(2, 1, 12, 11, '#0b1424'); R(2, 9, 12, 3, '#141c2c');
        for (let i = 0; i < 7; i++) R(2 + ((hash(i, e.x, 3) * 12) | 0), 4 + ((hash(i, e.x, 4) * 7) | 0), 1, 1, i % 3 ? '#d8b860' : '#e86a5a');
      }
      R(8, 1, 1, 11, '#3a3d42');
    },
    wboard(g, e, t, R) {
      box5(R, 0, 0, 32, 13, '#8a8e94'); R(1, 1, 30, 11, '#e4e4de');
      if (e.s.nums) { for (let y = 2; y < 11; y += 2) for (let x = 2; x < 30; x += 3) if (hash(x, y, 7) < .8) R(x, y, 2, 1, hash(x, y, 8) < .5 ? '#2a2a6a' : '#6a1a1a'); }
      else { R(3, 3, 12, 1, '#3a5aa0'); R(3, 6, 9, 1, '#3a5aa0'); R(3, 9, 14, 1, '#3a5aa0'); R(22, 4, 3, 3, '#c03030'); R(23, 7, 1, 3, '#c03030'); R(26, 5, 3, 4, '#5a5e66'); }
    },
    keybox(g, e, t, R) {
      box5(R, 3, 0, 10, 13, '#4a4e56');
      if (e.open) { R(4, 1, 8, 11, '#1a1a1e'); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) R(5 + j * 4, 3 + i * 3, 1, 2, '#c9a35a'); R(5, 3, 2, 2, '#1a1a1e'); }
      else { R(5, 2, 6, 3, '#1a3020'); R(6, 3, 3, 1, '#60e080'); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R(5 + j * 2, 6 + i * 2, 1, 1, '#c8c8c8'); }
    },
    corkboard(g, e, t, R) { box5(R, 1, 1, 14, 11, '#7a5a38'); R(2, 2, 12, 9, '#a8845a'); R(3, 3, 4, 5, '#ece6d6'); R(8, 3, 5, 3, '#e8d070'); R(8, 7, 5, 3, '#ece6d6'); R(4, 3, 1, 1, '#c03030'); R(10, 3, 1, 1, '#3050c0'); },
    wclock(g, e, t, R) {
      R(4, 1, 8, 8, '#2a2420'); R(5, 2, 6, 6, '#e0dac8'); if (e.s.nohands) return;
      R(7, 3, 1, 2, '#111'); R(8, 4, 2, 1, '#111');
      const a = (e.s.rev ? -1 : 1) * t * 1.2; R(7 + Math.round(Math.cos(a) * 2), 4 + Math.round(Math.sin(a) * 2), 1, 1, '#c02020');
    },
    exitsign(g, e, t, R) { R(3, 2, 10, 5, '#0e5a2a'); R(4, 3, 8, 3, '#2ab060'); R(5, 4, 2, 1, '#e8fff0'); R(8, 4, 3, 1, '#e8fff0'); },
    gdoor(g, e, t, R) { R(0, 0, 32, 16, 'rgba(120,150,170,.28)'); R(0, 0, 32, 1, '#5a6068'); R(0, 0, 1, 16, '#5a6068'); R(31, 0, 1, 16, '#5a6068'); R(15, 0, 2, 16, '#5a6068'); R(12, 6, 2, 4, '#a8aeb6'); R(18, 6, 2, 4, '#a8aeb6'); R(3, 2, 4, 8, 'rgba(220,235,245,.15)'); },
    plaque(g, e, t, R) {
      box5(R, 2, 2, 12, 9, '#a8843a'); R(3, 3, 10, 7, '#c9a35a');
      if (e.s.rev) { R(4, 4, 1, 5, '#6a4a1a'); R(6, 5, 7, 1, '#6a4a1a'); R(8, 7, 5, 1, '#6a4a1a'); R(11, 4, 1, 1, '#6a4a1a'); }   // 字是反着刻的，靠右对齐
      else { R(4, 5, 8, 1, '#6a4a1a'); R(5, 7, 6, 1, '#6a4a1a'); }
    },
    /* 五楼的女人 / 那东西：双人联机时，操作者几乎看不见（只剩一缕头发 / 一对红眼），观看者看得见 */
    womanS(g, e, t, R) {
      if (blindNow(e)) { R(10, -3, 1, 9, 'rgba(12,10,12,.85)'); R(11, 1, 1, 7, 'rgba(12,10,12,.6)'); return; }
      const [X, Y] = entXY(g, R); g.drawImage(personSprite(PEOPLE5[e.pf] || PEOPLE5.woman, e.dir, e.fr), X, Y - 8);
    },
    thingS(g, e, t, R) {
      const [X, Y] = entXY(g, R), P = PEOPLE5.thing;
      if (blindNow(e)) {   // 只剩两点红光
        if (e.dir === 3) return; const a = .6 + Math.sin(t * 7) * .3;
        g.fillStyle = `rgba(255,58,58,${a})`; if (e.dir === 0) { g.fillRect(X + 2, Y - 20, 4, 2); g.fillRect(X + 10, Y - 20, 4, 2); } else g.fillRect(X + (e.dir === 1 ? 0 : 12), Y - 20, 4, 2);
        return;
      }
      const c = personSprite(P, e.dir, e.fr), o = tintOf(c, '#7a1420', P.key + e.dir + '|' + e.fr);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.drawImage(o, X - 8 + dx, Y - 32 + dy, 32, 48);
      g.drawImage(c, X - 8, Y - 32, 32, 48);
      if (e.dir !== 3) {   // 眼睛的红光
        const a = .35 + Math.sin(t * 7) * .15; g.fillStyle = `rgba(255,58,58,${a})`;
        if (e.dir === 0) { g.fillRect(X + 1, Y - 21, 6, 4); g.fillRect(X + 9, Y - 21, 6, 4); } else g.fillRect(X + (e.dir === 1 ? -1 : 11), Y - 21, 6, 4);
      }
    },
    odoor(g, e, t, R) { box5(R, 2, -2, 12, 16, e.col || '#6a6e76'); R(11, 6, 2, 2, '#c8c8c8'); R(4, 0, 8, 4, '#e8e4d8'); if (!e.s.blank) { R(5, 1, 6, 1, '#2a2a2e'); R(5, 3, 4, 0.5, '#2a2a2e'); } },
    reception(g, e, t, R) { box5(R, 0, 0, 48, 14, '#6a5240'); R(1, 1, 46, 3, '#8a6e56'); R(20, 6, 8, 3, '#c9a35a'); }
  };
  function box5(R, x, y, w, h, fill) { R(x, y, w, h, shade(fill, -.45)); R(x + 1, y + 1, w - 2, h - 2, fill); }
  /* 自定义精灵里拿到实体在缓冲画布上的左上角（R 内部闭包了坐标，借一次 fillRect 读出来） */
  function entXY(g, R) { let X = 0, Y = 0; g.fillRect = (a, b) => { X = a; Y = b; }; R(0, 0, 1, 1, '#000'); delete g.fillRect; return [X, Y]; }
  const TINT = new Map();
  function tintOf(c, col, key) {
    let o = TINT.get(key + col); if (o) return o;
    o = mk(c.width, c.height); const og = o.getContext('2d'); og.drawImage(c, 0, 0); og.globalCompositeOperation = 'source-in'; og.fillStyle = col; og.fillRect(0, 0, c.width, c.height);
    TINT.set(key + col, o); return o;
  }
  function blindNow(e) { return NET.role !== 'solo' && NET.up && iControl() && !e.reveal; }

  /* ---------------- 按钮面板 ---------------- */
  async function panel(S) {
    const f = S.f;
    if (S.pl.y === 4) { await S.walk('pl', [7, 5], 5); S.turn(3); }   // 站在门口按的：先退回轿厢里
    const k = f.hold ? await S.keypad('有人要进来——！', ['开', '关'], 1, { alias: { O: '开', C: '关' } })
      : await S.keypad(f.woman ? '（不要回头。盯着按钮。）' : f.world === 'o' ? '按钮面板 · 数字的边缘泛着红光' : '3号梯 · 按钮面板', KEYS, 1, { alias: { '0': '10', O: '开', C: '关' } });
    if (k == null) return;
    if (k === '开') {
      if (f.hold === 'zhou') return zhouIn(S);
      if (f.hold) return S.narr('你的手指停在「开」上，没有按下去。');
      if (f.dopen) return S.narr('门已经开着了。');
      if (!canExit(S)) return S.narr(f.ritOn ? '规则说：每到一层，都不要出去。\n……你把手缩了回来。' : '电梯停在两层之间。按「开」没有反应。');
      scene(S, f.floor, f.world); await doors(S, 1); return rgoal(S);
    }
    if (k === '关') {
      if (f.hold === 'runner') return f._holdT > HOLD_T.runner ? runnerIn(S) : closeOnRunner(S);
      if (f.hold === 'zhou') return f._holdT > HOLD_T.zhou ? zhouIn(S) : closeOnZhou(S);
      if (!f.dopen) return S.narr('门本来就关着。');
      await doors(S, 0); shut(S); return;
    }
    const n = +k;
    if (f.home || f.home2) return S.narr('你的手指悬在按钮上面，抖了半天。\n……不。不要再按任何按钮了。');
    if (f.world === 'o' && n === 12 && !f._o_v12 && !f.woman) return goTwelve(S);
    if (f.ritOn) return ritual(S, n);
    if (f.world === 'o') return S.narr(f._o_v12 && n === 12 ? '12 的按钮再也按不亮了。' : f.gotNb ? '……' : '你的手在发抖。\n不行。来都来了——周屿留下的东西，也许还在这层楼里。');
    if (n === f.floor) return S.narr(`已经在 ${n} 楼了。`);
    if (f.floor === 1 && n === 4 && f.knows) {
      if (!f.card) { S.sfx('locked'); await S.narr('按钮亮了一下，又灭了。\n面板上的小屏幕滚动着一行字：「夜间模式 · 跨楼层请刷全层卡」'); S.goal(f.readLog ? '打开钥匙箱，拿全层卡' : '先去值班台找全层卡'); return; }
      f.ritOn = true; f.seq = 0;
      S.cp('elev');
      if (S.once('ritStart')) {
        await S.think('（4、2、6、2、10。到了十楼按 5。\n五楼进来什么人，都不要看，不要说话。然后按 1。）');
        await S.think('（……周屿，我来找你了。）');
      }
      return ritual(S, 4);
    }
    if (n === 1 || n === 10) {
      if (n === 10 && !f.knows) return S.narr('……');
      await ride(S, n);
      rgoal(S); return;
    }
    if (!f.card) { S.sfx('locked'); return S.narr(`${n} 楼的按钮按不亮。\n「夜间模式 · 跨楼层请刷全层卡」`); }
    return S.think(f.floor === 10 ? '（规则说，要从一楼开始。）' : '（去那一层干什么？……规则说，先按 4。）');
  }

  async function ritual(S, n) {
    const f = S.f, want = SEQ[f.seq];
    if (n !== want) return ritualBreak(S, n);
    const o = f.world === 'o';
    if (want === 5 && !o) S.cp('elev');
    if (o && f.seq === 3) S.cp('elev');   // 回程第二次去二楼之前
    if (want === 1) return o ? goHome(S) : goOther(S);
    f.seq++;
    const ev = (o ? EVO : EVN)[f.seq] || {};
    await ride(S, n, ev.mid, ev.pre);
    if (ev.at) await ev.at(S);
    rgoal(S);
  }
  /* 按错：电梯真的开去那一层，游戏断了，回起点重来 */
  async function ritualBreak(S, n) {
    const f = S.f, o = f.world === 'o';
    f._wrong = (f._wrong || 0) + 1;
    if (f.woman) { S.sfx('whisper'); await S.narr(`你按下了 ${n}。\n按钮没有亮。\n身后，有人很轻、很轻地笑了一声。`); return rgoal(S); }
    S.sfx('heart');
    f.ritOn = false; f.seq = 0;
    await ride(S, n);
    if (o) await S.narr(`${n} 楼。\n暗红色的走廊，空荡荡的。什么都没有等在门口。\n……顺序断了。`);
    else await S.narr(`${n} 楼。\n普普通通的走廊，安全出口的绿灯亮着。什么都没有发生。\n……电梯没有照着规则走。游戏好像断了。`);
    await S.think(o ? '（回十楼。从 4 开始，再按一遍。）' : '（回一楼。从 4 开始，重来。）');
    await ride(S, o ? 10 : 1);
    if (o) { f.ritOn = true; f.seq = 0; await autoClose(S); }
    if (f._wrong === 2) S.toast('（按错两次了——目标栏会直接写出下一层）');
    rgoal(S);
  }

  /* ---------------- 去程：每一层的停靠 ---------------- */
  const EVN = {
    1: { pre: S => { S.place('wallman', S.f._o_ev4 ? 3 : 2, 2, 3); },
      async at(S) {
        if (S.once('ev4')) {
          await S.narr('四楼。\n走廊的灯没开，只有安全出口亮着一点绿光。\n绿光底下站着一个穿西装的男人。他背对着电梯，整张脸贴在墙上，一动不动。');
          await S.think('（……加班加傻了吧。别出去，别出声。）');
        } else await S.narr('四楼。那个男人还贴着墙站着。比刚才……离电梯近了一点。');
        await autoClose(S);
      } },
    2: { pre: S => { S.place('runner', 0, 3, 2); },
      async at(S) {
        S.sfx('knock'); await S.wait(200); S.sfx('knock');
        await S.say('走廊里的男人', '等一下——！等等我！别关门！');
        S.f.hold = 'runner'; S.f._holdT = 0; rgoal(S);
        S.timer(HOLD_T.runner, '他跑过来了', runnerIn, { during: true });   // 打开面板也照样计时
      } },
    3: { pre: S => { S.place('ball', 9, 3); },
      async at(S) {
        await glide(S, 'ball', 5, 3, 3);
        S.sfx('giggle');
        await S.narr('六楼。\n一只红色的小皮球从走廊那头滚过来，在门槛前停住了。\n走廊里没有人。远处，有个小孩子「咯」地笑了一声。');
        const r = await S.ask('皮球就停在门槛外面，一动不动。', ['（不碰它）', '伸出鞋尖，把它拨出去']);
        if (r === 1) { await glide(S, 'ball', 7, 3, 4); await S.wait(300); await glide(S, 'ball', 5, 3, 2); await S.narr('皮球滚到走廊中间，停了一下——\n又慢慢地、慢慢地滚了回来，停在原来的地方。'); }
        await autoClose(S);
      } },
    4: { pre: S => { S.place('faceless', 5, 3, 0); S.ent('clight').light = { r: 2.2, col: 'rgba(160,170,200,.12)', flick: true }; },
      async at(S) {
        S.sfx('sting');
        await S.narr('二楼。\n四楼那个贴着墙站的男人，现在就站在门口。离你不到一步。');
        await S.narr('他没有进来。也没有喘气。\n他只是站在那里，像是在等你开口请他进来。');
        await S.wait(500);
        await S.narr('……他的脸上，什么都没有。\n没有眼睛，没有鼻子，没有嘴。一片光滑的、发灰的白。');
        await S.think('（不要出声。不要出声。不要出声。）');
        await S.narr('……原来他一直贴着墙站，是因为他没有脸可以朝向你。');
        await S.wait(400);
        await S.narr('门自己合上了。门缝合拢之前，那张白脸一直对着你。');
        await doors(S, 0); shut(S);
      } },
    5: { pre: S => { S.place('dbl', 5, 2, 3); },
      async at(S) {
        await S.narr('十楼。是你们公司。\n走廊的灯下，有个人背对着你，正往办公室里走。');
        await glide(S, 'dbl', 9, 2, 2.2);
        await S.narr('灰蓝色的衬衫，齐耳的短发，帆布包上挂着一只褪了色的小熊。\n……你低头看了一眼自己的包。');
        await S.alpha('dbl', 0, 900);
        await S.think('（是我眼花了。是我眼花了。）');
        await autoClose(S);
      } },
    6: { pre: S => { S.place('woman', 5, 3, 0); },
      async at(S) { await womanIn(S); } }
  };

  async function runnerIn(S) {
    const f = S.f; if (f.hold !== 'runner') return; f.hold = null; S.clearTimer();
    const r = S.ent('runner'); r.s.keep = true;
    await glide(S, 'runner', 5, 3, 6);
    const [rx, ry] = farCell(S);
    await glide(S, 'runner', 5, 4, 6); await glide(S, 'runner', rx, ry, 4);
    S.face('runner', 'pl');
    await S.say('男人', '呼……谢谢啊。这么晚了，你也加班？');
    await S.narr('他喘着气，在你身后的角落站好，伸手越过你，按了 1。\n规则说：中途有人进来，游戏就失败了。');
    f.ritOn = false; f.seq = 0;
    await ride(S, 1);
    await glide(S, 'runner', 5, 4, 4); await glide(S, 'runner', 5, 3, 4);
    r.s.keep = false;
    await S.alpha('runner', 0, 500);
    await S.narr('他走了出去，没有回头。\n大理石的地面上，他一点脚步声也没有。');
    await S.think('（……要从头来了。从一楼，按 4。）');
    S.goal('游戏失败了——重新按 4');
    S.cp('elev');
  }
  async function closeOnRunner(S) {
    const f = S.f; f.hold = null; S.clearTimer();
    await doors(S, 0);
    S.sfx('thud'); S.shake(300, 2);
    shut(S);
    await S.narr('门合上的前一刻，一只手「啪」地拍在门缝上。\n……门还是合上了。\n外面没有骂声，没有拍门声。什么声音都没有了。');
    rgoal(S);
  }

  /* ---------------- 五楼的女人 ---------------- */
  async function womanIn(S) {
    const f = S.f;
    S.sfx('heart');
    await S.narr('五楼。\n门开的一瞬间，你的余光扫到——门外站着一个人。');
    await S.think('（不要看。盯着按钮。盯着按钮。）');
    const w = S.ent('woman'); w.s.keep = true; w.s.pf = 'woman'; w.s.reveal = false;
    const p = S.pl, wx = p.x, wy = p.y + 1;   // 她站在你正后方
    await glide(S, 'woman', 5, 4, 2); await glide(S, 'woman', 5, wy, 1.6); if (wx !== 5) await glide(S, 'woman', wx, wy, 1.6);
    w.dir = 3; w.alpha = .5;   // 面朝你的后背：你只看得见她的一头黑发
    w.light = { r: .8, col: 'rgba(150,170,220,.16)' };
    pinPlayer(S, true);
    await doors(S, 0); shut(S);
    S.ent('ilight').off = true;   // 轿厢的灯暗下去，只剩她身上一圈冷光
    S.amb('none');
    await S.narr('门关上了。\n她就站在你身后。近得能闻到她头发上潮湿的味道。');
    if (S.coop) S.toast('双人：操作者看不见她——观看者，帮对方盯着，别让对方回头');
    f.woman = true; f._wt = 0; f._look = 0; f._side = 0; f._w1 = false; f._w2 = false; f._br = 0;
    rgoal(S);
  }
  function womanNear(S, k) {   // 一点点贴近：k = 1..3
    const w = S.ent('woman'); w.py = (S.pl.y + 1) * 16 - [0, 3, 6, 8][k]; w.alpha = [.5, .7, .85, 1][k];
  }
  async function womanFail(S, how) {
    const f = S.f; f._fail = true;
    const w = S.ent('woman');
    S.clearTimer();
    if (how === 'look') {
      S.face('pl', 'woman');
      await S.narr('你没忍住，回头看了她一眼。');
      w.s.pf = 'womanF'; w.s.reveal = true; w.alpha = 1; w.dir = 0; S.ent('ilight').off = false;
      await S.wait(300);
      await S.scare('face', { spr: '@womanF', dur: 1.2 });
      S.fx('red');
      await S.say('她', '……你看见我了。', { style: 'whisper' });
      return S.end({ bad: true, title: '你看见了她的脸', text: '第二天早上，3号梯停在了五楼。\n门开着，里面没有人。\n\n物业调出了那一晚的监控：电梯从十楼下到五楼，在五楼停了整整四个小时。\n画面里只有你一个人。你一直侧着头，像是在听谁说话。' });
    }
    await S.say('她', '……你终于肯理我了。', { style: 'whisper' });
    S.sfx('laugh'); S.fx('glitch');
    return S.end({ bad: true, title: '你回答了她', text: '「你是一个人吗？」\n\n从那天起，你再也不是一个人了。\n不管走到哪里，你总能听见身后半步远的地方，有一个很轻、很轻的呼吸声。\n它在等你回头。' });
  }
  async function whisper1(S) {
    if (!S.f.woman || S.f._fail) return;
    S.sfx('whisper');
    await S.say('身后的女人', '……可以帮我按一下吗？', { style: 'whisper' });
    const r = await S.ask('她在等你回答。', ['（不回答。盯着按钮。）', '「……您去几楼？」']);
    if (r === 1) return womanFail(S, 'talk');
    await S.narr('她没有再说话。\n你听见她轻轻地，笑了一下。');
  }
  async function whisper2(S) {
    if (!S.f.woman || S.f._fail) return;
    S.sfx('whisper'); S.shake(200, 1); womanNear(S, 1);
    await S.narr('有什么东西碰了一下你的后颈。\n冰凉的，细细的。是她的头发。');
    await S.think('（按 1。快按 1。）');
  }
  async function goOther(S) {
    const f = S.f;
    f.seq++;
    const mid = async fl => {
      if (fl === 6) { S.sfx('sting'); await S.narr(`你按的是 1。\n可指示灯跳到了——${fl}。\n电梯在往上走。`); }
      if (fl === 7) {
        S.sfx('whisper'); womanNear(S, 2);
        await S.say('身后的女人', '……你是一个人吗？', { style: 'whisper' });
        const r = await S.ask('她在等你回答。', ['（不回答）', '「……是。」']);
        if (r === 1) { await womanFail(S, 'talk'); throw 0; }
      }
      if (fl === 8) { S.shake(300, 1); womanNear(S, 3); await S.narr('她往前凑了凑。\n你能感觉到，她的脸就停在你的肩膀后面。'); }
      if (fl === 9) {
        S.sfx('whisper');
        await S.say('身后的女人', '……小满？', { style: 'whisper' });
        await S.narr('是周屿的声音。');
        const r = await S.ask('那个声音，就贴在你的耳朵后面。', ['（不回头）', '（回头）']);
        if (r === 1) { await womanFail(S, 'look'); throw 0; }
        f.world = 'o';
      }
    };
    try { await ride(S, 10, mid, S => { womanReset(S); f.woman = false; f.ritOn = false; }); }
    catch (e) { if (e === 0) return; throw e; }
    f.ritOn = false; f.seq = 0;
    S.amb('otherworld');
    await S.narr('十楼。\n「叮」的一声，身后的呼吸声停了。');
    await S.wait(600);
    await S.narr('你等了很久很久，才敢慢慢回过头。\n电梯里只有你一个人。');
    await S.narr('门外，是你们公司的走廊。\n……可是灯全灭了，所有东西都蒙着一层暗红色。');
    S.cp('elev');
    rgoal(S);
  }

  /* ---------------- 回程（另一边） ---------------- */
  const EVO = {
    1: { async at(S) { await S.narr('四楼。\n走廊是暗红色的。墙上的门牌，一块一块，全是空白。'); await autoClose(S); } },
    2: { pre: S => { S.place('thing2', 9, 2, 1); },
      async at(S) {
        S.sfx('heart');
        await S.narr('二楼。\n走廊尽头，站着那个东西。它没有动。');
        await S.wait(500);
        await glide(S, 'thing2', 7, 2, 10);
        S.shake(250, 2);
        await S.narr('……你一眨眼，它就近了两格。');
        await doors(S, 0); shut(S);
      } },
    3: { pre: S => { S.place('ball', 5, 3); },
      async at(S) { await S.narr('六楼。\n那只红皮球停在门口。\n像是一直在这里等你。'); await autoClose(S); } },
    4: { pre: S => { S.place('zrun', 0, 3, 2); },
      async at(S) {
        await S.narr('二楼。\n走廊尽头，那个东西不见了。');
        await S.wait(500); S.sfx('thud'); S.shake(300, 2);
        await S.narr('……头顶上，轿厢的顶板「咚」地响了一声。');
        S.sfx('knock'); await S.wait(150); S.sfx('knock');
        await S.say('走廊尽头', '小满——！小满！等等我！', { style: 'big' });
        await S.narr('是周屿。\n深灰色的卫衣，帽子扣在头上，跑得跌跌撞撞。他在朝电梯跑过来。');
        S.f.hold = 'zhou'; S.f._holdT = 0; rgoal(S);
        if (S.coop) S.toast('双人：快商量——让他进来，还是关门？');
        S.timer(HOLD_T.zhou, '他跑过来了', zhouIn, { during: true });
      } },
    5: { async at(S) { await S.narr('十楼。\n门外漆黑一片。很远的地方，那个红十字亮着。'); await autoClose(S); } },
    6: { pre: S => { S.place('owoman', 5, 2, 3); },
      async at(S) {
        await S.narr('五楼。\n那个女人背对着你，站在走廊正中间。长头发一直垂到腰。');
        S.sfx('whisper');
        await S.say('？？？', '……下次见。', { style: 'whisper' });
        await autoClose(S);
      } }
  };
  async function goHome(S) {
    const f = S.f;
    f.seq++;
    await ride(S, 1, async fl => {
      if (fl === 3) {
        S.fx('glitch'); S.sfx('tv'); f.world = 'n'; S.ent('ilight').light = { r: 3.2, col: 'rgba(255,60,50,.16)' };
        await S.scare('face', { face: 'thingUp', spr: '@thing', dur: .6 });
        await S.narr('LED 的红光里，你看见了——\n天花板的检修口开着一条缝。一张脸倒着垂下来，贴在缝上，看着你。');
        S.ent('ilight').light = { r: 3.2, col: 'rgba(230,240,255,.12)' };
        await S.narr('……再抬头的时候，检修口是关着的。');
      }
    }, S => { f.home = true; f.ritOn = false; });
    S.amb('room');
    await S.narr('一楼。\n大堂暖黄色的灯光从门外照进来。值班台那边，收音机在小声地唱着戏。');
    await S.think('（……回来了？）');
    S.cp('elev');
    rgoal(S);
  }
  function exitElev(S) {
    const f = S.f;
    if (f.world === 'o') return f.floor === 12 ? S.go('o12', 7, 2, 0) : S.go('other', 14, 2, 0);
    if (f.floor === 1) return f.home ? S.go('lobby2', 4, 2, 0) : S.go('lobby', 13, 2, 0);
    return S.go('office', 14, 2, 0);
  }

  /* ---------------- 回程二楼：周屿 ---------------- */
  async function closeOnZhou(S) {
    const f = S.f; if (f.hold !== 'zhou') return; f.hold = null; S.clearTimer();
    const z = S.ent('zrun'); z.dir = 0; z.fr = 0;
    S.sfx('close'); const d = S.ent('edoor');
    for (let i = 1; i <= 3; i++) { d.open = 1 - i / 6; await S.wait(90); }
    await S.narr('门缝一点一点地合拢。\n周屿在门外停下了脚步。他没有拍门，也没有再喊你。');
    await S.narr('他只是站在那儿，看着你，冲你笑了一下。\n……嘴角咧开的弧度，比你记得的，要大一点。');
    await doors(S, 0); shut(S);
    await S.think('（……那不是他。那不是他。）');
    rgoal(S);
  }
  async function zhouIn(S) {
    const f = S.f; if (f.hold !== 'zhou') return; f.hold = null; S.clearTimer();
    const z = S.ent('zrun'); z.s.keep = true;
    if (!f.dopen) { scene(S, f.floor, f.world); S.place('zrun', 4, 3, 2); z.s.keep = true; await doors(S, 1); }
    await glide(S, 'zrun', 5, 3, 6); await glide(S, 'zrun', 5, 4, 5); await glide(S, 'zrun', 5, 6, 4);
    S.face('zrun', 'pl');
    await doors(S, 0); shut(S);
    await S.say('周屿', ['呼……呼……吓死我了。', '我还以为……你也不等我了。'], { face: null });
    await S.narr('头顶的灯管照下来，亮得发白。\n你低头看了一眼地板。');
    await S.wait(500);
    await S.narr('地板上，只有一个影子。是你的。');
    await S.scare('face', { spr: '@zhou', dur: 1.1 });
    S.fx('red');
    await S.say('周屿', '……小满，你怎么不看我？', { style: 'whisper' });
    return S.end({ bad: true, title: '两个人', text: '第二天早上，物业在3号梯里找到了你。\n你说你是和周屿一起回来的。你说了很多遍。\n\n监控里，电梯从二楼开始，就一直只有你一个人。\n可你每说一句话，都会停下来，侧过头，\n像是在等身边的谁，替你把话说完。' });
  }

  /* ---------------- 隐藏：另一边的十二楼 ---------------- */
  async function goTwelve(S) {
    const f = S.f; S.once('v12');
    f.ritOn = false; f.seq = 0;
    S.sfx('sting');
    await S.narr('你按下了 12。\n……这部电梯，本来就没有 12 楼的灯。可它亮了。');
    await ride(S, 12);
    await S.narr('十二楼。\n门外的走廊，和十楼一模一样。只是更安静。');
    rgoal(S);
  }
  async function twelveNote(S) {
    const f = S.f; if (f.got12) return;
    await S.narr('地上掉着一页撕下来的纸。\n是周屿笔记本里缺的那一页。');
    await S.note('zhou2');
    f.got12 = true; S.hide('n12');
    await S.wait(400); S.sfx('sting');
    await S.narr('身后，所有的椅子，同时「吱」地响了一声。');
    for (const e of W.maps.o12.ents) if (e.spr === '@zhou') e.dir = 0;
    S.shake(300, 2); S.sfx('whisper');
    await S.narr('……他们一起转过了头。');
    S.fx('flash'); S.dark(1);
    await S.narr('灯灭了。');
    f.floor = 12;
    await S.go('elev', 5, 5, 3);
    S.dark(null, 'o12');
    await S.narr('等你回过神来，你已经站在电梯里了。\n指示灯在往下跳。');
    await ride(S, 10);
    if (f.fled) { f.ritOn = true; f.seq = 0; await autoClose(S); await S.think('（顺序断了。从 4 开始，再按一遍。）'); }
    rgoal(S);
  }

  /* ---------------- 第三次乘梯（结局二） ---------------- */
  async function againRide(S) {
    const f = S.f;
    const r = await S.ask('3号梯的门安安静静地关着。\n帖子里说：回到一楼，如果有哪里不对——就再来一遍。', ['再走一遍', '……算了']);
    if (r) return;
    await S.think(nChk(f) ? '（这里不是原来的一楼。我知道。）' : '（……总觉得哪里不对。）');
    S.sfx('ding'); f.floor = 1;
    await S.go('elev', 5, 5, 3);
    f.home = false; f.ritOn = true;   // 门口封住，不让出去
    await doors(S, 0); shut(S); S.amb('elevator');
    for (const n of [4, 2, 6, 2, 10]) { S.ent('led').num = String(n); S.sfx('tick'); S.shake(120, 1); await S.wait(520); }
    await S.narr('4、2、6、2、10。\n这一次，每一层的门外都是黑的。没有人进来。');
    S.ent('led').num = '5'; S.sfx('ding'); await S.wait(500);
    await S.narr('5。\n门开了，又关上。身后，没有人。');
    for (const n of [4, 3, 2, 1]) { S.ent('led').num = String(n); S.sfx('tick'); await S.wait(420); }
    await S.narr('1。\n指示灯一格一格地往下跳。\n……往下。');
    f.ritOn = false; f.world = 'n'; f.home2 = true;
    S.sfx('ding'); S.shake(180, 1);
    scene(S, 1, 'n'); await S.wait(250); await doors(S, 1);
    S.amb('room');
    rgoal(S);
  }

  const OFFICE_ROWS = [
    '####################',
    '####################',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '####################'];
  SPR5.logdesk = (g, e, t, R) => { box5(R, 0, 2, 16, 12, '#6a5240'); R(1, 3, 14, 2, '#8a6e56'); R(3, 0, 10, 6, '#ece6d6'); R(8, 0, 1, 6, '#a89e88'); for (let i = 0; i < 3; i++) { R(4, 1 + i * 2, 3, 1, '#6a6a7a'); R(9, 1 + i * 2, 3, 1, '#6a6a7a'); } R(12, -1, 1, 5, '#2a2a6a'); };

  /* ---------------- 办公室 ---------------- */
  async function zhouDesk(S) {
    const f = S.f;
    if (f.knows) { await S.narr('周屿的工位。马克杯里的咖啡已经干成了一圈褐色的印子。'); return S.note('rules'); }
    await S.narr('周屿的工位。\n键盘上压着一张没吃完的饼干包装纸，马克杯里的咖啡干成了一圈褐色的印子。\n显示器边上，贴着一张黄色的便利贴。');
    await S.note('rules');
    f.knows = true; S.ent('zdesk').s.note = false;
    await S.think('（……电梯游戏。）\n（上礼拜吃午饭的时候，他还跟我们讲过这个。说是网上看来的，韩国还是日本传过来的。）');
    await S.think('（我当时说：你多大了，还信这个。）');
    await S.wait(300);
    S.sfx('ding');
    await S.narr('走廊那头，3号梯「叮」地响了一声。\n门开了。\n……没有人按过它。');
    await S.think('（规则说，要从一楼开始。）');
    S.goal(S.f._o_forum ? '坐3号梯下到一楼' : '坐3号梯下到一楼（打印机那边好像还有他打印的东西）');
  }

  /* ---------------- 大堂 ---------------- */
  async function guard(S) {
    const f = S.f;
    if (f.home2) return endingB(S);
    if (f.home) {
      S.face('guard', 'pl');
      if (S.once('guardHome')) {
        await S.say('老郑', ['小林？哟，这都几点了，还没走啊。', '刚才3号梯在五楼停了老半天，我还当它又坏了。你在上面没碰上什么事吧？']);
        const r = await S.ask('', ['「……没事。就是有点累。」', '「郑师傅，您……认识周屿吗？」']);
        if (r === 1) await S.say('老郑', ['周屿？认识啊，十楼那个小伙子嘛。', '……刚才不是还跟你一块儿下来的吗？我看见电梯里有两个人。']);
        else await S.say('老郑', '累了就早点回去。路上慢点。');
        await S.narr('你的目光落在他胸口的名牌上。\n「郑」。\n……那个字，是反着写的。像从镜子里看过去的一样。');
        f.chkGuard = true; checks(S);
        return;
      }
      return S.say('老郑', '快回去吧。这楼晚上……不太干净。', { style: 'whisper' });
    }
    S.bubble('guard', '…', 1600);
    if (S.once('guardSleep')) {
      await S.narr('老郑睡得很沉，帽檐压到了鼻子上。收音机里的戏唱到一半，咿咿呀呀的。');
      await S.say('老郑（梦话）', '……别坐三号梯……五楼……五楼那个，不是人……', { style: 'whisper' });
      await S.think('（……郑师傅也知道？）');
      return;
    }
    const lines = ['老郑打着轻轻的呼噜。叫了两声，他只是翻了个身。', '收音机里换了一段戏。老郑的嘴动了动，没醒。', '保温杯里的茶早就凉了。'];
    await S.narr(lines[(f._gl = ((f._gl ?? -1) + 1) % 3)]);
  }
  async function keyBox(S) {
    const f = S.f, e = S.ent('keybox');
    if (f.home) return S.narr('钥匙箱关着。指示灯一闪一闪的。\n……你记得，它原来是挂在大堂另一头的墙上的。');
    if (f.home2) return S.narr('钥匙箱关着。全层卡挂在最里面的钩子上。\n……你口袋里那一张，又是从哪儿来的？');
    if (f.card) return S.narr('钥匙箱里挂着一排钥匙。全层卡的那个钩子空了。');
    if (!f.readLog) return S.narr('墙上的电子钥匙箱，需要四位密码。\n透过小窗能看见里面挂着一排钥匙，和一张白色的门禁卡。');
    const v = await S.keypad('钥匙箱 · 输入四位密码', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 4);
    if (v == null) return;
    if (v !== '1997') { S.sfx('locked'); return S.narr('「嘀嘀」两声。红灯。\n登记簿上说——密码是这栋楼竣工的那一年。'); }
    S.sfx('open'); e.open = true; f.card = true; S.give('card');
    await S.narr('「嘀」的一声，箱门弹开了。\n全层卡挂在最里面的钩子上。卡套背面贴着一张小纸条：「3号梯·夜间」。');
    await S.think('（三天前，周屿拿的就是这一张。）');
    S.goal('回3号梯，从一楼按 4');
  }
  async function cork(S) {
    if (S.f.home) return S.narr('公告栏。寻人启事上，周屿还在笑。\n……他的眼睛，好像在往你身后看。');
    if (S.f.home2) return S.narr('公告栏上只有两张通知。夜间模式，3号梯维保。\n那张寻人启事……不见了。连钉子眼都没有。');
    await S.narr(['公告栏上钉着几张通知：', '「夜间模式：22:00 后电梯跨楼层需刷全层卡，全层卡由值班室保管。」', '「3号梯维保通知：如遇电梯在非目标楼层停靠，请勿惊慌，勿强行扒门。」', '最上面是一张新贴的寻人启事。照片上的周屿穿着团建的文化衫，比着剪刀手。']);
  }
  async function lobbyMirror(S) {
    const f = S.f;
    if (f.home2) return S.narr('你抬起右手。镜子里的你，也抬起了手。\n分毫不差。\n……你盯着看了很久，才敢把手放下。');
    if (!f.home) return S.narr('大堂的装饰镜。镜子里的你脸色发白，眼睛底下一片青。\n……加班加的。');
    if (S.once('mirHome')) {
      await S.narr('你站在镜子前面。\n镜子里的你，也站在那里。');
      await S.wait(500);
      await S.narr('你抬起右手，摸了摸自己的脸。\n镜子里的你，过了半拍，才抬起手来。');
      S.sfx('heart');
      await S.think('（……是我太累了。一定是我太累了。）');
      f.chkMir = true; checks(S); return;
    }
    await S.narr('你没有再看那面镜子。');
  }
  async function lobbyClock(S) {
    const f = S.f;
    if (f.home2) return S.narr('挂钟。十一点五十八分。\n秒针一格一格地往前走。\n……往前。');
    if (!f.home) return S.narr('挂钟。十二点过五分。\n秒针一格一格地往前走，声音在空荡荡的大堂里显得格外响。');
    if (S.once('clkHome')) {
      await S.narr('挂钟。一点十七分。\n秒针一格一格地走着。');
      await S.wait(400);
      await S.narr('……往回走。');
      f.chkClk = true; checks(S); return;
    }
    await S.narr('秒针还在倒着走。');
  }
  async function homeLog(S) {
    await S.narr('登记簿摊开着。在周屿那一格空白下面，多了一行新写上的字：\n\n　11/22　01:15　10F 林小满 坐3号梯下楼。全层卡已还。');
    await S.think('（……我还没有登记。）\n（可那是我的字。）');
    S.f.chkLog = true; checks(S);
  }
  async function plaque(S) {
    const f = S.f;
    if (f.home) {
      if (S.once('plqHome')) {
        await S.narr('铜牌：华康大厦　一九九七年十月竣工。\n铜牌擦得锃亮，亮得能照出人影。');
        await S.narr('……不对。\n每一个字，都是反着刻的。\n像是有人照着镜子，一笔一笔描下来的。');
        f.chkPlq = true; checks(S); return;
      }
      return S.narr('反着刻的铜牌。你没敢再细看。');
    }
    return S.narr('一块铜牌，嵌在大理石墙上：\n\n　华康大厦\n　一九九七年十月竣工\n\n边角已经发黑了。');
  }
  function checks(S) { rgoal(S); }
  async function frontDoor(S) {
    const f = S.f;
    if (f.home2) return S.think('（……先跟老郑打声招呼吧。）');
    if (!f.home) return S.narr('大门的玻璃上映着大堂的灯。外面是空无一人的马路。\n……周屿还没找到。你不打算走。');
    if (nChk(f) < 3) return S.think('（帖子里说：回到一楼以后，先别急着出去。\n好好看看，周围是不是原来的样子。）');
    const r = await S.ask('门外的马路上，路灯一盏一盏地亮着。', ['推门出去', '……再看看']);
    if (r) return;
    await ending(S);
  }
  async function ending(S) {
    const f = S.f;
    S.sfx('open');
    await S.narr('你推开玻璃门。\n十一月的夜风灌进来，冷得很真实。');
    await S.wait(400);
    S.sfx('phone');
    if (f.phoneDead) { S.take('phoneD'); S.give('phone', true); }
    await S.narr('口袋里的手机震了一下。\n' + (f.phoneDead ? '——你明明记得，它在那边已经黑屏了。' : '——它整晚都安安静静的。'));
    await S.say('微信 · 周屿', '小满，你回来了吗？', { style: 'think' });
    await S.say('微信 · 周屿', '我在一楼等你。', { style: 'think' });
    await S.narr('你回过头。\n大堂里灯火通明。老郑低头看着收音机。\n电梯间那边，3号梯的门，正在慢慢地合上。');
    await S.fade(1, 1200);
    await S.note('endA');
    await S.end({ title: '第五夜　完', text: '有时候你会想：\n那天晚上，回到的那个一楼，真的是原来的那一个吗？\n\n' + (f.chkMir ? '镜子里的你，再也没有慢过半拍。' : '那面镜子，你始终没敢再看。') + '\n……大概吧。' });
  }
  /* 结局二：对的那一个一楼 */
  async function endingB(S) {
    S.face('guard', 'pl');
    await S.say('老郑', ['小林？哟，还没走啊。', '……周屿？他刚下班，跟你前后脚。', '还冲我摆摆手呢，说明天给我带包子。']);
    await S.think('（……刚下班？）');
    S.sfx('phone');
    await S.narr('你掏出手机。电量 31%。\n锁屏上的日期是：11月19日，23:58。');
    await S.narr('三天前。\n周屿说「我下楼拿个外卖，顺便试个东西」的那一天。');
    await S.wait(500);
    S.sfx('ding');
    await S.narr('电梯间那边，3号梯「叮」地响了一声。门开了。\n走出来一个女孩。齐耳短发，灰蓝色的衬衫，帆布包上挂着一只褪了色的小熊。');
    await S.narr('她低着头，从你身边走过去，推开了大门。\n老郑冲她摆摆手：「小林，路上慢点。」');
    await S.narr('……他没有再看你一眼。');
    await S.fade(1, 1400);
    await S.note('endB');
    await S.end({ title: '第五夜　完 · 另一个一楼', text: '这里的镜子不慢半拍。这里的钟往前走。\n这里的周屿，明天还会来上班。\n\n只是这里，已经有一个林小满了。' });
  }

  /* ---------------- 另一边 ---------------- */
  async function redCross(S) {
    await S.narr('很远很远的地方，有一个红色的十字。\n它不在任何一栋楼上，就那样悬在暗红色的天底下，一下一下地亮着。');
    if (S.once('cross')) await S.think('（帖子里说过……「远处能看到一个红色的十字」。）\n（它看上去像医院的灯牌。可它的光，一点也不让人觉得安心。）');
  }
  async function notebook(S) {
    const f = S.f;
    if (f.gotNb) return;
    await S.narr('你蹲下来，捡起那本黑色的笔记本。\n封皮上用马克笔写着：周屿　2019。');
    await S.note('notebook');
    f.gotNb = true; S.hide('nb'); S.clearTimer(); S.dark(null);
    await S.think('（周屿……你到底去了哪一个一楼？）');
    await S.wait(300);
    S.sfx('sting'); S.focus(THING_AT[0], THING_AT[1]);
    S.ent('thing').alpha = 1; S.place('thing', THING_AT[0], THING_AT[1], 0);
    S.fx('flash');
    await S.narr('休息区的沙发上，那个人形的凹陷里——\n有什么东西，慢慢地坐了起来。');
    await S.narr('它很高，很瘦，黑得像是从墙上剪下来的一块影子。\n它站在你和电梯之间。');
    S.focus(null);
    S.goal('回电梯！绕开它');
    if (S.coop) S.toast('双人：操作者只看得见它的眼睛——观看者，替对方指路');
    S.cp('flee');
    startThing(S, 1.6);
  }

  async function caughtThing(S) {
    S.stop('thing');
    await S.scare('face', { spr: '@thing' });
    await S.die('它没有脸。\n可你分明听见，它用你的声音，轻轻叫了一声「小满」。', '你被留在了那一边');
  }
  const THING_AT = [17, 7];   // 从沙发上的凹陷里冒出来，离电梯很近
  function startThing(S, delay) {
    const t = S.ent('thing'); t.alpha = 1; S.place('thing', THING_AT[0], THING_AT[1], 0);
    S.chase('thing', { spd: 2.6, catch: caughtThing }); t.chase.wait = delay;
  }
  /* 另一边的 3 号梯：门开得很慢，那东西还在逼近 */
  async function oe3Door(S) {
    const f = S.f, d = S.ent('oe3'), t = S.ent('thing');
    if (!f.gotNb) return S.think('（还不能走。周屿……周屿一定在这层楼里留下了什么。）');
    if (t.chase) {
      t.chase.always = true;
      S.toast('你拼命按着下行键——门开得很慢');
      S.sfx('ding');
      for (let i = 0; i < 25; i++) {
        d.open = i / 24; await S.wait(100);
        if (t.chase && Math.abs(t.px - S.pl.px) + Math.abs(t.py - S.pl.py) < 14) { t.chase = null; return caughtThing(S); }
      }
      if (t.chase) t.chase.always = false;
    }
    d.open = 0;
    await S.go('elev', 5, 5, 3);
  }
  async function stayedTooLong(S) {
    S.fx('red'); S.sfx('bad');
    await S.narr('窗外的红十字，忽然灭了。\n整层楼的暗红色，一点一点地，变成了纯粹的黑。');
    return S.end({ bad: true, title: '你在那边待得太久了', text: '帖子里说过：那边的时间和这边不一样。\n\n华康大厦的物业后来又贴了一张寻人启事，就贴在周屿那张的旁边。\n照片上的女孩留着齐耳短发，背着挂小熊的帆布包。\n\n两张启事上的日期，是同一天。' });
  }

  const LOBBY_ROWS = [
    '##################',
    '##################',
    '#................#',
    '#................#',
    '#................#',
    '#................#',
    '#................#',
    '#................#',
    '#................#',
    '########..########'];
  const LOBBY_ENTS = [
    { id: 'keybox', x: 1, y: 1, spr: 'keybox', on: S => keyBox(S) },
    { id: 'cork', x: 6, y: 1, spr: 'corkboard', on: S => cork(S) },
    { id: 'plaque', x: 8, y: 1, spr: 'plaque', on: S => plaque(S) },
    { id: 'lmirror', x: 10, y: 1, spr: 'mirror', frame: '#6a6a70', on: S => lobbyMirror(S) },
    { id: 'lclock', x: 11, y: 1, spr: 'wclock', on: S => lobbyClock(S) },
    { id: 'e3l', x: 13, y: 1, spr: 'elevdoor', lit: true, light: { r: 2.2, col: 'rgba(255,120,80,.12)' }, async on(S) {
      if (S.f.home) return againRide(S);
      if (S.f.home2) return S.narr('3号梯的门安安静静地关着。\n你连按钮都不想再碰一下。');
      S.f.floor = 1; S.sfx('ding');
      await S.go('elev', 5, 5, 3);
    } },
    { x: 15, y: 1, spr: 'elevdoor', on: S => S.narr('1号梯。「设备检修 暂停使用」。') },
    { x: 16, y: 2, spr: 'plant' },
    { x: 1, y: 8, spr: 'plant' },
    { id: 'desk', x: 2, y: 3, w: 3, spr: 'reception', on: S => guard(S) },
    { id: 'logdesk', x: 5, y: 3, spr: 'logdesk', async on(S) {
      if (S.once('log')) await S.narr(S.f.home ? '值班登记簿还摊在台面上。' : '值班台边上摊着一本登记簿，钢笔还夹在里面。');
      if (S.f.home) return homeLog(S);
      if (S.f.home2) return S.narr('登记簿摊开着。最新的一行是：\n\n　11/19　23:41　10F 周屿 坐3号梯下楼取外卖。\n\n墨水还没干。下面那一格，空着。');
      await S.note('log');
      if (!S.f.readLog) { S.f.readLog = true; S.goal(S.f.card ? '回3号梯，从一楼按 4' : '打开钥匙箱，拿全层卡'); }
    } },
    { id: 'guard', x: 3, y: 2, spr: '@guard', dir: 0, on: S => guard(S) },
    { x: 12, y: 6, w: 2, spr: 'sofa', col: '#3a3a44', on: S => S.narr('访客等候区的沙发。坐垫上有一个浅浅的凹陷，像是刚有人坐过。') },
    { id: 'gdoor', x: 8, y: 9, w: 2, spr: 'gdoor', on: S => frontDoor(S) },
    { x: 4, y: 5, spr: 'invisible', solid: false, light: { r: 4.2, col: 'rgba(255,220,160,.12)' } },
    { x: 12, y: 4, spr: 'invisible', solid: false, light: { r: 4, col: 'rgba(255,220,160,.1)' } }
  ];

  defChapter({
    id: 'elevator', n: 5, title: '电梯游戏', sub: '4、2、6、2、10、5。五楼进来的那个女人，不要看她。', origin: '韩国 · 日本网络怪谈', color: '#2a3442',
    icon: '@woman', iconDir: 3, amb: 'room', floor: 'linoleum', wall: 'plain', dark: .75, plr: 3.2,
    thumb(g, w, h) {
      const x = w / 2 - 34, y = 14;
      g.fillStyle = '#2a2d32'; g.fillRect(x - 3, y - 3, 34, h - 22 - y + 3);
      g.fillStyle = '#8d939b'; g.fillRect(x, y, 13, h - 22 - y); g.fillRect(x + 15, y, 13, h - 22 - y);
      g.fillStyle = '#050507'; g.fillRect(x + 13, y, 2, h - 22 - y);
      g.fillStyle = '#0c0606'; g.fillRect(x + 6, y - 11, 16, 7);
      g.fillStyle = '#ff4a2a'; [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 3], [0, 4], [1, 4], [2, 4]].forEach(([a, b]) => g.fillRect(x + 12 + a, y - 10 + b, 1, 1));
    },
    iconX: 22,
    people: PEOPLE5,
    sprites: SPR5,
    items: {
      card: { name: '全层卡', desc: '老郑钥匙箱里的门禁卡，背面贴着一张褪色的小纸条：「3号梯·夜间」。' },
      phone: { name: '手机', desc: '你的手机。电量 31%。' },
      phoneD: { name: '手机', desc: '屏幕是黑的。长按电源键，没有反应。' }
    },
    notes: {
      rules: { title: '周屿工位上的便签', text: '（便利贴，周屿的字，越写越潦草）\n\n电梯游戏\n· 楼至少十层。一个人。\n· 一楼进电梯，按 4 → 2 → 6 → 2 → 10\n  每一层都不要出去。中途有人进来 = 失败\n· 到十楼按 5\n· 五楼可能会进来一个女人\n  不要看她！！不要跟她说话！！\n  她会站在你正后方。千万别回头\n· 按 1。如果电梯往上走，去了十楼——就成了\n· 回来：同样的顺序再走一遍。回到一楼，好好看看周围\n\n（最底下补了一行，墨水洇开了）\n小满肯定说我无聊。等我回来讲给她听。' },
      forum: { title: '打印出来的帖子', text: '【转】去异世界的方法（电梯版）　发帖时间 23:12\n\n据说最早是日本那边传过来的，也有人说是韩国。英文论坛上也翻来翻去好几个版本了，细节每个人说的都不一样。\n\n有的版本说，十楼走出去，世界看起来和原来一模一样，只是灯全灭了，整栋楼只剩你一个人。窗外远处能看见一个红色的十字。\n有的版本说，那边手机能用；有的说一格信号都没有，屏幕根本点不亮。\n有的版本说，五楼进来的那个「女人」，不是人。你看了她，她就会跟你回来。\n\n怎么回来：坐同一部电梯，把顺序再按一遍。回到一楼以后，先别急着出去——仔细看看，周围还是不是原来的样子。如果有哪里不对，就再来一遍。\n\n——楼下回复 #3：楼主你自己试过吗？\n——楼下回复 #4：试过的人怎么回帖啊（笑）\n\n（打印机出的最后一页，页脚印着：打印人 周屿　11月19日 23:31）' },
      log: { title: '值班登记簿 · 11月', text: '（老郑的钢笔字，一格一格写得很工整）\n\n11/15　23:50　3号梯夜里自己跑到5楼停着。已报修。\n11/17　00:20　3号梯又停5楼。维保说一切正常。\n11/19　23:41　10F 周屿 坐3号梯下楼取外卖。说是借全层卡用一下，一会儿就还。\n11/19　——　　（这一格空着。卡没有还回来。）\n11/20　07:10　3号梯停在10楼，门开着，里面没人。卡在地上。已报警。\n\n（页边上歪歪扭扭的一行，像是打瞌睡时写的）\n钥匙箱密码 = 咱们楼竣工那年。年纪大了老记不住。' },
      notebook: { title: '周屿的笔记（另一边）', text: '（周屿的工作笔记本。前面是需求和排期，翻到最后几页，字迹变了）\n\n——到了。真的到了。十楼，和我们公司一模一样。灯全灭了。\n手机黑屏，按什么都没用。电脑也打不开。\n窗外很远的地方有个红色的十字，一直亮着。\n\n——五楼进来的那个女人，我没看她。可是她一直在我耳朵后面问：「你是一个人吗？」\n我没回答。我做到了。\n\n——不知道过了多久。这里的钟没有指针。\n走廊尽头有个东西。它不走过来，可每次我抬头，它都近了一点。\n\n——我按原样坐回去了。回到一楼，老郑在打瞌睡，钟在走，一切都对。\n可我出大门的时候，回头看了一眼大堂的镜子。\n镜子里的我，晚了半拍才回头。\n\n所以我又回来了。这次我要找对的那一个一楼。\n\n——如果有人看到这本子：\n回到一楼以后，好好看。别像我一样急着出去。\n小满，如果是你——对不起，那份周报我还没写完。' },
      zhou2: { title: '周屿·第二次', text: '（从笔记本上撕下来的一页，字写得很小，挤满了正反两面）\n\n——第二次回到一楼。镜子是对的。钟是对的。\n老郑醒着，跟我说：「周屿？你不是刚上去吗？」\n我没敢问他，刚上去的那个是谁。\n\n——所以我又回来了。第三次。第四次。\n每一次回去的一楼，都差一点点。\n差一点点，比差很多更可怕。\n\n——我按了 12。这部电梯本来没有 12 楼。\n这一层全是工位。每一张工位前面，都坐着一个我。\n他们都在按同一串数字。4 2 6 2 10 5 1。\n他们都没找到。\n\n——我想我知道为什么回不去了。\n不是电梯不对。是我每次都太想回去了。\n只要一看见差不多的一楼，我就骗自己说：就是这儿。\n\n——小满。如果你也到了这边。\n回去的时候，别骗自己。' },
      endA: { title: '结局一 · 推门出去', text: '（三天以后）\n\n周屿的笔记本被你交给了警察。\n他们说，那是他失踪前一天落在工位上的。\n\n你没有再加过班。\n只是每次走进电梯，\n你都会站在离按钮最近的地方，\n背对着整个轿厢。' },
      endB: { title: '结局二 · 另一个一楼', text: '（手机备忘录 · 11月19日 23:59）\n\n这里一切都对。\n镜子不慢，钟往前走，周屿还活着。\n\n门卫看不见我。\n我站在大门外面，看着「我」走到地铁站，刷卡，进站。\n她回头看了一眼大厦。\n我冲她挥了挥手。她没有看见。\n\n明天晚上，周屿会下楼拿外卖，顺便试个东西。\n……我要不要，在电梯口等他？' }
    },
    legend: '「电梯游戏」（Elevator Game，也叫「去异世界的电梯」）是网络时代最出名的仪式型怪谈之一。玩法大同小异：找一栋至少十层的楼，独自进电梯，依次按 4、2、6、2、10，途中有人进来就算失败；到十楼后按 5，五楼可能会进来一个年轻女人，不能看她、不能和她说话；接着按 1，如果电梯不下反上、一路升到十楼，就说明你到了「另一个世界」——那里只有你一个人，灯是黑的，据说窗外远处能看见一个红色的十字。\n\n它的出处一直说不清。一种说法是起源于韩国，2010 年前后在韩国网络上流传，还被画成过漫画；另一种说法认为更早出现在日本的匿名论坛上。2010 年代初，英文论坛和怪谈网站上开始出现各种转述和翻译，每传一次细节就变一点：电子设备能不能用、回来时要不要在中途按别的楼层、五楼的女人到底是什么，各个版本说法都不一样。\n\n回来的方法同样众说纷纭：多数版本要求原路再按一遍顺序，回到一楼后仔细确认周围是不是原来的样子，有任何不对劲就再来一次。这个「也许回来的并不是原来那个世界」的尾巴，是它最让人不安的地方。它也常被网友和一些真实的不幸事件牵强附会地联系在一起，但并没有任何可靠的证据。\n\n和血腥玛丽、「一个人的捉迷藏」一样，电梯游戏本质上是一种试胆仪式：规则越具体、越像一份操作手册，就越让人忍不住想亲手试一试。\n\n（本章中的华康大厦、林小满、周屿、保安老郑，以及各楼层的停靠事件和「走廊尽头的东西」均为游戏虚构。）',
    start: { map: 'office', x: 2, y: 4, dir: 3 },
    resume: {
      elev: async S => { elevReset(S); },
      flee: async S => { startThing(S, 1.6); }
    },
    faces: FACES5,
    tiles: {
      darkred: { solid: false, paint(R, X, Y) { speck(R, '#1c0708', ['#2a0b0d', '#130405'], X, Y, 10, 13); } }
    },
    async intro(S) {
      await S.card('第五夜　电梯游戏', '2019年11月22日　深夜　华康大厦十楼', '同事周屿失踪三天了。\n监控拍到他走进3号电梯，\n却没有拍到他从任何一层走出来。\n\n今晚，整层楼只剩你一个人在加班。');
    },
    tick(S, dt) {   // 只在主机跑；busy 时也会跑
      const f = S.f;
      /* 有人跑过来：章节自己实时计时（面板/对话打开也照走），男人的位置跟着推进，脚步声越来越密 */
      if (S.map === 'elev' && f.hold) {
        const T = HOLD_T[f.hold]; f._holdT = (f._holdT || 0) + dt;
        const r = S.ent(f.hold === 'zhou' ? 'zrun' : 'runner');
        r.px = Math.min(4, f._holdT / T * 4.5) * 16; r.fr = [1, 0, 3, 0][((W.t * 10) | 0) % 4]; r.dir = 2;
        f._stT = (f._stT || 0) - dt; if (f._stT <= 0) { f._stT = .22; S.sfx('step'); }
      }
      /* 另一边的十楼：红十字熄灭前分阶段加压 */
      if (S.map === 'other' && !f.gotNb && W.timer && W.timer.fn === stayedTooLong) {
        const L = W.timer.left;
        if (L < 45 && !f._st1) { f._st1 = true; S.ent('ocross').s.fast = true; S.dark(.9); S.sfx('sting'); S.toast('窗外的红十字，开始一明一暗地闪'); }
        if (L < 20) {
          f._hb = (f._hb || 0) - dt; if (f._hb <= 0) { f._hb = 1.1; S.sfx('heart'); }
          f._tk = (f._tk || 0) - dt; if (f._tk <= 0) { f._tk = 1; S.sfx('tick'); }
          if (!f._st2) { f._st2 = true; S.toast('墙上那只没有指针的钟，「嗒」、「嗒」地越走越响'); }
        }
        if (L < 10 && !f._st3) { f._st3 = true; f._flT = .5; S.place('thing', 18, 4, 1); S.ent('thing').alpha = .75; S.sfx('whisper'); }
      }
      if (f._flT > 0) { f._flT -= dt; if (f._flT <= 0 && !S.ent('thing').chase) S.hide('thing'); }
      /* 那东西追你：越近，脚步声越密，心跳声加进来 */
      if (S.map === 'other') {
        const t = S.ent('thing');
        if (t.chase && !t.hidden) {
          const d = Math.abs(t.px - S.pl.px) / 16 + Math.abs(t.py - S.pl.py) / 16;
          f._thT = (f._thT || 0) - dt;
          if (d <= 6 && f._thT <= 0) { f._thT = d <= 3 ? .4 : .6; S.sfx('thud'); if (d <= 3) S.sfx('heart'); }
        }
      }
      if (S.map !== 'elev' || !f.woman || f._fail) return;
      /* 五楼的女人：她的呼吸声。朝向越危险，越急 */
      const p = S.pl, risk = p.dir === 0 ? 2 : p.dir === 3 ? 0 : 1;
      f._br = (f._br || 0) - dt; if (f._br <= 0) { f._br = [3.5, 1.8, .9][risk]; S.sfx('whisper'); }
      if (W.busy) return;
      /* 只有面朝下（回头）才算看她，宽限 0.6 秒；朝左右是余光，宽限 2 秒 */
      if (risk === 2) {
        if (!f._look) { S.sfx('heart'); S.toast('不要回头！'); }
        f._look += dt; f._side = 0;
        if (f._look > .6) { f._fail = true; S.after(0, S2 => womanFail(S2, 'look')); }
      } else if (risk === 1) {
        if (!f._side) { S.sfx('heart'); S.toast('余光里有长头发……别再转了'); }
        f._side += dt; f._look = 0;
        if (f._side > 2) { f._fail = true; S.after(0, S2 => womanFail(S2, 'look')); }
      } else { f._look = 0; f._side = 0; }
      f._wt += dt;
      if (f._wt > 2.5 && !f._w1) { f._w1 = true; S.after(0, whisper1); }
      if (f._wt > 6 && !f._w2) { f._w2 = true; S.after(0, whisper2); }
    },
    maps: {
      /* ---------------- 十楼办公室 ---------------- */
      office: {
        amb: 'room', dark: .8, plr: 3.2, wall: 'plain', floor: 'carpet', tileOpts: { carpetC: '#3a4250' },
        rows: OFFICE_ROWS,
        ents: [
          { x: 2, y: 1, spr: 'owin', on: S => S.narr('窗外是城市的夜景。对面写字楼只剩几格窗户还亮着。\n玻璃上映出你的脸，和你身后一排排空着的工位。') },
          { x: 4, y: 1, spr: 'owin', on: S => S.narr('楼下的马路上偶尔开过一辆出租车。\n十层楼，听不见任何声音。') },
          { id: 'oclock', x: 6, y: 1, spr: 'wclock', on: S => S.narr('十一点四十。\n地铁末班车是十一点二十。你早就错过了。') },
          { x: 8, y: 1, w: 2, spr: 'wboard', on: S => S.narr(['白板上是上周的排期。「周屿」两个字后面画了好几个箭头，一直拖到下周。', '角落里有人用红笔画了个小人，旁边写着：周屿你的周报呢？？？\n……是你自己写的。']) },
          { x: 10, y: 1, spr: 'owin', on: S => S.narr('窗户关得严严实实。\n空调停了，屋子里有点闷。') },
          { id: 'mydesk', x: 2, y: 3, spr: 'workdesk', s: { scr: true }, lit: true, col: '#9a8a74', light: { r: 3.4, col: 'rgba(255,220,150,.16)', dy: 0 }, async on(S) {
            if (S.f.knows) return S.narr('屏幕上的周报还停在第二段。\n……今晚是写不完了。');
            await S.narr('你的工位。显示器还亮着，周报写到一半。\n台灯底下压着一张寻人启事——是物业今天发到每个工位上的。');
            await S.think('（周屿，二十八岁，十一月十九日晚……身穿深灰色卫衣……）\n（照片是去年团建时拍的。他笑得像个傻子。）');
          } },
          { x: 4, y: 3, spr: 'workdesk', col: '#8a7a66', on: S => S.narr('王姐的工位。桌上摆着一排多肉，还有一张儿子的奖状。') },
          { id: 'zdesk', x: 7, y: 3, spr: 'workdesk', col: '#8a7a66', s: { cup: true, note: true }, on: S => zhouDesk(S) },
          { x: 9, y: 3, spr: 'workdesk', col: '#8a7a66', on: S => S.narr('空工位。上个月的实习生走了以后，一直没人坐。') },
          { x: 2, y: 6, spr: 'workdesk', col: '#8a7a66', on: S => S.narr('老陈的工位。椅背上搭着一件外套。\n……他今天不是请假了吗？') },
          { x: 4, y: 6, spr: 'workdesk', col: '#8a7a66', on: S => S.narr('键盘上落了一层薄灰。') },
          { x: 7, y: 6, spr: 'workdesk', col: '#8a7a66', on: S => S.narr('显示器上贴着一张便利贴：「别动我的机械键盘」。') },
          { x: 9, y: 6, spr: 'workdesk', col: '#8a7a66', on: S => S.narr('隔板上钉着一张日历。十一月十九日那一格，被人用红笔圈了起来。\n旁边写着：周屿生日。') },
          { id: 'printer', x: 10, y: 8, spr: 'printer', s: { paper: true }, async on(S) {
            if (S.once('forum')) await S.narr('打印机的出纸托盘里还躺着几页纸。\n纸已经凉透了。最后一页的页脚印着：打印人 周屿。');
            await S.note('forum');
          } },
          { x: 1, y: 8, spr: 'dispenser', on: S => S.narr('饮水机「咕咚」响了一声。\n整层楼安静得只剩下这一个声音。') },
          { x: 1, y: 5, spr: 'plant', on: S => S.narr('前台搬上来的发财树。叶子黄了一半。') },
          { x: 12, y: 1, spr: 'odoor', col: '#4a5a4a', on: S => S.narr('楼梯间的防火门。\n门上贴着告示：「夜间22:00后楼梯间锁闭，请乘坐电梯」。拧了一下——锁着。') },
          { x: 13, y: 1, spr: 'exitsign' },
          { id: 'e3', x: 14, y: 1, spr: 'elevdoor', lit: true, light: { r: 2.2, col: 'rgba(255,120,80,.12)' }, async on(S) {
            if (!S.f.knows) { await S.narr('3号梯。\n三天前，周屿就是在这里走进去的。'); return S.think('（……走之前，再去周屿的工位看一眼吧。）'); }
            S.f.floor = 10; S.sfx('ding');
            await S.go('elev', 5, 5, 3);
          } },
          { x: 17, y: 1, spr: 'elevdoor', on: S => S.narr('1号梯。门上贴着黄色的纸：「设备检修 暂停使用」。\n整栋楼晚上只剩下3号梯在跑。') },
          { x: 18, y: 2, spr: 'plant' },
          { x: 16, y: 5, spr: 'invisible', light: { r: 3.6, col: 'rgba(200,220,255,.06)' } },
          { x: 14, y: 6, w: 2, spr: 'table2', col: '#6a6e76', on: S => S.narr('会议区。桌上还摊着周一例会的投影仪遥控器。\n例会上，周屿的位置一直空着。') },
          { x: 14, y: 5, spr: 'chair', col: '#3a3e46' }, { x: 15, y: 5, spr: 'chair', col: '#3a3e46' },
          { x: 17, y: 7, w: 2, spr: 'sofa', col: '#3a4250', on: S => S.narr('休息区的沙发。周屿午睡的时候总是霸占这里，脚翘在扶手上。') }
        ],
        async enter(S, first) {
          if (!first) return;
          S.give('phone', true);
          await S.narr('十一点四十。\n整层楼的灯都关了，只剩你头顶这一盏。');
          await S.think('（周屿的工位，三天没人动过了。\n警察来拍过照，物业来贴过封条，后来封条又撕了。）');
          await S.think('（那天晚上他在群里发的最后一句话是：\n「我下楼拿个外卖，顺便试个东西，回来跟你们讲。」）');
          S.goal('去周屿的工位看看');
        }
      },
      /* ---------------- 3号梯 ---------------- */
      elev: {
        amb: 'elevator', dark: .82, plr: 2.6, wall: 'metal', floor: 'metal', darkC: '#040406',
        legend: { 'n': 'linoleum', 'D': 'darkred' }, tileOpts: { carpetC: '#3a4250' },
        rows: [
          '###########',
          '###########',
          'nnnnnnnnnnn',
          'nnnnnnnnnnn',
          '####mmm####',
          '##mmmmmmm##',
          '##mmmmmmm##',
          '##mmmmmmm##',
          '###########'],
        ents: [
          { id: 'sgnL', x: 2, y: 1, spr: 'flnum', num: '10' },
          { id: 'sgnR', x: 8, y: 1, spr: 'flnum', num: '10' },
          { id: 'clight', x: 5, y: 2, spr: 'invisible', light: { r: 3.4, col: 'rgba(255,210,140,.12)' } },
          { id: 'c_pl1', x: 0, y: 2, spr: 'plant', hidden: true },
          { id: 'c_pl2', x: 10, y: 2, spr: 'plant', hidden: true },
          { id: 'wallman', x: 2, y: 2, spr: '@wallman', dir: 3, hidden: true },
          { id: 'faceless', x: 5, y: 3, spr: '@faceless', hidden: true },
          { id: 'runner', x: 0, y: 3, spr: '@runner', hidden: true },
          { id: 'ball', x: 9, y: 3, spr: 'ball', hidden: true, solid: false },
          { id: 'dbl', x: 5, y: 2, spr: '@me', dir: 3, hidden: true },
          { id: 'thing2', x: 9, y: 2, spr: 'thingS', hidden: true, solid: false, light: { r: 2.4, a: .5, dy: -6, col: 'rgba(255,30,30,.3)' } },
          { id: 'zrun', x: 0, y: 3, spr: '@zhou', hidden: true },
          { id: 'owoman', x: 5, y: 2, spr: '@woman', dir: 3, hidden: true },
          { id: 'shaft', x: 0, y: 0, spr: 'shaft', z: 1, solid: false },
          { id: 'edoor', x: 4, y: 4, w: 3, spr: 'edoor', open: 0, solid: false, async on(S) {
            const f = S.f;
            if (f.woman) return S.think('（不要动。不要回头。）');
            if (!f.dopen) return S.narr(f.ritOn ? '门紧紧地合着。门缝里透进来一丝冷风。' : '电梯门关着。按钮在右手边。');
            if (canExit(S)) return S.narr('门开着。');
            return S.think('（规则说：每到一层，都不要出去。）');
          } },
          { id: 'led', x: 3, y: 4, spr: 'led', num: '10', on: S => S.narr(`楼层显示屏：${S.f.floor}。\n红色的数字一跳一跳的，像是有点接触不良。`) },
          { id: 'panel', x: 7, y: 4, spr: 'panel', on: S => panel(S) },
          { x: 9, y: 5, spr: 'invisible', solid: true, on: S => S.narr(S.f.world === 'o' ? '电梯的检验合格证。日期、编号、签字，全是空白的。' : '电梯检验合格证。下次检验日期：2019年12月。\n维保电话那一栏，被人用指甲刮花了。') },
          { x: 1, y: 7, spr: 'invisible', solid: true, on: S => S.narr('轿厢的角落。不锈钢的墙板上，模模糊糊映出一个人影。\n……那是你自己。') },
          { id: 'ilight', x: 5, y: 6, spr: 'invisible', solid: false, light: { r: 3.2, col: 'rgba(230,240,255,.12)' } },
          { id: 'woman', x: 5, y: 3, spr: 'womanS', hidden: true, solid: true },
          ...['blk1', 'blk2', 'blk3'].map(id => ({ id, x: 0, y: 6, spr: 'invisible', solid: true, hidden: true }))
        ],
        async enter(S, first) {
          const f = S.f;
          scene(S, f.floor, f.world); S.ent('edoor').open = 1; f.dopen = 1; setSolid(S);
          S.ent('led').num = String(f.floor);
          if (first) await S.narr('3号梯。\n不锈钢的轿厢擦得很亮，头顶的灯管发出很轻的嗡嗡声。');
          if (f.world === 'o' && f.gotNb && !f.fled) {
            f.fled = true; f.ritOn = true; f.seq = 0; S.clearTimer(); S.stop('thing'); S.hide('thing');
            await doors(S, 0); shut(S);
            S.sfx('thud'); S.shake(400, 2);
            await S.narr('门合上的瞬间，外面有什么东西重重地撞在了门上。\n……然后，就什么声音都没有了。');
            await S.think('（回去。同样的顺序，再走一遍。）');
            S.cp('elev');
          }
          rgoal(S);
        },
        step(S, x, y) { if (y <= 3) return exitElev(S); }
      },
      /* ---------------- 一楼大堂 ---------------- */
      lobby: {
        amb: 'room', dark: .62, plr: 3.4, wall: 'plain', floor: 'marble',
        rows: LOBBY_ROWS,
        ents: LOBBY_ENTS.map(e => Object.assign({}, e)),
        async enter(S, first) {
          if (S.f.home2) {
            if (S.once('home2Lobby')) {
              S.ent('guard').dir = 0;
              await S.narr('一楼大堂。\n灯是暖黄色的。收音机里唱着戏。\n老郑醒着，正低头往登记簿上写着什么。');
              rgoal(S);
            }
            return;
          }
          if (first) {
            S.bubble('guard', '…', 1800);
            await S.narr('一楼大堂。\n值班台后面，保安老郑歪在椅子上，收音机里小声地放着戏。');
            S.goal('去值班台看看');
          }
        }
      },
      /* ---------------- 回来以后的一楼大堂（左右镜像：钥匙箱、电梯都换到了另一边） ---------------- */
      lobby2: {
        amb: 'room', dark: .62, plr: 3.4, wall: 'plain', floor: 'marble',
        rows: LOBBY_ROWS,
        ents: LOBBY_ENTS.map(e => Object.assign({}, e, { x: 17 - e.x - ((e.w || 1) - 1) }, e.id === 'plaque' ? { s: { rev: true } } : {})),
        async enter(S) {
          if (S.once('homeLobby')) {
            S.ent('lclock').s.rev = true; S.ent('guard').dir = 0;
            await S.narr('大堂的灯很亮。大理石地面上，映着你自己的影子。\n值班台后面，老郑醒了，正端着保温杯看着你。');
            rgoal(S);
          }
        }
      },
      /* ---------------- 隐藏：另一边的十二楼 ---------------- */
      o12: {
        amb: 'otherworld', dark: .88, plr: 2.6, wall: 'red', floor: 'redfloor', darkC: '#0a0203',
        rows: [
          '################',
          '################',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '################'],
        ents: [
          { id: 'oe12', x: 7, y: 1, spr: 'elevdoor', lit: true, light: { r: 2, col: 'rgba(255,40,40,.16)' }, on: S => S.narr(S.f.got12 ? '……' : '电梯门关着。按了下行键，没有反应。\n……像是在等你先做完什么。') },
          ...[2, 4, 10, 12, 14].flatMap(x => [3, 6].flatMap(y => [
            { x, y, spr: 'workdesk', col: '#5a3a3a', s: { scr: true }, light: { r: 1.3, col: 'rgba(120,150,200,.12)', dy: 0 }, on: S => S.narr('同一张工位。同一只干掉的马克杯。\n屏幕上是一行一行的数字：4 2 6 2 10 5 1　4 2 6 2 10 5 1……') },
            { x, y: y + 1, spr: '@zhou', dir: 3, on: S => S.narr(['深灰色的卫衣，乱糟糟的头发。\n他一动不动地盯着屏幕，手指在桌面上一下一下地点着。', '4。2。6。2。10。5。1。', '……你没敢叫他的名字。']) }
          ])),
          { id: 'n12', x: 15, y: 5, spr: 'note', on: S => twelveNote(S) },
          { x: 15, y: 2, spr: 'deadplant' }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('十二楼。\n一模一样的工位，一排接一排。每一张工位前面，都坐着一个人。');
          await S.narr('深灰色的卫衣。乱糟糟的头发。\n……他们都背对着你。');
          await S.think('（周屿……？）');
          S.goal('他们中间，掉着一页纸');
        }
      },
      /* ---------------- 另一边的十楼 ---------------- */
      other: {
        amb: 'otherworld', dark: .86, plr: 2.8, wall: 'red', floor: 'redfloor', darkC: '#0a0203',
        legend: { 'n': 'redfloor' },
        rows: OFFICE_ROWS,
        ents: [
          { id: 'ocross', x: 2, y: 1, spr: 'owin', s: { red: true, cross: true }, light: { r: 1.8, col: 'rgba(255,40,40,.25)' }, on: S => redCross(S) },
          { x: 4, y: 1, spr: 'owin', s: { red: true }, on: S => S.narr('窗外没有楼，没有路，没有灯。\n只有一大片暗红色的天，低低地压在地平线上。') },
          { x: 6, y: 1, spr: 'wclock', s: { nohands: true }, on: S => S.narr('墙上的钟没有指针。\n可你还是能听见它在「嗒、嗒」地走。') },
          { x: 8, y: 1, w: 2, spr: 'wboard', s: { nums: true }, on: S => S.narr(['白板上写满了数字，一行接一行：\n4 2 6 2 10 5 1　4 2 6 2 10 5 1　4 2 6 2 10 5 1……', '是周屿的字。越往下越乱，最后几行几乎是刻上去的。', '最底下一行，只有一个数字，被圈了好几圈：\n\n　12']) },
          { x: 10, y: 1, spr: 'owin', s: { red: true }, on: S => S.narr('你把额头贴在玻璃上往下看。\n楼下没有地面。只有一层一层的窗户，一直往下，看不到底。') },
          { x: 2, y: 3, spr: 'workdesk', col: '#5a3a3a', s: { note: true }, async on(S) {
            await S.narr('你的工位。周报的文件还开着——不，屏幕是黑的。\n显示器上贴着一张黄色的便利贴。');
            await S.say('便利贴', '小满？\n你也来了？', { style: 'whisper' });
            await S.think('（……是周屿的字。）');
          } },
          { x: 4, y: 3, spr: 'workdesk', col: '#5a3a3a', on: S => S.narr('王姐的多肉全枯了。花盆里的土，干得像灰。') },
          { id: 'ozdesk', x: 7, y: 3, spr: 'workdesk', col: '#5a3a3a', async on(S) { if (S.f.gotNb) return S.narr('周屿的工位。椅子是冷的。'); await S.narr('周屿的工位。椅子拉开着，好像有人刚站起来。\n椅子底下，掉着一本黑色的笔记本。'); return notebook(S); } },
          { id: 'nb', x: 7, y: 4, spr: 'book', col: '#1a1a1e', on: S => notebook(S) },
          { x: 9, y: 3, spr: 'workdesk', col: '#5a3a3a', on: S => S.narr('隔板上那张寻人启事还在。\n照片的位置是空白的。') },
          { x: 2, y: 6, spr: 'workdesk', col: '#5a3a3a', on: S => S.narr('椅背上搭着一件外套。\n你伸手摸了一下——布料是湿的，冰凉冰凉。') },
          { x: 4, y: 6, spr: 'workdesk', col: '#5a3a3a', on: S => S.narr('键盘上的字母全被抠掉了。') },
          { x: 7, y: 6, spr: 'workdesk', col: '#5a3a3a', async on(S) { await S.narr('你掏出手机想照个亮。\n屏幕是黑的。长按电源键——没有任何反应。'); if (!S.f.phoneDead) { S.f.phoneDead = true; S.take('phone'); S.give('phoneD', true); } } },
          { x: 9, y: 6, spr: 'workdesk', col: '#5a3a3a', on: S => S.narr('日历上每一天都被红笔圈了起来。\n每一格里都写着同一个日期：11月19日。') },
          { x: 10, y: 8, spr: 'printer', s: { red: true }, on: S => S.narr('打印机的指示灯是红的。\n出纸口吐出半张纸，上面只印了一行字：你是一个人吗？') },
          { x: 1, y: 8, spr: 'dispenser', s: { red: true }, on: S => S.narr('饮水机的水桶里，水是暗红色的。\n……大概只是光线的缘故。') },
          { x: 1, y: 5, spr: 'deadplant' },
          { x: 12, y: 1, spr: 'odoor', col: '#3a1a1a', s: { blank: true }, on: S => S.narr('楼梯间的门。门上的告示、门牌，全是空白的。\n门把手一动不动，像是和门框焊在了一起。') },
          { id: 'oe3', x: 14, y: 1, spr: 'elevdoor', lit: true, light: { r: 2.4, col: 'rgba(255,40,40,.18)' }, on: S => oe3Door(S) },
          { x: 17, y: 1, spr: 'elevdoor', on: S => S.narr('1号梯。门缝里在往外渗着什么。\n你没有凑近去看。') },
          { x: 18, y: 2, spr: 'deadplant' },
          ...[[14, 3], [13, 4], [13, 6], [12, 7], [11, 7], [9, 6], [8, 5]].map(([x, y]) => ({ x, y, spr: 'footprints', decal: true, col: 'rgba(30,6,8,.55)' })),
          { x: 14, y: 6, w: 2, spr: 'table2', col: '#3a2a2a', on: S => S.narr('会议桌上摆着十几只纸杯，一圈一圈地围着桌子。\n每一只里面，都盛着一点点暗红色的水。') },
          { x: 14, y: 5, spr: 'chair', col: '#2a1a1a' }, { x: 15, y: 5, spr: 'chair', col: '#2a1a1a' },
          { x: 17, y: 7, w: 2, spr: 'sofa', col: '#3a1a1e', on: S => S.narr('沙发上留着一个人形的凹陷。\n凹陷还是温的。') },
          { id: 'thing', x: 17, y: 7, spr: 'thingS', hidden: true, solid: false, light: { r: 2.4, a: .5, dy: -6, col: 'rgba(255,30,30,.3)' } }
        ],
        async enter(S, first) {
          const f = S.f;
          if (!f.gotNb && !W.timer) S.timer(75, '红十字熄灭前', stayedTooLong);
          if (!first) return;
          await S.narr('你走出了电梯。\n一样的走廊，一样的门。可是没有一盏灯是亮的，空气里有一股铁锈的味道。');
          await S.think('（这里……只有我一个人。）');
          S.goal('找到周屿留下的东西');
        }
      }
    }
  });
})();
