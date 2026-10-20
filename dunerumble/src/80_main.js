/* ================= game flow, UI, main loop ================= */
const STATE = { mode: 'menu', cfg: null, me: null, killer: 0, resultShown: false, watching: false, acc: 0, deathAt: 0, endAt: 0, startT: 0, lastHurt: 0, gid: 0, hitstop: 0, slowUntil: 0, killcam: null, cmd: 'free', pingT: 0, run: null, recorded: false };
const SEL = Object.assign({ hero: 0, mode: 'solo', map: 'random', diff: 1, name: '', online: false, versus: false, sp: {}, skin: {} }, LS.get('sel', {}));
if (SEL.mode === 'online') { SEL.mode = 'duo'; SEL.online = true; }
if (!MODES[SEL.mode]) SEL.mode = 'solo';
if (!PLAYABLE.includes(SEL.hero)) SEL.hero = 0;
SEL.sp = SEL.sp || {}; SEL.skin = SEL.skin || {};
const $ = id => document.getElementById(id);
const myName = () => (SEL.name || '').trim().slice(0, 8) || '玩家';
const curSp = () => { const H = HEROES[SEL.hero]; return H.sps.includes(SEL.sp[H.k]) ? SEL.sp[H.k] : H.sps[0]; };
const curSkin = () => { const k = HEROES[SEL.hero].k, s = SEL.skin[k] | 0; return skinOwned(k, s) ? s : 0; };
function saveSel() { LS.set('sel', SEL); }
const fmtT = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const later = (fn, ms) => { const id = STATE.gid; setTimeout(() => { if (STATE.gid === id && STATE.mode !== 'menu') fn(); }, ms); };
const isOnlineGame = () => !!NET.role && STATE.mode !== 'menu';

/* ---------- view accessors (host/solo read G, guest reads CL) ---------- */
const isGuest = () => NET.role === 'guest' && STATE.mode !== 'menu';
function meEnt() { if (isGuest()) return CL.me; return STATE.me; }
function myTeam() { const m = meEnt(); return m ? m.team : 0; }
function viewBrawlers() { return isGuest() ? CL.list : (G ? G.ents : []); }
function viewProjs() { return isGuest() ? [...CL.projs.values()] : (G ? G.projs : []); }
function viewCubes() { return isGuest() ? CL.cubes : (G ? G.cubes : []); }
function viewTurrets() { return isGuest() ? CL.turrets : (G ? G.turrets : []); }
function viewZones() { return isGuest() ? CL.zones : (G ? G.zones : []); }
function viewTraps() { return isGuest() ? CL.traps : (G ? G.traps : []); }
function viewWarns() { return isGuest() ? CL.warns : (G ? G.warns : []); }
function viewMS() { return isGuest() ? CL.ms : (G ? G.ms : null); }
function viewGasR() { return isGuest() ? CL.gasR : (G ? G.gasR : BAL.N / 2); }
function viewT() { return isGuest() ? CL.t : (G ? G.t : 0); }
function viewEnt(id) { return isGuest() ? CL.ents.get(id) : (G ? entById(id) : null); }
function viewAliveTeams() { return isGuest() ? CL.alive : (G ? G.alive.size : 0); }
function viewPlacement() { return isGuest() ? CL.placement : (G ? G.placement : {}); }
function viewMode() { return (isGuest() ? CL.cfg : G && G.cfg || STATE.cfg || {}).mode || 'solo'; }
const viewMD = () => MODES[viewMode()] || MODES.solo;
const hasAllies = () => { const me = meEnt(); return !!me && viewBrawlers().some(b => b !== me && b.team === me.team && b.H.k !== 'dummy'); };

/* ---------- social requests (ping / command / emote) ---------- */
function requestPing(touch) {
  const me = meEnt(); if (!me || !me.alive || STATE.mode !== 'play' || !hasAllies()) return;
  if (performance.now() - STATE.pingT < 700) return; STATE.pingT = performance.now();
  let x, z, tid = 0;
  if (!touch && performance.now() - INP.mouseT < 2500) { x = INP.gx; z = INP.gz; }
  else { const t = autoTarget(me, 11); if (t && t.id) { x = t.x; z = t.z; } else { x = me.x + Math.cos(me.inp.aim) * 5; z = me.z + Math.sin(me.inp.aim) * 5; } }
  let bd = 1.8; for (const e of viewBrawlers()) if (e.alive && e.team !== me.team && e.vis !== false) { const d = dist(e.x, e.z, x, z); if (d < bd) { bd = d; tid = e.id; } }
  x = clamp(x, 1, BAL.N - 1); z = clamp(z, 1, BAL.N - 1);
  if (isGuest()) netSend({ t: 'ping', x: +x.toFixed(2), z: +z.toFixed(2), tid }); else addPing(me, x, z, tid);
}
function requestCmd() {
  const me = meEnt(); if (!me || STATE.mode !== 'play' || !hasAllies()) return;
  STATE.cmd = STATE.cmd === 'follow' ? 'free' : 'follow';
  if (isGuest()) netSend({ t: 'cmd', c: STATE.cmd }); else setCmd(me, STATE.cmd);
  updateCmdBtn();
}
function updateCmdBtn() { const b = $('cmdBtn'); if (b) { b.textContent = STATE.cmd === 'follow' ? '跟随' : '自由'; b.classList.toggle('on', STATE.cmd === 'follow'); } }
function requestEmote(k) {
  const me = meEnt(); if (!me || STATE.mode !== 'play' || !EMOTES[k]) return;
  if (isGuest()) netSend({ t: 'emo', e: k }); else emote(me, k);
  $('emoPanel').classList.add('hidden');
}

/* ---------- rosters & flow ---------- */
function pickTheme() { const ok = Object.keys(THEMES).filter(themeUnlocked); return SEL.map !== 'random' && ok.includes(SEL.map) ? SEL.map : pick(ok); }
function localHumans() { return [{ name: myName(), hero: SEL.hero, human: 1, sp: curSp(), skin: curSkin() }]; }
function startLocal(mode) {
  if (NET.role) netLeave();
  startGame({ seed: (Math.random() * 1e9) | 0, theme: mode === 'train' ? 'desert' : pickTheme(), mode, diff: SEL.diff, roster: rosterFor(mode, localHumans(), false) });
}
function startGame(cfg) {
  newGame(cfg);
  STATE.cfg = cfg; STATE.me = G.ents.find(e => e.human === 1);
  enterPlay();
}
function enterPlay() {
  STATE.gid++;
  try { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); } catch (e) { }
  INP.keys = {};
  buildMapScene();
  Object.assign(STATE, { mode: 'play', resultShown: false, watching: false, killer: 0, acc: 0, deathAt: 0, endAt: 0, startT: performance.now(), hitstop: 0, slowUntil: 0, killcam: null, cmd: 'free', recorded: false,
    run: { maxMulti: 0, maxStreak: 0, goals: 0, maxGems: 0, maxBounty: 0, gad: 0, cubes: 0 } });
  OV.nums = []; SOC.emotes.clear(); SOC.pings.length = 0;
  $('menu').classList.add('hidden'); $('hud').classList.remove('hidden'); $('result').classList.add('hidden'); $('pause').classList.add('hidden'); $('emoPanel').classList.add('hidden');
  $('touch').classList.toggle('hidden', !IS_TOUCH); $('superBtn').classList.toggle('hidden', IS_TOUCH); $('gadPill').classList.toggle('hidden', IS_TOUCH); $('keyHint').classList.toggle('hidden', IS_TOUCH);
  $('hFeed').innerHTML = '';
  const md = viewMD(), allies = hasAllies();
  $('pingBtn').classList.toggle('hidden', !allies); $('cmdBtn').classList.toggle('hidden', !allies); updateCmdBtn();
  $('hGas').classList.toggle('hidden', !md.showdown); $('hScore').classList.toggle('hidden', md.showdown || viewMode() === 'boss' || viewMode() === 'train');
  $('hBoss').classList.toggle('hidden', viewMode() !== 'boss'); $('hTrain').classList.toggle('hidden', viewMode() !== 'train');
  $('keyHint').innerHTML = 'WASD 移动 · 鼠标瞄准 · 左键攻击 · E/右键 大招 · Q 副技能 · 空格 自动瞄准' + (allies ? ' · T 标记 · V 跟随/自由' : '') + ' · 1-6 表情 · Esc 暂停';
  const me = meEnt(); if (me) { R3.camT.set(me.x, 0, me.z); }
  MINI.img = null;
  if (R3.show) R3.show.root.visible = false;
  const tn = THEMES[M.theme].name;
  banner(md.name, viewMode() === 'train' ? '跟着提示一步步来' : `${tn} · ${md.desc}`);
  audioInit();
}
function quitToMenu(fromNet) {
  if (NET.role === 'host' && !fromNet && STATE.mode !== 'menu') netSend({ t: 'back' });
  STATE.gid++;
  G = null; STATE.me = null; STATE.mode = 'menu';
  CL.me = null; CL.list = []; CL.ents.clear(); CL.projs.clear(); CL.ms = null;
  $('menu').classList.remove('hidden'); $('hud').classList.add('hidden'); $('touch').classList.add('hidden'); $('result').classList.add('hidden'); $('pause').classList.add('hidden'); $('emoPanel').classList.add('hidden');
  $('gasVig').style.opacity = 0; $('hurtVig').style.opacity = 0;
  showAim(null);
  buildShowcase(); refreshMenu();
  if (NET.role === 'host') broadcastLobby();
}
function togglePause() {
  if (STATE.mode === 'play') {
    STATE.mode = 'pause'; $('pause').classList.remove('hidden');
    $('pauseNote').textContent = NET.role && connected() ? '联机对局不会暂停，游戏仍在进行' : '';
  } else if (STATE.mode === 'pause') { STATE.mode = 'play'; $('pause').classList.add('hidden'); }
}
const simPaused = () => STATE.mode === 'pause' && !(NET.role && connected());

/* ---------- events -> fx / sound / feed ---------- */
const GAD_FX = { nova: [0xffb347, 2.6], freeze: [0xbfe9ff, 2.6], armor: [0xb8c0c8, 1.1], trap: [0x9aa3ad, 0.7], reload: [0xff9f1c, 1], speed: [0x52f5ff, 1.1], dash: [0xe8d8b8, 0.9], blink: [0xc77dff, 1], blink2: [0xc77dff, 1], heal: [0x6dff8f, 1.2] };
function onLocalEvent(e) {
  if (STATE.mode === 'menu' || !R3.mapG) return;
  const me = meEnt(), mid = me ? me.id : -1, th = THEMES[M.theme], mt = myTeam(), nowS = performance.now() / 1000;
  switch (e.k) {
    case 'shot': {
      const H = HEROES[e.h];
      const x = e.x + Math.cos(e.a) * 0.65, z = e.z + Math.sin(e.a) * 0.65;
      if (e.s !== 2) emit({ x, z, y: 0.75, c: [0xfff3b0, 0xffc04a], glow: 1, s0: 0.12, s1: 0, life: 0.15, sp: 3, a: e.a, ar: 0.5, g: 0 }, e.s ? 8 : 4);
      if (e.s === 1) ring(e.x, e.z, 1.4, 0xffd23f, 0.35);
      sfx(H.k + (e.s ? 'S' : ''), e.x, e.z, e.id === mid ? 1 : 0.7);
    } break;
    case 'hit': {
      const t = viewEnt(e.id), isMe = e.id === mid, byMe = e.s === mid;
      const tm = t ? t.team : -1, mine = tm === mt;
      const col = e.g ? '#b8ff6a' : isMe ? '#ff5a5a' : mine ? '#ff9c9c' : byMe ? '#ffffff' : '#ffe1b8';
      const big = !e.g && (byMe || isMe) && e.v >= 1400 ? 2 : e.v >= 1000 ? 1 : 0;
      if (!t || t.vis !== false || isMe || mine) addNum(e.x, e.z, e.v, col, big);
      if (!e.g) emit({ x: e.x, z: e.z, y: 0.7, c: [0xffffff, 0xffe08a], glow: 1, s0: 0.08, s1: 0, life: 0.25, sp: 4, up: 2, g: 6 }, big === 2 ? 12 : 5);
      if (isMe) { sfx(e.g ? 'gas' : 'hurt'); if (!e.g) { R3.shake = Math.max(R3.shake, 0.18); STATE.lastHurt = performance.now(); } }
      else if (byMe) { sfx(big === 2 ? 'crit' : 'hit'); if (big === 2) { R3.shake = Math.max(R3.shake, 0.22); if (!NET.role) STATE.hitstop = Math.max(STATE.hitstop, 0.045); } }
      else sfx('hit', e.x, e.z, 0.4);
    } break;
    case 'immune': if (e.id !== mid) addNum(e.x, e.z, '无敌', '#cfd8e3', 0); break;
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
      const big = e.big, r = e.r;
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
      addFeed(k, v);
      if (e.v === mid) {
        STATE.killer = e.by; STATE.deathAt = performance.now(); sfx('death');
        if (k && k !== me) { STATE.killcam = { by: e.by, t: performance.now() }; if (!NET.role) STATE.slowUntil = performance.now() + 1100; }
      } else if (e.by === mid) {
        sfx('kill'); if (!NET.role) STATE.hitstop = Math.max(STATE.hitstop, 0.09);
        STATE.run.maxMulti = Math.max(STATE.run.maxMulti, e.mk || 0); STATE.run.maxStreak = Math.max(STATE.run.maxStreak, e.st || 0);
        const big = e.mk >= 4 ? '暴走！' : e.mk === 3 ? '三杀！' : e.mk === 2 ? '双杀！' : e.st === 5 ? '势不可挡！' : e.st === 3 ? '大杀特杀！' : null;
        if (e.end >= 3) { banner('终结！', `终结了 ${v ? v.name : ''} 的 ${e.end} 连杀`); sfx('streak'); }
        else if (big) { banner(big, v ? v.name : ''); sfx('streak'); }
        else if (v && v.H.k !== 'dummy' && !v.minion) banner('击败！', v.name);
      } else if (k && (e.st === 3 || e.st === 5)) toast(`${k.name} ${e.st === 5 ? '势不可挡' : '大杀特杀'}！`, 1800);
      else if (k && e.end >= 3 && v) toast(`${k.name} 终结了 ${v.name} 的连杀`, 1800);
    } break;
    case 'out': if (e.team === mt && !STATE.resultShown) later(() => showResult({ rank: e.rank }), STATE.killcam ? 2600 : 1300); break;
    case 'end': {
      if (STATE.watching) { STATE.resultShown = false; STATE.watching = false; }
      const md = viewMD(), win = e.team === mt;
      if (md.showdown) { if (!STATE.resultShown) later(() => showResult({ rank: win ? 1 : (viewPlacement()[mt] || 2) }), win ? 900 : 1300); break; }
      if (e.train) banner('训练完成！', '你已经掌握全部操作了');
      else if (viewMode() === 'boss') banner(win ? '击败巨像！' : '挑战失败', win ? '团队配合满分' : '巨像还站着…');
      else banner(e.draw ? '平局' : win ? '胜利！' : '失败', e.draw ? '势均力敌' : win ? '干得漂亮' : '下次扳回来');
      sfx(win ? 'win' : 'lose');
      later(() => showResult({ rank: win ? 1 : 2, win, draw: !!e.draw, train: !!e.train }), 1700);
    } break;
    case 'cube': emit({ x: e.x, z: e.z, y: 0.5, c: [0x6dff8f, 0xb6ffc8], glow: 1, s0: 0.1, s1: 0, life: 0.5, sp: 2, up: 4, g: 2 }, 10); sfx('cube', e.x, e.z, e.id === mid ? 1.2 : 0.5); if (e.id === mid) STATE.run.cubes++; break;
    case 'supready': if (e.id === mid) sfx('supready'); break;
    case 'turret': ring(e.x, e.z, 1.2, 0x5ef2ff, 0.4); emit({ x: e.x, z: e.z, y: 0.3, c: [0xffffff, 0xd8e2ee], s0: 0.2, s1: 0, life: 0.6, sp: 2, up: 2, g: 0 }, 10); sfx('turret', e.x, e.z); break;
    case 'tshot': sfx('tshot', e.x, e.z, 0.6); break;
    case 'tdie': emit({ x: e.x, z: e.z, y: 0.5, c: [0xf2f5fb, 0x3a86ff, 0x2b2f3a], s0: 0.12, s1: 0.03, life: 0.8, sp: 4, up: 5, g: 12 }, 14); sfx('box', e.x, e.z, 0.6); break;
    case 'respawn': ring(e.x, e.z, 1.6, 0x7dffa0, 0.6); if (e.id === mid) { sfx('respawn'); STATE.killcam = null; } break;
    case 'swing': { const b = viewEnt(e.id); arcFx(e.x, e.z, e.a, e.r, e.s, b && b.H.k === 'bruin' ? 0xffd9a0 : 0xffffff); emit({ x: e.x + Math.cos(e.a) * e.r * 0.7, z: e.z + Math.sin(e.a) * e.r * 0.7, y: 0.6, c: [0xffffff, 0xffe9c0], glow: 1, s0: 0.08, s1: 0, life: 0.2, sp: 3, a: e.a, ar: e.s / 2, g: 0 }, 6); } break;
    case 'chain': boltFx(e.p); { const L = e.p[e.p.length - 1]; emit({ x: L[0], z: L[1], y: 0.8, c: [0xffffff, 0xc77dff], glow: 1, s0: 0.1, s1: 0, life: 0.3, sp: 4, up: 2, g: 3 }, 8); sfx('zapHit', L[0], L[1], 0.6); } break;
    case 'land': ring(e.x, e.z, e.r * 1.2, 0xffd9a0, 0.4, 0.07, 0.25); emit({ x: e.x, z: e.z, y: 0.2, c: [0xc8a878, 0xe8d8b8, 0x9a7a5a], s0: 0.16, s1: 0.03, life: 0.7, sp: 5, up: 3, g: 8, jr: 0.4 }, 18); R3.shake = Math.max(R3.shake, clamp(0.4 * (1 - dist(e.x, e.z, R3.camT.x, R3.camT.z) / 12), 0, 0.4)); sfx('boom', e.x, e.z, 0.6); break;
    case 'heal': addNum(e.x, e.z, '+' + e.v, '#6dff8f', false); break;
    case 'shit': addNum(e.x, e.z, e.v, '#7ad8ff', false); emit({ x: e.x, z: e.z, y: 0.8, c: 0x7ad8ff, glow: 1, s0: 0.08, s1: 0, life: 0.25, sp: 3, up: 2 }, 4); sfx('bhit', e.x, e.z); break;
    case 'stealth': emit({ x: e.x, z: e.z, y: 0.6, c: [0xe6dcff, 0xb9a6ff], glow: 1, s0: 0.15, s1: 0, life: 0.6, sp: 2.5, up: 2, g: -0.5, jr: 0.3 }, 18); sfx('wispS', e.x, e.z); break;
    case 'shield': ring(e.x, e.z, e.r, 0x7ad8ff, 0.5, 0.07, 0.15); ring(e.x, e.z, e.r * 0.6, 0xffffff, 0.35); break;
    case 'zone': ring(e.x, e.z, e.r, e.k === 'heal' ? 0x6dff8f : e.k === 'frost' ? 0xffffff : 0xb070ff, 0.4); sfx(e.k === 'heal' ? 'respawn' : e.k === 'frost' ? 'frostS' : 'sporeHit', e.x, e.z, 0.7); break;
    /* --- gadgets, modes, events --- */
    case 'gadget': {
      const b = viewEnt(e.id); if (e.k === 'trap' && b && b.team !== mt) break; // enemies don't see traps being laid
      const [c, r] = GAD_FX[e.k] || [0xffffff, 1];
      ring(e.x, e.z, r, c, 0.45, 0.07, 0.18);
      emit({ x: e.x, z: e.z, y: 0.6, c: [c, 0xffffff], glow: 1, s0: 0.1, s1: 0, life: 0.5, sp: e.k === 'nova' || e.k === 'freeze' ? 7 : 2.5, up: 2, g: 1, jr: 0.2 }, e.k === 'nova' || e.k === 'freeze' ? 26 : 12);
      if (e.k !== 'blink2') sfx('gadget', e.x, e.z, e.id === mid ? 1 : 0.6);
      if (e.id === mid && e.k !== 'blink2') STATE.run.gad++;
      if (e.k === 'nova') R3.shake = Math.max(R3.shake, 0.2);
    } break;
    case 'trap': emit({ x: e.x, z: e.z, y: 0.3, c: [0xd8dce4, 0x9aa3ad], s0: 0.1, s1: 0, life: 0.5, sp: 3, up: 4, g: 10 }, 12); sfx('trap', e.x, e.z); break;
    case 'gem': emit({ x: e.x, z: e.z, y: 0.5, c: [0xb05cff, 0xe0aaff], glow: 1, s0: 0.1, s1: 0, life: 0.5, sp: 2, up: 4, g: 2 }, 10); sfx('gem', e.x, e.z, e.id === mid ? 1.1 : 0.4); break;
    case 'gemspawn': emit({ x: e.x, z: e.z, y: 0.8, c: 0xc77dff, glow: 1, s0: 0.08, s1: 0, life: 0.5, sp: 2.5, up: 3, g: 3 }, 8); break;
    case 'cdstart': banner(e.team === mt ? '我方宝石领先！' : '敌方宝石领先！', e.team === mt ? '守住 15 秒就赢了' : '15 秒内击败他们夺回宝石'); sfx(e.team === mt ? 'supready' : 'alarm'); break;
    case 'cdstop': toast('倒计时中断！'); break;
    case 'goal': {
      const ours = e.team === mt; banner(ours ? '进球！' : '失球…', `${e.sc[mt]} : ${e.sc[1 - mt]}`); sfx(ours ? 'goal' : 'lose');
      if (e.by === mid) STATE.run.goals++;
      const gl = (M.goals || []).find(g => g.team !== e.team); if (gl) emit({ x: (gl.x0 + gl.x1) / 2, z: gl.z + .5, y: 0.5, c: [0xffd23f, 0xff7ac0, 0x52f5ff, 0xffffff], s0: 0.1, s1: 0.04, life: 1.4, sp: 7, up: 9, g: 10, jr: 1 }, 50);
    } break;
    case 'kick': sfx('kick', e.x, e.z, e.p ? 1.2 : 0.8); emit({ x: e.x, z: e.z, y: 0.3, c: 0xffffff, s0: 0.08, s1: 0, life: 0.3, sp: 3, up: 1 }, 6); break;
    case 'ballget': if (e.id === mid) sfx('click'); break;
    case 'kickoff': toast('⚽ 开球！', 1200); sfx('whistle'); break;
    case 'stars': addNum(e.x, e.z, '+' + e.n + '★', '#ffd23f', 1); break;
    case 'phase': banner('巨像暴怒了！', '攻击更快、机兵更多'); R3.shake = Math.max(R3.shake, 0.6); sfx('alarm'); break;
    case 'bossact': if (e.k === 'charge' || e.k === 'rockets') sfx('alarm', e.x, e.z, 0.6); break;
    case 'minion': ring(e.x, e.z, 1, 0xff4b4b, 0.4); break;
    case 'trainstep': sfx('supready'); if (e.s < TRAIN_STEPS.length) toast('✔ 完成！下一步：' + TRAIN_STEPS[e.s].t, 2400); break;
    case 'dropwarn': toast('📦 补给箱正在空投！', 2000); ring(e.x, e.z, 1.2, 0x6dff8f, 0.8); sfx('alarm', e.x, e.z, 0.5); break;
    case 'dropland': ring(e.x, e.z, 1.6, 0x6dff8f, 0.6); emit({ x: e.x, z: e.z, y: 0.2, c: [0xe8d8b8, 0xc8a878], s0: 0.2, s1: 0.03, life: 0.8, sp: 4, up: 2, g: 5, jr: 0.4 }, 16); sfx('box', e.x, e.z, 0.8); break;
    case 'meteors': banner('流星雨来袭！', '注意地上的红圈'); sfx('alarm'); break;
    case 'surge': banner('毒雾暴涨！', '快往中间跑'); sfx('alarm'); break;
    case 'pad': ring(e.x, e.z, 0.8, 0x52f5ff, 0.35); sfx('pad', e.x, e.z); break;
    case 'padland': ring(e.x, e.z, 0.9, 0xe8d8b8, 0.35); emit({ x: e.x, z: e.z, y: 0.15, c: [0xe8d8b8, 0xc8a878], s0: 0.12, s1: 0, life: 0.5, sp: 3, up: 1.5, g: 4 }, 10); break;
    case 'port': emit({ x: e.x, z: e.z, y: 0.6, c: [0xc77dff, 0xffffff], glow: 1, s0: 0.12, s1: 0, life: 0.5, sp: 3, up: 3, g: 0, jr: 0.2 }, 14); sfx('port', e.x, e.z); break;
    case 'spring': emit({ x: e.x, z: e.z, y: 0.3, c: [0x6dff8f, 0xffffff], glow: 1, s0: 0.07, s1: 0, life: 0.6, up: 2, g: -0.5, jr: 0.3 }, 3); break;
    case 'emote': SOC.emotes.set(e.id, { e: e.e, t: nowS }); sfx('pop', null, null, e.id === mid ? 1 : 0.5); break;
    case 'ping': if (e.team === mt) { SOC.pings.push({ x: e.x, z: e.z, tid: e.tid, t: nowS }); if (SOC.pings.length > 4) SOC.pings.shift(); sfx('ping'); const b = viewEnt(e.by); if (b && b !== me) toast(`${b.name}：${e.tid ? '集火这个目标！' : '去这里！'}`, 1500); } break;
    case 'cmd': if (e.team === mt) { const b = viewEnt(e.by); STATE.cmd = e.c; updateCmdBtn(); toast(e.c === 'follow' ? `AI 队友：跟着 ${b ? b.name : '你'} 走` : 'AI 队友：自由行动', 1600); } break;
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
function mvpScore(b) { const st = b.st || {}; return b.kills * 3 + b.dmg / 1500 + (st.goals || 0) * 5 + (st.heal || 0) / 2500 + (st.maxGems || 0) * 0.3; }
function showResult(o) {
  if (STATE.resultShown || STATE.mode === 'menu') return;
  STATE.resultShown = true; STATE.endAt = performance.now();
  const me = meEnt(), mode = viewMode(), md = MODES[mode];
  if (STATE.mode === 'pause') $('pause').classList.add('hidden');
  STATE.mode = 'result'; $('result').classList.remove('hidden'); $('emoPanel').classList.add('hidden');
  const rank = o.rank || 2, win = md.showdown ? rank === 1 : !!o.win, draw = !!o.draw;
  const over = isGuest() ? CL.over : G && G.over;
  // title
  $('rRank').textContent = md.showdown ? '#' + rank : mode === 'train' ? '🎓' : draw ? '平局' : win ? '胜利' : '失败';
  $('rRank').className = win ? 'win' : draw ? '' : 'lose';
  $('rSub').textContent = md.showdown ? (rank === 1 ? '🏆 大吉大利，沙丘之王！' : rank <= (mode === 'duo' ? 2 : 4) ? '干得漂亮！' : '下次一定！')
    : mode === 'train' ? '训练完成！去实战试试吧' : mode === 'boss' ? (win ? '钢铁巨像被击倒了！' : '巨像太强了，换个阵容再来') : draw ? '势均力敌' : win ? '团队胜利！' : '惜败，再来一局';
  // progression (once per match; watching on and finishing later does not double count)
  let rec = null, fresh = false;
  const st = (me && me.st) || {};
  if (!STATE.recorded && me) {
    STATE.recorded = true; fresh = true;
    rec = recordMatch({ mode, win, rank: md.showdown ? rank : (win ? 1 : 2), draw, kills: me.kills || 0, dmg: Math.round(me.dmg || 0), boxes: st.boxes || 0, gad: st.gad != null ? st.gad : STATE.run.gad,
      cubes: st.cubes != null ? st.cubes : STATE.run.cubes, heal: Math.round(st.heal || 0), maxMulti: STATE.run.maxMulti, maxStreak: STATE.run.maxStreak, goals: STATE.run.goals, maxGems: Math.max(STATE.run.maxGems, st.maxGems || 0), maxBounty: Math.max(STATE.run.maxBounty, st.maxBounty || 0), hero: me.H.k });
    STATE.lastRec = rec;
  } else rec = STATE.lastRec;
  const R = rankOf(PROG.trophies);
  $('rReward').innerHTML = rec ? `<span class="tro ${rec.dT >= 0 ? 'up' : 'dn'}">🏆 ${rec.dT >= 0 ? '+' : ''}${rec.dT}</span><span class="coin">🪙 +${rec.coins}</span><span class="rk" style="color:${R.c}">${R.n} · ${PROG.trophies}${R.next ? ' / ' + R.next.t : ''}</span>` : '';
  // my stats
  const surv = me ? Math.round(me.alive ? viewT() : (STATE.deathAt ? (STATE.deathAt - STATE.startT) / 1000 : viewT())) : 0;
  const cells = [['击败', me ? me.kills : 0], ['伤害', me ? Math.round(me.dmg) : 0]];
  if (me && me.st) cells.push(['治疗', Math.round(st.heal || 0)], ['开箱', st.boxes || 0]);
  cells.push(['副技能', st.gad != null ? st.gad : STATE.run.gad]);
  cells.push(md.showdown ? ['存活', fmtT(surv)] : mode === 'ball' ? ['进球', STATE.run.goals] : mode === 'gem' ? ['最多宝石', Math.max(STATE.run.maxGems, st.maxGems || 0)] : mode === 'bounty' ? ['最高星', Math.max(STATE.run.maxBounty, st.maxBounty || 0)] : ['阵亡', st.deaths || 0]);
  $('rStats').innerHTML = cells.map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join('');
  // damage-over-time chart (5 s buckets)
  const cv = $('rChart'), tl = Array.from(st.tl || [], v => v || 0);
  cv.classList.toggle('hidden', !tl.length);
  if (tl.length) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, n = Math.max(tl.length, 6), mx = Math.max(1, ...tl), bw = (W - 30) / n;
    g.clearRect(0, 0, W, H); g.font = '20px "Lilita One",system-ui'; g.fillStyle = 'rgba(255,255,255,.55)'; g.textAlign = 'left'; g.fillText('伤害 / 5 秒', 4, 20);
    for (let i = 0; i < tl.length; i++) { const v = tl[i] || 0, h = (H - 40) * v / mx; const gr = g.createLinearGradient(0, H - 14 - h, 0, H - 14); gr.addColorStop(0, '#ffe14d'); gr.addColorStop(1, '#ff9f1c'); g.fillStyle = gr; g.fillRect(24 + i * bw + 1, H - 14 - h, Math.max(2, bw - 2), h); }
    g.fillStyle = 'rgba(255,255,255,.45)'; g.textAlign = 'center'; g.font = '16px "Lilita One",system-ui';
    for (let i = 0; i <= n; i += 6) g.fillText(fmtT(i * 5), 24 + i * bw, H - 1);
  }
  // MVP + table
  const all = viewBrawlers().filter(b => !b.H.hidden);
  const pool = md.showdown || draw ? all : all.filter(b => b.team === (win ? myTeam() : 1 - myTeam()) || mode === 'boss');
  const mvp = pool.length && mode !== 'train' ? pool.reduce((a, b) => mvpScore(b) > mvpScore(a) ? b : a) : null;
  $('rMvp').innerHTML = mvp ? `⭐ MVP <b class="${mvp === me ? 'me' : ''}">${esc(mvp.name)}</b> · ${mvp.H.name}　💥${mvp.kills}　⚔${Math.round(mvp.dmg)}` : '';
  const pl = viewPlacement(), mt = myTeam(), rows = [];
  const teams = new Map(); for (const b of all) { if (!teams.has(b.team)) teams.set(b.team, []); teams.get(b.team).push(b); }
  for (const [t, bs] of teams) rows.push({ r: pl[t] || 0, t, bs });
  rows.sort((a, b) => md.showdown ? (a.r || 99) - (b.r || 99) : (a.t === mt ? -1 : b.t === mt ? 1 : 0));
  const tag = b => b.bounty && mode === 'bounty' ? ` ★${b.bounty}` : '';
  $('rTable').innerHTML = rows.map(R => md.showdown
    ? `<div class="${R.t === mt ? 'me' : ''}"><span>${R.r ? '#' + R.r : '—'}</span><span>${R.bs.map(b => esc(b.name) + ' · ' + b.H.name).join('　')}</span><span>💥${R.bs.reduce((s, b) => s + (b.kills || 0), 0)}</span></div>`
    : R.bs.map((b, i) => `<div class="${b === me ? 'me' : R.t === mt ? 'al' : ''}"><span>${i ? '' : R.t === mt ? '我方' : '敌方'}</span><span>${esc(b.name)} · ${b.H.name}${tag(b)}</span><span>💥${b.kills} ⚔${Math.round(b.dmg)}</span></div>`).join('')).join('');
  // quests, achievements, unlocks, difficulty
  const extra = [];
  if (fresh) {
    if (rec.rankUp) { extra.push(`<div class="up">🎖 晋升 <b style="color:${rec.rankUp.c}">${rec.rankUp.n}</b>！</div>`); later(() => { banner('段位提升！', rec.rankUp.n); sfx('win'); }, 600); }
    for (const u of rec.unlocks) extra.push(`<div class="up">🔓 解锁地图：${u}</div>`);
    for (const q of rec.quests) extra.push(`<div>📜 完成任务「${q.t}」 🪙+${q.r}</div>`);
    for (const a of rec.ach) extra.push(`<div>🏅 达成成就「${a.t}」 🪙+${a.r}</div>`);
    if (!NET.role && mode !== 'train') { const msg = adaptDifficulty(); if (msg) extra.push(`<div>⚙ ${msg}</div>`); }
  }
  if (fresh) STATE.lastExtra = extra.join('');
  $('rExtra').innerHTML = STATE.lastExtra || '';
  $('rWatch').classList.toggle('hidden', !!over);
  $('rAgain').textContent = NET.role === 'guest' ? '等待房主' : NET.role === 'host' && connected() ? '回到房间' : '再来一局';
  $('rAgain').disabled = NET.role === 'guest';
  if (md.showdown) sfx(rank === 1 ? 'win' : 'lose');
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
  for (const i of PLAYABLE) {
    const h = HEROES[i];
    S.background = new THREE.Color(h.color).lerp(new THREE.Color(0xffffff), 0.25);
    const V = makeHero(h.k); V.root.rotation.y = 0.35; S.add(V.root); animHero(V, { alive: true, moving: false, atkAge: 9, supAge: 9 }, 0.01, 0);
    r.setRenderTarget(rt); r.render(S, cam); r.readRenderTargetPixels(rt, 0, 0, W, W, buf); r.setRenderTarget(null);
    const id = g.createImageData(W, W); for (let y = 0; y < W; y++) id.data.set(buf.subarray((W - 1 - y) * W * 4, (W - y) * W * 4), y * W * 4);
    g.putImageData(id, 0, 0);
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
    const decos = []; for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(GEO.box(0.22, 0.22, 0.22, 0.04), toon(0x3de06a, { emissive: 0x1fbf4a, emissiveIntensity: 0.8 })); m.position.set(rr(-6, 7), rr(0.6, 4), rr(-9, -4)); S.add(m); decos.push(m); }
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
    R3.show = { S, cam, pod, decos, V: null, k: null, root: { visible: true }, spin: 0.4, atkT: 0 };
  }
  setShowHero(SEL.hero, curSkin());
}
function setShowHero(i, skin = 0) {
  const SH = R3.show; const k = HEROES[i].k, key = k + '|' + skin;
  if (SH.k === key) return;
  if (SH.V) SH.pod.remove(SH.V.root);
  SH.V = makeHero(k, skin); SH.V.root.scale.setScalar(1.0); SH.pod.add(SH.V.root); SH.k = key; SH.V.flash = 0;
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
  SH.spin += dt * 0.35; SH.V.root.rotation.y = 0.3 + Math.sin(SH.spin) * 0.55;
  SH.atkT += dt; const cyc = SH.atkT % 4.5;
  animHero(SH.V, { alive: true, moving: false, atkAge: cyc > 3 ? cyc - 3 : 9, supAge: 9 }, dt, now);
  SH.decos.forEach((m, i) => { m.rotation.set(now * 0.6 + i, now * 0.8 + i, 0); m.position.y += Math.sin(now * 1.3 + i) * 0.002; });
  R3.renderer.render(SH.S, SH.cam);
}
const ONLINE_MODES = ['solo', 'duo', 'gem', 'ball', 'bounty', 'boss'];
const VERSUS_MODES = ['duo', 'gem', 'ball', 'bounty'];
function refreshMenu() {
  const H = HEROES[SEL.hero], hk = H.k;
  const R = rankOf(PROG.trophies);
  $('metaRow').innerHTML = `<span class="rk" style="--rc:${R.c}">${R.n}</span><span class="tro">🏆 ${PROG.trophies}</span><span class="coin">🪙 ${PROG.coins}</span><span class="sp"></span><button id="questBtn">📜 任务${dailyQuests().some(q => !q.done) ? '<i class="dot"></i>' : ''}</button><button id="setBtn">⚙</button>`;
  $('questBtn').onclick = () => { sfx('click'); openQuests(); }; $('setBtn').onclick = () => { sfx('click'); openSettings(); };
  $('heroGrid').innerHTML = PLAYABLE.map(i => { const h = HEROES[i]; return `<div class="hcard ${i === SEL.hero ? 'on' : ''}" data-i="${i}" style="background:${h.color}"><img src="${PORTRAITS[h.k] || ''}" alt=""><span>${h.name}</span>${PROG.ht[h.k] ? `<em>🏆${PROG.ht[h.k]}</em>` : ''}</div>`; }).join('');
  const maxHp = 6000, bar = (v, m) => `<div class="bar"><i style="width:${Math.round(clamp(v / m, 0.06, 1) * 100)}%"></i></div>`;
  const dps = h => { const a = h.atk; return Math.round((a.type === 'spread' || a.type === 'flame' || a.type === 'burst' ? a.dmg * a.n : a.dmg) + (a.zone ? a.zone.dps * a.zone.life : 0)); };
  const GD = GADGETS[H.gad];
  $('heroInfo').innerHTML = `<div><span class="nm" style="color:${H.color}">${H.name}</span><span class="tt">${H.title}</span></div><div class="ds">${H.desc}</div>
    <div class="stat"><b>生命</b>${bar(H.hp, maxHp)}<span>${Math.round(H.hp * BAL.hpMul)}</span></div>
    <div class="stat"><b>伤害</b>${bar(dps(H), 2300)}<span>${dps(H)}</span></div>
    <div class="stat"><b>射程</b>${bar(H.atk.range, 11)}<span>${H.atk.range}</span></div>
    <div class="stat"><b>移速</b>${bar(H.spd - 2.2, 1)}<span>${H.spd}</span></div>
    <div class="skill"><div class="ic a">⚔</div><div><em>${H.atkName}</em>　${H.atkDesc}</div></div>
    <div class="skill"><div class="ic s">★</div><div><em>${H.supName}</em>　${H.supDesc}</div></div>
    <div class="skill"><div class="ic g">⚡</div><div><em>${GD.name}</em>　${GD.desc}（每局 ${GADGET_USES} 次）</div></div>`;
  // star power + skin
  const sp = curSp(), sk = curSkin();
  $('spSeg').innerHTML = H.sps.map(k => `<button data-v="${k}" class="${k === sp ? 'on' : ''}" title="${STARS[k].desc}"><b>${STARS[k].name}</b><small>${STARS[k].desc}</small></button>`).join('');
  $('spSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; sfx('click'); SEL.sp[hk] = b.dataset.v; saveSel(); refreshMenu(); heroChanged(); };
  $('skinSeg').innerHTML = SKINS.map((S, i) => { const own = skinOwned(hk, i); return `<button data-v="${i}" class="${i === sk ? 'on' : ''} ${own ? '' : 'lock'}">${S.name}${own ? '' : ` <small>🪙${S.cost}</small>`}</button>`; }).join('');
  $('skinSeg').onclick = e => {
    const b = e.target.closest('button'); if (!b) return; const i = +b.dataset.v; sfx('click');
    if (!skinOwned(hk, i)) {
      if (PROG.coins < SKINS[i].cost) { toast(`金币不够：还差 ${SKINS[i].cost - PROG.coins} 🪙（打比赛、做任务能赚）`); return; }
      if (b.dataset.arm !== '1') { b.dataset.arm = '1'; b.innerHTML = `确认购买 🪙${SKINS[i].cost}`; return; }
      buySkin(hk, i); toast(`解锁了 ${H.name}·${SKINS[i].name}！`); sfx('win');
      const ach = ACH.find(a => a.k === 'skin'); if (ach && !PROG.ach.skin) { PROG.ach.skin = Date.now(); PROG.coins += ach.r; saveProg(); toast(`🏅 达成成就「${ach.t}」 🪙+${ach.r}`, 2600); }
    }
    SEL.skin[hk] = i; saveSel(); refreshMenu(); heroChanged();
  };
  // modes
  const online = SEL.online && !inArtifact(), allowed = k => !online || ONLINE_MODES.includes(k);
  if (!allowed(SEL.mode)) SEL.mode = 'duo';
  $('modeGrid').innerHTML = Object.entries(MODES).map(([k, m]) => `<button data-v="${k}" class="mcard ${k === SEL.mode ? 'on' : ''}" ${allowed(k) ? '' : 'disabled'}><i>${m.icon}</i><b>${m.name}</b></button>`).join('');
  $('modeGrid').onclick = e => { const b = e.target.closest('button'); if (!b || b.disabled) return; sfx('click'); if (NET.role === 'guest') { toast('由房主选择模式'); return; } SEL.mode = b.dataset.v; saveSel(); refreshMenu(); broadcastLobby(); };
  $('modeDesc').textContent = MODES[SEL.mode].desc;
  const seg = (id, items, cur, cb) => { $(id).innerHTML = items.map(([v, t, dis]) => `<button data-v="${v}" class="${v === cur ? 'on' : ''}" ${dis ? 'disabled' : ''}>${t}</button>`).join(''); $(id).onclick = e => { const b = e.target.closest('button'); if (!b || b.disabled) return; sfx('click'); cb(b.dataset.v); }; };
  seg('playSeg', [['local', '本机 + AI'], ['online', '联机（2–6 人）']], SEL.online ? 'online' : 'local', v => { SEL.online = v === 'online'; if (SEL.online && SEL.mode === 'train') SEL.mode = 'duo'; if (!SEL.online && NET.role) netLeave(); saveSel(); refreshMenu(); });
  seg('mapSeg', [...Object.entries(THEMES).map(([k, t]) => [k, themeUnlocked(k) ? t.name : `🔒${t.name}（${t.locked}🏆）`, !themeUnlocked(k)]), ['random', '随机']], SEL.map, v => { SEL.map = v; saveSel(); refreshMenu(); });
  seg('diffSeg', DIFF.map((d, i) => [String(i), d.name]), String(SEL.diff), v => { SEL.diff = +v; saveSel(); refreshMenu(); });
  $('diffNote').textContent = SET.autoDiff ? '已开启自动调节：连输 3 局降一档，连胜 3 局升一档' : '';
  $('diffSec').classList.toggle('hidden', SEL.mode === 'train');
  $('mapSec').classList.toggle('hidden', SEL.mode === 'train');
  $('nameIn').value = SEL.name || '';
  $('onlineBox').classList.toggle('hidden', !SEL.online);
  $('vsRow').classList.toggle('hidden', !(SEL.online && VERSUS_MODES.includes(SEL.mode)));
  seg('vsSeg', [['coop', '真人同队'], ['vs', '真人对抗']], SEL.versus ? 'vs' : 'coop', v => { SEL.versus = v === 'vs'; saveSel(); refreshMenu(); broadcastLobby(); });
  lobbyUI();
  $('keysHelp').innerHTML = IS_TOUCH ? '左半屏拖动移动 · 右下摇杆拖动瞄准、松手攻击（轻点自动瞄准）· 黄色摇杆放大招 · 绿色按钮副技能（设置里可换左手、调摇杆大小）' :
    '<kbd>WASD</kbd> 移动　<kbd>鼠标</kbd> 瞄准　<kbd>左键</kbd> 攻击　<kbd>E</kbd>/<kbd>右键</kbd> 大招　<kbd>Q</kbd> 副技能<br><kbd>空格</kbd> 自动瞄准　<kbd>T</kbd> 标记　<kbd>V</kbd> 队友跟随/自由　<kbd>1</kbd>-<kbd>6</kbd> 表情　<kbd>Esc</kbd> 暂停　大厅 <kbd>←→</kbd> 选英雄 <kbd>Enter</kbd> 开战';
  if (R3.show) setShowHero(SEL.hero, sk);
}
function lobbyUI(msg) {
  const st = $('netStatus'), start = $('startBtn');
  if (!SEL.online) { start.disabled = false; start.textContent = SEL.mode === 'train' ? '开始训练' : '开 战 ！'; return; }
  const art = inArtifact();
  $('hostBtn').disabled = art; $('joinBtn').disabled = art;
  let html = '';
  const plist = ps => '<div class="plist">' + ps.map(p => `<span class="${p.host ? 'h' : ''}">${p.host ? '👑' : '🎮'} ${esc(p.name)} · ${HEROES[validHero(p.hero)].name}</span>`).join('') + '</div>';
  if (art) html = '这个预览页面不支持联机（浏览器安全策略拦截了 WebRTC）。请用 GitHub Pages 网址打开再联机，或者选「本机 + AI」。';
  else if (NET.role === 'host') {
    const n = [...NET.guests.values()].filter(g => g.hello).length;
    html = NET.code && NET.peer && NET.peer.open ? `房间码 <b>${NET.code}</b>　${n + 1}/6 人<br>` : '正在创建房间…<br>';
    html += plist(lobbyPlayers()) + (n ? '人齐了就点「开战」，空位由 AI 补上' : '把房间码发给朋友，等 TA 加入…');
  } else if (NET.role === 'guest') {
    if (connected()) { const L = NET.lobby; html = `已加入房间 <b>${NET.code}</b><br>` + (L ? plist(L.players) + `模式：${MODES[L.mode] ? MODES[L.mode].name : ''}${L.versus && VERSUS_MODES.includes(L.mode) ? '（真人对抗）' : ''}　` : '') + '等待房主开始…'; }
    else html = '正在连接…';
  } else html = '一人创建房间，把 4 位房间码发给朋友；最多 6 人。空位由 AI 补上，团队模式可选真人同队或对抗。';
  if (msg) html = esc(msg) + (html ? '<br>' + html : '');
  st.innerHTML = html;
  start.disabled = !(NET.role === 'host' && connected());
  start.textContent = NET.role === 'guest' ? '等待房主…' : '开 战 ！';
}
function menuKey(k) {
  if (!$('setModal').classList.contains('hidden') || !$('questModal').classList.contains('hidden')) { if (k === 'Escape') closeModals(); return; }
  const n = PLAYABLE.length, idx = PLAYABLE.indexOf(SEL.hero);
  const go = d => { SEL.hero = PLAYABLE[(idx + d + n) % n]; saveSel(); refreshMenu(); heroChanged(); sfx('click'); };
  if (k === 'ArrowLeft' || k === 'ArrowRight') go(k === 'ArrowRight' ? 1 : -1);
  else if (k === 'ArrowUp' || k === 'ArrowDown') go(k === 'ArrowDown' ? 4 : -4);
  else if (k === 'Enter') $('startBtn').click();
}
function heroChanged() {
  if (NET.role === 'guest' && connected()) netSend({ t: 'hero', hero: SEL.hero, sp: curSp(), skin: curSkin() });
  if (NET.role === 'host') broadcastLobby();
  lobbyUI();
}

/* ---------- quests / achievements / settings modals ---------- */
function closeModals() { $('setModal').classList.add('hidden'); $('questModal').classList.add('hidden'); }
function openQuests() {
  const qs = dailyQuests();
  $('qList').innerHTML = qs.map(q => `<div class="q ${q.done ? 'done' : ''}"><span>${q.done ? '✅' : '📜'} ${q.t}</span><div class="bar"><i style="width:${Math.round(q.p / q.n * 100)}%"></i></div><span>${Math.min(q.p, q.n)}/${q.n}　🪙${q.r}</span></div>`).join('') + '<div class="note">每天 0 点刷新 3 个任务</div>';
  $('aList').innerHTML = ACH.map(a => `<div class="a ${PROG.ach[a.k] ? 'done' : ''}"><b>${PROG.ach[a.k] ? '🏅' : '🔒'} ${a.t}</b><small>${a.d}　🪙${a.r}</small></div>`).join('');
  const L = PROG.life;
  $('lifeStats').textContent = `生涯：${L.games} 局 · ${L.wins} 胜 · 击败 ${L.kills} · 伤害 ${Math.round(L.dmg)} · 开箱 ${L.boxes}`;
  $('questModal').classList.remove('hidden');
}
const SETTINGS = [
  ['cb', '色盲友好配色', 'bool', '队友蓝 / 敌人橙，替换红绿'], ['shake', '屏幕震动', 'bool'], ['nums', '伤害数字', 'bool'],
  ['autoDiff', '自动调节 AI 难度', 'bool', '连输 3 局降一档，连胜 3 局升一档'],
  ['quality', '画质', [['auto', '自动'], ['high', '高'], ['low', '流畅']], '刷新页面后生效'],
  ['stick', '摇杆大小', [[0.85, '小'], [1, '中'], [1.2, '大']]], ['hand', '操作手', [['right', '右手攻击'], ['left', '左手攻击']], '触屏：攻击摇杆放在哪一侧'],
  ['vol', '音量', 'range'],
];
function openSettings() {
  $('setList').innerHTML = SETTINGS.map(([k, t, type, note]) => {
    let ctl;
    if (type === 'bool') ctl = `<div class="seg" data-k="${k}"><button data-v="1" class="${SET[k] ? 'on' : ''}">开</button><button data-v="0" class="${SET[k] ? '' : 'on'}">关</button></div>`;
    else if (type === 'range') ctl = `<input type="range" min="0" max="1" step="0.05" value="${SET[k]}" data-k="${k}">`;
    else ctl = `<div class="seg" data-k="${k}">${type.map(([v, l]) => `<button data-v="${v}" class="${String(SET[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    return `<div class="srow"><label>${t}${note ? `<small>${note}</small>` : ''}</label>${ctl}</div>`;
  }).join('');
  $('setModal').classList.remove('hidden');
}
function applySettings() {
  const B = document.body.classList;
  B.toggle('lefty', SET.hand === 'left'); B.toggle('cb', !!SET.cb);
  document.documentElement.style.setProperty('--stk', SET.stick);
  if (AU.master && !AU.muted) AU.master.gain.value = SET.vol;
}
function initModals() {
  $('setList').addEventListener('click', e => {
    const b = e.target.closest('button'), s = b && b.closest('.seg'); if (!s) return; sfx('click');
    const k = s.dataset.k, def = SETTINGS.find(x => x[0] === k), v = b.dataset.v;
    SET[k] = def[2] === 'bool' ? v === '1' : typeof SET[k] === 'number' ? +v : v;
    saveSet(); applySettings(); openSettings(); refreshMenu();
  });
  $('setList').addEventListener('input', e => { const k = e.target.dataset.k; if (!k) return; SET[k] = +e.target.value; saveSet(); applySettings(); });
  $('setClose').onclick = () => { sfx('click'); closeModals(); };
  $('qClose').onclick = () => { sfx('click'); closeModals(); };
  for (const id of ['setModal', 'questModal']) $(id).addEventListener('click', e => { if (e.target.id === id) closeModals(); });
}
function initMenu() {
  $('heroGrid').addEventListener('click', e => { const c = e.target.closest('.hcard'); if (!c) return; audioInit(); sfx('click'); SEL.hero = +c.dataset.i; saveSel(); refreshMenu(); heroChanged(); });
  $('nameIn').addEventListener('input', e => { SEL.name = e.target.value; saveSel(); });
  $('nameIn').addEventListener('change', () => { if (NET.role === 'guest' && connected()) netSend({ t: 'hero', name: myName(), hero: SEL.hero, sp: curSp(), skin: curSkin() }); if (NET.role === 'host') broadcastLobby(); });
  $('startBtn').onclick = () => {
    audioInit(); sfx('click');
    if (SEL.online && !inArtifact()) { if (NET.role === 'host' && connected()) hostStartOnline(); else if (!NET.role) toast('先创建或加入一个房间'); return; }
    startLocal(SEL.mode);
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
    startLocal(STATE.cfg.mode);
  };
  $('rWatch').onclick = () => hideResultWatch();
  if (/\/dunerumble\/(index\.html)?$/.test(location.pathname)) { $('hubBtn').classList.remove('hidden'); $('pHub').classList.remove('hidden'); }
  $('hubBtn').onclick = () => { if (NET.role) netLeave(); location.href = '../'; };
  $('pHub').onclick = () => {
    const b = $('pHub');
    if (!b.dataset.arm) { b.dataset.arm = '1'; b.textContent = '再点一次：放弃本局并返回'; clearTimeout(b._t); b._t = setTimeout(() => { delete b.dataset.arm; b.textContent = '返回游戏厅'; }, 2500); return; }
    if (NET.role) netLeave(); location.href = '../';
  };
  $('rMenu').onclick = () => { if (NET.role === 'guest') netLeave(); quitToMenu(); };
  $('emoPanel').innerHTML = Object.entries(EMOTES).map(([k, v], i) => `<button data-e="${k}">${v}<small>${i + 1}</small></button>`).join('');
  initModals();
}

/* ---------- HUD ---------- */
const MINI = { img: null, t: 0 };
function drawMini(me) {
  const cv = $('mini'), g = cv.getContext('2d'), N = M.N, W = cv.width, s = W / N;
  if (!MINI.img || MINI.ver !== M.ver) {
    const c = document.createElement('canvas'); c.width = c.height = W; const q = c.getContext('2d'), th = THEMES[M.theme];
    q.fillStyle = hex(th.g1); q.fillRect(0, 0, W, W);
    for (let i = 0; i < N * N; i++) { const t = M.t[i]; if (t === T_FLOOR) continue; q.fillStyle = t === T_WALL ? hex(M.sty[i] ? th.crate : th.rock) : t === T_BUSH ? hex(th.bush[0]) : t === T_WATER ? hex(th.water) : hex(th.border); q.fillRect((i % N) * s, ((i / N) | 0) * s, s + 0.5, s + 0.5); }
    for (const p of M.pads || []) { q.fillStyle = '#52f5ff'; q.fillRect(p.x * s - 3, p.z * s - 3, 6, 6); }
    for (const P of M.ports || []) for (const e of [P.a, P.b]) { q.fillStyle = '#c77dff'; q.beginPath(); q.arc(e.x * s, e.z * s, 4, 0, TAU); q.fill(); }
    for (const sp of M.springs || []) { q.fillStyle = 'rgba(109,255,176,.7)'; q.beginPath(); q.arc(sp.x * s, sp.z * s, sp.r * s, 0, TAU); q.fill(); }
    MINI.img = c; MINI.ver = M.ver;
  }
  g.clearRect(0, 0, W, W); g.drawImage(MINI.img, 0, 0);
  for (const b of M.boxes) if (b.hp > 0) { g.fillStyle = b.drop ? '#ffd23f' : '#3ee070'; g.fillRect(b.tx * s, b.tz * s, s, s); }
  const md = viewMD(), mt = myTeam();
  if (md.showdown) {
    const R = viewGasR(), h = N / 2; g.fillStyle = 'rgba(70,200,60,.45)';
    const a = Math.max(0, (h - R) * s), b2 = Math.min(W, (h + R) * s); g.fillRect(0, 0, W, a); g.fillRect(0, b2, W, W - b2); g.fillRect(0, a, a, b2 - a); g.fillRect(b2, a, W - b2, b2 - a);
  }
  const ms = viewMS();
  if (ms && ms.ball) { g.fillStyle = '#fff'; g.strokeStyle = '#22141f'; g.lineWidth = 2; g.beginPath(); g.arc(ms.ball.x * s, ms.ball.z * s, 4.5, 0, TAU); g.fill(); g.stroke(); }
  if (ms && ms.gems) for (const gm of ms.gems) { g.fillStyle = '#c77dff'; g.fillRect(gm.x * s - 2, gm.z * s - 2, 4, 4); }
  for (const w of viewWarns()) { g.strokeStyle = w.k === 'drop' ? '#6dff8f' : '#ff4040'; g.lineWidth = 2; g.beginPath(); g.arc(w.x * s, w.z * s, Math.max(4, w.r * s), 0, TAU); g.stroke(); }
  const C = { me: SET.cb ? '#ffffff' : '#4fe36f', ally: teamCss('ally'), foe: teamCss('foe') };
  for (const e of viewBrawlers()) {
    if (!e.alive || e.vis === false) continue;
    const isMe = me && e.id === me.id; g.fillStyle = isMe ? C.me : e.team === mt ? C.ally : C.foe;
    const r = e.H.k === 'boss' ? 8 : isMe ? 5.5 : 4.5;
    g.beginPath(); g.arc(e.x * s, e.z * s, r, 0, TAU); g.fill(); g.strokeStyle = '#22141f'; g.lineWidth = 2; g.stroke();
  }
  for (const P of SOC.pings) { g.strokeStyle = '#ffd23f'; g.lineWidth = 2.5; g.beginPath(); g.arc(P.x * s, P.z * s, 7, 0, TAU); g.stroke(); }
}
let hudT = 0;
function updateHUD(dt) {
  const me = meEnt(); if (!me) return;
  hudT += dt; const t = viewT(), mode = viewMode(), md = viewMD(), mt = myTeam(), ms = viewMS();
  STATE.run.maxGems = Math.max(STATE.run.maxGems, me.gems || 0); STATE.run.maxBounty = Math.max(STATE.run.maxBounty, mode === 'bounty' ? me.bounty || 0 : 0);
  if (hudT > 0.1) {
    hudT = 0;
    if (md.showdown) {
      $('hAlive').innerHTML = (mode === 'duo' ? '剩余队伍' : '剩余') + `<span class="n">${viewAliveTeams()}</span>`;
      const gs = $('hGas');
      if (t < BAL.gasStart) { gs.textContent = `☁ 毒雾 ${Math.ceil(BAL.gasStart - t)} 秒后蔓延`; gs.classList.remove('warn'); }
      else { gs.textContent = '☠ 毒雾正在收缩！'; gs.classList.toggle('warn', t - BAL.gasStart < 5 || inGas(me.x, me.z, viewGasR())); }
    } else if (ms) {
      $('hAlive').innerHTML = mode === 'train' ? `训练<span class="n">${Math.min(ms.step || 0, TRAIN_STEPS.length)}/${TRAIN_STEPS.length}</span>` : `⏱<span class="n">${fmtT(ms.tl || 0)}</span>`;
      if (ms.sc && (mode === 'gem' || mode === 'ball' || mode === 'bounty')) {
        const ic = mode === 'gem' ? '💎' : mode === 'ball' ? '⚽' : '★', a = ms.sc[mt] || 0, b = ms.sc[1 - mt] || 0;
        let sub = '';
        if (mode === 'gem') sub = ms.cd ? `<small class="${ms.cd.team === mt ? 'a' : 'x'}">${ms.cd.team === mt ? '守住' : '夺回'} ${Math.ceil(ms.cd.t)}</small>` : '<small>先到 10 颗并守 15 秒</small>';
        else if (mode === 'ball') sub = ms.resetT > 0 ? `<small>开球 ${Math.ceil(ms.resetT)}</small>` : '<small>先进 2 球获胜</small>';
        else sub = '<small>击杀拿对方头顶的星</small>';
        $('hScore').innerHTML = `<b class="a">${a}</b><i>${ic}</i><b class="x">${b}</b>${sub}`;
      }
      if (mode === 'boss') {
        const boss = viewEnt(ms.bossId);
        if (boss) { $('hBoss').querySelector('i').style.width = clamp(boss.hp / boss.mhp, 0, 1) * 100 + '%'; $('hBoss').querySelector('.nm').textContent = `钢铁巨像${ms.phase === 2 ? ' · 暴怒' : ''}　${Math.ceil(boss.hp)}`; $('hBoss').classList.toggle('rage', ms.phase === 2); }
      }
      if (mode === 'train') {
        const S = TRAIN_STEPS[ms.step];
        $('hTrain').innerHTML = S ? `<b>${ms.step + 1}. ${S.t}</b><small>${IS_TOUCH ? S.d.split('／').pop() : S.d.split('／')[0]}</small>` : '<b>全部完成！</b>';
      }
    }
    drawMini(me);
    const spec = $('spec');
    if (!me.alive && STATE.mode !== 'menu') {
      const rs = isGuest() ? me.respawnIn : (me.respawnT ? me.respawnT - G.t : 0);
      spec.classList.remove('hidden');
      const k = viewEnt(STATE.killer), kc = STATE.killcam && performance.now() - STATE.killcam.t < 3000;
      const kname = k && k !== me ? `被 <span style="color:#ff8a8a">${esc(k.name)}</span>（${k.H.name}${k.alive ? ' · 剩 ' + Math.ceil(k.hp) + ' 血' : ''}）击败` : '';
      spec.innerHTML = rs > 0 ? `${kname ? kname + '<br>' : ''}复活倒计时 <b style="font-family:var(--num);font-size:30px;color:var(--y1)">${Math.ceil(rs)}</b>${md.showdown ? '<br><small>队友活着你就能复活</small>' : ''}` : `${kname || '你被淘汰了'}${kc ? '' : ' · 观战中'}`;
    } else spec.classList.add('hidden');
  }
  const f = clamp(me.sup, 0, 1);
  $('superBtn').querySelector('.fill').style.height = (f * 100) + '%'; $('superBtn').classList.toggle('ready', f >= 1 && me.alive);
  $('supStick').querySelector('.sfill').style.height = (f * 100) + '%'; $('supStick').classList.toggle('ready', f >= 1 && me.alive);
  // gadget
  const gl = me.gadLeft == null ? GADGET_USES : me.gadLeft, gcd = me.gadCd || 0, gReady = gl > 0 && gcd <= 0 && me.alive;
  const pips = '●'.repeat(gl) + '○'.repeat(Math.max(0, GADGET_USES - gl));
  $('gadPill').innerHTML = `<kbd>Q</kbd> ${GADGETS[me.H.gad].name} <span>${gcd > 0 && gl > 0 ? Math.ceil(gcd) + 's' : pips}</span>`; $('gadPill').classList.toggle('ready', gReady);
  $('gadBtn').innerHTML = `<span>${gcd > 0 && gl > 0 ? Math.ceil(gcd) : '⚡'}</span><small>${pips}</small>`; $('gadBtn').classList.toggle('ready', gReady); $('gadBtn').classList.toggle('empty', gl <= 0);
  $('gasVig').style.opacity = md.showdown && me.alive && inGas(me.x, me.z, viewGasR()) ? 0.85 : 0;
  $('hurtVig').style.opacity = me.alive && performance.now() - STATE.lastHurt < 250 ? 0.6 : (me.alive && me.hp / me.mhp < 0.3 ? 0.35 : 0);
}

/* ---------- spectate target (kill cam first, then teammate, killer, anyone) ---------- */
function camFocus() {
  const me = meEnt(); if (!me) return null;
  if (me.alive) return me;
  const k = viewEnt(STATE.killer);
  if (STATE.killcam && performance.now() - STATE.killcam.t < 2600 && k && k.alive) return k;
  const mate = viewBrawlers().find(b => b !== me && b.team === me.team && b.alive && b.H.k !== 'dummy');
  if (mate) return mate;
  if (!viewMD().showdown) return me.spawn || me;
  if (k && k.alive) return k;
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
  if (STATE.mode === 'menu') { if (!(window.__dbg && window.__dbg.skipDraw)) renderShowcase(dt, now); OV.ctx.clearRect(0, 0, OV.cv.width, OV.cv.height); return; }
  const me = meEnt();
  let show = null;
  if (isGuest()) { guestLocal(dt); }
  else if (G && !simPaused()) {
    if (me && me.alive && STATE.mode === 'play' && !STATE.watching) show = readInput(me);
    else if (me) { me.inp.mx = me.inp.mz = 0; me.inp.fire = me.inp.sup = me.inp.gad = false; }
    // hit-stop on crits / kills and slow-motion kill cam (offline only)
    let simDt = dt * (window.__dbg && window.__dbg.speed || 1);
    if (STATE.hitstop > 0) { STATE.hitstop -= dt; simDt = 0; }
    else if (performance.now() < STATE.slowUntil) simDt *= 0.35;
    STATE.acc += simDt;
    let n = 0; while (STATE.acc >= STEP && n < 8) { stepGame(STEP); STATE.acc -= STEP; n++; }
    if (n >= 8) STATE.acc = 0;
    if (NET.role === 'host') netHostTick(dt);
    for (const b of G.ents) b.vis = visibleTo(b, myTeam());
    if (me && me.alive) showAim(me, show && show.mode, show && show.ang, show && show.tx, show && show.tz, show ? show.strength : 0); else showAim(null);
    if (G.ms && G.ms.k === 'train' && G.ms.step === 0 && Math.random() < dt * 2.5) ring(G.ms.mark.x, G.ms.mark.z, 1, 0xffd23f, 0.7);
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
  initRenderer(); initInput(); initMenu(); applySettings();
  try { makePortraits(); } catch (e) { console.warn(e); }
  if (IS_TOUCH) document.body.classList.add('touch');
  buildShowcase(); refreshMenu();
  $('loading').remove();
  if (!PROG.life.games) setTimeout(() => toast('第一次玩？先选「训练场」熟悉操作吧', 3500), 800);
  requestAnimationFrame(frame);
}
