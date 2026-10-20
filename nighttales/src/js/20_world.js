/* ================= 十夜怪谈 · 世界：地图、实体、移动、渲染、光照 ================= */
const CHAPTERS = [];
function defChapter(def) { CHAPTERS.push(def); CHAPTERS.sort((a, b) => a.n - b.n); }
const BASE_LEGEND = {
  '#': 'wall', '.': '@floor', ',': '@floor2', ' ': 'void', '0': 'black',
  '"': 'grass', ':': 'asphalt', '=': 'roadline', '|': 'roadlinev', '-': 'crosswalk', '_': 'sidewalk', '+': 'tile', 'w': 'wood', 'W': 'darkwood', 'l': 'lightwood',
  'c': 'carpet', 'r': 'rug', 't': 'tatami', 'd': 'dirt', 'u': 'mud', '~': 'water', 'o': 'shallow', 's': 'sand', 'k': 'stone', 'x': 'concrete', 'n': 'linoleum',
  'm': 'metal', 'b': 'busfloor', 'R': 'redfloor', 'q': 'marble', 'g': 'greentile', 'z': 'checker',
  'T': 'tree', 'P': 'pine', 'h': 'hedge', 'f': 'fence', 'e': 'reeds', 'L': 'rail', 'K': 'rock', 'C': 'counterT', 'B': 'bushes'
};
/* 实体上的这些字段会同步给客机并影响绘制 */
/* 注意：'on' 是调查处理函数，不能当状态；电视/收音机/钢琴的开关状态用 power */
const VKEYS = ['open', 'covered', 'cracked', 'blood', 'face', 'power', 'off', 'lit', 'full', 'read', 'eyes', 'red', 'coat', 'flowers', 'thread', 'knife', 'col', 'text', 'water', 'locked', 'flicker', 'num', 'ox', 'oy'];
const NONSOLID = new Set(['note', 'paper', 'key', 'item', 'sparkle', 'coin', 'footprints', 'stain', 'puddle', 'handprint', 'marigold', 'newspaper', 'photo', 'scissors', 'knife', 'cup', 'salt', 'rice', 'thread', 'paw', 'candy', 'flashlight', 'match', 'towel', 'book', 'dock', 'rope', 'shoes', 'brush', 'invisible', 'skin', 'whisk']);

let W = null;          // 当前章节运行态（主机权威；客机是镜像）
const FX = [];         // 屏幕特效
const PINGS = [];

function newWorld(ch) {
  const w = { ch, mapId: null, maps: {}, inv: [], f: {}, mapDark: {}, queue: [], goal: '', timer: null, pl: null, shake: null, fade: 0, dark: null, busy: 0, t: 0, gen: 1, forceK: 0, dlg: null, card: null, note: null, ended: false };
  for (const id in ch.maps) w.maps[id] = buildMap(ch, id);
  const st = ch.start;
  w.pl = { x: st.x, y: st.y, px: st.x * TS, py: st.y * TS, dir: st.dir ?? 0, fr: 0, mv: null, spr: ch.player || '@me', hidden: false, walked: 0, speed: 1, prev: [st.x, st.y] };
  w.mapId = st.map;
  return w;
}
function buildMap(ch, id) {
  const d = ch.maps[id], rows = d.rows, h = rows.length, wd = Math.max(...rows.map(r => r.length));
  const leg = Object.assign({}, BASE_LEGEND, ch.legend || {}, d.legend || {});
  const m = { id, def: d, w: wd, h, leg, rows: rows.map(r => r.padEnd(wd, ' ')), mods: {}, ents: [], cache: null, dirty: true };
  for (const ed of (d.ents || [])) m.ents.push(makeEnt(ed, ch));
  return m;
}
function makeEnt(ed, ch) {
  const e = Object.assign({}, ed);
  e.def = ed; e.w = ed.w || 1; e.h = ed.h || 1;
  e.px = ed.x * TS; e.py = ed.y * TS; e.dir = ed.dir ?? 0; e.fr = 0; e.alpha = ed.alpha ?? 1; e.hidden = !!ed.hidden;
  if (e.solid === undefined) e.solid = !(typeof e.spr === 'string' && NONSOLID.has(e.spr)) && !e.decal && !!e.spr;
  e.s = Object.assign({}, ed.s || {});
  if (ed.to && !ed.on && !ed.touch) {   // 出口简写：to:[map,x,y,dir]，lock:物品id 或 (S)=>bool
    const go = async S => {
      if (e.lock && !(typeof e.lock === 'function' ? e.lock(S) : S.has(e.lock))) { S.sfx('locked'); await S.narr(e.lockMsg || '锁住了。'); return; }
      if (e.solid && e.spr) S.sfx(e.sfx || 'open');
      await S.go(ed.to[0], ed.to[1], ed.to[2], ed.to[3]);
    };
    if (e.solid && e.spr) e.on = go; else { e.touch = go; e.solid = false; }
  }
  return e;
}
function curMap() { return W && W.maps[W.mapId]; }
function tileName(m, x, y) {
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return 'void';
  const k = y * m.w + x, c = m.mods[k] ?? m.rows[y][x];
  let t = m.leg[c]; if (t === undefined) t = 'void';
  if (typeof t === 'object') t = t.t;
  if (t === '@floor') t = m.def.floor || W.ch.floor || 'wood';
  if (t === '@floor2') t = m.def.floor2 || 'carpet';
  return t;
}
function tileSolid(m, x, y) {
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true;
  const k = y * m.w + x, c = m.mods[k] ?? m.rows[y][x], t = m.leg[c];
  if (t && typeof t === 'object' && 'solid' in t) return t.solid;
  const n = tileName(m, x, y); if (n === 'wall') return true;
  const td = TILE[n] || (W.ch.tiles && W.ch.tiles[n]); return td ? td.solid : true;
}
function isWallAt(m, x, y) { return x < 0 || y < 0 || x >= m.w || y >= m.h ? true : tileName(m, x, y) === 'wall'; }
function entsAt(m, x, y, f) { return m.ents.filter(e => !e.hidden && x >= Math.round(e.px / TS) && x < Math.round(e.px / TS) + e.w && y >= Math.round(e.py / TS) && y < Math.round(e.py / TS) + e.h && (!f || f(e))); }
function passable(m, x, y, who) {
  if (tileSolid(m, x, y)) return false;
  for (const e of m.ents) {
    if (e.hidden || !e.solid || e === who || e.chase) continue;
    const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS);
    if (x >= ex && x < ex + e.w && y >= ey && y < ey + e.h) return false;
  }
  if (who && who !== W.pl && !W.pl.hidden && W.pl.x === x && W.pl.y === y) return false;
  return true;
}
function getEnt(id, mapId) {
  if (mapId) return W.maps[mapId].ents.find(e => e.id === id);
  const m = curMap(); let e = m.ents.find(e => e.id === id); if (e) return e;
  for (const k in W.maps) { e = W.maps[k].ents.find(e => e.id === id); if (e) return e; }
  return null;
}

/* ---------------- 地图预渲染 ---------------- */
function renderMapCache(m) {
  if (!m.cache || m.cache.width !== m.w * TS || m.cache.height !== m.h * TS) m.cache = mk(m.w * TS, m.h * TS);
  const g = m.cache.getContext('2d'); g.clearRect(0, 0, m.cache.width, m.cache.height);
  const st = Object.assign({}, WALLSTYLE[m.def.wall || W.ch.wall || 'paper'] || WALLSTYLE.paper, m.def.wallC || {});
  const tileDefs = Object.assign({}, TILE, W.ch.tiles || {});
  const opts = Object.assign({}, W.ch.tileOpts || {}, m.def.tileOpts || {});
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const ox = x * TS, oy = y * TS;
    const R = (a, b, w, h, col) => { if (!col) return; g.fillStyle = col; g.fillRect(ox + Math.floor(a), oy + Math.floor(b), Math.ceil(w), Math.ceil(h)); };
    const n = tileName(m, x, y);
    if (n === 'wall') paintWall(R, x, y, !isWallAt(m, x, y + 1), st, (a, b) => isWallAt(m, a, b));
    else { const td = tileDefs[n]; if (td) td.paint(R, x, y, opts); else R(0, 0, 16, 16, '#000'); }
  }
  m.dirty = false;
}

/* ---------------- 移动 ---------------- */
const WALK_SPD = 4.2, RUN_SPD = 6.8;
function stepFrame(walked) { return [1, 0, 3, 0][Math.floor(walked / 8) % 4]; }
function moveEntity(e, dt) {
  const mv = e.mv; if (!mv) return false;
  mv.p = Math.min(1, mv.p + mv.spd * dt);
  e.px = lerp(mv.fx, mv.tx, mv.p) * TS; e.py = lerp(mv.fy, mv.ty, mv.p) * TS;
  e.walked = (e.walked || 0) + mv.spd * dt * TS; e.fr = stepFrame(e.walked);
  if (mv.p >= 1) { e.mv = null; e.px = mv.tx * TS; e.py = mv.ty * TS; e.x = mv.tx; e.y = mv.ty; if (mv.done) mv.done(); return true; }
  return false;
}
function startMove(e, d, spd, done) {
  const x = Math.round(e.px / TS), y = Math.round(e.py / TS);
  e.dir = d; e.mv = { fx: x, fy: y, tx: x + DIRS[d][0], ty: y + DIRS[d][1], p: 0, spd, done };
}
function bfsStep(m, sx, sy, tx, ty, who, maxN = 2500) {
  if (sx === tx && sy === ty) return -1;
  const W2 = m.w, prev = new Int32Array(m.w * m.h).fill(-2), q = [sy * W2 + sx]; prev[q[0]] = -1;
  let found = -1, n = 0;
  while (q.length && n++ < maxN) {
    const c = q.shift(), cx0 = c % W2, cy0 = (c / W2) | 0;
    if (cx0 === tx && cy0 === ty) { found = c; break; }
    /* 平局时优先缩小差得多的那个轴（斜对面追来时会走「斜线」，不会一直沿一条轴平移） */
    const ddx = tx - cx0, ddy = ty - cy0, ax = Math.abs(ddx) >= Math.abs(ddy);
    const ord = ax ? [ddx < 0 ? 1 : 2, ddy < 0 ? 3 : 0, ddy < 0 ? 0 : 3, ddx < 0 ? 2 : 1] : [ddy < 0 ? 3 : 0, ddx < 0 ? 1 : 2, ddx < 0 ? 2 : 1, ddy < 0 ? 0 : 3];
    for (const d of ord) {
      const nx = cx0 + DIRS[d][0], ny = cy0 + DIRS[d][1], k = ny * W2 + nx;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || prev[k] !== -2) continue;
      if (!(nx === tx && ny === ty) && !passable(m, nx, ny, who)) continue;
      if (who && who.chase && who.chase.zone && !who.chase.zone(nx, ny) && !(nx === tx && ny === ty)) continue;
      prev[k] = c; q.push(k);
    }
  }
  if (found < 0) return -1;
  let c = found; while (prev[c] !== sy * W2 + sx && prev[c] >= 0) c = prev[c];
  const nx = c % W2, ny = (c / W2) | 0;
  return DIRS.findIndex(d => d[0] === nx - sx && d[1] === ny - sy);
}
/* 控制者本地推进玩家 */
function updatePlayer(dt) {
  const p = W.pl, m = curMap();
  if (p.mv) {
    const spd = p.mv.spd;
    const arrived = moveEntity(p, dt);
    if (arrived) { AU.sfx('step'); if (isHost()) onPlayerArrive(); }
    else return;
    void spd;
  }
  if (!canMove()) { p.fr = 0; return; }
  const d = IN.dir();
  if (d < 0) { p.fr = 0; return; }
  if (p.dir !== d && !p.mv && W._turnT == null) { p.dir = d; W._turnT = 0.07; return; }
  if (W._turnT != null) { W._turnT -= dt; if (W._turnT > 0) return; W._turnT = null; }
  p.dir = d;
  const tx = p.x + DIRS[d][0], ty = p.y + DIRS[d][1];
  if (passable(m, tx, ty, p)) { p.prev = [p.x, p.y]; p.run = IN.running() && !W.noRun; const sp = (p.run ? RUN_SPD : WALK_SPD) * (p.speed || 1) * (m.def.speed || 1); startMove(p, d, sp); }
  else { p.fr = 0; if (isHost()) onBump(tx, ty); }
}
let lastPTile = null;
function onPlayerArrive() {   // 仅主机
  const p = W.pl, m = curMap();
  for (const e of m.ents) if (e.follow && !e.hidden) followStep(e);
  if (W.busy) return;
  const hit = entsAt(m, p.x, p.y, e => e.touch);
  if (hit.length) { runScript(hit[0].touch, hit[0]); return; }
  if (m.def.step) { const r = m.def.step(SAPI, p.x, p.y); if (r && r.then) runScriptP(r); }
}
function followStep(e) {
  const p = W.pl, m = curMap();
  if (e.mv) return;
  const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS);
  const [tx, ty] = p.prev || [p.x, p.y];
  if (Math.abs(ex - p.x) + Math.abs(ey - p.y) <= 1) return;
  let d = DIRS.findIndex(dd => dd[0] === tx - ex && dd[1] === ty - ey);
  if (d < 0) d = bfsStep(m, ex, ey, tx, ty, e);
  if (d < 0) { e.px = tx * TS; e.py = ty * TS; return; }
  startMove(e, d, RUN_SPD * 1.2);
}
function onBump(x, y) {
  if (W.busy) return;
  const m = curMap(), es = entsAt(m, x, y, e => e.bump);
  if (es.length) runScript(es[0].bump, es[0]);
}
/* 主机：检测客机控制下玩家走到新格子 */
function hostCheckRemoteTile() {
  const p = W.pl, k = W.mapId + ':' + p.x + ',' + p.y;
  if (k !== lastPTile) { const had = lastPTile; lastPTile = k; if (had && !W.busy) onPlayerArrive(); }
}
/* 调查对象：脚下非实心的可调查物优先；同一格有多个时，人物优先，其次画在最上层的 */
function pickTop(m, es) {
  if (es.length < 2) return es[0] || null;
  const isP = e => typeof sprOf(e.spr) === 'object';
  return es.slice().sort((a, b) => (isP(b) - isP(a)) || ((b.z || 0) - (a.z || 0)) || (!!a.decal - !!b.decal) || ((b.py + b.h * TS) - (a.py + a.h * TS)) || (m.ents.indexOf(b) - m.ents.indexOf(a)))[0];
}
function facingEnt() {
  const p = W.pl, m = curMap();
  const under = entsAt(m, p.x, p.y, e => typeof e.on === 'function' && !e.solid);
  if (under.length) return pickTop(m, under);
  const tx = p.x + DIRS[p.dir][0], ty = p.y + DIRS[p.dir][1];
  return pickTop(m, entsAt(m, tx, ty, e => typeof e.on === 'function'));
}
function interact() {   // 仅主机
  if (W.busy || W.ended) return;
  const e = facingEnt(); if (e) { e.read = true; runScript(e.on, e); }
}

/* ---------------- 每帧（主机逻辑） ---------------- */
function hostTick(dt) {
  const m = curMap();
  for (const e of m.ents) {
    if (e.mv && !e.frozen) moveEntity(e, dt);
    else if (e.fr && !e.chase) e.fr = 0;
    if (e.chase && !e.hidden && !e.mv && !W.paused && !e.frozen) chaseStep(e, m, dt);
  }
  if (!W.busy && !W.ended) for (const e of m.ents) {
    if (e.chase && !e.hidden && !W.pl.hidden && Math.abs(e.px - W.pl.px) + Math.abs(e.py - W.pl.py) < 11) {
      const c = e.chase; e.chase = null; e.mv = null;
      runScript(c.catch || (S => S.die(c.msg || '你被抓住了……')), e); break;
    }
  }
  if (W.timer && (!W.busy || W.timer.during) && !W.ended && !W.endScreen) {
    W.timer.left -= dt;
    if (W.timer.left <= 0) { const t = W.timer; W.timer = null; if (W.busy) interruptWait(); runScript(t.fn); }
  }
  if (!W.busy && !W.ended && W.queue.length) { const i = W.queue.findIndex(q => q.at <= W.t); if (i >= 0) { const q = W.queue.splice(i, 1)[0]; runScript(q.fn); } }
  W.t += dt;
  if (W.ch.tick && !W.ended) W.ch.tick(SAPI, dt);
  if (m.def.tick && !W.ended) m.def.tick(SAPI, dt);
}
function chaseStep(e, m, dt) {
  const c = e.chase, ex = Math.round(e.px / TS), ey = Math.round(e.py / TS);
  if (W.busy && !c.always) return;
  c.wait = (c.wait || 0) - dt; if (c.wait > 0) return;
  let tx = W.pl.x, ty = W.pl.y;
  if (W.pl.hidden) { if (c.wander === false) return; tx = ex + ((Math.random() * 5) | 0) - 2; ty = ey + ((Math.random() * 5) | 0) - 2; if (!passable(m, tx, ty, e)) return; }
  const d = bfsStep(m, ex, ey, tx, ty, e);
  if (d < 0) { c.wait = .3; return; }
  startMove(e, d, c.spd || 3);
  e.dir = d;
}

/* ---------------- 摄像机与渲染 ---------------- */
let CAM = { x: 0, y: 0 };
function camUpdate(dt, snap) {
  const m = curMap(), p = W.pl;
  let tx = p.px + 8 - VW / 2, ty = p.py + 4 - VH / 2;
  if (W.camFocus) { tx = W.camFocus[0] * TS + 8 - VW / 2; ty = W.camFocus[1] * TS + 8 - VH / 2; }
  const mw = m.w * TS, mh = m.h * TS;
  tx = mw <= VW ? (mw - VW) / 2 : clamp(tx, 0, mw - VW);
  ty = mh <= VH ? (mh - VH) / 2 : clamp(ty, 0, mh - VH);
  if (snap) { CAM.x = tx; CAM.y = ty; } else { const k = Math.min(1, dt * 10); CAM.x += (tx - CAM.x) * k; CAM.y += (ty - CAM.y) * k; }
}
const lightCv = mk(320, 200), lx = lightCv.getContext('2d');
let RT = 0;    // 渲染用时间（秒）
function sprOf(spr) {
  if (typeof spr !== 'string') return spr;
  if (spr[0] === '@') { const name = spr.slice(1); return (W.ch.people && W.ch.people[name]) || PEOPLE[name] || PEOPLE.me; }
  return spr;
}
const PEOPLE = { me: { skin: '#f0c8a0', hair: '#2b2020', hs: 'short', top: '#4a6a9a', bottom: '#2a3048' } };
function drawEntity(g, e, ox, oy, t) {
  const spr = sprOf(e.spr); if (!spr) return;
  const x = Math.round(e.px - ox + (e.ox || 0)), y = Math.round(e.py - oy + (e.oy || 0));
  if (x < -48 || y < -48 || x > VW + 48 || y > VH + 48) return;
  g.globalAlpha = clamp(e.alpha ?? 1, 0, 1);
  if (typeof spr === 'object') {
    if (spr.big) { const c = personSprite(spr, e.dir, e.fr); g.drawImage(c, x - 8, y - 32, 32, 48); }
    else g.drawImage(personSprite(spr, e.dir, e.fr), x, y - 8);
  } else {
    const fn = (W.ch.sprites && W.ch.sprites[spr]) || SPR[spr];
    if (fn) { const R = (a, b, w, h, col) => { if (!col) return; g.fillStyle = col; g.fillRect(x + Math.floor(a), y + Math.floor(b), Math.ceil(w), Math.ceil(h)); }; const pe = Object.assign({}, e, e.s); pe.sx = x; pe.sy = y; fn(g, pe, t, R); }   // sx/sy：屏幕绘制坐标（自定义精灵直接 drawImage 用）
  }
  g.globalAlpha = 1;
  if (e.bubble && e.bubble.until > RT) drawBubble(g, x + 8, y - (typeof spr === 'object' ? 12 : 6), e.bubble.k);
}
function drawBubble(g, x, y, k) {
  const R = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(x + a, y + b, w, h); };
  R(-5, -9, 10, 9, '#120c10'); R(-4, -8, 8, 7, '#f4efe2'); R(-1, -1, 2, 2, '#120c10'); R(0, -1, 1, 1, '#f4efe2');
  const c = k === '!' ? '#c02828' : '#2a2030';
  if (k === '!') { R(-1, -7, 2, 4, c); R(-1, -2, 2, 1, c); }
  else if (k === '?') { R(-2, -7, 4, 1, c); R(1, -6, 1, 2, c); R(-1, -4, 2, 1, c); R(-1, -2, 2, 1, c); }
  else if (k === '…') { R(-3, -4, 1, 1, c); R(0, -4, 1, 1, c); R(3, -4, 1, 1, c); }
  else if (k === '♥') { R(-3, -7, 2, 2, '#c02828'); R(1, -7, 2, 2, '#c02828'); R(-3, -5, 6, 1, '#c02828'); R(-2, -4, 4, 1, '#c02828'); R(-1, -3, 2, 1, '#c02828'); }
}
function render(dt) {
  RT += dt;
  const g = bx; g.imageSmoothingEnabled = false;
  g.fillStyle = '#000'; g.fillRect(0, 0, VW, VH);
  if (!W || !curMap()) { blit(); return; }
  const m = curMap(); if (m.dirty || !m.cache) renderMapCache(m);
  let sx = 0, sy = 0;
  if (W.shake && W.shake.until > RT) { const a = W.shake.amt; sx = ((Math.random() - .5) * a * 2) | 0; sy = ((Math.random() - .5) * a * 2) | 0; }
  const ox = Math.round(CAM.x) + sx, oy = Math.round(CAM.y) + sy;
  g.drawImage(m.cache, -ox, -oy);
  // 水面闪烁
  if (m.def.shimmer !== false) {
    const x0 = Math.max(0, (ox / TS) | 0), y0 = Math.max(0, (oy / TS) | 0), x1 = Math.min(m.w, x0 + ((VW / TS) | 0) + 2), y1 = Math.min(m.h, y0 + ((VH / TS) | 0) + 2);
    g.fillStyle = 'rgba(150,190,220,.18)';
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const n = tileName(m, x, y); if (n === 'water' || n === 'shallow') { const ph = (RT * 1.3 + hash(x, y, 77) * 6) % 6; if (ph < 3) g.fillRect(x * TS - ox + ((hash(x, y, 78) * 10) | 0) + ((ph * 2) | 0), y * TS - oy + ((hash(x, y, 79) * 12) | 0), 3, 1); } }
  }
  // 实体排序绘制
  const list = [];
  for (const e of m.ents) if (!e.hidden && e.spr) list.push(e);
  list.sort((a, b) => (a.decal ? -1e5 : 0) + (a.z || 0) * 1e4 + a.py + a.h * TS - ((b.decal ? -1e5 : 0) + (b.z || 0) * 1e4 + b.py + b.h * TS));
  let drewP = false; const pBase = W.pl.py + TS;
  for (const e of list) {
    if (!drewP && !e.decal && (e.z || 0) >= 0 && e.py + e.h * TS > pBase) { drawPlayer(g, ox, oy); drewP = true; }
    drawEntity(g, e, ox, oy, RT);
  }
  if (!drewP) drawPlayer(g, ox, oy);
  // 天气
  if (m.def.rain || W.ch.rain) drawRain(g, dt);
  if (m.def.fog) drawFog(g, m.def.fog);
  // 光照
  drawLighting(g, m, ox, oy);
  // 可调查提示
  if (W.hint && !W.busy && W.hint.on && !W.hint.hidden) { const e = W.hint; drawBubble(g, Math.round(e.px - ox + e.w * 8), Math.round(e.py - oy - (typeof sprOf(e.spr) === 'object' ? 10 : 2) + Math.sin(RT * 6)), '!'); }
  // ping
  for (let i = PINGS.length - 1; i >= 0; i--) {
    const p = PINGS[i], a = RT - p.t; if (a > 2.2) { PINGS.splice(i, 1); continue; }
    const x = p.x - ox, y = p.y - oy, r = 3 + (a % .7) * 14;
    g.strokeStyle = p.c; g.globalAlpha = 1 - a / 2.2; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.fillStyle = p.c; g.fillRect(x - 1, y - 1, 2, 2); g.globalAlpha = 1;
  }
  drawFX(g, dt);
  // 暗角 + 颗粒
  vignette(g);
  if (W.fade > 0) { g.fillStyle = `rgba(0,0,0,${W.fade})`; g.fillRect(0, 0, VW, VH); }
  blit();
}
function drawPlayer(g, ox, oy) {
  const p = W.pl; if (p.hidden) return;
  const spr = sprOf(p.spr);
  const fake = { spr: p.spr, px: p.px, py: p.py, dir: p.dir, fr: p.fr, alpha: 1, w: 1, h: 1, s: {} };
  if (typeof spr === 'string') { fake.dir = p.dir; drawEntity(g, fake, ox, oy, RT); }
  else g.drawImage(personSprite(spr, p.dir, p.fr), Math.round(p.px - ox), Math.round(p.py - oy - 8));
  if (p.bubble && p.bubble.until > RT) drawBubble(g, Math.round(p.px - ox + 8), Math.round(p.py - oy - (typeof spr === 'object' ? 12 : 6)), p.bubble.k);
}
const RAIN = [];
function drawRain(g, dt) {
  while (RAIN.length < 90) RAIN.push({ x: Math.random() * VW, y: Math.random() * VH, v: 180 + Math.random() * 90 });
  g.fillStyle = 'rgba(170,190,220,.35)';
  for (const r of RAIN) { r.y += r.v * dt; r.x -= r.v * dt * .18; if (r.y > VH) { r.y = -6; r.x = Math.random() * (VW + 40); } g.fillRect(r.x | 0, r.y | 0, 1, 4); }
}
function drawFog(g, a) {
  g.fillStyle = `rgba(160,170,180,${a * .5})`;
  for (let i = 0; i < 6; i++) { const y = ((RT * 4 + i * 37) % (VH + 40)) - 20; g.fillRect(0, y, VW, 8 + i % 3 * 4); }
}
function drawLighting(g, m, ox, oy) {
  const md = W.mapDark && W.mapDark[W.mapId]; const dark = md != null ? md : (m.def.dark ?? W.ch.dark ?? 0);
  if (dark <= 0.01) return;
  if (lightCv.width !== VW || lightCv.height !== VH) { lightCv.width = VW; lightCv.height = VH; }
  const L = lx; L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, VW, VH);
  L.fillStyle = m.def.darkC || W.ch.darkC || '#05040a'; L.globalAlpha = dark; L.fillRect(0, 0, VW, VH); L.globalAlpha = 1;
  L.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a) => { if (r <= 0) return; const gr = L.createRadialGradient(x, y, r * .15, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(.6, `rgba(0,0,0,${a * .6})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); L.fillStyle = gr; L.beginPath(); L.arc(x, y, r, 0, 7); L.fill(); };
  const plr = W.plr != null ? W.plr : (m.def.plr ?? W.ch.plr ?? 3.5);
  const warm = [];
  if (!W.pl.hidden || W.plLightWhenHidden) { const fl = 1 + Math.sin(RT * 9) * .03; hole(W.pl.px + 8 - ox, W.pl.py + 4 - oy, plr * TS * fl, 1); }
  for (const e of m.ents) {
    const li = e.light; if (!li || e.hidden || e.s.off || e.off) continue;
    const r = (li.r || 3) * TS * (li.flick ? 1 + Math.sin(RT * 13 + e.px) * .05 + (Math.random() < .02 ? -.3 : 0) : 1);
    const bx0 = li.pl ? W.pl.px : e.px, by0 = li.pl ? W.pl.py : e.py;
    const lxp = bx0 + (li.dx ?? (li.pl ? 8 : e.w * 8)) - ox, lyp = by0 + (li.dy ?? (li.pl ? 4 : 8)) - oy;
    hole(lxp, lyp, r, li.a ?? 1); if (li.col) warm.push([lxp, lyp, r, li.col]);
  }
  for (const l of (W.extraLights || [])) hole(l[0] - ox, l[1] - oy, l[2] * TS, l[3] ?? 1);
  L.globalCompositeOperation = 'source-over';
  g.drawImage(lightCv, 0, 0);
  if (warm.length) {
    g.globalCompositeOperation = 'lighter';
    for (const [x, y, r, col] of warm) { const gr = g.createRadialGradient(x, y, 0, x, y, r * .8); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * .8, 0, 7); g.fill(); }
    g.globalCompositeOperation = 'source-over';
  }
}
let VIG = null;
function vignette(g) {
  if (!VIG || VIG.width !== VW || VIG.height !== VH) {
    VIG = mk(VW, VH); const v = VIG.getContext('2d');
    const gr = v.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * .35, VW / 2, VH / 2, Math.max(VW, VH) * .75);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); v.fillStyle = gr; v.fillRect(0, 0, VW, VH);
  }
  g.drawImage(VIG, 0, 0);
  g.fillStyle = 'rgba(255,255,255,.035)';
  for (let i = 0; i < 40; i++) g.fillRect((Math.random() * VW) | 0, (Math.random() * VH) | 0, 1, 1);
}
function blit() {
  cx.imageSmoothingEnabled = false;
  cx.drawImage(buf, 0, 0, VW, VH, 0, 0, VW * SC * DPR, VH * SC * DPR);
}

/* ---------------- 屏幕特效 ---------------- */
const FACECV = mk(32, 32);
function addFX(k, o = {}) { FX.push(Object.assign({ k, t0: RT, dur: o.dur || ({ flash: .5, red: 1.2, face: .9, glitch: .6, static: .8, black: 1, blood: 2.5 }[k] || .8) }, o)); }
function drawFX(g, dt) {
  for (let i = FX.length - 1; i >= 0; i--) {
    const f = FX[i], a = (RT - f.t0) / f.dur; if (a >= 1) { FX.splice(i, 1); continue; }
    if (f.k === 'flash') { g.fillStyle = `rgba(255,255,255,${(1 - a) * .9})`; g.fillRect(0, 0, VW, VH); }
    if (f.k === 'red') { g.fillStyle = `rgba(150,0,0,${Math.sin(a * Math.PI) * .45})`; g.fillRect(0, 0, VW, VH); }
    if (f.k === 'black') { g.fillStyle = '#000'; g.fillRect(0, 0, VW, VH); }
    if (f.k === 'static') { for (let y = 0; y < VH; y += 2) for (let x = 0; x < VW; x += 2) if (Math.random() < .5 * (1 - a)) { g.fillStyle = Math.random() < .5 ? '#ddd' : '#333'; g.fillRect(x, y, 2, 2); } }
    if (f.k === 'glitch') { for (let i = 0; i < 8; i++) { const y = (Math.random() * VH) | 0, h = 2 + (Math.random() * 8) | 0; g.drawImage(buf, 0, y, VW, h, ((Math.random() - .5) * 20) | 0, y, VW, h); } g.fillStyle = 'rgba(255,0,40,.08)'; g.fillRect(0, 0, VW, VH); }
    if (f.k === 'blood') { g.fillStyle = '#5a0606'; for (let i = 0; i < 24; i++) { const x = (hash(i, 3, 9) * VW) | 0, len = Math.min(1, a * 1.6) * VH * (.3 + hash(i, 4, 9) * .8); g.fillRect(x, 0, 2 + (hash(i, 5, 9) * 4 | 0), len); } g.fillStyle = `rgba(80,0,0,${Math.sin(a * Math.PI) * .5})`; g.fillRect(0, 0, VW, VH); }
    if (f.k === 'face') {
      g.fillStyle = `rgba(0,0,0,${.85})`; g.fillRect(0, 0, VW, VH);
      const fk = f.face || (typeof f.spr === 'string' && f.spr[0] === '@' ? f.spr.slice(1) : null), ff = fk && W.ch.faces && W.ch.faces[fk];
      if (ff) {   /* 章节专用惊吓大头像：faces[name](R, a, t)，在 32×32 网格里画 */
        const fc = FACECV, fg = fc.getContext('2d'); fg.clearRect(0, 0, 32, 32);
        ff((x, y, w, h, col) => { if (!col) return; fg.fillStyle = col; fg.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h)); }, a, RT, fg);
        const s = Math.max(2, Math.floor(Math.min(VW, VH) * .8 / 32 * (1 + a * .25)));
        const jx = ((Math.random() - .5) * 6) | 0, jy = ((Math.random() - .5) * 4) | 0;
        g.drawImage(fc, 0, 0, 32, 32, Math.round((VW - 32 * s) / 2) + jx, Math.round((VH - 32 * s) / 2) + jy, 32 * s, 32 * s);
        for (let i = 0; i < 5; i++) { const y = (Math.random() * VH) | 0; g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, y, VW, 1 + (Math.random() * 3 | 0)); }
        continue;
      }
      const P = sprOf(f.spr || '@me'); const c = personSprite(typeof P === 'object' ? P : PEOPLE.me, 0, 0);
      const s = Math.floor(Math.min(VW, VH) / 10 * (1 + a * .3));
      const jx = ((Math.random() - .5) * 8) | 0, jy = ((Math.random() - .5) * 6) | 0;
      const cy0 = (typeof P === 'object' && P.child) ? 5 : 0; g.drawImage(c, 2, cy0, 12, 12, (VW - 12 * s) / 2 + jx, (VH - 12 * s) / 2 + jy, 12 * s, 12 * s);
      for (let i = 0; i < 6; i++) { const y = (Math.random() * VH) | 0; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, y, VW, 1 + (Math.random() * 3 | 0)); }
    }
  }
}
