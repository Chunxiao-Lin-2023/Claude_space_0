/* ================= 第九夜 · 天蛾人 ================= */
(() => {
  /* ---------- 常量 ---------- */
  const ANSWER = '352614';                                   // 按日期从早到晚：③红眼睛 ⑤狗 ②黑衣人 ⑥河上的光 ①电视 ④电话
  const BR_BASE = 86, BR_MIN = 76, BR_FLOOR = 74;            // 桥上的倒计时（秒）：基础 / 排错卡后最少 / 死后重来的下限
  const BOARD_PEN = 3, ARG_PEN = 9;                          // 排错一次扣桥上 3 秒；劝错一句扣 9 秒
  const CHASE_SPD = 2.8, CHASE_WAIT = 1.0;                   // TNT：它的速度（格/秒）、现身后愣多久才追
  const LAMPS = [8, 18, 23, 28, 38, 43];                     // 桥灯（北侧护栏）
  const VER = ['v1', 'v2', 'v4', 'v5', 'v6'];                // 要核实的五张卡（③是诺拉自己的）
  const PEOPLE_B = ['doris', 'carl', 'bud'];
  let deaths = 0, brDeaths = 0;                              // 本次游玩死过几次（不随检查点回滚，重来时给提示用）
  const SND = { wing: 0, ring: 0, honk: 4, scr: 6, creak: 9, tv: 0 };
  const FONT = '"Noto Sans CJK SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';

  /* 所有实体都编 id（检查点按 id 对应） */
  function ids(map, ents) { ents.forEach((e, i) => { if (!e.id) e.id = map + '_' + i; }); return ents; }
  function grid(w, h, c) {
    const g = [...Array(h)].map(() => Array(w).fill(c));
    const api = {
      set(x, y, ch) { if (y >= 0 && y < h && x >= 0 && x < w) g[y][x] = ch; return api; },
      rect(x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) api.set(x, y, ch); return api; },
      rows() { return g.map(r => r.join('')); }
    };
    return api;
  }
  /* 精灵里写字：借 R 拿到当前绘制偏移 */
  const TXC = new Map();
  function txtBmp(s, px, col) {
    const k = s + '|' + px + '|' + col; let c = TXC.get(k); if (c) return c;
    const m = mk(8, 8).getContext('2d'); m.font = `bold ${px}px ${FONT}`;
    const w = Math.ceil(m.measureText(s).width) + 2, h = px + 4;
    c = mk(w, h); const x = c.getContext('2d');
    x.font = `bold ${px}px ${FONT}`; x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, w / 2, h / 2 + 1);
    const im = x.getImageData(0, 0, w, h), d = im.data;
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 96 ? 255 : 0;
    x.putImageData(im, 0, 0); TXC.set(k, c); return c;
  }
  function txt(g, R, s, a, b, px, col) {
    let X = 0, Y = 0; const f = g.fillRect; g.fillRect = (x, y) => { X = x; Y = y; }; R(a, b, 1, 1, '#000'); g.fillRect = f;
    const c = txtBmp(s, px, col); g.drawImage(c, Math.round(X - c.width / 2), Math.round(Y - c.height / 2));
  }
  const clockStr = m => { const h = Math.floor(m / 60), mm = m % 60; return (h >= 12 ? '下午 ' : '上午 ') + (h > 12 ? h - 12 : h) + ':' + String(mm).padStart(2, '0'); };

  /* ================= 声音（S.tone 合成，双方都听得到） ================= */
  function screech(S, vol = 1, d0 = 0) {   // 它的叫声：又尖又高、往下掉，像女人尖叫混着耗子叫
    S.tone('sawtooth', 2500, 1250, .6, .05 * vol, d0, 3800);
    S.tone('square', 3300, 1700, .45, .02 * vol, d0 + .04, 5200);
    S.tone('sine', 1900, 850, .75, .05 * vol, d0 + .06, 0);
  }
  function wingbeat(S, vol = 1) { S.tone('triangle', 95, 52, .2, .13 * vol, 0, 420); S.tone('sawtooth', 170, 70, .14, .03 * vol, .02, 600); }
  function beeps(S, n = 3, d0 = 0) { for (let i = 0; i < n; i++) S.tone('sine', 1400, 1400, .12, .07, d0 + i * .24, 0); }
  function whine(S, dur = 1.6) { S.tone('sine', 3150, 3230, dur, .03, 0, 0); S.tone('square', 60, 60, dur, .02, 0, 300); }
  function ring(S) { for (const d of [0, .42]) { S.tone('square', 1100, 1100, .34, .025, d, 3000); S.tone('square', 1320, 1320, .34, .018, d, 3000); } }
  function honk(S, f = 330, d0 = 0, vol = 1) { S.tone('square', f, f, .32, .028 * vol, d0, 1500); S.tone('square', f * 1.26, f * 1.26, .32, .018 * vol, d0, 1500); }
  function creak(S, vol = 1) { S.tone('sawtooth', 72, 46, 1.3, .045 * vol, 0, 300); S.tone('triangle', 190, 118, .9, .022 * vol, .25, 600); }
  function snap(S) { S.tone('square', 2700, 300, .05, .24, 0, 7000); S.tone('sawtooth', 900, 60, .28, .13, .01, 2500); S.tone('triangle', 120, 38, 1.4, .12, .05, 500); }
  function jingle(S) { [784, 988, 1175, 988, 1319].forEach((f, i) => S.tone('triangle', f, f, .22, .05, i * .18, 3000)); }

  /* ================= 人物 ================= */
  const PEOPLE_M = {
    me: { skin: '#f0d2b6', hair: '#6a4426', hs: 'bob', top: '#3c5a48', top2: '#e8dcc0', coat: true, bottom: '#2c2a30', shoes: '#1a1414' },
    bud: { skin: '#eac4a0', hair: '#c08a3a', hs: 'messy', top: '#6a4a2a', top2: '#3a2a1a', bottom: '#34466a', shoes: '#2a1e14', hat: 'cap', hatC: '#8a2a24' },
    hal: { key: 'mm-hal', skin: '#e8c4a4', hair: '#d8d6d0', hs: 'short', top: '#e2ded2', top2: '#6a2a2a', bottom: '#3a3a3e', shoes: '#1a1a1a',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 2, 1, '#2a2a2a'); R(9, G.hT + 4, 2, 1, '#2a2a2a'); R(7, G.hT + 4, 2, 1, '#5a5a5a'); R(7, G.tT + 1, 2, 6, '#6a2a2a'); } else if (d === 1) R(4, G.hT + 4, 3, 1, '#2a2a2a'); } },
    doris: { skin: '#f2d0b8', hair: '#c0452a', hs: 'bun', top: '#d88a9a', top2: '#ffffff', apron: '#f4f2ee', skirt: true, bottom: '#d88a9a', shoes: '#f0f0f0', mouth: '#b0303a' },
    carl: { key: 'mm-carl', skin: '#dcb090', hair: '#3a2818', hs: 'short', top: '#9a2a24', top2: '#2a1a1a', bottom: '#34466a', shoes: '#2a1e14', hat: 'cap', hatC: '#2e3e2a',
      extra(g, d, fr, G, R) { for (let i = 0; i < 3; i++) R(4, G.tT + 2 + i * 3, 8, 1, '#5a1612'); } },
    susie: { skin: '#f6d6be', hair: '#e2b250', hs: 'twin', top: '#3a6aa6', coat: true, bottom: '#3a6aa6', skirt: true, shoes: '#8a2a2a', child: true },
    mae: { skin: '#e6c8b0', hair: '#cfcac4', hs: 'bun', top: '#6a5a7a', top2: '#e8e0d8', bottom: '#4a3a4a', skirt: true, shoes: '#2a2222' },
    mib: { key: 'mm-mib', skin: '#d8c8a0', hair: '#0a0a0a', hs: 'short', top: '#141418', top2: '#f0f0ea', coat: true, bottom: '#141418', shoes: '#050505', eye: '#000',
      extra(g, d, fr, G, R) {
        R(3, G.hT - 1, 10, 2, '#0c0c0e'); R(4, G.hT - 3, 8, 2, '#0c0c0e'); R(4, G.hT - 1, 8, 1, '#2a1a1a');
        if (d === 0) { R(7, G.tT, 2, 7, '#050505'); R(6, G.hT + 6, 4, 1, '#7a3a3a'); }
      } },
    man1: { skin: '#e0bc9c', hair: '#4a3a2a', hs: 'short', top: '#4a4a5a', coat: true, bottom: '#2a2a30', shoes: '#141414', hat: 'cap', hatC: '#3a3a3a' },
    woman1: { skin: '#f0d0b8', hair: '#2a1e18', hs: 'long', top: '#7a4a3a', coat: true, bottom: '#3a2a2a', skirt: true, shoes: '#2a1a1a' },
    man2: { skin: '#c8a080', hair: '#1a1410', hs: 'short', top: '#2a3a5a', coat: true, bottom: '#2a2a2a', shoes: '#141414' }
  };

  /* ================= 惊吓大头像（32×32） ================= */
  const FACES_M = {
    /* 天蛾人：没有脖子，脑袋长在肩膀里；两只自行车尾灯一样的红眼睛越瞪越大；身后张开的翅膀 */
    moth(R, a) {
      const K = '#0a0808', W1 = '#1c1816', W2 = '#2a2420', RB = '#3e3630', B = '#3c3632', B2 = '#4c443e', F = '#5e564e';
      R(0, 0, 32, 32, K);
      for (let r = 0; r < 26; r++) { const ext = r < 8 ? 4 + r : 12 - ((r - 8) >> 1); R(0, 4 + r, ext, 1, r % 6 === 3 ? RB : W1); R(32 - ext, 4 + r, ext, 1, r % 6 === 3 ? RB : W1); }
      for (let i = 0; i < 4; i++) { R(1 + i * 2, 6 + i * 4, 1, 20 - i * 4, W2); R(30 - i * 2, 6 + i * 4, 1, 20 - i * 4, W2); }
      R(10, 2, 12, 30, B); R(8, 7, 16, 25, B); R(12, 0, 8, 3, B); R(11, 2, 10, 2, B2); R(21, 6, 3, 26, '#2e2a26');
      for (let i = 0; i < 14; i++) R(9 + ((i * 7) % 14), 5 + ((i * 11) % 25), 1, 2, F);
      const er = 3 + Math.round(a * 1.5);
      for (const cx of [12, 20]) {
        const cy = 11;
        R(cx - er - 1, cy - er + 1, (er + 1) * 2, er * 2 - 2, '#5a0604'); R(cx - er, cy - er, er * 2, er * 2, '#5a0604');
        R(cx - er, cy - er + 1, er * 2, er * 2 - 2, '#d8160c'); R(cx - er + 1, cy - er, er * 2 - 2, er * 2, '#d8160c');
        R(cx - er + 1, cy - er + 1, er * 2 - 2, er * 2 - 2, '#ff5a30');
        R(cx - 1, cy - 1, 2, 2, '#fff0d0');
      }
    },
    /* 黑西装的男人：礼帽、蜡一样光的脸、离得太开的细眼，一张越咧越大的笑 */
    mib(R, a) {
      const HAT = '#0c0c0e', HB = '#22222a', SK = '#d8c8a0', SK2 = '#b6a67e', K = '#050505', SH = '#f0f0ea', SU = '#121216';
      R(0, 0, 32, 32, '#060608');
      R(8, 0, 16, 7, HAT); R(9, 1, 14, 1, HB); R(3, 7, 26, 2, HAT); R(8, 6, 16, 1, '#3a1a1a');
      R(8, 9, 16, 15, SK); R(9, 24, 14, 2, SK); R(11, 26, 10, 1, SK); R(21, 9, 3, 15, SK2); R(8, 9, 16, 1, SK2);
      R(8, 13, 5, 1, K); R(19, 13, 5, 1, K); R(9, 14, 3, 1, '#4a4a4a'); R(20, 14, 3, 1, '#4a4a4a');
      R(15, 15, 2, 4, SK2);
      const w = 8 + Math.round(a * 10), x0 = 16 - (w >> 1);
      R(x0, 21, w, 1, '#5a1a1a'); R(x0 - 1, 20, 1, 1, '#5a1a1a'); R(x0 + w, 20, 1, 1, '#5a1a1a');
      if (a > .35) for (let i = 1; i < w - 1; i += 2) R(x0 + i, 22, 1, 1, SH);
      R(1, 27, 30, 5, SU); R(12, 26, 8, 6, SH); R(15, 26, 2, 6, K);
    }
  };

  /* ================= 瓦片 ================= */
  const TOWERS = [13, 33];
  const chainY = X => {   // 吊链在天空第二行里的高度（像素，0=顶）
    if (X >= 13 && X <= 33) { const t = (X - 13) / 20; return 2 + 12 * (1 - Math.pow(2 * t - 1, 2)); }
    if (X < 13) return 2 + Math.min(14, (13 - X) * 1.7);
    return 2 + Math.min(14, (X - 33) * 1.7);
  };
  const TILES_M = {
    dsky: { solid: true, paint(R, X, Y) {
      R(0, 0, 16, 6, '#241e3a'); R(0, 6, 16, 5, '#3a2a48'); R(0, 11, 16, 5, '#5a3448');
      if (hash(X, Y, 3) < .2) R((hash(X, Y, 4) * 15) | 0, (hash(X, Y, 5) * 6) | 0, 1, 1, '#9a8ab0');
    } },
    dsky2: { solid: true, paint(R, X, Y) {
      R(0, 0, 16, 4, '#7a3a4a'); R(0, 4, 16, 4, '#a85448'); R(0, 8, 16, 3, '#c87a50');
      const h = (10 + Math.sin(X * .5) * 2 + hash(X, 0, 9) * 2) | 0; R(0, h, 16, 16 - h, '#1a1620'); R(0, h, 16, 1, '#2a2230');
      if (X > 36 && hash(X, 1, 7) < .5) R((hash(X, 2, 7) * 14) | 0, h + 2, 1, 1, '#f0c870');
      for (let i = 0; i < 16; i += 2) { const y = Math.round(chainY(X + i / 16)); R(i, y, 2, 2, '#c8ccd0'); R(i, y + 2, 2, 1, '#7a7e84'); if ((X * 16 + i) % 12 === 0) R(i, y + 3, 1, 16 - y - 3, '#8a8e94'); }
    } },
    truss: { solid: true, paint(R, X, Y) {
      R(0, 0, 16, 16, '#141218');
      for (let i = 0; i < 16; i += 4) R(i, 0, 1, 12, '#9aa0a8');
      R(0, 2, 16, 2, '#c8ccd2'); R(0, 9, 16, 3, '#aab0b8'); R(0, 12, 16, 4, '#5a5e66');
      for (let i = 0; i < 16; i += 8) { R(i + 1, 4, 1, 1, '#9aa0a8'); R(i + 2, 5, 1, 1, '#9aa0a8'); R(i + 3, 6, 1, 1, '#9aa0a8'); R(i + 4, 7, 1, 2, '#9aa0a8'); }
      if (Y > 4) R(0, 0, 16, 2, '#2a2a30');
    } },
    walk: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#6e6c6a'); for (let y = 0; y < 16; y += 4) R(0, y, 16, 1, '#5c5a58'); if (hash(X, Y, 2) < .3) R(4, 6, 3, 1, '#7c7a78'); R(0, 15, 16, 1, '#3a3836'); } },
    lane: { solid: false, paint(R, X, Y) { speck(R, '#34343a', ['#3e3e44', '#2a2a30'], X, Y, 14, 12); if (Y === 4) for (let i = 0; i < 16; i += 8) R(i + 1, 15, 5, 1, '#a89040'); } },
    river: { solid: true, paint(R, X, Y) {
      R(0, 0, 16, 16, Y === 7 ? '#141a26' : '#18202e');
      for (let i = 0; i < 3; i++) { const h = hash(X, Y, 20 + i); R((h * 12) | 0, (hash(X, Y, 30 + i) * 14) | 0, 3, 1, i === 0 && Y < 9 ? '#8a5a40' : '#2a3a52'); }
    } },
    fwall: { solid: true, paint(R, X, Y) {
      R(0, 0, 16, 16, '#6a6a66'); R(0, 0, 16, 2, '#8a8a84'); R(0, 14, 16, 2, '#4a4a46');
      if (X % 4 === 0) R(0, 0, 1, 16, '#55554f');
      if (hash(X, Y, 3) < .4) R(((hash(X, Y, 4) * 12) | 0) + 1, 3, 1, 9, '#5a5a54');
    } },
  };

  /* ================= 精灵 ================= */
  const SPR_M = {
    /* 天蛾人：灰褐色、比人高，脑袋长在肩膀里，两点红眼；open = 张开翅膀，s.fly = 飞着 */
    moth(g, e, t, R) {
      const fly = !!e.fly, sp = !!e.open;
      const bob = fly ? Math.round(Math.sin(t * 5) * 1.5) : 0, fl = fly ? Math.round(Math.sin(t * 9) * 2) : 0;
      const y = -24 + bob;
      const B = '#4a4540', B2 = '#38332f', B3 = '#5e5850', WG = '#26211e', WR = '#3e3732';
      if (!fly) R(1, 14, 14, 2, 'rgba(0,0,0,.4)');
      if (sp) {
        for (let r = 0; r < 18; r++) {
          const ext = r < 6 ? 5 + r * 2 : 17 - (r - 6), yy = y + 5 + r - (r > 3 ? fl : 0), c = r % 5 === 2 ? WR : WG;
          R(3 - ext, yy, ext, 1, c); R(13, yy, ext, 1, c);
        }
        for (let i = 0; i < 4; i++) { R(-12 + i * 4, y + 23 - fl + (i % 2), 2, 2, WG); R(18 + i * 4, y + 23 - fl + (i % 2), 2, 2, WG); }
      } else { R(1, y + 6, 14, 22, WG); R(0, y + 9, 16, 15, WG); R(2, y + 5, 12, 2, WR); R(1, y + 10, 1, 12, WR); R(14, y + 10, 1, 12, WR); }
      R(4, y + 2, 8, 22, B); R(3, y + 6, 10, 14, B); R(5, y, 6, 3, B); R(10, y + 3, 2, 20, B2); R(5, y + 3, 1, 18, B3);
      if (!fly) { R(5, y + 24, 2, 14 - (y + 24) + 0, B2); R(9, y + 24, 2, 14 - (y + 24), B2); R(4, 14, 3, 1, '#221e1c'); R(9, 14, 3, 1, '#221e1c'); }
      else { R(5, y + 24, 2, 4, B2); R(9, y + 24, 2, 4, B2); }
      const blink = Math.sin(t * 1.3 + e.px) > .985;
      if (!blink) { R(5, y + 3, 2, 2, '#ff2a14'); R(9, y + 3, 2, 2, '#ff2a14'); R(5, y + 3, 1, 1, '#ffd8c0'); R(9, y + 3, 1, 1, '#ffd8c0'); }
    },
    /* 黑洞洞的门框里两点红光（它还没出来） */
    eyes(g, e, t, R) { if (Math.sin(t * 1.7) > .96) return; R(5, -2, 2, 2, '#ff2a14'); R(9, -2, 2, 2, '#ff2a14'); R(5, -2, 1, 1, '#ffc8b0'); R(9, -2, 1, 1, '#ffc8b0'); },
    igloo(g, e, t, R) {
      const G1 = '#26341f', G2 = '#30422a', G3 = '#1a2618', C = '#7c7c74', C2 = '#5c5c56', D = '#3e4448';
      R(6, -7, 36, 4, G1); R(2, -3, 44, 6, G2); R(0, 3, 48, 27, G1); R(2, 0, 44, 3, G2);
      for (let i = 0; i < 12; i++) R(3 + ((i * 13) % 42), -2 + ((i * 7) % 26), 2, 1, G3);
      R(13, 6, 22, 24, C); R(13, 6, 22, 2, '#909088'); R(13, 28, 22, 2, C2); R(11, 8, 2, 22, C2); R(35, 8, 2, 22, C2);
      R(17, 11, 14, 19, e.open ? '#060606' : D);
      if (!e.open) { R(23, 11, 2, 19, '#2e3236'); R(27, 19, 2, 2, '#8a7a50'); R(18, 12, 12, 1, '#5a6064'); }
      txt(g, R, String(e.num || ''), 24, 8, 6, '#3a3a36');
      R(0, 30, 48, 2, 'rgba(0,0,0,.35)');
    },
    pdoor(g, e, t, R) { R(1, -4, 14, 18, '#2a1c16'); R(2, -3, 12, 17, '#030303'); R(1, -4, 14, 1, '#5a3a2a'); R(12, 2, 3, 1, '#4a3020'); R(2, 9, 5, 1, '#4a3020'); R(3, 10, 1, 4, '#4a3020'); },
    bwin(g, e, t, R) { R(2, 0, 12, 10, '#2a1c16'); R(3, 1, 10, 8, '#050608'); R(3, 1, 3, 2, '#5a6a7a'); R(10, 6, 3, 3, '#4a5a6a'); R(7, 1, 1, 8, '#2a1c16'); },
    prints(g, e, t, R) {
      const c = 'rgba(16,12,10,.75)';
      R(5, 3, 2, 5, c); R(3, 1, 1, 3, c); R(8, 1, 1, 3, c); R(5, 8, 2, 1, c);
      R(10, 9, 2, 5, c); R(8, 7, 1, 3, c); R(13, 7, 1, 3, c);
    },
    tntsign(g, e, t, R) { R(3, 2, 2, 13, '#4a3a2a'); R(11, 2, 2, 13, '#4a3a2a'); R(-2, -8, 20, 12, '#d8d0bc'); R(-2, -8, 20, 1, '#8a8070'); txt(g, R, '禁止入内', 8, -4, 6, '#a01a10'); R(0, 1, 16, 1, '#a01a10'); },
    /* 报社的软木板：六张卡片；s.solved = 红毛线连成螺旋 */
    board(g, e, t, R) {
      R(0, -3, 48, 17, '#4a2e1a'); R(1, -2, 46, 15, '#b08a5a');
      for (let i = 0; i < 14; i++) R(2 + ((i * 17) % 44), -1 + ((i * 5) % 13), 1, 1, '#9a7448');
      const C = [[4, 0], [14, 5], [22, -1], [31, 4], [38, -1], [40, 7]];
      if (e.solved) {
        for (let k = 0; k < 90; k++) { const an = k * .21, rd = 1 - k / 100; R(24 + Math.cos(an) * 20 * rd, 5 + Math.sin(an) * 6 * rd, 1, 1, '#c81c1c'); }
        R(22, 4, 5, 2, '#d0d4d8'); R(23, 3, 1, 1, '#d0d4d8'); R(25, 3, 1, 1, '#d0d4d8');
      } else { R(7, 2, 9, 1, '#c81c1c'); R(25, 1, 9, 1, '#c81c1c'); R(17, 7, 14, 1, '#c81c1c'); }
      C.forEach(([x, y], i) => { R(x, y, 6, 5, '#f2eee2'); R(x + 1, y + 2, 4, 1, '#8a8478'); R(x + 2, y, 2, 1, '#c02020'); txt(g, R, String(i + 1), x + 3, y + 3, 5, '#2a2a2a'); });
    },
    radio(g, e, t, R) { R(1, 2, 14, 12, '#5a3a22'); R(2, 3, 12, 10, '#7a5432'); R(3, 4, 6, 8, '#3a2a1a'); for (let y = 5; y < 12; y += 2) R(3, y, 6, 1, '#5a4430'); R(10, 5, 3, 2, '#e8d8a0'); R(10, 9, 3, 3, '#2a1a10'); R(3, 14, 2, 2, '#2a1a10'); R(11, 14, 2, 2, '#2a1a10'); },
    twdesk(g, e, t, R) { box(R, 0, 2, 16, 12, '#5d4632'); R(1, 3, 14, 2, '#7a6044'); R(3, -3, 10, 6, '#2a2c2e'); R(4, -2, 8, 2, '#4a4c50'); R(5, -7, 6, 5, '#f0ece0'); R(6, -6, 4, 1, '#8a8478'); },
    owin(g, e, t, R) {   // 报社的窗：看得见银桥
      box(R, 0, 0, 32, 12, '#4a3a2a'); R(1, 1, 30, 10, '#5a4a6a'); R(1, 6, 30, 5, '#8a5a50'); R(1, 9, 30, 2, '#2a2a3a');
      R(6, 2, 1, 8, '#c8ccd0'); R(24, 2, 1, 8, '#c8ccd0'); for (let i = 0; i < 18; i++) R(7 + i, 3 + Math.round(4 * (1 - Math.pow((i - 8.5) / 9, 2))), 1, 1, '#c8ccd0');
      R(1, 8, 30, 1, '#d0d4d8'); for (let i = 3; i < 30; i += 5) R(i, 8, 1, 1, '#ffe8a0');
      R(15, 1, 2, 10, '#4a3a2a');
    },
    files(g, e, t, R) { box(R, 1, -10, 14, 25, '#6a6e66'); for (let i = 0; i < 4; i++) { R(2, -9 + i * 6, 12, 5, '#7a7e76'); R(6, -7 + i * 6, 4, 1, '#c8c8b8'); } },
    papers(g, e, t, R) { for (let i = 0; i < 5; i++) R(2 + (i % 2), 10 - i * 2, 12, 2, i % 2 ? '#d8d2c0' : '#c8c2b0'); R(4, 3, 8, 1, '#555'); },
    coatrack(g, e, t, R) { R(7, -12, 2, 26, '#3a2a1a'); R(4, 13, 8, 2, '#3a2a1a'); R(3, -12, 10, 2, '#3a2a1a'); R(2, -10, 5, 12, '#4a3a5a'); R(1, -12, 6, 3, '#2a2a2a'); },
    /* 主街 */
    shopsign(g, e, t, R) { R(-6, -4, 28, 11, '#1a1410'); R(-5, -3, 26, 9, e.col || '#6a1a1a'); txt(g, R, e.text || '', 8, 1, 7, '#f0e6c8'); },
    neon(g, e, t, R) { const on = Math.sin(t * 7) > -.85 && !(Math.sin(t * 2.3) > .97); R(-6, -4, 28, 11, '#101014'); txt(g, R, e.text || '', 8, 1, 7, on ? '#ff5a7a' : '#4a2a32'); },
    xlamp(g, e, t, R) {
      R(7, -26, 2, 41, '#3a3d42'); R(4, 13, 8, 2, '#2a2d32'); R(3, -28, 10, 3, '#3a3d42'); R(4, -25, 8, 2, e.off ? '#555' : '#ffeaa0');
      for (let i = 0; i < 6; i++) R(6 + (i % 2) * 2, -18 + i * 4, 2, 2, '#2a5a2a');
      for (let i = 0; i < 6; i++) R(6 + ((i + 1) % 2) * 3, -17 + i * 4, 1, 1, ['#ff4040', '#ffd040', '#40a0ff'][(i + ((t * 2) | 0)) % 3]);
    },
    tvcrate(g, e, t, R) {
      R(1, 8, 14, 8, '#6a5032'); R(1, 11, 14, 1, '#4a3420');
      box(R, 1, -4, 14, 12, '#3a3230'); const p = e.power;
      if (p === 'static') { for (let y = -2; y < 6; y++) for (let x = 3; x < 11; x++) R(x, y, 1, 1, hash(x, y, (t * 30) | 0) < .5 ? '#ddd' : '#555'); }
      else if (p === 'grid') { for (let y = -2; y < 6; y++) for (let x = 3; x < 11; x++) R(x, y, 1, 1, ((x >> 1) + (y >> 1)) % 2 ? '#e8e8e8' : '#1a1a1a'); }
      else R(3, -2, 8, 8, '#141a1c');
      R(12, -1, 2, 1, '#888'); R(12, 2, 2, 1, '#888');
    },
    pickup(g, e, t, R) {
      const c = e.col || '#6a7a4a';
      R(1, 13, 30, 2, 'rgba(0,0,0,.4)'); box(R, 0, 3, 32, 11, c); R(1, 1, 13, 4, shade(c, -.1)); R(2, 0, 11, 2, shade(c, .1));
      R(3, 1, 9, 4, '#1a2a3a'); if (e.kid) { R(6, 2, 4, 3, '#f6d6be'); R(5, 1, 6, 1, '#e2b250'); R(4, 2, 1, 3, '#e2b250'); R(11, 2, 1, 3, '#e2b250'); }
      R(16, 5, 14, 7, shade(c, -.25)); R(17, 5, 12, 1, shade(c, .1)); R(0, 6, 1, 3, '#ffeeaa'); R(31, 6, 1, 3, '#a01010');
    },
    van(g, e, t, R) {
      const c = '#d8d2c0';
      R(1, 13, 30, 2, 'rgba(0,0,0,.4)'); box(R, 0, -4, 32, 18, c); R(2, -2, 8, 6, '#1a2a3a'); R(0, 6, 32, 2, '#a02a24');
      txt(g, R, '巴德电视', 20, 2, 6, '#a02a24'); R(0, 9, 1, 3, '#ffeeaa'); R(31, 9, 1, 3, '#a01010');
    },
    xtree(g, e, t, R) {
      R(7, 10, 2, 5, '#4a3020'); for (let i = 0; i < 6; i++) R(7 - i, -10 + i * 3.5, 2 + i * 2, 4, i % 2 ? '#1e4a26' : '#2a5a30');
      for (let i = 0; i < 9; i++) R(3 + ((i * 5) % 10), -8 + i * 2, 1, 1, ['#ff4040', '#ffd040', '#40a0ff'][(i + ((t * 1.5) | 0)) % 3]);
      R(7, -13, 2, 2, '#ffe070');
    },
    rview: () => { },
    /* 桥 */
    tower(g, e, t, R) {
      const S1 = '#c4c8ce', S2 = '#8a8e96', S3 = '#5a5e66';
      R(2, -34, 4, 48, S1); R(10, -34, 4, 48, S2); R(2, -34, 12, 3, S1); R(2, -20, 12, 2, S2); R(2, -6, 12, 2, S3);
      R(3, -34, 1, 48, '#e0e4e8'); R(5, -36, 6, 2, S2);
      R(4, -30, 8, 1, S3); R(5, -29, 1, 8, S3); R(10, -29, 1, 8, S3);
    },
    blamp(g, e, t, R) { R(7, -20, 2, 24, '#5a5e66'); R(4, -22, 8, 3, '#5a5e66'); R(5, -19, 6, 2, e.off ? '#3a3a3a' : '#fff0b0'); },
    bcar(g, e, t, R) {
      const c = e.col || '#7a1f22';
      R(1, 13, 30, 2, 'rgba(0,0,0,.4)'); box(R, 0, 2, 32, 12, c); R(8, 3, 14, 10, shade(c, -.15)); R(10, 4, 4, 8, '#1a2a3a'); R(16, 4, 5, 8, '#1a2a3a');
      if (!e.off) { R(30, 4, 2, 3, '#ffeeaa'); R(30, 9, 2, 3, '#ffeeaa'); R(0, 4, 1, 3, '#ff2a2a'); R(0, 9, 1, 3, '#ff2a2a'); }
      else { R(0, 4, 1, 3, '#6a1010'); R(0, 9, 1, 3, '#6a1010'); }
    },
    bsign(g, e, t, R) { R(7, 2, 2, 13, '#555'); R(-6, -10, 28, 13, '#1e4a2a'); R(-5, -9, 26, 11, '#2a6a3a'); txt(g, R, '银桥', 8, -6, 7, '#f0f0e0'); txt(g, R, '→ 俄亥俄', 8, 0, 5, '#f0f0e0'); }
  };

  /* ================= 文本 ================= */
  const NOTES_M = {
    cards: { title: '哈尔的预兆卡（软木板）', text: '（编号是这些事送到报社的先后，不是发生的先后。\n日期一栏全是听来的传言——哈尔在上面打了红问号。）\n\n① 电视　主街好多户人家的电视同时花屏，喇叭里一声尖啸。\n　传言：「十月底？」　去问：巴德（电视修理铺）\n② 黑衣人　两个穿一样黑西装的男人，在镇北头的旅社住了一夜。\n　传言：「去年冬天？」　去问：旅社的梅太太\n③ 红眼睛　TNT 废弃区，旧发电厂门口，红眼睛、大翅膀的东西。\n　日期：诺拉自己知道\n④ 电话　餐馆的多丽丝半夜接到怪电话，听筒里「嘀嘀」响。\n　传言：「好几个月了」　去问：多丽丝\n⑤ 狗　卡尔家的狗冲进 TNT 区南口的林子，再没回来。\n　传言：「开春？」　去问：卡尔\n⑥ 河上的光　河堤上好多人看见几团光，逆着风飞。\n　传言：「独立日放烟花那晚？」　去问：多丽丝\n\n（卡片背面，哈尔的字：「它们是排着队来的。」）' },
    ledger: { title: '巴德电视修理铺 · 登记簿（摘抄）', text: '10月30日　米勒太太家　显像管老化　换管\n11月2日　 浸信会教堂　喇叭有杂音　焊好\n\n11月6日（礼拜一）\n　晚上十点四十起，一个钟头里来了十七个电话：\n　画面全成了黑白格子，喇叭里一声尖啸，\n　关机、拔插头都没用。\n　十一点零五分，全好了。自己好的。\n　（这一行巴德画了两个圈，涂成了红色。）\n\n11月9日　卡尔家　天线被风吹歪\n11月20日　多丽丝家　「电话一响，电视就雪花」？？' },
    register: { title: '河畔旅社 · 住客登记簿', text: '6月24日　推销员（吸尘器）　一晚\n6月27日　卡车司机　一晚\n\n6月31日　（两个签名，笔迹一模一样，\n　　　　　像照着字帖一笔一笔描出来的）\n　　来自：「这里」\n　　事由：「看看」\n　　房费：一沓崭新的一美元钞票，号码是连着的。\n\n7月2日　（这一页夹着一面小小的纸国旗，\n　　　　 是独立日那天镇上发的）\n\n（六月只有三十天。）' },
    clip: { title: '剪报 · 本报 1966年11月16日', text: '【TNT 区出现「人那么大的鸟」？】\n\n昨夜（11月15日）十一点多，几名本镇青年在 TNT 废弃区的旧发电厂附近，看见一个灰色的东西：比人还高，翅膀张开有十来英尺，眼睛像自行车的尾灯那样红。\n\n他们开车逃走，那东西在车顶上方跟了一路。车速开到每小时一百英里，也没甩掉。\n\n警长表示已派人查看，未见异常。\n\n（剪报边上，排字房的人用铅笔写着：\n「天蛾人」——照电视上正火的《蝙蝠侠》起的外号。）' }
  };
  const ITEMS_M = {
    pen: { name: '圆珠笔', desc: '报社发的圆珠笔，笔杆上印着「信使报」。采访本已经写满了一半。' },
    drawing: { name: '苏西的画', desc: '一张蜡笔画：一只灰色的大鸟站在桥上，眼睛涂成了红色。底下歪歪扭扭写着：「它在等灯亮。」' }
  };

  /* ================= 序章：TNT 废弃区 ================= */
  async function budTnt(S) {
    if (S.f.phase !== 'explore') return S.say('巴德', '……');
    const lines = [
      ['这些水泥包包，是二战那会儿存炸药的。', '镇上的人都叫这儿「TNT」。晚上来这儿兜风的，都是胆子大的。'],
      ['卡尔家那条狗强尼，最近老往这边跑。', '……狗鼻子灵，知道这儿有什么。'],
      ['我收音机里一直有杂音，从刚才拐进来就有。', '你听——「吱……」']
    ];
    const i = S.f.budI = ((S.f.budI ?? -1) + 1) % lines.length;
    await S.say('巴德', lines[i]);
    if (i === 2) { whine(S, 1.2); await S.think('那个声音细得像针，扎在耳朵里。'); }
  }
  async function plantDoor(S) {
    if (S.f.phase !== 'explore') return S.narr('黑洞洞的门框。');
    S.f.phase = 'eyes';
    await S.narr('发电厂的门早就没了，只剩一个黑洞洞的门框。\n里面一股机油和霉味。');
    S.show('eyes'); S.sfx('heart');
    await S.narr('门框里，离地两米多高的地方——\n亮起了两个红点。');
    await S.say('巴德', '……诺拉。别动。', { style: 'whisper' });
    await S.walk('pl', 'sss', 5); S.turn(3);
    S.hide('eyes');
    const m = S.ent('moth'); S.place('moth', 13, 3, 0); m.alpha = 0; m.open = false;
    await S.alpha('moth', 1, 600);
    await S.walk('moth', 's', 2);
    await S.narr('它从门框里走了出来。\n灰色的，比人还高。没有脖子，脑袋像是直接长在肩膀里。');
    m.open = true; screech(S); S.shake(500, 2);
    await S.scare('face', { face: 'moth', dur: .9 });
    await S.narr('它张开了翅膀。');
    S.hide('bud');
    await S.say('巴德', '跑！！回车上！', { style: 'big' });
    S.goal('跑回车上！（顺着石子路往下、往左）');
    S.cp('tntrun');
    startTntChase(S);
  }
  function startTntChase(S) {
    S.f.phase = 'run';
    const m = S.ent('moth'); m.open = true; m.s.fly = false;
    S.chase('moth', { spd: CHASE_SPD, wait: CHASE_WAIT, catch: tntCaught });
  }
  async function tntCaught(S) {
    deaths++;
    S.f.phase = 'caught'; wingbeat(S, 1.5); screech(S, 1.2);
    await S.scare('red', { dur: .9 });
    await S.die('翅膀从头顶罩下来，风里一股烧焦的机油味。\n两点红光，贴在你脸前。', '它追上了你');
  }
  async function tntEscape(S) {
    S.f.phase = 'escape'; S.stop('moth');
    S.sfx('close'); S.hidePlayer(true); S.pos(3, 13, 2);
    await S.narr('你一头扎进副驾驶，「砰」地关上车门。\n巴德已经拧着了钥匙。');
    S.sfx('car');
    const m = S.ent('moth'); S.place('moth', 3, 11, 2); m.open = true; m.s.fly = true;
    wingbeat(S, 1.5);
    await Promise.all([S.walk('car', 'r'.repeat(21), 7), S.walk('pl', 'r'.repeat(21), 7), S.walk('moth', 'r'.repeat(21), 7)]);
    await S.fade(1, 700);
    await S.card('62 号公路', '1966年11月15日　深夜', '巴德一脚油门踩到底。\n仪表盘上的指针，指到了一百。\n\n它就在车顶上方。\n翅膀一下都没扇，就那么跟着。\n一直跟到镇子边上第一盏路灯底下，才不见了。');
    await S.card('一年零一个月以后', '1967年12月15日　星期五　下午两点半', '点普莱森特，河边的小镇。\n诺拉在镇上的《信使报》当见习记者。\n\n这一年，镇上的怪事一件接一件。\n今天，编辑哈尔把她叫到了那块软木板前面。');
    S.hidePlayer(false); S.hide('moth');
    await S.go('office', 1, 2, 0);
  }

  /* ================= 报社 ================= */
  const CARDS = [
    { p: 1, k: 'v1', name: '电视', got: '11月6日（礼拜一）· 巴德的登记簿' },
    { p: 2, k: 'v2', name: '黑衣人', got: '独立日（7月4日）之前那个礼拜 · 登记簿上写的是「6月31日」' },
    { p: 3, k: 'v3', name: '红眼睛', got: '1966年11月15日 · 你和巴德亲眼看见的' },
    { p: 4, k: 'v4', name: '电话', got: '感恩节前一天夜里 · 离电视花屏过了两个多礼拜' },
    { p: 5, k: 'v5', name: '狗', got: '红眼睛那晚的第二天晚上 · 卡尔说的' },
    { p: 6, k: 'v6', name: '河上的光', got: '劳动节那晚（九月头一个礼拜一）· 多丽丝说的' }
  ];
  const WHO = { v1: '电视——修理铺的巴德', v2: '黑衣人——旅社的梅太太', v4: '电话——餐馆的多丽丝', v5: '狗——卡尔（停在五金店门口）', v6: '河上的光——餐馆的多丽丝' };
  const nVer = S => VER.filter(k => S.f[k]).length;
  function townGoal(S) {
    if (S.f.solved) return;
    const n = nVer(S);
    S.goal(n < 5 ? '核实卡片日期 ' + n + '/5 · 主街（两人时一人按 J 看卡片）' : '回报社，把六张卡按日期排好');
  }
  async function verify(S, k) {
    if (S.f[k]) return;
    S.f[k] = true; S.f.clock = Math.min(16 * 60 + 25, (S.f.clock || 870) + 11);
    const c = CARDS.find(c => c.k === k);
    S.sfx('paper'); S.toast('核实：' + '①②③④⑤⑥'[c.p - 1] + ' ' + c.name + ' → ' + c.got.split(' · ')[0]);
    townGoal(S);
  }
  function boardText(S) {
    const lines = CARDS.map(c => '①②③④⑤⑥'[c.p - 1] + ' ' + c.name + '\n　' + (S.f[c.k] ? c.got : '？（还没核实）'));
    return '（你在采访本上记下的，已经核实的日期）\n\n' + lines.join('\n') + '\n\n——从最早排到最晚，按卡片上的编号。';
  }
  async function boardOn(S) {
    if (S.f.solved) {
      if (!S.f.deduced) return deduce(S);
      return S.narr('红毛线绕成了一个越收越紧的螺旋。\n螺旋的正中间，钉着一张小小的银桥明信片。');
    }
    if (S.once('board1')) await S.narr('软木板上钉着六张卡片，用红毛线乱七八糟地连着。\n哈尔说，它们是「排着队来的」。');
    await S.note('核实进度', boardText(S));
    const r = await S.ask('把卡片按日期重新排一遍吗？', ['按日期从早到晚重新排好', '先不排']);
    if (r) return;
    const v = await S.keypad('从最早到最晚，依次按下六张卡片的编号', ['1', '2', '3', '4', '5', '6'], 6);
    if (v == null) return S.narr('你把图钉又按了回去。');
    if (v === ANSWER) return solved(S);
    return boardWrong(S, v);
  }
  async function boardWrong(S, v) {
    const w = S.f.bw = (S.f.bw || 0) + 1;
    S.f.clock = Math.min(16 * 60 + 35, (S.f.clock || 870) + 15);
    /* 代价：桥上少几秒；电话自己响一声、灯闪一下 */
    S.sfx('bad'); S.dark(.62); beeps(S, 3); S.shake(250, 1);
    await S.narr('桌上的电话「叮」地响了半声。\n听筒里传出来一串「嘀——嘀——嘀——」，然后断了。');
    S.dark(null);
    S.toast('时间又过去了一刻钟（' + clockStr(S.f.clock) + '）');
    let fb;
    if (new Set(v).size < 6) fb = '有一张卡你钉了两次。六张卡，每张只用一次。';
    else {
      let i = 0; while (i < 6 && v[i] === ANSWER[i]) i++;
      if (i === 0) fb = '最早的那件事……你比谁都清楚。\n一切都是从 TNT 那晚开始的。';
      else if (i === 1) fb = S.f.v5 ? '红眼睛之后紧跟着的是哪件？\n卡尔说过——第二天晚上。' : '红眼睛之后紧跟着的是哪件？\n有一张卡，你还没去问过当事人。';
      else fb = '前 ' + i + ' 张没错。从第 ' + (i + 1) + ' 张开始，顺序乱了。';
    }
    await S.think(fb);
    const miss = VER.filter(k => !S.f[k]);
    if (w === 2) await S.think(miss.length ? '卡片上的传言一个都别信。还没核实的：\n' + miss.map(k => WHO[k]).join('\n') : '把每张卡换成月份再排：\n去年十一月的两张，今年夏天、九月初、十一月初、十一月下旬。');
    else if (w === 3) await S.think('独立日是七月四号，劳动节是九月第一个礼拜一，感恩节在十一月第四个礼拜四。\n黑衣人在六月底，河上的光在九月初；电话在电视花屏两个多礼拜以后。');
    else if (w >= 4) await S.think('……照这个顺序：3、5、2、6、1、4。');
  }
  async function solved(S) {
    S.f.solved = true; S.sfx('chime');
    await S.narr('你把六张卡按日期重新钉好，用哈尔的红毛线一张一张连起来。');
    S.ent('board').s.solved = true; S.sfx('paper');
    await S.narr('TNT、林子边、镇北头的旅社、河堤、主街、多丽丝家……\n红线绕着小镇转了一圈，又一圈。一圈比一圈小，一圈比一圈近。');
    await S.say('哈尔', '……像飞蛾绕着灯飞。');
    await S.think('螺旋的正中间——是河上那座桥。');
    S.goal('想清楚：预言里「很多灯一起熄灭」，说的是哪儿？');
    S.cp('deduce');
    return deduce(S);
  }
  async function deduce(S) {
    jingle(S);
    await S.say('收音机', '……今天傍晚，总统将在华盛顿按下按钮，点亮国家圣诞树……');
    await S.say('哈尔', ['多丽丝接的那通电话，全镇都传遍了：', '「总统按下按钮、圣诞树亮起来的时候，河上会有很多灯一起熄灭。」', '……都说是要大停电。']);
    for (;;) {
      const r = await S.ask('「河上会有很多灯一起熄灭」——说的是哪儿？', ['河边的变电站：全城大停电', '银桥：桥上的路灯，和堵在桥上的车灯', 'TNT 废弃区：它的老窝']);
      if (r === 2) { await S.think('不对。螺旋是往里收的，一圈比一圈近。\n它不会回去了。'); continue; }
      if (r === 0) return blackoutEnd(S);
      break;
    }
    S.f.deduced = true;
    await S.narr('墙上的钟：' + clockStr(S.f.clock || 960) + '。\n窗外，银桥上的灯已经亮了。下班的车开始往桥上排。');
    await S.think('多丽丝、卡尔、巴德——\n他们都说过，今天五点要过桥。');
    await S.say('哈尔', '我给警长打电话！你先去！');
    beeps(S, 4);
    await S.narr('哈尔抓起听筒。听筒里只有一串「嘀——嘀——」。\n他一连拨了三次。');
    await S.say('哈尔', '……线路全是这个声音。快去，诺拉！');
    S.goal('赶去银桥（主街东头）');
    S.cp();
  }
  async function blackoutEnd(S) {
    await S.say('哈尔', '变电站……对，镇上都这么说。');
    await S.fade(1, 900);
    await S.card('河边的变电站', clockStr(S.f.clock || 960) + ' — 下午五点', '你在变电站的铁丝网外守着，\n手里攥着手电，等那场大停电。\n\n五点整，收音机里说：华盛顿的圣诞树亮了。\n镇上的灯，一盏都没有灭。');
    snap(S); S.shake(700, 2);
    await S.narr('五点零四分。\n河那边传来一声闷响，像很远的地方有人开了一枪。');
    await S.narr('然后是警笛。很多很多的警笛。');
    return S.end({ bad: true, id: 'blackout', title: '等一场停电', text: '那天晚上，镇上没有停电。\n\n很多年以后你才明白，预言里那句「河上会有很多灯一起熄灭」，从来说的不是停电。\n\n你一直在想：如果那天傍晚，你没有去等那场停电——' });
  }
  async function halOn(S) {
    if (S.f.deduced) return S.say('哈尔', '还愣着干什么！去桥上！');
    if (S.f.solved) return deduce(S);
    const miss = VER.filter(k => !S.f[k]);
    if (!miss.length) return S.say('哈尔', ['日期都问齐了？', '那就排吧。从最早的那件开始。']);
    await S.say('哈尔', S.once('halHint') ? ['卡片上写的日期，都是听来的。', '别信传言，去找当事人。'] : '还差这几张：');
    await S.think(miss.map(k => WHO[k]).join('\n'));
  }

  /* ================= 主街 ================= */
  async function budTown(S) {
    if (S.f.v1) {
      const l = ['五点我得把这台电视送到对岸去。\n人家等着看总统点圣诞树呢。', '你脸色不太好，诺拉。\n……又梦见那晚了？'];
      return S.say('巴德', l[(S.f.budT = ((S.f.budT ?? -1) + 1) % 2)]);
    }
    await S.say('巴德', '诺拉！来来，帮我扶一下这台的天线。');
    await S.say('诺拉', '巴德，十一月家家电视花屏那次，是哪天？');
    await S.say('巴德', ['那个啊，我都记在本子上了。', '一个钟头接了十七个电话。全是黑白格子，喇叭里「吱——」的一声。']);
    await S.note('ledger');
    await verify(S, 'v1');
    const tv = S.ent('tvset'); tv.power = 'grid'; whine(S, 1.8); S.fx('static');
    await S.narr('箱子上那台修好的电视，自己亮了。\n满屏黑白格子。喇叭里一声又细又尖的「吱——」。');
    await S.say('巴德', ['……跟 TNT 那晚，车上收音机里的声音一模一样。', '这两天老这样。五点我还得把它送到对岸去。']);
    tv.power = false;
  }
  async function dorisTown(S) {
    if (S.f.v4) return S.say('多丽丝', ['五点一下班我就过桥，', '去对岸百货店给我外甥女买娃娃。这回可不能再忘了。']);
    await S.say('多丽丝', '诺拉宝贝！又来给报纸挖怪事？');
    await S.say('诺拉', '河上那几团光，哈尔说是独立日那晚？');
    await S.say('多丽丝', ['那个老糊涂。是劳动节！九月头一个礼拜一。', '焰火早放完了，那几团光才出来——逆着风飞。']);
    await verify(S, 'v6');
    await S.say('诺拉', '那个电话呢？');
    await S.say('多丽丝', ['第一通是感恩节前一天夜里，我正烤南瓜派——离电视花屏那晚，过了两个多礼拜。', '半夜一点，「嘀——嘀——」，像电报。然后一个男人慢吞吞地念：', '「总统按下按钮、圣诞树亮起来的时候，河上会有很多灯一起熄灭。」']);
    await verify(S, 'v4'); S.f.proph = true;
    await S.say('多丽丝', '镇上都说要大停电。我可不管——五点下了班，我还得过桥买娃娃。');
    S.ent('payph').s.ring = true; SND.ring = .3;
  }
  async function payphoneOn(S) {
    const e = S.ent('payph');
    if (!e.s.ring) return S.narr('餐馆门口的公用电话。听筒上有一股咖啡和烟的味道。');
    e.s.ring = false; S.f.phoneHeard = true;
    await S.narr('你拿起了听筒。');
    beeps(S, 5);
    await S.say('听筒', '嘀——嘀——嘀——', { style: 'whisper' });
    S.fx('glitch'); S.sfx('whisper');
    await S.say('听筒', '……诺……拉……\n……灯……亮……以前……', { style: 'whisper' });
    await S.narr('听筒里的声音一字一顿，像在照着念一张不认识的字。\n然后，只剩下「嘟——」。');
    await S.think('它知道我的名字。');
  }
  async function maeOn(S) {
    if (S.f.v2) return S.say('梅太太', ['那俩人走的时候，床铺得整整齐齐，像没人睡过。', '……还问我，河上那座桥，晚上几点灯最亮。']);
    await S.say('梅太太', ['报社的小姑娘？又是来问那两个黑衣人的吧。', '他们住进来那天，镇上刚挂上独立日的彩旗，离七月四号还有好几天。', '登记簿你自己看。我活了七十岁，头一回见有人写那个日子。']);
    await S.note('register');
    await verify(S, 'v2');
    await S.say('梅太太', ['他们问我：「圆珠笔是怎么出水的？」', '……还问我，河上那座桥，晚上几点灯最亮。']);
  }
  async function carlOn(S) {
    if (S.f.v5) return S.say('卡尔', '五点下了班，我带苏西去对岸挑棵圣诞树。');
    await S.say('卡尔', '诺拉？哈尔又派你出来打听怪事了？');
    await S.say('诺拉', '强尼——你家的狗，是哪天丢的？');
    await S.say('卡尔', ['就是你和巴德撞见那东西的第二天晚上。全镇都在传红眼睛，我还笑话来着。', '那晚强尼冲着林子叫，叫着叫着就挣开了绳子。我拿手电一照——', '林子里有两个红点。比我还高。……强尼就再没回来。']);
    await verify(S, 'v5');
    await S.say('苏西', '诺拉姐姐，你看我画的。');
    await S.narr('驾驶室的窗户里递出来一张蜡笔画：\n一只灰色的大鸟站在桥上，眼睛涂成了红色。\n底下歪歪扭扭写着：「它在等灯亮。」');
    const r = await S.ask('苏西眼巴巴地看着你。', ['「画得真好。能送给我吗？」', '「画得真好。」（还给她）']);
    if (r === 0) { S.give('drawing'); await S.say('苏西', '嗯！姐姐要贴在报纸上哦。'); }
    else await S.say('苏西', '那我留着，给圣诞老人看。');
    await S.say('卡尔', '五点下了班，我带她去对岸挑棵圣诞树。');
  }
  async function mibAppear(S) {
    S.show('mib'); S.ent('mib').alpha = 1;
    S.focus(20, 6);
    await S.narr('马路对面，路灯底下，站着一个穿黑西装、戴礼帽的男人。\n大冷天，他没穿大衣。他一动不动地看着你。');
    S.focus(null);
  }
  async function mibOn(S) {
    await S.say('黑西装的男人', '诺拉小姐。下午好。');
    await S.say('诺拉', '……我们认识吗？');
    await S.narr('他盯着你手里的圆珠笔，像是头一回见到这种东西。');
    await S.say('黑西装的男人', ['那支笔……', '是怎么出水的？']);
    await S.say('黑西装的男人', '今天是十五号。五点，桥上的灯会很好看。');
    await S.scare('face', { face: 'mib', dur: .7 });
    S.f.mibTalk = true;
    S.sfx('car');
    await S.narr('一辆运煤的卡车从你们中间开了过去。\n等它过去，路灯底下已经没有人了。');
    S.hide('mib');
  }
  async function townRight(S) {
    if (!S.f.deduced) {
      await S.think(S.f.solved ? '先想清楚那个预言说的是哪儿。' : '桥那头……现在去做什么？\n先把卡片的事弄清楚。');
      return S.pos(35, S.pl.y, 1);
    }
    await S.go('bridge', 1, 3, 2);
  }

  /* ================= 银桥 ================= */
  const PERS = {
    doris: {
      who: '多丽丝', intro: '诺拉？你怎么跑桥上来了？\n这车二十分钟没挪窝了。', again: '又怎么了，宝贝？', q: '怎么劝多丽丝？',
      opts: ['「桥要塌了，快下车！」', '「你那通电话说的，就是现在。」', '「前面出车祸了，警察让往回走。」'], ok: 1,
      no: ['宝贝，这桥比你岁数都大。', null, '警察？我怎么一个都没看见。'],
      yes: async S => { await S.narr('她抬头看了一眼桥上的灯。\n灯亮着，一串，一直连到对岸。她的脸一下子白了。'); await S.say('多丽丝', '……「树亮起来的时候」。好，我走。'); },
      hint: '空口白话，谁都不会信。\n说她自己经历过的那件事。'
    },
    carl: {
      who: '卡尔', intro: '苏西吵着要去对岸挑圣诞树，\n结果堵在这儿了。', again: '又怎么了？', q: '怎么劝卡尔？',
      opts: ['「下来透透气吧，我帮你看着车。」', '「这桥年头太久了，不安全。」', '「强尼那晚，也是朝着那双红眼睛跑的。」'], ok: 2,
      no: ['透什么气，冻死人了。', '我天天跑这座桥，比你熟。', null],
      pre: async S => { await S.say('苏西', '爸爸，塔上有只大鸟。眼睛红红的。', { style: 'whisper' }); },
      yes: async S => { await S.narr('卡尔顺着苏西的手指抬起头。\n塔顶上，两个红点。'); await S.say('卡尔', '……苏西，下车。爸爸背你走回去。'); },
      hint: '他天天跑这座桥。\n要说他忘不掉的那件事。'
    },
    bud: {
      who: '巴德', intro: '诺拉！你也看见塔上那东西了？\n对岸等着这台电视看总统点树呢。', again: '诺拉？', q: '怎么劝巴德？',
      opts: ['「TNT 那晚是你开车带我们逃出来的。这回也一样——掉头。」', '「电视我替你送。」', '「点个圣诞树有什么好看的。」'], ok: 0,
      no: [null, '你又不会开货车。', '……这跟好不好看有什么关系。'],
      yes: async S => { await S.say('巴德', ['……对。那天晚上，它也是这么跟着我们的。', '我去喊人！']); },
      hint: '巴德和你一样，见过它。\n提那一晚。'
    }
  };
  const nOff = S => PEOPLE_B.filter(k => S.f['pd_' + k]).length;
  function bridgeGoal(S) {
    const n = nOff(S);
    S.goal(n < 3 ? '把认识的人劝下桥 ' + n + '/3（两人时一人看笺：谁见过哪件事）' : '回到桥头（西岸）！');
  }
  async function persuade(S, k) {
    const P = PERS[k];
    if (S.f['pd_' + k]) return;
    if (S.f.phase !== 'bridge') return S.say(P.who, '……');
    const first = !S.f['pt_' + k]; S.f['pt_' + k] = true;
    await S.say(P.who, first ? P.intro : P.again);
    if (first && P.pre) await P.pre(S);
    const used = S.f['pw_' + k] || [], left = P.opts.map((o, i) => i).filter(i => !used.includes(i));
    const r = await S.ask(P.q, left.map(i => P.opts[i]));
    const i = left[r];
    if (i !== P.ok) {
      S.timerAdd(-ARG_PEN); S.f['pw_' + k] = used.concat([i]); S.sfx('bad'); honk(S, 300, 0, .7);
      await S.say(P.who, P.no[i]);
      S.toast('（又耽误了好几秒）');
      if (S.once('hint_' + k)) await S.think(P.hint);
      return;
    }
    S.sfx('good');
    await P.yes(S);
    S.f['pd_' + k] = true;
    const fade = [S.alpha(k + '_b', 0, 450)];
    if (k === 'carl') { S.ent('pickup_b').s.kid = false; }
    await Promise.all(fade);
    S.show(k + '_h'); if (k === 'carl') S.show('susie_h');
    if (nOff(S) >= 3) return rally(S);
    bridgeGoal(S);
  }
  async function rally(S) {
    honk(S, 330); honk(S, 330, .5); honk(S, 280, 1);
    await S.narr('卡尔按住喇叭不放。巴德站上货车的踏板，扯着嗓子喊：\n「都下车！往回走！」');
    await S.narr('一扇接一扇的车门打开了。\n裹着大衣的人们，一个跟着一个，往西弗吉尼亚这头走。');
    for (const id of ['crowd1', 'crowd2', 'crowd3', 'crowd4']) S.show(id);
    bridgeGoal(S);
  }
  function startBridgeTimer(S, retry) {
    const T = retry ? Math.max(BR_FLOOR, (S.f.bt || BR_BASE) - 4 * brDeaths) : (S.f.bt || BR_BASE);
    S.f.btNow = T;
    S.timer(T, '距五点零四分', bridgeTimeUp, { during: true });
  }
  async function bridgeTimeUp(S) {
    if (S.f.phase !== 'bridge') return;
    S.f.phase = 'fail'; brDeaths++;
    const onB = S.pl.x >= 5;
    for (const x of LAMPS) S.ent('lamp' + x).off = true;
    snap(S); S.shake(1400, 4); S.sfx('thud');
    await S.fade(1, 1100);
    await S.die(onB ? '五点零四分。\n脚下的桥面猛地一沉——\n像很远的地方，有人开了一枪。' : '五点零四分。\n身后传来一声像枪响的脆响。\n桥上，还有你没来得及叫回来的人。', onB ? '你还在桥上' : '还有人在桥上');
  }
  async function bridgeIntro(S) {
    await S.narr('主街东头，银桥。\n四十年的老桥，刷着铝粉漆，远看银闪闪的。');
    honk(S, 330); honk(S, 260, .4);
    await S.narr('下班的车堵了一桥，一辆贴着一辆，谁也动不了。\n喇叭声此起彼伏。');
    S.focus(33, 2); screech(S, .8);
    await S.narr('东边那座塔的塔顶上，蹲着一个灰色的东西。\n两点红光。');
    await S.think('……和 TNT 那晚一模一样。');
    S.focus(null);
    await S.think('多丽丝、卡尔、巴德，都堵在桥上。\n一个人喊没人信——得说他们自己见过的那件事。');
  }
  async function finale(S) {
    S.f.phase = 'final'; S.clearTimer();
    await S.narr('你跑回了桥头。脚底下是结结实实的土地。');
    await S.narr('身后，桥上的车一辆一辆空着，车灯还亮着，排成一条长长的光带，一直连到对岸。');
    const m = S.ent('moth_b'); m.open = true; screech(S, 1.2); S.shake(400, 2);
    S.focus(33, 2);
    await S.narr('塔顶上，那个东西张开了翅膀。');
    S.sfx('whisper');
    await S.say('？？？', '……诺拉姐姐——\n你过来呀——', { style: 'whisper' });
    S.focus(null);
    await S.narr('声音是从桥中间传来的。是苏西的声音。');
    await S.say('苏西', '……那不是我。', { style: 'whisper' });
    await S.narr('苏西的小手攥住了你的手指。');
    const r = await S.ask('桥中间，有人在叫你的名字。', ['往桥中间走，看看是谁', '握紧苏西的手，留在桥头']);
    if (r === 0) return onBridgeEnd(S);
    return goodEnd(S);
  }
  async function onBridgeEnd(S) {
    await S.narr('你松开了苏西的手。');
    await S.walk('pl', [11, 3], 4);
    const m = S.ent('moth_b'); await S.alpha('moth_b', 0, 400);
    S.place('moth_b', 14, 3, 1); m.s.fly = false; m.open = true; m.alpha = 0;
    wingbeat(S, 1.5); await S.alpha('moth_b', 1, 500);
    await S.narr('它落在了你前面的桥面上，比路灯还高。');
    await S.scare('face', { face: 'moth', dur: .9 });
    await S.narr('它没有扑过来。\n它低着头，两只红眼睛看着你，好像有什么话，想告诉你。');
    for (let i = LAMPS.length - 1; i >= 0; i--) { S.ent('lamp' + LAMPS[i]).off = true; S.sfx('switch'); await S.wait(160); }
    snap(S); S.shake(1500, 4);
    await S.fade(1, 1200);
    return S.end({ bad: true, id: 'onbridge', title: '自己去了桥上', text: '桥头的人后来说，最后一个走上桥的，是报社那个姑娘。\n\n有人看见她站在桥中间，仰着头，\n像在听谁说话。\n\n第二天的《信使报》头版，哈尔亲手排的字，\n排到她的名字那一行，排了很久很久。' });
  }
  async function goodEnd(S) {
    await S.narr('你没有动。');
    const m = S.ent('moth_b'); m.s.fly = true; wingbeat(S, 1.2);
    await S.walk('moth_b', 'uu', 3); await S.alpha('moth_b', 0, 800);
    await S.narr('它从塔顶上飞起来，翅膀一下都没扇，往河的下游滑了过去。\n再也没有回头。');
    await S.narr('桥上的灯，从对岸那头开始——');
    for (let i = LAMPS.length - 1; i >= 0; i--) { S.ent('lamp' + LAMPS[i]).off = true; S.sfx('switch'); await S.wait(300); }
    await S.narr('一盏，一盏，熄灭了。');
    snap(S); S.shake(1000, 3); await S.wait(500); creak(S, 2.2);
    await S.narr('一声脆响，像很远的地方有人开了一枪。\n然后是很长、很长的，钢铁的呻吟。');
    await S.narr('你没有回头看。桥头上，谁都没有回头看。');
    await S.fade(1, 1500);
    await S.card('1967年12月15日　下午五点零四分', '点普莱森特', '那天晚上，镇上没有停电。\n华盛顿的圣诞树照常亮了，电视里在放。\n\n巴德修好的那台电视，没有送到对岸。\n多丽丝的外甥女，那年圣诞节收到了一个晚了几天的娃娃。');
    if (S.has('drawing')) await S.narr('苏西的那张画，你一直没有贴到报纸上。\n它夹在你的采访本里。\n「它在等灯亮。」——很多年以后，你还是不知道，它等的究竟是什么。');
    if (S.f.mibTalk) await S.narr('那个穿黑西装的男人，镇上再没有人见过。\n旅社的登记簿上，「6月31日」那一页，后来不知被谁撕走了。');
    return S.end({ id: 'dusk', title: '第九夜　完', text: '后来，河上修起了一座新桥。\n\n镇上的人很少再提起那年的红眼睛。\n只有哈尔那块软木板，一直挂在报社的墙上，\n红毛线绕成的螺旋，一圈比一圈小。\n\n有人说它是来报信的；\n也有人说，是灯把它引来的——就像飞蛾。' });
  }

  /* ================= 地图数据 ================= */
  /* TNT 废弃区 28×16 */
  const TNT_ROWS = (() => {
    const g = grid(28, 16, '"');
    g.rect(0, 0, 27, 0, 'P').rect(0, 0, 0, 15, 'P').rect(27, 0, 27, 15, 'P').rect(0, 15, 27, 15, 'P');
    g.rect(1, 1, 8, 1, 'P').rect(19, 1, 26, 1, 'P');
    g.rect(9, 1, 18, 3, '#');
    g.rect(13, 4, 13, 9, 'd').rect(5, 9, 13, 9, 'd').rect(5, 9, 5, 11, 'd');
    g.rect(1, 12, 26, 12, 'f').rect(3, 12, 6, 12, 'd');
    g.rect(1, 13, 26, 14, ':');
    for (const [x, y] of [[1, 4], [25, 4], [26, 7], [1, 10], [18, 10], [24, 12 - 1], [10, 6], [17, 4]]) g.set(x, y, 'B');
    return g.rows();
  })();
  /* 主街 38×11 */
  const TOWN_ROWS = (() => {
    const g = grid(38, 11, '_');
    g.rect(0, 0, 37, 1, '#');
    g.rect(0, 4, 37, 4, ':').rect(0, 5, 37, 5, '=').rect(0, 6, 37, 6, ':');
    g.rect(0, 8, 37, 9, 'F').set(18, 8, 'x').rect(17, 9, 19, 9, 'x');
    g.rect(0, 10, 37, 10, 'V');
    return g.rows();
  })();
  /* 银桥 46×12 */
  const BRIDGE_ROWS = (() => {
    const g = grid(46, 12, 'V');
    g.rect(5, 0, 45, 0, 'N').rect(5, 1, 45, 1, 'M').rect(5, 2, 45, 2, 'Q').rect(5, 3, 45, 3, 'D').rect(5, 4, 45, 5, 'A').rect(5, 6, 45, 6, 'Q');
    g.rect(0, 0, 4, 1, '#').rect(0, 2, 4, 3, '_').rect(0, 4, 4, 5, ':').rect(0, 6, 4, 7, '_').rect(0, 8, 4, 11, '"');
    g.set(0, 9, 'B').set(4, 10, 'B').set(2, 11, 'B');
    return g.rows();
  })();
  /* 桥上的车：两格一辆，空出劝人的位置 */
  function laneCars(y, x0, x1, gaps, cols) {
    const out = []; let x = x0, i = 0;
    while (x + 1 <= x1) {
      if (gaps.includes(x)) { x++; continue; }
      if (gaps.includes(x + 1)) { x += 2; continue; }
      out.push({ id: 'car' + y + '_' + x, x, y, w: 2, spr: 'bcar', col: cols[i++ % cols.length], solid: true, on: S => S.narr(['车里没人。车灯还亮着，雨刷停在半截。', '后座上堆着包好的圣诞礼物，系着红丝带。', '收音机开着，在放圣诞歌。', '仪表盘上的钟：四点五十几分。'][(x + y) % 4]) });
      x += 2;
    }
    return out;
  }
  const CAR_COLS = ['#7a1f22', '#2a4a6a', '#d8c8a0', '#3a5a3a', '#5a3a5a', '#8a6a2a', '#a0a4a8', '#2a2a30'];

  defChapter({
    id: 'mothman', n: 9, title: '天蛾人', sub: 'TNT 废弃区的红眼睛之后，小镇怪事一件接一件。把预兆排对顺序，赶在五点之前。', origin: '美国西弗吉尼亚　1966—1967', color: '#4a2228',
    amb: 'wind', floor: 'wood', wall: 'brick', dark: .6, plr: 3.4,
    people: PEOPLE_M, tiles: TILES_M, sprites: SPR_M, items: ITEMS_M, notes: NOTES_M, faces: FACES_M,
    endings: { dusk: '第九夜　完', onbridge: '自己去了桥上', blackout: '等一场停电' },
    legend: '「天蛾人」（Mothman）的故事发生在美国西弗吉尼亚州俄亥俄河边的小镇点普莱森特。据当时的报道，1966年11月15日深夜，两对年轻夫妇开车经过镇北的「TNT 区」——二战时期一座军械厂的旧址，到处是覆着草皮的水泥弹药库——在一座废弃的发电厂附近看见一个比人还高、长着大翅膀、眼睛发出红光的东西。他们说它跟着车飞，车速开到每小时一百英里也甩不掉。第二天消息上了报纸，这个东西很快有了外号「天蛾人」，一般认为是借了当年正热播的电视剧《蝙蝠侠》。此后一年多里，当地陆续有不少类似的目击报告；有人说家里的电视那几天怪响，有人说家里的狗朝着红光跑掉了。\n\n1967年12月15日傍晚，下班高峰时分，连接点普莱森特与对岸俄亥俄州加利波利斯的「银桥」突然垮塌。这是一座1928年建成的眼杆链吊桥，因为刷着铝粉漆而得名。据报道，那天有46人遇难。事后的调查认定，原因是吊链上一根眼杆里一道很小的裂纹，在几十年的应力腐蚀中慢慢扩大，最终断裂——与任何怪物无关。\n\n把天蛾人和银桥连在一起的，主要是一位纽约作家1975年出版的书《天蛾人预言》。书里把红眼怪物、天上的怪光、穿黑西装上门问奇怪问题的「黑衣人」、半夜的怪电话、电视和电话的干扰，以及种种「预言」串成了一个故事；据书中所说，作者曾被警告「总统点亮圣诞树的时候」会出大事，他当时以为指的是一场大停电。也有研究者比对作者当年的书信，认为书里不少细节是后来加工的。2002年同名电影上映；如今点普莱森特镇上立着天蛾人的金属雕像，有天蛾人博物馆，每年还办天蛾人节。\n\n（游戏虚构：本章的诺拉、巴德、编辑哈尔、多丽丝、卡尔和苏西、梅太太、黑西装的男人都是虚构人物，不对应任何真实的当事人；六张预兆卡、它们的日期、电视登记簿和旅社登记簿、「6月31日」、电话里的原话、红毛线连成的螺旋、桥上劝人下桥的情节以及三个结局，全部是游戏编写的。现实中的银桥上，没有人提前得到警告。）',
    start: { map: 'tnt', x: 5, y: 11, dir: 3 },
    resume: {
      tntrun: async S => {
        S.f.phase = 'run0'; S.hidePlayer(false);
        const m = S.ent('moth'); S.place('moth', 13, 4, 0); m.open = true; m.s.fly = false; m.alpha = 1;
        S.hide('bud'); S.hide('eyes');
        if (deaths) await S.think(deaths === 1 ? '别愣着，也别回头看它。\n顺着石子路往下、往左——车停在铁丝网门外。' : '一出对话就跑：往下两步，往左一直走，再往下出铁丝网门。\n按住跑步键会快得多。');
        S.goal('跑回车上！（顺着石子路往下、往左）');
        startTntChase(S);
      },
      deduce: async S => { await deduce(S); },
      bridge: async S => {
        S.f.phase = 'bridge'; S.dark(null); S.focus(null);
        if (brDeaths) await S.think(brDeaths === 1 ? '还来得及。先找认识的人：多丽丝、卡尔、巴德。\n说他们自己见过的那件事。劝完了，自己也要回到桥头。' : '别跟黑西装的人说话，别在桥上停。\n多丽丝——那通电话；卡尔——强尼；巴德——TNT 那晚。');
        bridgeGoal(S);
        startBridgeTimer(S, true);
      }
    },
    async intro(S) {
      deaths = 0; brDeaths = 0;
      await S.card('第九夜　天蛾人', '1966年11月15日　深夜　美国西弗吉尼亚州', '点普莱森特镇往北七英里，\n有一片二战时候造炸药的军械厂旧址。\n镇上的年轻人管那儿叫「TNT」。\n\n那天夜里，巴德开着他的旧福特，\n带诺拉去那儿「兜风」。');
    },
    thumb(g, w, h) {
      g.fillStyle = '#c87a50'; g.fillRect(0, 40, w, 14); g.fillStyle = '#8a4a48'; g.fillRect(0, 30, w, 10);
      g.fillStyle = '#1a1620'; for (let x = 0; x < w; x++) g.fillRect(x, 46 + Math.round(Math.sin(x * .08) * 3), 1, 12);
      g.fillStyle = '#141a26'; g.fillRect(0, 58, w, h - 58);
      g.fillStyle = '#b8bcc2'; g.fillRect(0, 56, w, 3);
      for (const x of [36, 116]) { g.fillRect(x, 14, 3, 44); g.fillRect(x + 7, 14, 3, 44); g.fillRect(x, 14, 10, 2); }
      for (let x = 0; x < w; x++) { const y = x < 37 ? 16 + (37 - x) * 1.1 : x > 125 ? 16 + (x - 125) * 1.1 : 16 + 32 * (1 - Math.pow((x - 81) / 44, 2)); g.fillRect(x, Math.round(y), 1, 1); if (x % 6 === 0) g.fillRect(x, Math.round(y), 1, 56 - Math.round(y)); }
      g.fillStyle = '#ffe8a0'; for (let x = 4; x < w; x += 12) g.fillRect(x, 55, 1, 1);
      const cx = 121, cy = 2;   // 塔顶上的天蛾人
      g.fillStyle = '#0c0a0a';
      for (let r = 0; r < 12; r++) { const ext = r < 4 ? 4 + r * 3 : 16 - (r - 4); g.fillRect(cx - 2 - ext, cy + 3 + r, ext, 1); g.fillRect(cx + 4, cy + 3 + r, ext, 1); }
      g.fillRect(cx - 3, cy, 8, 14); g.fillRect(cx - 2, cy - 2, 6, 3);
      g.fillStyle = '#ff2a14'; g.fillRect(cx - 2, cy + 1, 2, 2); g.fillRect(cx + 2, cy + 1, 2, 2);
      const gr = g.createRadialGradient(cx + 1, cy + 2, 1, cx + 1, cy + 2, 14); gr.addColorStop(0, 'rgba(255,40,20,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(cx - 14, cy - 12, 30, 30);
    },
    maps: {
      /* ---------------- TNT 废弃区（1966年11月15日 深夜） ---------------- */
      tnt: {
        amb: 'wind', dark: .88, plr: 3.0, wall: 'brick', wallC: { face: '#4a2e26', trim: '#24160f' }, darkC: '#04040a',
        tileOpts: { grassC: '#283422', treeC: '#14221a', fenceBase: 'grass' },
        rows: TNT_ROWS,
        ents: ids('tnt', [
          { id: 'car', x: 2, y: 13, w: 2, spr: 'car', col: '#34506a', light: { r: 3.4, dx: 36, dy: 8, col: 'rgba(255,240,200,.16)' }, on: S => S.narr('巴德的旧福特。\n车头灯开着，照着一片枯草和铁丝网。') },
          { id: 'bud', x: 6, y: 11, spr: '@bud', dir: 1, on: budTnt },
          { id: 'igloo1', x: 2, y: 5, w: 3, h: 2, spr: 'igloo', open: true, num: 7, on: S => S.narr('一座覆着草皮的水泥圆包，是当年存炸药的。\n铁门半开着，里面黑得像口井。\n一股霉味，还有……什么东西烧焦的味道。') },
          { id: 'igloo2', x: 19, y: 5, w: 3, h: 2, spr: 'igloo', num: 12, on: S => S.narr('铁门锁着，锁早就锈死了。\n门板上，有几道很深的划痕——是从外面划的，在两米多高的地方。') },
          { id: 'igloo3', x: 22, y: 9, w: 3, h: 2, spr: 'igloo', num: 13, on: S => S.narr('草皮顶上落着几根很长的、灰褐色的羽毛。\n……不对，摸上去不像羽毛。像毛皮。') },
          { id: 'igloo4', x: 8, y: 10, w: 3, h: 2, spr: 'igloo', num: 4, on: S => S.narr('有人在铁门上用油漆写了一行字：\n「KEEP OUT」——别进来。\n下面又有人加了一行，字写得歪歪扭扭：「它住在发电厂里」。') },
          { id: 'pdoor', x: 13, y: 3, spr: 'pdoor', on: plantDoor },
          { id: 'eyes', x: 13, y: 3, spr: 'eyes', hidden: true, z: 1, solid: false, light: { r: 1.1, dy: -1, col: 'rgba(255,40,20,.55)' } },
          { id: 'bwin1', x: 10, y: 3, spr: 'bwin', on: S => S.narr('旧发电厂的窗户，玻璃全碎了。\n风从里面往外吹，带着一股机油味。') },
          { id: 'bwin2', x: 16, y: 3, spr: 'bwin', on: S => S.narr('窗户里面黑漆漆的。\n你好像听见里面有什么东西，在慢慢地呼吸。') },
          { id: 'prints', x: 16, y: 6, spr: 'prints', decal: true, on: S => S.narr('泥地上有两行很大的印子。三个趾头，像鸟爪——\n可一个印子就比你的手掌还大。\n印子是往发电厂那边去的。') },
          { id: 'tsign', x: 17, y: 11, spr: 'tntsign', on: S => S.narr('「禁止入内　西弗吉尼亚军械厂（已废弃）」\n牌子被人打了好几个枪眼。') },
          { id: 'moth', x: 13, y: 4, spr: 'moth', hidden: true, solid: false, light: { r: 1.3, dx: 8, dy: -19, col: 'rgba(255,40,20,.6)' } }
        ]),
        async enter(S, first) {
          if (!first) return;
          S.f.phase = 'explore'; S.give('pen', true);
          await S.narr('车灯一灭，四下里黑得什么都看不见。\n风从枯草上刮过去，沙沙地响。');
          await S.say('巴德', ['就是这儿。镇上的人都叫它「TNT」。', '听说北边那座旧发电厂里……有东西。去看看？']);
          S.goal('去北边的旧发电厂看看（顺着石子路）');
        },
        step(S, x, y) { if (S.f.phase === 'run' && x <= 6 && y >= 12) return tntEscape(S); },
        tick(S, dt) {
          const m = S.ent('moth');
          if (S.f.phase === 'run' && m && m.chase && !S.busy) { SND.wing -= dt; if (SND.wing <= 0) { SND.wing = .5; wingbeat(S, .7); } }
        }
      },
      /* ---------------- 信使报 报社 ---------------- */
      office: {
        amb: 'room', dark: .36, plr: 3.6, wall: 'wood', floor: 'wood', wallC: { face: '#5e4632', trim: '#30221a' },
        rows: ['##############', '##############', '#............#', '#............#', '#............#', '#............#', '#............#', '#............#', '##############'],
        ents: ids('office', [
          { id: 'door_o', x: 1, y: 1, spr: 'door', col: '#4a3422', on: async S => { S.sfx('open'); await S.go('town', 2, 2, 0); } },
          { id: 'board', x: 4, y: 1, w: 3, spr: 'board', on: boardOn },
          { id: 'owin', x: 8, y: 1, w: 2, spr: 'owin', light: { r: 2.4, dx: 16, dy: 10, col: 'rgba(255,200,150,.08)' }, on: S => S.narr('窗外看得见河，和河上的银桥：两座塔，一串灯。\n天还没黑，桥上的灯已经亮了。') },
          { id: 'clockO', x: 11, y: 1, spr: 'wallclock', on: S => S.narr('墙上的钟：' + clockStr(S.f.clock || 870) + '。\n秒针走得一下比一下响。') },
          { id: 'files', x: 12, y: 2, spr: 'files', on: async S => { await S.narr('旧报纸的档案柜。你拉开「1966年11月」那一格。'); await S.note('clip'); } },
          { id: 'desk_h', x: 9, y: 4, spr: 'desk', on: S => S.narr('哈尔的桌子。烟灰缸满了。\n电话听筒上缠着胶布——上个月，它自己响了一整夜。') },
          { id: 'hal', x: 10, y: 4, spr: '@hal', dir: 1, on: halOn },
          { id: 'tw', x: 3, y: 5, spr: 'twdesk', on: S => S.narr('你的打字机。纸上还卡着半句：\n「本镇居民近日……」') },
          { id: 'radio', x: 12, y: 4, spr: 'radio', on: async S => { jingle(S); await S.say('收音机', '……今天傍晚，总统将在华盛顿按下按钮，点亮国家圣诞树。本台将现场转播……'); } },
          { id: 'papers', x: 2, y: 7, spr: 'papers', on: S => S.narr('一摞今天的报纸，油墨还没干透。\n头版：「圣诞采购季，银桥车流创新高」。') },
          { id: 'rack', x: 12, y: 7, spr: 'coatrack', on: S => S.narr('衣帽架上挂着哈尔的旧大衣，口袋里鼓鼓囊囊，全是揉皱的采访条。') }
        ]),
        async enter(S, first) {
          if (!first) return;
          S.f.phase = 'town'; S.f.v3 = true; S.f.clock = 870;
          await S.say('哈尔', ['诺拉，过来看看。', '这一年多送到报社来的怪事，我全钉在这块板上了。按送来的先后，编了一到六。', '可那是先来后到，不是先发生后发生。有的人憋了半年才肯来说。', '我总觉得……这些事是排着队来的。像有人在倒数。']);
          await S.say('诺拉', '倒数到哪儿？');
          await S.say('哈尔', ['所以才要你去问。卡片上的日期全是听来的，一个字也别信。', '去主街，找当事人核实。③号是你和巴德的那晚——那个日期，你比谁都清楚。']);
          await S.note('cards');
          jingle(S);
          await S.say('收音机', '……今天傍晚，总统将在华盛顿按下按钮，点亮国家圣诞树……');
          townGoal(S);
        }
      },
      /* ---------------- 主街 ---------------- */
      town: {
        amb: 'wind', dark: .42, plr: 4, wall: 'brick', floor: 'concrete', darkC: '#0a0812',
        legend: { F: 'fwall', V: 'river' },
        rows: TOWN_ROWS,
        ents: ids('town', [
          { id: 'door_paper', x: 2, y: 1, spr: 'door', col: '#4a3422', on: async S => { S.sfx('open'); await S.go('office', 1, 2, 0); } },
          { id: 'sign_paper', x: 4, y: 1, spr: 'shopsign', text: '信使报', col: '#2a3a5a', on: S => S.narr('《信使报》。镇上唯一的报纸，你在这儿当见习记者。') },
          { id: 'win1', x: 6, y: 1, spr: 'window', lit: true, on: S => S.narr('报社的窗户。哈尔在里面来回踱步，嘴里叼着没点的烟。') },
          { id: 'door_tv', x: 9, y: 1, spr: 'door', col: '#3a4a3a', on: S => S.narr('门上挂着一块牌子：「外出修理——人在门口」。') },
          { id: 'sign_tv', x: 11, y: 1, spr: 'shopsign', text: '电视修理', col: '#3a5a3a', on: S => S.narr('「巴德电视修理」。招牌是巴德自己刷的，「修」字少了一点。') },
          { id: 'bud_t', x: 10, y: 3, spr: '@bud', dir: 0, on: budTown },
          { id: 'tvset', x: 11, y: 3, spr: 'tvcrate', on: S => S.narr(S.ent('tvset').power ? '……' : '一台修好的电视，放在木箱上。\n黑屏里映着你的脸，和你身后灰蒙蒙的天。') },
          { id: 'win_d1', x: 14, y: 1, spr: 'window', lit: true, on: S => S.narr('餐馆里暖烘烘的，玻璃上一层水汽。\n有人用手指在水汽上画了两个圆点。') },
          { id: 'door_diner', x: 15, y: 1, spr: 'door', col: '#7a2a2a', on: S => S.narr('「河景餐馆」。门上的铃铛「叮铃」一声。\n里面在放猫王的圣诞歌。') },
          { id: 'sign_diner', x: 17, y: 1, spr: 'shopsign', text: '河景餐馆', col: '#7a2a3a', on: S => S.narr('「河景餐馆　咖啡续杯免费」。') },
          { id: 'doris_t', x: 15, y: 3, spr: '@doris', dir: 0, on: dorisTown },
          { id: 'payph', x: 18, y: 2, spr: 'payphone', on: payphoneOn },
          { id: 'win_m', x: 21, y: 1, spr: 'window', on: S => S.narr('旅社的窗帘拉着。\n二楼有一扇窗，窗帘缝里好像有人往外看。') },
          { id: 'door_motel', x: 22, y: 1, spr: 'door', col: '#5a4a3a', on: S => S.narr('旅社的门。门框上还挂着褪了色的独立日小彩旗。') },
          { id: 'sign_motel', x: 24, y: 1, spr: 'neon', text: '河畔旅社', on: S => S.narr('霓虹灯招牌一闪一闪。「河畔旅社　空房」。') },
          { id: 'mae', x: 22, y: 3, spr: '@mae', dir: 0, on: maeOn },
          { id: 'win_hw', x: 26, y: 1, spr: 'window', lit: true, on: S => S.narr('五金店的橱窗里堆满了圣诞彩灯，一闪一闪。\n价签上写着：「一串 1.29 美元」。') },
          { id: 'door_hw', x: 27, y: 1, spr: 'door', col: '#3a3a5a', on: S => S.narr('五金店。卡尔刚在里面买了两串彩灯。') },
          { id: 'sign_hw', x: 29, y: 1, spr: 'shopsign', text: '五金', col: '#5a4a2a', on: S => S.narr('「五金　工具　圣诞装饰」。') },
          { id: 'carl_t', x: 28, y: 3, spr: '@carl', dir: 0, on: carlOn },
          { id: 'pickup_t', x: 29, y: 4, w: 2, spr: 'pickup', s: { kid: true }, on: S => S.narr('卡尔的皮卡。苏西趴在副驾驶的窗户上，冲你挥手。') },
          { id: 'door_bank', x: 33, y: 1, spr: 'door', col: '#5a5a5a', on: S => S.narr('银行已经关门了。门上贴着：「圣诞节照常营业」。') },
          { id: 'clockT', x: 34, y: 1, spr: 'wallclock', on: S => S.narr('银行门口的钟：' + clockStr(S.f.clock || 870) + '。') },
          { id: 'xtree', x: 32, y: 2, spr: 'xtree', on: S => S.narr('镇上的圣诞树。彩灯一明一灭。\n树顶上的星星歪了，没人去扶。') },
          { id: 'bsign_t', x: 36, y: 2, spr: 'bsign', on: S => S.narr('「银桥　通往俄亥俄州」。\n顺着主街一直往东，就是桥头。') },
          { id: 'pcar1', x: 4, y: 6, w: 2, spr: 'car', col: '#5a3a2a', on: S => S.narr('路边停着的车。挡风玻璃上落了一层薄霜。') },
          { id: 'pcar2', x: 23, y: 6, w: 2, spr: 'car', col: '#2a4a5a', on: S => S.narr('车顶上绑着一棵刚买的圣诞树。') },
          { id: 'tlamp1', x: 7, y: 7, spr: 'xlamp', light: { r: 3, dy: -24, col: 'rgba(255,220,150,.12)' }, on: S => S.narr('路灯杆上缠着冬青和彩灯。\n下午三点，天阴得像傍晚，路灯已经亮了。') },
          { id: 'tlamp2', x: 13, y: 7, spr: 'xlamp', light: { r: 3, dy: -24, col: 'rgba(255,220,150,.12)' }, on: S => S.narr('路灯。灯罩里落着几只冻僵的飞蛾。') },
          { id: 'tlamp3', x: 26, y: 7, spr: 'xlamp', light: { r: 3, dy: -24, col: 'rgba(255,220,150,.12)' }, on: S => S.narr('路灯。彩灯有一截不亮了。') },
          { id: 'tlamp4', x: 32, y: 7, spr: 'xlamp', light: { r: 3, dy: -24, col: 'rgba(255,220,150,.12)' }, on: S => S.narr('路灯杆上贴着一张寻狗启事，纸已经泛黄：\n「强尼，棕色，左耳缺一角。」') },
          { id: 'mib', x: 20, y: 7, spr: '@mib', dir: 3, hidden: true, on: mibOn },
          { id: 'rview', x: 18, y: 10, spr: 'rview', solid: true, on: S => S.narr('河堤的台阶下面就是俄亥俄河。水是铅灰色的，流得很急。\n往东看，银桥横在河上，两座塔，一串灯。\n——九月那几团光，就是在这儿被看见的。') },
          ...[2, 3, 4, 5, 6, 7].map(y => ({ id: 'exL' + y, x: 0, y, spr: 'invisible', solid: false, async touch(S) { await S.think('往北是 62 号公路……TNT 那边。\n你不想再去那儿。'); S.pos(2, S.pl.y, 2); } })),
          ...[2, 3, 4, 5, 6, 7].map(y => ({ id: 'exR' + y, x: 37, y, spr: 'invisible', solid: false, touch: townRight }))
        ]),
        async enter(S, first) {
          if (!first) return;
          await S.narr('主街上挂满了圣诞彩灯。\n天阴着，下午三点不到，路灯就亮了。');
          townGoal(S);
        },
        tick(S, dt) {
          const ph = S.ent('payph');
          if (ph && ph.s.ring) { SND.ring -= dt; if (SND.ring <= 0) { SND.ring = 2.2; ring(S); S.bubble('payph', '!', 900); } }
          if (!S.busy && !S.f.mibShown && nVer(S) >= 3 && S.pl.x > 12 && S.pl.x < 30) { S.f.mibShown = true; S.run(mibAppear); }
        }
      },
      /* ---------------- 银桥 ---------------- */
      bridge: {
        amb: 'river', dark: .5, plr: 3.4, wall: 'brick', floor: 'concrete', darkC: '#08060e',
        legend: { N: 'dsky', M: 'dsky2', Q: 'truss', D: 'walk', A: 'lane', V: 'river' },
        tileOpts: { grassC: '#2a3424' },
        rows: BRIDGE_ROWS,
        ents: ids('bridge', [
          { id: 'bsign_b', x: 3, y: 2, spr: 'bsign', on: S => S.narr('「银桥　1928」。\n桥头的铜牌上刻着：「连接两个州的友谊」。') },
          ...TOWERS.map(x => ({ id: 'towerN' + x, x, y: 2, spr: 'tower', on: S => S.narr('桥塔。铆钉一颗挨着一颗，铝粉漆剥落的地方露出铁锈。\n吊链从塔顶垂下来，一节一节，是一根根扁扁的铁杆串起来的。') })),
          ...TOWERS.map(x => ({ id: 'towerS' + x, x, y: 6, spr: 'tower' })),
          ...LAMPS.map(x => ({ id: 'lamp' + x, x, y: 2, spr: 'blamp', light: { r: 2.6, dy: -16, col: 'rgba(255,230,160,.14)' }, on: S => S.narr(S.ent('lamp' + x).off ? '灯灭了。' : '桥灯。灯罩上结着薄冰。\n底下的吊链在风里轻轻地「咔、咔」响。') })),
          ...laneCars(4, 5, 45, [9, 10, 11, 21, 22, 23, 31, 32, 33], CAR_COLS),
          ...laneCars(5, 5, 45, [], CAR_COLS.slice().reverse()),
          { id: 'dcar', x: 9, y: 4, w: 2, spr: 'bcar', col: '#d88a9a', on: S => S.narr('多丽丝的粉色小轿车。后视镜上挂着一个塑料天使。') },
          { id: 'pickup_b', x: 22, y: 4, w: 2, spr: 'pickup', s: { kid: true }, on: S => S.narr(S.f.pd_carl ? '皮卡空了。车斗里放着两串还没拆封的彩灯。' : '卡尔的皮卡。苏西趴在窗户上，一直盯着塔顶。') },
          { id: 'van_b', x: 32, y: 4, w: 2, spr: 'van', on: S => S.narr('巴德的货车。车厢里绑着那台修好的电视。') },
          { id: 'doris_b', x: 11, y: 4, spr: '@doris', dir: 3, on: S => persuade(S, 'doris') },
          { id: 'carl_b', x: 21, y: 4, spr: '@carl', dir: 3, on: S => persuade(S, 'carl') },
          { id: 'bud_b', x: 31, y: 4, spr: '@bud', dir: 3, on: S => persuade(S, 'bud') },
          { id: 'mib_b', x: 40, y: 3, spr: '@mib', dir: 1, on: async S => { await S.say('黑西装的男人', ['诺拉小姐。', '现在几点了？']); await S.narr('他抬起手腕给你看他的表。\n表上没有指针。'); } },
          { id: 'moth_b', x: 33, y: 1, spr: 'moth', solid: false, z: 1, oy: -14, light: { r: 1.4, dx: 8, dy: -33, col: 'rgba(255,40,20,.6)' } },
          { id: 'doris_h', x: 1, y: 6, spr: '@doris', dir: 2, hidden: true, on: S => S.say('多丽丝', '……我刚才，就差一点。') },
          { id: 'carl_h', x: 2, y: 7, spr: '@carl', dir: 2, hidden: true, on: S => S.say('卡尔', '强尼……那天晚上，它是不是也想告诉我们什么？') },
          { id: 'susie_h', x: 3, y: 7, spr: '@susie', dir: 2, hidden: true, on: S => S.say('苏西', '大鸟还在看我们。') },
          { id: 'bud_h', x: 3, y: 6, spr: '@bud', dir: 2, hidden: true, on: S => S.say('巴德', '跟那晚一样……它一直跟着。') },
          { id: 'crowd1', x: 0, y: 6, spr: '@man1', dir: 2, hidden: true, on: S => S.say('男人', '到底怎么回事？') },
          { id: 'crowd2', x: 1, y: 7, spr: '@woman1', dir: 2, hidden: true, on: S => S.say('女人', '车还在桥上呢……') },
          { id: 'crowd3', x: 0, y: 7, spr: '@man2', dir: 2, hidden: true, on: S => S.say('男人', '谁让我们下车的？') },
          { id: 'crowd4', x: 2, y: 8, spr: '@man1', dir: 3, hidden: true, on: S => S.say('男人', '……那是什么？塔顶上那个。') },
          { id: 'exB', x: 45, y: 3, spr: 'invisible', solid: false, async touch(S) { await S.think('再往前就是俄亥俄那头了。'); S.pos(43, 3, 1); } },
          ...[2, 3, 4, 5, 6, 7].map(y => ({ id: 'exBL' + y, x: 0, y, spr: 'invisible', solid: false, async touch(S) { await S.think(S.f.phase === 'bridge' ? '桥上还有人。' : '……'); S.pos(1, S.pl.y, 2); } }))
        ]),
        async enter(S, first) {
          if (!first) return;
          await bridgeIntro(S);
          S.f.phase = 'bridge';
          S.f.bt = Math.max(BR_MIN, BR_BASE - BOARD_PEN * (S.f.bw || 0));
          bridgeGoal(S);
          S.cp('bridge');
          startBridgeTimer(S, false);
        },
        step(S, x, y) { if (S.f.phase === 'bridge' && nOff(S) >= 3 && x <= 4) return finale(S); },
        tick(S, dt) {
          if (S.f.phase !== 'bridge') return;
          const left = S.timerLeft, T = S.f.btNow || BR_BASE;
          if (left != null) S.dark(.48 + .32 * Math.min(1, Math.max(0, 1 - left / T)), 'bridge');
          if (S.busy) return;
          SND.honk -= dt; if (SND.honk <= 0) { SND.honk = 3 + Math.random() * 4; honk(S, 260 + Math.random() * 120, 0, .6); }
          SND.scr -= dt; if (SND.scr <= 0) { SND.scr = 8 + Math.random() * 5; screech(S, .5); S.bubble('moth_b', '!', 900); }
          SND.creak -= dt; if (SND.creak <= 0) { const late = left != null && left < 18; SND.creak = late ? 2.2 : 7 + Math.random() * 4; creak(S, late ? 1.6 : .7); if (late) S.shake(300, 1); }
        }
      }
    }
  });
})();
