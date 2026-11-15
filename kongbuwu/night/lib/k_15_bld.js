/* ================= 建筑主题：居民楼 / 学校 / 医院（RULES 39） =================
   地图写 bld: 'apt' | 'sch' | 'hosp' 就会：
   · 墙变成两格高的立面（上半墙 + 带墙裙的下半墙；医院有扶手），地面换成水磨石 / 旧水泥 / 医院地胶；
   · 墙上自动挂东西（门牌、窗、黑板报、电表箱、小广告、安全出口、宣传画……），只画在墙上，不占路；
   · 地上画门垫、鞋、导向线（只是画，能踩）；
   · bldProps 不为 false 时，在走廊里贴墙放 1–3 件家具（排椅、轮椅、输液架 / 鞋柜、自行车 / 饮水机、拖把桶），
     只放在离任何实体 ≥2 格、不切断通路的位置；它们只挡玩家，剧情里走动的人和鬼直接穿过去（脚本不会被卡住）。
   这个文件也被 src/build.py 拼进主游戏，白天小剧场的背景用同一套墙、地面和挂件。 */
const BLD_THEMES = ['apt', 'sch', 'hosp'];
Object.assign(WALLSTYLE, {
  sch: { top: '#16181a', face: '#cfc9b6', low: '#4d6e5d', trim: '#2c3f34', pat: 'bld' },
  apt: { top: '#141413', face: '#9f9a8a', low: '#5a5e57', trim: '#32342e', pat: 'bld', dirty: 1 },
  hosp: { top: '#141a1b', face: '#d0d9d6', low: '#86a9ae', trim: '#3e5c60', pat: 'bld', rail: '#8a6a48' }
});
/* 两格高的墙：贴着地面的是下半墙（墙裙、踢脚线），它上面一格是上半墙（顶上一道阴影线） */
{ const _pw = paintWall; paintWall = function (R, X, Y, face, st, isWall) {
  if (st.pat !== 'bld') return _pw(R, X, Y, face, st, isWall);
  const lower = !isWall(X, Y + 1), upper = !lower && !isWall(X, Y + 2);
  if (!lower && !upper) return _pw(R, X, Y, false, st, isWall);
  const f = st.face; R(0, 0, 16, 16, f);
  if (upper) { R(0, 0, 16, 2, shade(f, -.55)); R(0, 2, 16, 1, shade(f, -.28)); R(0, 3, 16, 1, shade(f, .06)); }
  else { R(0, 7, 16, 7, st.low); R(0, 6, 16, 1, shade(st.low, .3)); if (st.rail) { R(0, 4, 16, 2, st.rail); R(0, 6, 16, 1, shade(st.rail, -.45)); } R(0, 14, 16, 2, st.trim); R(0, 14, 16, 1, shade(st.trim, .25)); }
  if (st.dirty) for (let i = 0; i < 2; i++) { const h = hash(X, Y, 90 + i); if (h < .35) R((h * 40) % 13 | 0, upper ? 5 + i * 4 : 1 + i * 3, 2 + (h * 9 | 0) % 4, 1, 'rgba(70,58,36,.28)'); }
  if (!isWall(X - 1, Y) && isWall(X + 1, Y)) R(0, 0, 1, 16, shade(f, -.3)); if (!isWall(X + 1, Y) && isWall(X - 1, Y)) R(15, 0, 1, 16, shade(f, -.3));
}; }
/* 地面 */
defTile('terrazzo', false, (R, X, Y) => { speck(R, '#8e8d85', ['#a3a299', '#7a7972', '#b5ab8e', '#6d7a74'], X, Y, 20, 21); if (X % 3 === 0) R(0, 0, 1, 16, '#a8925a'); if (Y % 3 === 0) R(0, 0, 16, 1, '#a8925a'); });
defTile('cement2', false, (R, X, Y) => { speck(R, '#67645c', ['#726f66', '#5a5850', '#6d6a61'], X, Y, 18, 22); const h = hash(X, Y, 23); if (h < .18) { R(2, 5, 6, 4, '#5d5a52'); R(3, 6, 4, 2, '#615e56'); } else if (h < .3) { R(4, 9, 5, 1, '#4b4943'); R(8, 10, 4, 1, '#4b4943'); } });
defTile('hlino', false, (R, X, Y) => { R(0, 0, 16, 16, '#9fb3ad'); for (let i = 0; i < 6; i++) R((hash(X, Y, 30 + i) * 16) | 0, (hash(Y, X, 30 + i) * 16) | 0, 1, 1, i % 2 ? '#aabdb7' : '#93a7a1'); if (X % 2 === 0) R(0, 0, 1, 16, '#8a9e98'); if (Y % 4 === 0) R(0, 0, 16, 1, '#8a9e98'); R(3, 3, 3, 1, '#b4c6c0'); });
const BLDF = { sch: { linoleum: 'terrazzo', concrete: 'terrazzo' }, apt: { concrete: 'cement2', linoleum: 'cement2' }, hosp: { linoleum: 'hlino', concrete: 'hlino', tile: 'hlino' } };
if (typeof tileName === 'function') { const _tn = tileName; tileName = function (m, x, y) { const t = _tn(m, x, y), b = m.def && m.def.bld; return b && BLDF[b][t] && !m.def.bldKeepFloor ? BLDF[b][t] : t; }; }

/* ---------- 挂件（画在墙上 / 地上，原点是那一格的左上角） ---------- */
const BDEC = {
  /* 学校 */
  schPlate(R) { R(8, 9, 1, 4, '#4a4a44'); R(9, 8, 6, 6, '#e6e1d4'); R(9, 8, 6, 1, '#6a7f6c'); R(10, 10, 4, 1, '#3a3a36'); R(10, 12, 3, 1, '#3a3a36'); },
  schTransom(R) { R(3, 10, 10, 5, '#6d6a5e'); R(4, 11, 8, 3, '#14202a'); R(8, 11, 1, 3, '#6d6a5e'); },
  schWin(R) { R(1, 4, 14, 11, '#8a928c'); R(2, 5, 12, 9, '#0f1922'); R(7, 5, 2, 9, '#8a928c'); R(2, 9, 12, 1, '#8a928c'); R(3, 6, 2, 1, '#355068'); R(10, 10, 2, 1, '#2a4256'); },
  schBoard(R, d) { const p = d.part; R(0, 3, 16, 12, '#6a4c30'); R(p ? 0 : 1, 4, p ? 15 : 15, 10, '#2c4636'); if (!p) { R(3, 5, 2, 2, '#d24a3a'); R(6, 5, 2, 2, '#d24a3a'); R(9, 5, 2, 2, '#d24a3a'); R(3, 9, 9, 1, '#d8d4c0'); R(3, 11, 7, 1, '#d8d4c0'); }
    else { R(1, 6, 8, 1, '#e8c860'); R(1, 8, 10, 1, '#d8d4c0'); R(1, 10, 6, 1, '#88c0e0'); R(9, 10, 4, 3, '#e07a8a'); R(10, 9, 2, 1, '#6aa858'); } },
  schBanner(R, d) { R(0, 5, 16, 5, '#9e2624'); R(0, 5, 16, 1, '#c03a34'); for (let i = 0; i < 3; i++) R(2 + i * 5, 7, 2, 2, '#e8c860'); if (d.end === 0) R(0, 4, 1, 7, '#5a4a3a'); if (d.end === 1) R(15, 4, 1, 7, '#5a4a3a'); },
  schClock(R) { R(5, 4, 6, 6, '#2a2a28'); R(6, 5, 4, 4, '#e8e4d8'); R(7, 6, 1, 2, '#222'); R(8, 7, 1, 1, '#b02a2a'); },
  schNotice(R, d) { R(3, 5, 5, 7, '#e0dac6'); R(9, 6, 4, 5, '#d8c890'); R(4, 7, 3, 1, '#555'); R(4, 9, 2, 1, '#555'); R(10, 8, 2, 1, '#555'); R(5, 5, 1, 1, '#b02a2a'); R(10, 6, 1, 1, '#2a5ab0'); },
  schFire(R) { R(4, 0, 8, 11, '#a82622'); R(4, 0, 8, 1, '#c84a3a'); R(6, 2, 4, 5, '#e6e2d6'); R(7, 3, 2, 3, '#b82a26'); R(5, 9, 6, 1, '#6a1614'); },
  schSwitch(R) { R(6, 0, 4, 5, '#dcd8c8'); R(7, 1, 2, 1, '#8a8678'); },
  /* 居民楼 */
  aptPlate(R) { R(5, 10, 6, 4, '#2a4a7a'); R(5, 10, 6, 1, '#4a6a9a'); R(6, 12, 1, 1, '#e8e8e8'); R(8, 12, 1, 1, '#e8e8e8'); R(9, 11, 1, 2, '#e8e8e8'); },
  aptMeter(R) { R(2, 4, 12, 10, '#6f716c'); R(2, 4, 12, 1, '#8a8c86'); R(3, 5, 10, 8, '#7c7e78'); R(4, 6, 8, 3, '#1e1f1c'); R(5, 7, 1, 1, '#d8d4b8'); R(7, 7, 1, 1, '#d8d4b8'); R(9, 7, 1, 1, '#d8d4b8'); R(4, 10, 3, 2, '#b8b498'); R(12, 8, 1, 3, '#4a4c46'); R(7, 14, 1, 2, '#1a1a1a'); R(9, 14, 1, 2, '#1a1a1a'); },
  aptAds(R, d) { const c = [['#e6e2d0', '#b02a2a'], ['#e8d870', '#1a1a1a'], ['#f0f0ea', '#2a3a8a']]; for (let i = 0; i < 4; i++) { const h = hash(d.x, d.y, 50 + i); if (h < .3) continue; const k = c[i % 3], x = (h * 97 | 0) % 11, y = d.low ? 0 + (h * 31 | 0) % 6 : 4 + (h * 31 | 0) % 7; R(x, y, 5, 3, k[0]); R(x + 1, y + 1, 3, 1, k[1]); } },
  aptStain(R) { R(3, 4, 9, 6, 'rgba(66,52,30,.22)'); R(5, 10, 5, 4, 'rgba(66,52,30,.18)'); R(6, 13, 2, 3, 'rgba(66,52,30,.15)'); },
  aptWire(R, d) { R(0, 4, 16, 1, '#1c1c1a'); if (d.box) { R(5, 2, 6, 5, '#55574f'); R(6, 3, 4, 1, '#3a3c36'); } },
  aptStamp(R) { R(1, 1, 11, 6, '#9a2a24'); R(2, 2, 9, 4, '#a39e8e'); R(3, 3, 2, 2, '#9a2a24'); R(6, 3, 2, 2, '#9a2a24'); R(2, 8, 12, 1, '#2a2a2a'); R(3, 10, 9, 1, '#2a2a2a'); },
  aptSwitch(R) { R(6, 0, 4, 5, '#c8c4b2'); R(7, 1, 2, 2, '#e8e4d0'); },
  aptLamp(R) { R(7, 0, 1, 6, '#1a1a1a'); R(5, 6, 5, 3, '#d8d0a0'); R(6, 9, 3, 1, '#a89a60'); },
  aptMat(R, d) { R(2, 4, 12, 8, d.c || '#6a3a2a'); for (let i = 0; i < 3; i++) R(3, 5 + i * 2, 10, 1, shade(d.c || '#6a3a2a', .15)); },
  aptShoes(R) { R(2, 10, 4, 2, '#1e1e1e'); R(2, 9, 2, 1, '#2e2e2e'); R(7, 11, 4, 2, '#4a3226'); R(7, 10, 2, 1, '#5a4232'); },
  aptBag(R) { R(4, 7, 8, 7, '#161616'); R(5, 6, 6, 2, '#1e1e1e'); R(7, 4, 2, 3, '#161616'); R(5, 9, 2, 1, '#2c2c2c'); },
  /* 医院 */
  hospPlate(R) { R(2, 9, 12, 5, '#eef2f0'); R(2, 9, 4, 5, '#3a6aa8'); R(3, 11, 3, 1, '#ffffff'); R(4, 10, 1, 3, '#ffffff'); R(7, 11, 5, 1, '#5a6a72'); },
  hospCall(R) { R(6, 12, 4, 2, '#5a1010'); R(7, 11, 2, 1, '#a02020'); },
  hospExit(R) { R(1, 5, 14, 7, '#1d7f46'); R(1, 5, 14, 1, '#2aa05a'); R(3, 7, 2, 2, '#e8f4ea'); R(4, 9, 2, 2, '#e8f4ea'); R(6, 8, 2, 1, '#e8f4ea'); R(9, 7, 4, 3, '#e8f4ea'); R(10, 8, 2, 1, '#1d7f46'); },
  hospPoster(R, d) { R(3, 4, 10, 10, '#e8ece8'); R(3, 4, 10, 3, d.c || '#3a7ab0'); R(5, 8, 6, 1, '#7a8a90'); R(5, 10, 4, 1, '#7a8a90'); R(9, 10, 2, 3, '#c04848'); },
  hospQuiet(R) { R(5, 5, 6, 6, '#c03030'); R(6, 6, 4, 4, '#f0f0ec'); R(7, 7, 2, 2, '#2a2a2a'); },
  hospSan(R) { R(6, 0, 5, 6, '#e6eae8'); R(6, 0, 5, 1, '#b8c0c0'); R(8, 6, 1, 2, '#9aa0a0'); },
  hospClock(R) { R(5, 4, 6, 6, '#3a4a50'); R(6, 5, 4, 4, '#f2f4f2'); R(7, 6, 1, 2, '#222'); R(8, 7, 1, 1, '#222'); },
  hospLine(R, d) { R(0, 11, 16, 2, d.c1 || '#3a72b0'); R(0, 14, 16, 1, d.c2 || '#3a9a6a'); }
};
/* ---------- 家具（实体精灵） ---------- */
Object.assign(SPR, {
  hbench(g, e, t, R) { R(1, 4, 30, 2, '#5a6066'); for (let i = 0; i < 3; i++) { const x = 1 + i * 10; R(x, -4, 9, 8, '#2f5f9a'); R(x, -4, 9, 1, '#4a7ab4'); R(x, 4, 9, 4, '#3a6aa8'); } R(2, 8, 2, 6, '#4a4f55'); R(28, 8, 2, 6, '#4a4f55'); R(15, 8, 2, 5, '#4a4f55'); },
  wheelchair(g, e, t, R) { R(3, 0, 2, 9, '#7a7e84'); R(4, -2, 8, 7, '#2a3a4a'); R(4, 4, 9, 3, '#24323e'); R(2, 6, 9, 9, '#5a5e64'); R(3, 7, 7, 7, '#1a1c20'); R(5, 9, 3, 3, '#8a8e94'); R(12, 12, 3, 3, '#3a3c40'); },
  ivstand(g, e, t, R) { R(7, -14, 1, 28, '#b8bcc0'); R(4, -14, 7, 1, '#b8bcc0'); R(4, -13, 4, 6, '#d6e8ee'); R(5, -7, 1, 4, '#c8d8dc'); R(3, 13, 10, 1, '#8a8e92'); R(3, 14, 2, 2, '#333'); R(11, 14, 2, 2, '#333'); },
  gurney(g, e, t, R) { R(1, 2, 30, 8, '#e4e8e6'); R(1, 2, 30, 1, '#f4f6f4'); R(2, 1, 6, 3, '#f6f6f2'); R(1, 10, 30, 2, '#8a9096'); R(3, 12, 2, 3, '#444'); R(27, 12, 2, 3, '#444'); },
  shoerack(g, e, t, R) { box(R, 1, 1, 14, 13, '#6a4e34'); R(2, 7, 12, 1, '#4a3420'); R(3, 3, 3, 3, '#1e1e1e'); R(8, 4, 4, 2, '#8a3a2a'); R(3, 9, 4, 3, '#4a4a52'); R(9, 9, 3, 3, '#2a2a2a'); R(2, -2, 5, 3, '#2a2a2a'); R(9, -1, 4, 2, '#5a3a2a'); },
  bike(g, e, t, R) { const w = (x) => { R(x, 4, 10, 10, '#1a1a1a'); R(x + 1, 5, 8, 8, 'rgba(0,0,0,0)'); R(x + 2, 6, 6, 6, '#3a3a38'); R(x + 4, 8, 2, 2, '#9a9a96'); }; w(1); w(21); R(6, 8, 20, 1, '#7a2a24'); R(12, 2, 1, 7, '#7a2a24'); R(10, 1, 5, 2, '#222'); R(24, 1, 1, 8, '#9a9a96'); R(22, 0, 5, 1, '#222'); },
  waterdisp(g, e, t, R) { box(R, 3, 0, 10, 15, '#e2e4e0'); R(4, -9, 8, 9, '#8ab8d8'); R(5, -8, 6, 7, '#a8d0e8'); R(5, -10, 6, 1, '#5a8ab0'); R(5, 5, 2, 2, '#b02a2a'); R(9, 5, 2, 2, '#2a5ab0'); R(4, 9, 8, 1, '#9a9c98'); },
  mopbucket(g, e, t, R) { R(3, 6, 9, 8, '#3a6aa8'); R(3, 6, 9, 1, '#5a8ac8'); R(4, 14, 7, 1, '#22446a'); R(12, -10, 1, 20, '#9a7a4a'); R(10, 9, 5, 5, '#c8c0a8'); R(10, 13, 5, 1, '#8a8270'); },
  bins(g, e, t, R) { R(1, 2, 7, 12, '#2a6ab0'); R(1, 2, 7, 2, '#3a7ac8'); R(8, 2, 7, 12, '#3a8a4a'); R(8, 2, 7, 2, '#4a9a5a'); R(3, 7, 3, 3, '#e8e8e8'); R(10, 7, 3, 3, '#e8e8e8'); }
});

/* ---------- 布置：建图时一次算好，确定、可重复 ---------- */
const BLD_DOORS = new Set(['door', 'door3', 'sliding', 'elevdoor', 'stairsup', 'stairsdown', 'booth']);
function bldSeed(s) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 997; }
function bldDecorate(m) {
  const b = m.def.bld, deco = m.bdeco = [], sd = bldSeed(m.id), H = (x, y, k) => hash(x + sd, y * 7 + k, sd);
  const wall = (x, y) => isWallAt(m, x, y), floorOk = (x, y) => { const n = tileName(m, x, y); return n !== 'wall' && n !== 'void' && n !== 'black' && !tileSolid(m, x, y); };
  const entAt = (x, y, r = 0) => m.ents.some(e => { const ex = e.x ?? Math.round(e.px / TS), ey = e.y ?? Math.round(e.py / TS); return x >= ex - r && x < ex + (e.w || 1) + r && y >= ey - r && y < ey + (e.h || 1) + r; });
  const doorAt = (x, y) => m.ents.some(e => typeof e.spr === 'string' && BLD_DOORS.has(e.spr) && Math.round(e.px / TS) === x && Math.round(e.py / TS) === y);
  /* 墙段：下半墙 (x,y) + 上半墙 (x,y-1)，下面是地面 */
  const runs = []; for (let y = 1; y < m.h - 1; y++) { let cur = null; for (let x = 0; x < m.w; x++) { const ok = wall(x, y) && wall(x, y - 1) && !wall(x, y + 1) && floorOk(x, y + 1) && !(y >= 2 && wall(x, y - 2) === false && false);
      if (ok) { if (!cur) runs.push(cur = { y, xs: [] }); cur.xs.push(x); } else cur = null; } }
  const room = m.def.bldProps === false;
  for (const r of runs) { const y = r.y, U = y - 1; let boardDone = false, bannerDone = room;
    for (let i = 0; i < r.xs.length; i++) { const x = r.xs[i], door = doorAt(x, y), busyL = entAt(x, y), busyU = entAt(x, U), h = H(x, y, 1);
      if (door) { if (room) continue; if (!busyU) deco.push({ k: b === 'sch' ? (h < .5 ? 'schPlate' : 'schTransom') : b === 'apt' ? 'aptPlate' : 'hospPlate', x, y: U, w: 1 }); if (b === 'hosp' && !busyU) deco.push({ k: 'hospCall', x, y: U, w: 1, after: 1 }); if (b === 'apt' && floorOk(x, y + 1) && !entAt(x, y + 1) && H(x, y, 9) < .7) deco.push({ k: 'aptMat', x, y: y + 1, fl: 1, c: ['#6a3a2a', '#3a4a6a', '#5a5a3a'][(H(x, y, 4) * 3) | 0] }); continue; }
      const near = doorAt(x - 1, y) || doorAt(x + 1, y);
      if (!busyU) { let k = null, o = {};
        if (b === 'sch') { const nx = r.xs[i + 1]; if (!boardDone && !room && nx === x + 1 && !doorAt(nx, y) && !entAt(nx, U) && !near && h < .5) { deco.push({ k: 'schBoard', x, y: U, part: 0 }, { k: 'schBoard', x: nx, y: U, part: 1 }); boardDone = true; i++; continue; }
          k = h < .45 ? 'schWin' : h < .52 ? 'schClock' : h < .62 ? 'schNotice' : null; if (!bannerDone && r.xs.length > 14 && i === (r.xs.length >> 1) && !entAt(x + 1, U) && !doorAt(x + 1, y)) { deco.push({ k: 'schBanner', x, y: U, end: 0 }, { k: 'schBanner', x: x + 1, y: U, end: 1 }); bannerDone = true; i++; continue; } }
        else if (b === 'apt') { k = room ? (h < .25 ? 'aptStain' : null) : h < .18 ? 'aptMeter' : h < .4 ? 'aptAds' : h < .5 ? 'aptStain' : h < .58 ? 'aptLamp' : null; }
        else { k = room ? (h < .2 ? 'hospPoster' : h < .28 ? 'hospClock' : null) : (i === 1 || i === r.xs.length - 2) && h < .7 ? 'hospExit' : h < .3 ? 'hospPoster' : h < .4 ? 'hospQuiet' : h < .48 ? 'hospClock' : null; o.c = ['#3a7ab0', '#3a9a6a', '#c07a3a'][(H(x, y, 3) * 3) | 0]; }
        if (k) deco.push(Object.assign({ k, x, y: U }, o));
        if (b === 'apt' && !room) deco.push({ k: 'aptWire', x, y: U, box: H(x, y, 5) < .12, under: 1 }); }
      if (!busyL) { const h2 = H(x, y, 2); let k = null;
        if (b === 'sch') k = near && h2 < .3 ? 'schSwitch' : room ? null : h2 < .1 ? 'schFire' : h2 < .2 ? 'schNotice' : null;
        else if (b === 'apt') k = near && h2 < .45 ? 'aptSwitch' : room ? null : h2 < .25 ? 'aptAds' : h2 < .33 ? 'aptStamp' : null;
        else k = near && h2 < .3 ? 'hospSan' : null;
        if (k) deco.push({ k, x, y, low: 1 }); }
      if (b === 'apt' && !room && floorOk(x, y + 1) && !entAt(x, y + 1, 1)) { const h3 = H(x, y, 7); if (near && h3 < .35) deco.push({ k: 'aptShoes', x, y: y + 1, fl: 1 }); else if (h3 < .05) deco.push({ k: 'aptBag', x, y: y + 1, fl: 1 }); } } }
  /* 医院：走廊地上的导向线（最下面一排地面） */
  if (b === 'hosp' && m.w >= 14) { const y = m.h - 2; for (let x = 0; x < m.w; x++) if (floorOk(x, y)) deco.push({ k: 'hospLine', x, y, fl: 1, under: 1 }); }
  if (m.def.bldProps !== false) bldProps(m, runs, entAt, doorAt, floorOk, H);
}
/* 贴墙家具：不挨着任何实体（含隐藏的、踩上去才触发的），不在门的左右，不把地面切成两半 */
function bldProps(m, runs, entAt, doorAt, floorOk, H) {
  const b = m.def.bld, pool = b === 'hosp' ? [['hbench', 2], ['wheelchair', 1], ['ivstand', 1], ['hbench', 2], ['gurney', 2]] : b === 'apt' ? [['shoerack', 1], ['bike', 2], ['plant', 1]] : [['waterdisp', 1], ['mopbucket', 1], ['bins', 1]];
  const max = Math.min(b === 'hosp' ? 3 : 2, Math.floor(m.w / 7)); if (max <= 0) return;
  const solidAt = new Set(); const key = (x, y) => x + ',' + y;
  for (const e of m.ents) if (e.solid && !e.hidden) for (let i = 0; i < (e.w || 1); i++) for (let j = 0; j < (e.h || 1); j++) solidAt.add(key(Math.round(e.px / TS) + i, Math.round(e.py / TS) + j));
  const open = (x, y) => floorOk(x, y) && !solidAt.has(key(x, y));
  const comps = () => { const seen = new Set(); let n = 0; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { if (!open(x, y) || seen.has(key(x, y))) continue; n++; const q = [[x, y]]; seen.add(key(x, y)); while (q.length) { const [a, c] = q.pop(); for (const [dx, dy] of DIRS) { const nx = a + dx, ny = c + dy; if (open(nx, ny) && !seen.has(key(nx, ny))) { seen.add(key(nx, ny)); q.push([nx, ny]); } } } } return n; };
  const start = (W && W.ch && W.ch.start && W.ch.start.map === m.id) ? W.ch.start : null; let placed = 0, idx = (H(1, 1, 11) * pool.length) | 0;
  const cands = []; for (const r of runs) for (const x of r.xs) cands.push([x, r.y + 1, H(x, r.y, 12)]); cands.sort((a, c) => a[2] - c[2]);
  const avoid = new Set(); const scan = f => { if (typeof f !== 'function') return; const s = String(f); for (const mm of s.matchAll(/go\('(\w+)',\s*(\d+),\s*(\d+)/g)) if (mm[1] === m.id) avoid.add(key(+mm[2], +mm[3])); };
  for (const id in W.ch.maps) { const d = W.ch.maps[id]; scan(d.enter); for (const e of d.ents || []) { scan(e.on); scan(e.touch); if (e.to && e.to[0] === m.id) avoid.add(key(e.to[1], e.to[2])); } }
  for (const k in W.ch) scan(W.ch[k]);
  const base = comps();
  for (const [x, y] of cands) { if (placed >= max) break; const [spr, w] = pool[idx % pool.length];
    let ok = true; for (let i = 0; i < w && ok; i++) { const tx = x + i; if (!open(tx, y) || !isWallAt(m, tx, y - 1) || entAt(tx, y, 1) || doorAt(tx - 1, y - 1) || doorAt(tx, y - 1) || doorAt(tx + 1, y - 1) || (start && Math.abs(start.x - tx) <= 1 && Math.abs(start.y - y) <= 1) || avoid.has(key(tx, y))) ok = false; if (!open(tx, y + 1)) ok = false; }
    if (!ok) continue; for (let i = 0; i < w; i++) solidAt.add(key(x + i, y)); if (comps() !== base) { for (let i = 0; i < w; i++) solidAt.delete(key(x + i, y)); continue; }
    const e = makeEnt({ x, y, spr, w, decor: true, solid: true }, W && W.ch); e._k = m.id + '#d' + placed; m.ents.push(e); placed++; idx++; }
}
if (typeof buildMap === 'function') {
  const _bm = buildMap; buildMap = function (ch, id) { const m = _bm(ch, id); if (m.def.bld) { const keep = W; try { W = Object.assign({}, keep || {}, { ch }); bldDecorate(m); } catch (er) { console.error(er); } finally { W = keep; } } return m; };
  /* 走到 / 被传送到家具那格（脚本里写死的坐标）：那件家具就收起来 */
  window.bldArrive = function () { if (!W || !W.pl) return; const m = curMap(); if (!m) return; for (const e of m.ents) if (e.decor && !e.hidden) { const x = Math.round(e.px / TS), y = Math.round(e.py / TS); if (W.pl.y === y && W.pl.x >= x && W.pl.x < x + e.w) e.hidden = true; } };
  const _rm = renderMapCache; renderMapCache = function (m) { _rm(m); if (!m.bdeco || !m.bdeco.length) return; const g = m.cache.getContext('2d');
    for (const d of m.bdeco.slice().sort((a, c) => (c.under ? 1 : 0) - (a.under ? 1 : 0) || (a.after ? 1 : 0) - (c.after ? 1 : 0))) { const n = tileName(m, d.x, d.y); if (d.fl ? n === 'wall' || n === 'void' : n !== 'wall') continue; const ox = d.x * TS, oy = d.y * TS;
      BDEC[d.k]((a, b, w, h, col) => { if (!col || w <= 0 || h <= 0) return; g.fillStyle = col; g.fillRect(ox + Math.floor(a), oy + Math.floor(b), Math.ceil(w), Math.ceil(h)); }, d); } };
  /* 家具只挡玩家：剧情里走动的人和鬼直接穿过 */
  const _pa = passable; passable = function (m, x, y, who) { if (!who || who === W.pl) return _pa(m, x, y, who); const hid = []; for (const e of m.ents) if (e.decor && !e.hidden) { e.hidden = true; hid.push(e); } try { return _pa(m, x, y, who); } finally { for (const e of hid) e.hidden = false; } };
}
if (typeof SAPI === 'object') { const _go = SAPI.go, _pos = SAPI.pos;
  SAPI.go = async function (...a) { const r = await _go.apply(this, a); if (window.bldArrive) bldArrive(); return r; };
  if (_pos) SAPI.pos = function (...a) { const r = _pos.apply(this, a); if (window.bldArrive) bldArrive(); return r; }; }
