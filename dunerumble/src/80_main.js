/* ================= game flow, UI, main loop ================= */
const STATE = { mode: 'menu', cfg: null, me: null, killer: 0, resultShown: false, watching: false, feed: [], acc: 0, deathAt: 0, endAt: 0, startT: 0, lastHurt: 0, inGasT: 0, prevHp: 0 };
const SEL = Object.assign({ hero: 0, mode: 'solo', map: 'random', diff: 1, name: '' }, LS.get('sel', {}));
const $ = id => document.getElementById(id);
const myName = () => (SEL.name || '').trim().slice(0, 8) || '玩家';

/* ---------- view accessors (host/solo read G, guest reads CL) ---------- */
const isGuest = () => NET.role === 'guest' && STATE.mode !== 'menu';
function meEnt() { if (isGuest()) return CL.me; return STATE.me; }
function myTeam() { const m = meEnt(); return m ? m.team : 0; }
function viewBrawlers() { return isGuest() ? CL.list : (G ? G.ents : []); }
function viewProjs() { return isGuest() ? [...CL.projs.values()] : (G ? G.projs : []); }
function viewCubes() { return isGuest() ? CL.cubes : (G ? G.cubes : []); }
function viewTurrets() { return isGuest() ? CL.turrets : (G ? G.turrets : []); }
function viewZones() { return isGuest() ? CL.zones : (G ? G.zones : []); }
function viewGasR() { return isGuest() ? CL.gasR : (G ? G.gasR : BAL.N / 2); }
function viewT() { return isGuest() ? CL.t : (G ? G.t : 0); }
function viewEnt(id) { return isGuest() ? CL.ents.get(id) : (G ? entById(id) : null); }
function viewAliveTeams() { return isGuest() ? CL.alive : (G ? G.alive.size : 0); }
function viewPlacement() { return isGuest() ? CL.placement : (G ? G.placement : {}); }
function viewMode() { return (isGuest() ? CL.cfg : G && G.cfg || {}).mode; }

/* ---------- rosters ---------- */
function pickTheme() { return SEL.map === 'random' ? pick(Object.keys(THEMES)) : SEL.map; }
function botHeroes(n, avoid) {
  const out = []; let pool = [];
  for (let i = 0; i < n; i++) { if (!pool.length) pool = HEROES.map((h, k) => k).sort(() => Math.random() - .5); out.push(pool.pop()); }
  return out;
}
function botNames(n) { const p = BOT_NAMES.slice().sort(() => Math.random() - .5); return p.slice(0, n); }
function buildRoster(online) {
  const R = [];
  if (SEL.mode === 'solo' && !online) {
    R.push({ name: myName(), hero: SEL.hero, human: 1, team: 0 });
    const hs = botHeroes(9), ns = botNames(9);
    for (let i = 0; i < 9; i++) R.push({ name: ns[i], hero: hs[i], human: 0, team: i + 1 });
  } else {
    R.push({ name: myName(), hero: SEL.hero, human: 1, team: 0 });
    const ns = botNames(9), hs = botHeroes(9);
    if (online && NET.partner) R.push({ name: NET.partner.name, hero: NET.partner.hero, human: 2, team: 0 });
    else R.push({ name: ns[8] + '(队友)', hero: hs[8], human: 0, team: 0 });
    for (let t = 1; t <= 4; t++) for (let k = 0; k < 2; k++) R.push({ name: ns[(t - 1) * 2 + k], hero: hs[(t - 1) * 2 + k], human: 0, team: t });
  }
  return R;
}
function startGame(cfg) {
  newGame(cfg);
  STATE.cfg = cfg; STATE.me = G.ents.find(e => e.human === 1);
  enterPlay();
}
function enterPlay() {
  buildMapScene();
  STATE.mode = 'play'; STATE.resultShown = false; STATE.watching = false; STATE.killer = 0; STATE.feed = []; STATE.acc = 0; STATE.deathAt = 0; STATE.endAt = 0; STATE.startT = performance.now(); OV.nums = [];
  $('menu').classList.add('hidden'); $('hud').classList.remove('hidden'); $('result').classList.add('hidden'); $('pause').classList.add('hidden');
  $('touch').classList.toggle('hidden', !IS_TOUCH); $('superBtn').classList.toggle('hidden', IS_TOUCH); $('keyHint').classList.toggle('hidden', IS_TOUCH);
  $('hFeed').innerHTML = '';
  const me = meEnt(); if (me) { R3.camT.set(me.x, 0, me.z); }
  MINI.img = null;
  if (R3.show) R3.show.root.visible = false;
  const cfg = isGuest() ? CL.cfg : G.cfg;
  banner(cfg.mode === 'duo' ? '双人吃鸡' : '单人吃鸡', `${THEMES[M.theme].name} · 活到最后！`);
  audioInit();
}
function quitToMenu(fromNet) {
  if (NET.role === 'host' && connected() && !fromNet) netSend({ t: 'lobby', host: myName(), hero: SEL.hero });
  G = null; STATE.me = null; STATE.mode = 'menu';
  CL.me = null; CL.list = []; CL.ents.clear(); CL.projs.clear();
  $('menu').classList.remove('hidden'); $('hud').classList.add('hidden'); $('touch').classList.add('hidden'); $('result').classList.add('hidden'); $('pause').classList.add('hidden');
  $('gasVig').style.opacity = 0; $('hurtVig').style.opacity = 0;
  showAim(null);
  buildShowcase(); refreshMenu();
}
function togglePause() {
  if (STATE.mode === 'play') {
    STATE.mode = 'pause'; $('pause').classList.remove('hidden');
    $('pauseNote').textContent = NET.role && connected() ? '联机对局不会暂停，游戏仍在进行' : '';
  } else if (STATE.mode === 'pause') { STATE.mode = 'play'; $('pause').classList.add('hidden'); }
}
const simPaused = () => STATE.mode === 'pause' && !(NET.role && connected());

/* ---------- events -> fx / sound / feed ---------- */
function onLocalEvent(e) {
  if (STATE.mode === 'menu' || !R3.mapG) return;
  const me = meEnt(), mid = me ? me.id : -1, th = THEMES[M.theme];
  switch (e.k) {
    case 'shot': {
      const b = viewEnt(e.id); const H = HEROES[e.h];
      const x = e.x + Math.cos(e.a) * 0.65, z = e.z + Math.sin(e.a) * 0.65;
      if (e.s !== 2) emit({ x, z, y: 0.75, c: [0xfff3b0, 0xffc04a], glow: 1, s0: 0.12, s1: 0, life: 0.15, sp: 3, a: e.a, ar: 0.5, g: 0 }, e.s ? 8 : 4);
      if (e.s === 1) ring(e.x, e.z, 1.4, 0xffd23f, 0.35);
      sfx(H.k + (e.s ? 'S' : ''), e.x, e.z, e.id === mid ? 1 : 0.7);
      void b;
    } break;
    case 'hit': {
      const t = viewEnt(e.id), isMe = e.id === mid, byMe = e.s === mid;
      const tm = t ? t.team : -1, mine = tm === myTeam();
      const col = e.g ? '#b8ff6a' : isMe ? '#ff5a5a' : mine ? '#ff9c9c' : byMe ? '#ffffff' : '#ffe1b8';
      if (!t || t.vis !== false || isMe || mine) addNum(e.x, e.z, e.v, col, e.v >= 1000);
      if (!e.g) emit({ x: e.x, z: e.z, y: 0.7, c: [0xffffff, 0xffe08a], glow: 1, s0: 0.08, s1: 0, life: 0.25, sp: 4, up: 2, g: 6 }, 5);
      if (isMe) { sfx(e.g ? 'gas' : 'hurt'); if (!e.g) { R3.shake = Math.max(R3.shake, 0.18); STATE.lastHurt = performance.now(); } }
      else if (byMe) sfx('hit');
      else sfx('hit', e.x, e.z, 0.4);
    } break;
    case 'bhit': { addNum(e.x, e.z, e.v, '#c9ffd6', false); const V = R3.boxVis[e.b]; if (V) V.shake = 0.12; emit({ x: e.x, z: e.z, y: 0.6, c: [0x8fa6b8, 0x4dff7c], s0: 0.06, s1: 0, life: 0.35, sp: 3, up: 3 }, 4); sfx('bhit', e.x, e.z); } break;
    case 'box': emit({ x: e.x, z: e.z, y: 0.5, c: [0x3a4d5e, 0x8fa6b8, 0x2c3a47], s0: 0.13, s1: 0.05, life: 0.9, sp: 5, up: 6, g: 14, jr: 0.3 }, 22); emit({ x: e.x, z: e.z, y: 0.5, c: 0x6dff8f, glow: 1, s0: 0.12, s1: 0, life: 0.6, sp: 4, up: 4 }, 14); ring(e.x, e.z, 1.6, 0x6dff8f, 0.5); sfx('box', e.x, e.z); break;
    case 'wall': {
      visClearTile(e.i, e.w);
      const x = (e.i % M.N) + .5, z = ((e.i / M.N) | 0) + .5;
      const cols = e.w ? (e.s ? [th.crate, th.crateTop, shade(th.crate, 0.7)] : [th.rock, th.rockTop, shade(th.rock, 0.7)]) : th.bush;
      emit({ x, z, y: 0.5, c: cols, s0: e.w ? 0.16 : 0.12, s1: 0.04, life: 1.0, sp: 4, up: 5, g: 14, jr: 0.35 }, e.w ? 14 : 10);
      if (e.w) { emit({ x, z, y: 0.3, c: 0xf2e6d0, s0: 0.3, s1: 0, life: 0.8, sp: 1.5, up: 1, g: -0.5, jr: 0.4 }, 4); sfx('wall', x, z, 0.8); }
    } break;
    case 'boom': {
      const big = e.big; const r = e.r;
      ring(e.x, e.z, r * 1.15, 0xffb347, 0.4, 0.07, 0.2); ring(e.x, e.z, r * 0.7, 0xfff0b0, 0.3, 0.08, 0.35);
      emit({ x: e.x, z: e.z, y: 0.4, c: [0xff7a1a, 0xffb347, 0xffe08a], glow: 1, s0: 0.22 * (big ? 1.6 : 1), s1: 0, life: 0.5, sp: 5 * r, up: 4, g: -1, jr: r * 0.3 }, big ? 34 : 18);
      emit({ x: e.x, z: e.z, y: 0.4, c: [0x6b5b5b, 0x8a7a70, 0xb0a090], s0: 0.3 * (big ? 1.5 : 1), s1: 0.05, life: 1.0, sp: 2 * r, up: 2, g: -0.8, jr: r * 0.4 }, big ? 16 : 8);
      if (big) emit({ x: e.x, z: e.z, y: 0.3, c: [0xff7ac0, 0xffb3e0, 0xffffff], s0: 0.09, s1: 0, life: 1.0, sp: 7, up: 7, g: 12 }, 20);
      const d = dist(e.x, e.z, R3.camT.x, R3.camT.z); R3.shake = Math.max(R3.shake, clamp((big ? 0.7 : 0.35) * (1 - d / 14), 0, 0.7));
      sfx('boom', e.x, e.z, big ? 1 : 0.75);
    } break;
    case 'spark': emit({ x: e.x, z: e.z, y: 0.7, c: e.c === 1 ? [0xff7a1a, 0xffb347] : e.c === 2 ? 0x5ef2ff : e.c === 3 ? [0x9cff57, 0xb070ff] : [0xffffff, 0xffe08a], glow: 1, s0: 0.07, s1: 0, life: 0.22, sp: 3, up: 2, g: 4 }, 4); break;
    case 'kill': {
      const v = viewEnt(e.v), k = viewEnt(e.by);
      if (v && v.vis === false && v.team !== myTeam()) { /* still shown in feed */ }
      addFeed(k, v);
      if (e.v === mid) { STATE.killer = e.by; STATE.deathAt = performance.now(); sfx('death'); }
      else if (e.by === mid) { sfx('kill'); if (v) banner('击败！', v.name); }
    } break;
    case 'out': if (e.team === myTeam() && !STATE.resultShown) setTimeout(() => showResult(e.rank), 1300); break;
    case 'end': if (STATE.watching) { STATE.resultShown = false; STATE.watching = false; }
      if (!STATE.resultShown) setTimeout(() => showResult(e.team === myTeam() ? 1 : (viewPlacement()[myTeam()] || 2)), e.team === myTeam() ? 900 : 1300); break;
    case 'cube': emit({ x: e.x, z: e.z, y: 0.5, c: [0x6dff8f, 0xb6ffc8], glow: 1, s0: 0.1, s1: 0, life: 0.5, sp: 2, up: 4, g: 2 }, 10); sfx('cube', e.x, e.z, e.id === mid ? 1.2 : 0.5); break;
    case 'supready': if (e.id === mid) sfx('supready'); break;
    case 'turret': ring(e.x, e.z, 1.2, 0x5ef2ff, 0.4); emit({ x: e.x, z: e.z, y: 0.3, c: [0xffffff, 0xd8e2ee], s0: 0.2, s1: 0, life: 0.6, sp: 2, up: 2, g: 0 }, 10); sfx('turret', e.x, e.z); break;
    case 'tshot': sfx('tshot', e.x, e.z, 0.6); break;
    case 'tdie': emit({ x: e.x, z: e.z, y: 0.5, c: [0xf2f5fb, 0x3a86ff, 0x2b2f3a], s0: 0.12, s1: 0.03, life: 0.8, sp: 4, up: 5, g: 12 }, 14); sfx('box', e.x, e.z, 0.6); break;
    case 'respawn': ring(e.x, e.z, 1.6, 0x7dffa0, 0.6); if (e.id === mid) sfx('respawn'); break;
    case 'swing': { const b = viewEnt(e.id); arcFx(e.x, e.z, e.a, e.r, e.s, b && b.H.k === 'bruin' ? 0xffd9a0 : 0xffffff); emit({ x: e.x + Math.cos(e.a) * e.r * 0.7, z: e.z + Math.sin(e.a) * e.r * 0.7, y: 0.6, c: [0xffffff, 0xffe9c0], glow: 1, s0: 0.08, s1: 0, life: 0.2, sp: 3, a: e.a, ar: e.s / 2, g: 0 }, 6); } break;
    case 'chain': boltFx(e.p); { const L = e.p[e.p.length - 1]; emit({ x: L[0], z: L[1], y: 0.8, c: [0xffffff, 0xc77dff], glow: 1, s0: 0.1, s1: 0, life: 0.3, sp: 4, up: 2, g: 3 }, 8); sfx('zapHit', L[0], L[1], 0.6); } break;
    case 'land': ring(e.x, e.z, e.r * 1.2, 0xffd9a0, 0.4, 0.07, 0.25); emit({ x: e.x, z: e.z, y: 0.2, c: [0xc8a878, 0xe8d8b8, 0x9a7a5a], s0: 0.16, s1: 0.03, life: 0.7, sp: 5, up: 3, g: 8, jr: 0.4 }, 18); R3.shake = Math.max(R3.shake, clamp(0.4 * (1 - dist(e.x, e.z, R3.camT.x, R3.camT.z) / 12), 0, 0.4)); sfx('boom', e.x, e.z, 0.6); break;
    case 'heal': addNum(e.x, e.z, '+' + e.v, '#6dff8f', false); break;
    case 'shit': addNum(e.x, e.z, e.v, '#7ad8ff', false); emit({ x: e.x, z: e.z, y: 0.8, c: 0x7ad8ff, glow: 1, s0: 0.08, s1: 0, life: 0.25, sp: 3, up: 2 }, 4); sfx('bhit', e.x, e.z); break;
    case 'stealth': emit({ x: e.x, z: e.z, y: 0.6, c: [0xe6dcff, 0xb9a6ff], glow: 1, s0: 0.15, s1: 0, life: 0.6, sp: 2.5, up: 2, g: -0.5, jr: 0.3 }, 18); sfx('wispS', e.x, e.z); break;
    case 'shield': ring(e.x, e.z, e.r, 0x7ad8ff, 0.5, 0.07, 0.15); ring(e.x, e.z, e.r * 0.6, 0xffffff, 0.35); break;
    case 'zone': ring(e.x, e.z, e.r, e.k === 'heal' ? 0x6dff8f : e.k === 'frost' ? 0xffffff : 0xb070ff, 0.4); sfx(e.k === 'heal' ? 'respawn' : e.k === 'frost' ? 'frostS' : 'sporeHit', e.x, e.z, 0.7); break;
  }
}
function addFeed(k, v) {
  if (!v) return;
  const mt = myTeam(), cls = (b) => b && (b === meEnt() ? 'me' : b.team === mt ? 'a' : 'x');
  const d = document.createElement('div');
  const nm = b => b ? `<span class="${cls(b)}">${esc(b.name)}</span>` : '<span class="x">毒雾</span>';
  d.innerHTML = k && k !== v ? `${nm(k)} 💥 ${nm(v)}` : `☠ ${nm(v)}`;
  const F = $('hFeed'); F.prepend(d); while (F.children.length > 4) F.lastChild.remove();
  setTimeout(() => d.remove(), 5000);
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function banner(big, small) { const b = $('banner'); b.innerHTML = esc(big) + (small ? `<small>${esc(small)}</small>` : ''); b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
function toast(msg, ms = 2200) { const t = $('toast'); t.textContent = msg; t.style.opacity = 1; clearTimeout(t._h); t._h = setTimeout(() => t.style.opacity = 0, ms); }

/* ---------- results ---------- */
const TROPHY = { solo: [0, 10, 8, 7, 6, 4, 2, 0, -1, -2, -3], duo: [0, 9, 7, 4, 0, -3] };
function showResult(rank) {
  if (STATE.resultShown || STATE.mode === 'menu') return;
  STATE.resultShown = true; STATE.endAt = performance.now();
  const me = meEnt(), mode = viewMode();
  const P = $('result'); P.classList.remove('hidden');
  if (STATE.mode === 'pause') { STATE.mode = 'play'; $('pause').classList.add('hidden'); }
  STATE.mode = 'result';
  $('rRank').textContent = '#' + rank;
  const tr = (TROPHY[mode] || TROPHY.solo)[rank] || 0;
  $('rSub').innerHTML = (rank === 1 ? '🏆 大吉大利，沙丘之王！' : rank <= (mode === 'duo' ? 2 : 4) ? '干得漂亮！' : '下次一定！') + ` <span style="font-family:var(--num);color:${tr >= 0 ? '#ffe14d' : '#ff8a8a'}">奖杯 ${tr >= 0 ? '+' : ''}${tr}</span>`;
  const surv = me ? Math.round(((me.alive ? viewT() : (STATE.deathAt ? (STATE.deathAt - STATE.startT) / 1000 : viewT())))) : 0;
  $('rStats').innerHTML = `<div>击败<b>${me ? me.kills : 0}</b></div><div>伤害<b>${me ? Math.round(me.dmg) : 0}</b></div><div>存活<b>${Math.floor(surv / 60)}:${String(surv % 60).padStart(2, '0')}</b></div><div>英雄<b style="font-family:var(--font);font-size:20px">${me ? me.H.name : ''}</b></div>`;
  // standings
  const pl = viewPlacement(), mt = myTeam(), rows = [];
  const teams = new Map(); for (const b of viewBrawlers()) { if (!teams.has(b.team)) teams.set(b.team, []); teams.get(b.team).push(b); }
  for (const [t, bs] of teams) rows.push({ r: pl[t] || 0, t, bs });
  rows.sort((a, b) => (a.r || 99) - (b.r || 99));
  $('rTable').innerHTML = rows.map(R => `<div class="${R.t === mt ? 'me' : ''}"><span>${R.r ? '#' + R.r : '—'}</span><span>${R.bs.map(b => esc(b.name) + ' · ' + b.H.name).join('　')}</span><span>💥${R.bs.reduce((s, b) => s + (b.kills || 0), 0)}</span></div>`).join('');
  $('rWatch').classList.toggle('hidden', !!(isGuest() ? CL.over : G && G.over));
  $('rAgain').textContent = NET.role === 'guest' ? '等待房主' : NET.role === 'host' && connected() ? '回到房间' : '再来一局';
  $('rAgain').disabled = NET.role === 'guest';
  sfx(rank === 1 ? 'win' : 'lose');
}
function hideResultWatch() { $('result').classList.add('hidden'); STATE.mode = 'play'; STATE.watching = true; }

/* ---------- menu ---------- */
const PORTRAITS = {};
function makePortraits() {
  const r = R3.renderer, S = new THREE.Scene(), W = 192;
  S.add(new THREE.HemisphereLight(0xfff4e0, 0x7a5a6a, 2.0)); const L = new THREE.DirectionalLight(0xffffff, 2.2); L.position.set(-2, 4, 5); S.add(L);
  const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 20); cam.position.set(0, 1.25, 3.2); cam.lookAt(0, 0.86, 0);
  const rt = new THREE.WebGLRenderTarget(W, W, { samples: 4 }); const buf = new Uint8Array(W * W * 4);
  const cv = document.createElement('canvas'); cv.width = cv.height = W; const g = cv.getContext('2d');
  for (const h of HEROES) {
    S.background = new THREE.Color(h.color).lerp(new THREE.Color(0xffffff), 0.25);
    const V = makeHero(h.k); V.root.rotation.y = 0.35; S.add(V.root); animHero(V, { alive: true, moving: false, atkAge: 9, supAge: 9 }, 0.01, 0);
    r.setRenderTarget(rt); r.render(S, cam); r.readRenderTargetPixels(rt, 0, 0, W, W, buf); r.setRenderTarget(null);
    const id = g.createImageData(W, W); for (let y = 0; y < W; y++) id.data.set(buf.subarray((W - 1 - y) * W * 4, (W - y) * W * 4), y * W * 4);
    g.putImageData(id, 0, 0);
    // radial vignette
    const gr = g.createRadialGradient(W / 2, W * 0.45, W * 0.2, W / 2, W / 2, W * 0.75); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(40,20,40,0.45)'); g.fillStyle = gr; g.fillRect(0, 0, W, W);
    PORTRAITS[h.k] = cv.toDataURL('image/png'); S.remove(V.root);
  }
  rt.dispose();
}
function buildShowcase() {
  if (!R3.show) {
    const S = new THREE.Scene();
    S.add(new THREE.HemisphereLight(0xfff0dc, 0x5a3a5a, 1.9));
    const L = new THREE.DirectionalLight(0xffffff, 2.5); L.position.set(-3, 6, 4); L.castShadow = true; L.shadow.mapSize.set(1024, 1024); Object.assign(L.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 }); S.add(L);
    const pod = new THREE.Group(); S.add(pod);
    const top = new THREE.Mesh(GEO.cyl(1.25, 1.35, 0.3, 48), toon(0xf4e1c1)); top.position.y = -0.15; top.receiveShadow = true; pod.add(top);
    const rim = new THREE.Mesh(GEO.tor(1.3, 0.06, TAU, 8, 64), toon(0xffb21e)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.0; pod.add(rim);
    const base = new THREE.Mesh(GEO.cyl(1.45, 1.6, 0.4, 48), toon(0x6b3f5f)); base.position.y = -0.45; pod.add(base);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 48).rotateX(-Math.PI / 2), toon(0x3b2340)); ground.position.y = -0.64; ground.receiveShadow = true; S.add(ground);
    // floating deco cubes
    const decos = []; for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(GEO.box(0.22, 0.22, 0.22, 0.04), toon(0x3de06a, { emissive: 0x1fbf4a, emissiveIntensity: 0.8 })); m.position.set(rr(-6, 7), rr(0.6, 4), rr(-9, -4)); S.add(m); decos.push(m); }
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
    R3.show = { S, cam, pod, decos, V: null, k: null, root: { visible: true }, spin: 0.4, atkT: 0 };
  }
  setShowHero(SEL.hero);
}
function setShowHero(i) {
  const SH = R3.show; const k = HEROES[i].k;
  if (SH.k === k) return;
  if (SH.V) SH.pod.remove(SH.V.root);
  SH.V = makeHero(k); SH.V.root.scale.setScalar(1.0); SH.pod.add(SH.V.root); SH.k = k; SH.V.flash = 0;
  SH.V.root.traverse(o => { if (o.isMesh && !o.userData.outline) o.castShadow = true; });
  SH.S.background = new THREE.Color(HEROES[i].color).lerp(new THREE.Color(0x2a1830), 0.62);
  SH.S.fog = new THREE.Fog(SH.S.background, 8, 26);
  SH.atkT = 0;
}
function renderShowcase(dt, now) {
  const SH = R3.show; if (!SH) return;
  const asp = innerWidth / innerHeight, portrait = asp < 1;
  SH.cam.aspect = asp; SH.cam.fov = portrait ? 48 : 32; SH.cam.updateProjectionMatrix();
  const ox = portrait ? 0 : (asp > 1.4 ? 1.45 : 1.0);
  SH.cam.position.set(ox, portrait ? 2.2 : 1.75, portrait ? 8.4 : 7.8); SH.cam.lookAt(ox, portrait ? -0.9 : 0.5, 0);
  SH.pod.position.set(0, 0, 0);
  SH.spin += dt * 0.35; SH.V.root.rotation.y = 0.3 + Math.sin(SH.spin) * 0.55;
  SH.atkT += dt; const cyc = SH.atkT % 4.5;
  animHero(SH.V, { alive: true, moving: false, atkAge: cyc > 3 ? cyc - 3 : 9, supAge: 9 }, dt, now);
  SH.decos.forEach((m, i) => { m.rotation.set(now * 0.6 + i, now * 0.8 + i, 0); m.position.y += Math.sin(now * 1.3 + i) * 0.002; });
  R3.renderer.render(SH.S, SH.cam);
}
function refreshMenu() {
  const H = HEROES[SEL.hero];
  $('heroGrid').innerHTML = HEROES.map((h, i) => `<div class="hcard ${i === SEL.hero ? 'on' : ''}" data-i="${i}" style="background:${h.color}"><img src="${PORTRAITS[h.k] || ''}" alt=""><span>${h.name}</span></div>`).join('');
  const maxHp = 6000, bar = (v, m) => `<div class="bar"><i style="width:${Math.round(clamp(v / m, 0.06, 1) * 100)}%"></i></div>`;
  const dps = h => { const a = h.atk; return Math.round((a.type === 'spread' || a.type === 'flame' || a.type === 'burst' ? a.dmg * a.n : a.dmg) + (a.zone ? a.zone.dps * a.zone.life : 0)); };
  $('heroInfo').innerHTML = `<div><span class="nm" style="color:${H.color}">${H.name}</span><span class="tt">${H.title}</span></div><div class="ds">${H.desc}</div>
    <div class="stat"><b>生命</b>${bar(H.hp, maxHp)}<span>${Math.round(H.hp * BAL.hpMul)}</span></div>
    <div class="stat"><b>伤害</b>${bar(dps(H), 2300)}<span>${dps(H)}</span></div>
    <div class="stat"><b>射程</b>${bar(H.atk.range, 11)}<span>${H.atk.range}</span></div>
    <div class="stat"><b>移速</b>${bar(H.spd - 2.2, 1)}<span>${H.spd}</span></div>
    <div class="skill"><div class="ic a">⚔</div><div><em>${H.atkName}</em>　${H.atkDesc}</div></div>
    <div class="skill"><div class="ic s">★</div><div><em>${H.supName}</em>　${H.supDesc}</div></div>`;
  const seg = (id, items, cur, cb) => { $(id).innerHTML = items.map(([v, t]) => `<button data-v="${v}" class="${v === cur ? 'on' : ''}">${t}</button>`).join(''); $(id).onclick = e => { const b = e.target.closest('button'); if (!b) return; sfx('click'); cb(b.dataset.v); }; };
  seg('modeSeg', [['solo', '单人吃鸡'], ['duo', '双人吃鸡'], ['online', '联机双人']], SEL.mode, v => { SEL.mode = v; saveSel(); refreshMenu(); });
  seg('mapSeg', [['desert', '仙人掌峡谷'], ['snow', '雪松冰原'], ['dusk', '落日绿洲'], ['random', '随机']], SEL.map, v => { SEL.map = v; saveSel(); refreshMenu(); });
  seg('diffSeg', DIFF.map((d, i) => [String(i), d.name]), String(SEL.diff), v => { SEL.diff = +v; saveSel(); refreshMenu(); });
  $('nameIn').value = SEL.name || '';
  const online = SEL.mode === 'online';
  $('onlineBox').classList.toggle('hidden', !online);
  lobbyUI();
  $('keysHelp').innerHTML = IS_TOUCH ? '左半屏拖动移动 · 右下摇杆拖动瞄准、松手攻击（轻点自动瞄准）· 黄色摇杆放大招' :
    '<kbd>WASD</kbd> 移动　<kbd>鼠标</kbd> 瞄准　<kbd>左键</kbd> 攻击　<kbd>E</kbd>/<kbd>右键</kbd> 按住瞄准大招、松开释放<br><kbd>空格</kbd> 自动瞄准攻击　<kbd>F</kbd> 自动大招　<kbd>Esc</kbd> 暂停　<kbd>M</kbd> 静音　大厅里 <kbd>←→</kbd> 选英雄 <kbd>Enter</kbd> 开战';
  if (R3.show) setShowHero(SEL.hero);
}
function lobbyUI(msg) {
  const st = $('netStatus'), start = $('startBtn');
  if (SEL.mode !== 'online') { start.disabled = false; start.textContent = '开 战 ！'; return; }
  const art = inArtifact();
  $('hostBtn').disabled = art; $('joinBtn').disabled = art;
  let html = '';
  if (art) html = '这个预览页面不支持联机（浏览器安全策略拦截了 WebRTC）。请用 GitHub Pages 网址打开再联机，或者选「双人吃鸡」和 AI 队友并肩作战。';
  else if (NET.role === 'host') {
    html = NET.code && NET.peer && NET.peer.open ? `房间码 <b>${NET.code}</b><br>` : '正在创建房间…<br>';
    html += NET.partner ? `队友：<span style="color:var(--ally)">${esc(NET.partner.name)}</span>（${HEROES[NET.partner.hero].name}）已就位，点「开战」！` : '把房间码发给队友，等待 TA 加入…';
  } else if (NET.role === 'guest') html = connected() ? `已加入房间 <b>${NET.code}</b><br>${NET.partner ? '房主：' + esc(NET.partner.name) + '。' : ''}等待房主开始…` : '正在连接…';
  else html = '一人创建房间，把 4 位房间码发给队友；队友输入房间码加入。你们会组队对抗 4 支 AI 队伍。';
  if (msg) html = esc(msg) + (html ? '<br>' + html : '');
  st.innerHTML = html;
  start.disabled = !(NET.role === 'host' && NET.partner && connected());
  start.textContent = NET.role === 'guest' ? '等待房主…' : '开 战 ！';
}
function saveSel() { LS.set('sel', SEL); }
function menuKey(k, e) {
  if (k === 'ArrowLeft' || k === 'ArrowRight') { SEL.hero = (SEL.hero + (k === 'ArrowRight' ? 1 : HEROES.length - 1)) % HEROES.length; saveSel(); refreshMenu(); heroChanged(); sfx('click'); }
  else if (k === 'ArrowUp' || k === 'ArrowDown') { SEL.hero = (SEL.hero + (k === 'ArrowDown' ? 4 : HEROES.length - 4)) % HEROES.length; saveSel(); refreshMenu(); heroChanged(); sfx('click'); }
  else if (k === 'Enter') $('startBtn').click();
  else if (k === '1' || k === '2' || k === '3') { SEL.mode = ['solo', 'duo', 'online'][+k - 1]; saveSel(); refreshMenu(); }
}
function heroChanged() { if (NET.role === 'guest' && connected()) netSend({ t: 'hero', hero: SEL.hero }); if (NET.role === 'host' && connected()) netSend({ t: 'lobby', host: myName(), hero: SEL.hero }); }
function initMenu() {
  $('heroGrid').addEventListener('click', e => { const c = e.target.closest('.hcard'); if (!c) return; audioInit(); sfx('click'); SEL.hero = +c.dataset.i; saveSel(); refreshMenu(); heroChanged(); });
  $('nameIn').addEventListener('input', e => { SEL.name = e.target.value; saveSel(); });
  $('startBtn').onclick = () => {
    audioInit(); sfx('click');
    if (SEL.mode === 'online') { if (NET.role === 'host' && NET.partner && connected()) hostStartOnline(); return; }
    if (NET.role) netLeave();
    startGame({ seed: (Math.random() * 1e9) | 0, theme: pickTheme(), mode: SEL.mode, diff: SEL.diff, roster: buildRoster(false) });
  };
  $('hostBtn').onclick = () => { audioInit(); sfx('click'); netHost(); };
  $('joinBtn').onclick = () => { audioInit(); sfx('click'); netJoin($('codeIn').value); };
  $('codeIn').addEventListener('keydown', e => { if (e.key === 'Enter') netJoin($('codeIn').value); e.stopPropagation(); });
  $('pResume').onclick = () => togglePause();
  $('pQuit').onclick = () => quitToMenu();
  $('pauseBtn').onclick = () => togglePause();
  $('muteBtn').onclick = () => setMute(!AU.muted); setMute(AU.muted);
  $('rAgain').onclick = () => {
    if (NET.role === 'guest') return;
    if (NET.role === 'host' && connected()) { quitToMenu(); return; }
    startGame({ seed: (Math.random() * 1e9) | 0, theme: pickTheme(), mode: STATE.cfg.mode, diff: SEL.diff, roster: buildRoster(false) });
  };
  $('rWatch').onclick = () => hideResultWatch();
  // game-hub entry: only when deployed in the hub's folder layout (…/dunerumble/)
  if (/\/dunerumble\/(index\.html)?$/.test(location.pathname)) { $('hubBtn').classList.remove('hidden'); $('pHub').classList.remove('hidden'); }
  $('hubBtn').onclick = () => { if (NET.role) netLeave(); location.href = '../'; };
  $('pHub').onclick = () => {
    const b = $('pHub');
    if (!b.dataset.arm) { b.dataset.arm = '1'; b.textContent = '再点一次：放弃本局并返回'; clearTimeout(b._t); b._t = setTimeout(() => { delete b.dataset.arm; b.textContent = '返回游戏厅'; }, 2500); return; }
    if (NET.role) netLeave(); location.href = '../';
  };
  $('rMenu').onclick = () => { if (NET.role === 'guest') { netLeave(); } quitToMenu(); };
}

/* ---------- HUD ---------- */
const MINI = { img: null, t: 0 };
function drawMini(me) {
  const cv = $('mini'), g = cv.getContext('2d'), N = M.N, W = cv.width, s = W / N;
  if (!MINI.img || MINI.ver !== M.ver) {
    const c = document.createElement('canvas'); c.width = c.height = W; const q = c.getContext('2d'), th = THEMES[M.theme];
    q.fillStyle = hex(th.g1); q.fillRect(0, 0, W, W);
    for (let i = 0; i < N * N; i++) { const t = M.t[i]; if (t === T_FLOOR) continue; q.fillStyle = t === T_WALL ? hex(M.sty[i] ? th.crate : th.rock) : t === T_BUSH ? hex(th.bush[0]) : t === T_WATER ? hex(th.water) : hex(th.border); q.fillRect((i % N) * s, ((i / N) | 0) * s, s + 0.5, s + 0.5); }
    MINI.img = c; MINI.ver = M.ver;
  }
  g.clearRect(0, 0, W, W); g.drawImage(MINI.img, 0, 0);
  for (const b of M.boxes) if (b.hp > 0) { g.fillStyle = '#3ee070'; g.fillRect(b.tx * s, b.tz * s, s, s); }
  const R = viewGasR(), h = N / 2; g.fillStyle = 'rgba(70,200,60,.45)';
  const a = (h - R) * s, b2 = (h + R) * s; g.fillRect(0, 0, W, a); g.fillRect(0, b2, W, W - b2); g.fillRect(0, a, a, b2 - a); g.fillRect(b2, a, W - b2, b2 - a);
  const mt = myTeam();
  for (const e of viewBrawlers()) {
    if (!e.alive || e.vis === false) continue;
    const isMe = me && e.id === me.id; g.fillStyle = isMe ? '#4fe36f' : e.team === mt ? '#47aaff' : '#ff4d4d';
    g.beginPath(); g.arc(e.x * s, e.z * s, isMe ? 5.5 : 4.5, 0, TAU); g.fill(); g.strokeStyle = '#22141f'; g.lineWidth = 2; g.stroke();
  }
}
let hudT = 0;
function updateHUD(dt) {
  const me = meEnt(); if (!me) return;
  hudT += dt; const t = viewT();
  if (hudT > 0.1) {
    hudT = 0;
    const mode = viewMode();
    $('hAlive').innerHTML = (mode === 'duo' ? '剩余队伍' : '剩余') + `<span class="n">${viewAliveTeams()}</span>`;
    const gs = $('hGas');
    if (t < BAL.gasStart) { gs.textContent = `☁ 毒雾 ${Math.ceil(BAL.gasStart - t)} 秒后蔓延`; gs.classList.remove('warn'); }
    else { gs.textContent = '☠ 毒雾正在收缩！'; gs.classList.toggle('warn', t - BAL.gasStart < 5 || inGas(me.x, me.z, viewGasR())); }
    drawMini(me);
    const spec = $('spec');
    if (!me.alive && STATE.mode !== 'menu') {
      const rs = isGuest() ? me.respawnIn : (me.respawnT ? me.respawnT - G.t : 0);
      spec.classList.remove('hidden');
      const k = viewEnt(STATE.killer);
      spec.innerHTML = rs > 0 ? `复活倒计时 <b style="font-family:var(--num);font-size:30px;color:var(--y1)">${Math.ceil(rs)}</b><br><small>队友活着你就能复活</small>` : `${k && k !== me ? '被 <span style="color:#ff8a8a">' + esc(k.name) + '</span> 击败' : '你被淘汰了'} · 观战中`;
    } else spec.classList.add('hidden');
  }
  const f = clamp(me.sup, 0, 1);
  $('superBtn').querySelector('.fill').style.height = (f * 100) + '%'; $('superBtn').classList.toggle('ready', f >= 1 && me.alive);
  $('supStick').querySelector('.sfill').style.height = (f * 100) + '%'; $('supStick').classList.toggle('ready', f >= 1 && me.alive);
  $('gasVig').style.opacity = me.alive && inGas(me.x, me.z, viewGasR()) ? 0.85 : 0;
  $('hurtVig').style.opacity = me.alive && performance.now() - STATE.lastHurt < 250 ? 0.6 : (me.alive && me.hp / me.mhp < 0.3 ? 0.35 : 0);
}

/* ---------- spectate target ---------- */
function camFocus() {
  const me = meEnt(); if (!me) return null;
  if (me.alive) return me;
  const mate = viewBrawlers().find(b => b !== me && b.team === me.team && b.alive);
  if (mate) return mate;
  const k = viewEnt(STATE.killer); if (k && k.alive) return k;
  const any = viewBrawlers().find(b => b.alive); return any || me;
}

/* ---------- main loop ---------- */
const STEP = 1 / 60;
let lastT = performance.now();
function frame() {
  requestAnimationFrame(frame);
  const nowMs = performance.now(); let dt = Math.min(0.05, (nowMs - lastT) / 1000); lastT = nowMs;
  const now = nowMs / 1000;
  if (window.__dbg && window.__dbg.norender) { try { if (G && STATE.mode !== 'menu') { for (let i = 0; i < 6; i++) stepGame(STEP); } } catch (e) { window.__dbg.err = String(e.stack) } return; }
  try { tick(dt, now); } catch (e) { console.error(e); if (window.__dbg) window.__dbg.err = String(e && e.stack || e); }
}
function tick(dt, now) {
  if (STATE.mode === 'menu') { renderShowcase(dt, now); OV.ctx.clearRect(0, 0, OV.cv.width, OV.cv.height); return; }
  const me = meEnt();
  let show = null;
  if (isGuest()) { if (STATE.mode !== 'menu') guestLocal(dt); }
  else if (G && !simPaused()) {
    if (me && me.alive && STATE.mode === 'play' && !STATE.watching) show = readInput(me);
    else if (me) { me.inp.mx = me.inp.mz = 0; me.inp.fire = me.inp.sup = false; }
    STATE.acc += dt * (window.__dbg && window.__dbg.speed || 1);
    let n = 0; while (STATE.acc >= STEP && n < 8) { stepGame(STEP); STATE.acc -= STEP; n++; }
    if (n >= 8) STATE.acc = 0;
    if (NET.role === 'host') netHostTick(dt);
    for (const b of G.ents) b.vis = visibleTo(b, myTeam());
    if (me && me.alive) showAim(me, show && show.mode, show && show.ang, show && show.tx, show && show.tz, show ? show.strength : 0); else showAim(null);
  }
  if (me && !me.alive) showAim(null);
  syncScene(dt, now);
  stepParticles(dt); stepRings(dt);
  const f = camFocus();
  const lead = f === me && me && me.alive && !IS_TOUCH && performance.now() - INP.mouseT < 2500 ? { x: clamp((INP.gx - me.x) * 0.18, -2, 2), z: clamp((INP.gz - me.z) * 0.18, -1.6, 1.6) } : null;
  updateCamera(dt, f, lead);
  if (!(window.__dbg && window.__dbg.skipDraw)) { R3.renderer.render(R3.scene, R3.cam); drawOverlay(dt, now); }
  updateHUD(dt);
}

/* ---------- boot ---------- */
function boot() {
  initRenderer(); initInput(); initMenu();
  try { makePortraits(); } catch (e) { console.warn(e); }
  if (IS_TOUCH) document.body.classList.add('touch');
  buildShowcase(); refreshMenu();
  $('loading').remove();
  if (inArtifact() && SEL.mode === 'online') { /* keep selection, panel explains */ }
  requestAnimationFrame(frame);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
