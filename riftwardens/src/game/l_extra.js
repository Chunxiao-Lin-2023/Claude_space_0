/* =================== round 3: content & systems =================== */
/* ---------- alternate primary weapons (unlocked in the armory, swap by pressing 1 again) ---------- */
const PRIMARY2 = {
  warmage: {name: '霰弹弩', rate: 1.4, dmg: 16, speed: 900, kind: 'bolt', life: 0.42, n: 5, spread: 0.42},
  sorc: {name: '闪电链', rate: 1.6, dmg: 30, kind: 'chain', range: 380, jumps: 3, jr: 160},
  paladin: {name: '长枪突刺', rate: 1.5, dmg: 44, kind: 'melee', range: 112, arc: 0.4, push: 220},
  ranger: {name: '双发短弓', rate: 3.4, dmg: 17, speed: 1000, kind: 'parrow', life: 0.55, n: 2, spread: 0.07},
  alch: {name: '火焰瓶', rate: 1.6, dmg: 18, speed: 520, kind: 'flask', r: 64, max: 420, burn: 30},
  blade: {name: '野太刀', rate: 1.9, dmg: 40, kind: 'melee', range: 86, arc: 1.5, push: 170},
};
for (const k in PRIMARY2) HEROES[k].primary2 = PRIMARY2[k];
const primOf = p => (p.wpn && HEROES[p.hero].primary2) ? HEROES[p.hero].primary2 : HEROES[p.hero].primary;
/* ---------- trinkets (2 slots, unlocked with skulls) ---------- */
const TRINKETS = {
  vamp: {name: '吸血护符', desc: '普攻命中回复伤害 3% 的生命'},
  mana: {name: '法力之泉', desc: '法力回复 +40%'},
  boots: {name: '迅捷之靴', desc: '移动速度 +12%'},
  glove: {name: '工匠手套', desc: '陷阱造价 -10%'},
  heart: {name: '守护之心', desc: '最大生命 +25%'},
  rage: {name: '狂战徽记', desc: '生命低于一半时伤害 +25%'},
  purse: {name: '金币袋', desc: '自己击杀的兽人金币 +15%'},
  glass: {name: '冷却沙漏', desc: '技能冷却 -18%'},
};
/* ---------- level-up perks during a level ---------- */
const PERKS = {
  pdmg: {name: '锋锐', desc: '伤害 +15%'}, prate: {name: '迅捷', desc: '攻击速度 +15%'}, php: {name: '坚韧', desc: '最大生命 +20% 并回满'},
  pmp: {name: '冥想', desc: '法力回复 +30%'}, pcd: {name: '专注', desc: '技能冷却 -15%'}, pspd: {name: '疾行', desc: '移动速度 +8%'},
  pgold: {name: '贪婪', desc: '击杀金币 +10%'}, pmag: {name: '魔力', desc: '最大法力 +25'},
};
const XP_LV = [0, 90, 240, 460, 760, 1150]; // xp needed for level 1..6
function calcMods(p) {
  const m = {dmg: 1, rate: 1, hp: 1, regen: 1, cdr: 1, spd: 1, gold: 1, mp: 0, vamp: 0, rage: 0, disc: 0};
  for (const t of (p.trinkets || [])) switch (t) {
    case 'vamp': m.vamp += 0.03; break; case 'mana': m.regen *= 1.4; break; case 'boots': m.spd *= 1.12; break; case 'glove': m.disc += 0.1; break;
    case 'heart': m.hp *= 1.25; break; case 'rage': m.rage = 0.25; break; case 'purse': m.gold *= 1.15; break; case 'glass': m.cdr *= 0.82; break;
  }
  for (const [k, n] of Object.entries(p.perks || {})) for (let i = 0; i < n; i++) switch (k) {
    case 'pdmg': m.dmg *= 1.15; break; case 'prate': m.rate *= 1.15; break; case 'php': m.hp *= 1.2; break; case 'pmp': m.regen *= 1.3; break;
    case 'pcd': m.cdr *= 0.85; break; case 'pspd': m.spd *= 1.08; break; case 'pgold': m.gold *= 1.1; break; case 'pmag': m.mp += 25; break;
  }
  return m;
}
function applyMods(p) {
  const H = HEROES[p.hero], m = p.mods = calcMods(p);
  const f = p.mhp ? p.hp / p.mhp : 1; p.mhp = Math.round(H.hp * m.hp); p.hp = Math.min(p.mhp, p.mhp * f);
  p.mmp = H.mp + m.mp; p.mp = Math.min(p.mp, p.mmp);
}
function giveXp(i, n) {
  const p = P[i]; if (!p || G.demo) return;
  p.xp = (p.xp || 0) + n;
  while ((p.lvl || 1) < XP_LV.length && p.xp >= XP_LV[p.lvl || 1]) {
    p.lvl = (p.lvl || 1) + 1;
    const pool = Object.keys(PERKS).filter(k => ((p.perks || {})[k] || 0) < 3);
    for (let k = pool.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [pool[k], pool[j]] = [pool[j], pool[k]]; }
    (p.pick = p.pick || []).push(pool.slice(0, 3));
    ev('lvlup', {p: i, l: p.lvl});
  }
}
function takePerk(p, id) {
  if (!p.pick || !p.pick.length || !p.pick[0].includes(id)) return '';
  p.pick.shift(); p.perks = p.perks || {}; p.perks[id] = (p.perks[id] || 0) + 1; applyMods(p);
  if (id === 'php') p.hp = p.mhp;
  ev('perk', {p: p.i, id}); return '';
}
/* ---------- level challenges (+1 skull each, once) ---------- */
const CHALLENGES = {
  m1: [{id: 'fall8', name: '深渊收割', desc: '让 8 个兽人坠入深渊', ok: s => s.falls >= 8}, {id: 'nobar', name: '不设路障', desc: '不放置任何路障通关', ok: s => !s.bars}],
  m2: [{id: 'lava15', name: '熔岩浴', desc: '让 15 个兽人坠入熔岩', ok: s => s.falls >= 15}, {id: 'nodie', name: '无伤守护', desc: '英雄全程不阵亡', ok: s => !s.deaths}],
  m3: [{id: 'three', name: '三板斧', desc: '只用不超过 3 种陷阱通关', ok: s => (s.kinds || []).length <= 3}, {id: 'combo15', name: '连锁反应', desc: '触发 15 次陷阱连携', ok: s => (s.combos || 0) >= 15}],
  m4: [{id: 'lean', name: '精兵简政', desc: '布置不超过 15 个陷阱通关', ok: s => (s.built || 0) <= 15}, {id: 'streak20', name: '连杀狂', desc: '达成 20 连杀', ok: s => (s.best || 0) >= 20}],
};
function chalDone(lid, cid) { return !!(SAVE.chal && SAVE.chal[lid + '.' + cid]); }
/* ---------- endless & daily ---------- */
const DAILY_MODS = {
  fast: {name: '急行军', desc: '兽人移动速度 +25%'},
  poor: {name: '紧缩财政', desc: '初始金币 -40%，击杀金币 +50%'},
  glass: {name: '玻璃大炮', desc: '兽人血量 -30%，英雄生命 -40%'},
  nobar: {name: '禁用路障', desc: '本局不能放置路障'},
  tri: {name: '三件套', desc: '只能使用指定的 3 种陷阱'},
  swarm: {name: '兽潮', desc: '兽人数量 +50%，血量 -25%'},
};
function todayKey() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
function dailySpec(key = todayKey()) {
  const r = mulberry(key * 7919 + 13); const li = Math.floor(r() * LEVELS.length); const mods = Object.keys(DAILY_MODS); const mod = mods[Math.floor(r() * mods.length)];
  const hero = Object.keys(HEROES)[Math.floor(r() * 6)];
  const pool = ['spikes', 'tar', 'arrow', 'spring', 'brim', 'frost', 'barricade', 'grinder']; const tri = []; while (tri.length < 3) { const k = pool[Math.floor(r() * pool.length)]; if (!tri.includes(k)) tri.push(k); }
  return {key, li, mod, hero, tri};
}
function genWave(w, gates) { // endless wave w (0-based)
  const r = mulberry((G.seed || 1) * 31 + w * 977);
  const budget = 70 + w * 48 + w * w * 2.2;
  const pool = [['grunt', 10, 0], ['kobold', 6, 1], ['archer', 12, 2], ['shield', 16, 3], ['bat', 11, 4], ['sapper', 12, 5], ['shaman', 22, 6], ['ogre', 55, 6]];
  const avail = pool.filter(p => w >= p[2]);
  const groups = []; let b = budget, t = 0;
  while (b > 6) { const [type, c] = avail[Math.floor(r() * avail.length)]; const n = Math.max(1, Math.min(Math.floor(b / c), Math.floor(2 + r() * 8))); groups.push([Math.floor(r() * gates), type, n, t, Math.max(0.4, 1.3 - w * 0.03)]); b -= n * c; t += 2 + r() * 5; }
  if ((w + 1) % 10 === 0) groups.push([0, 'chief', 1, 4, 0]);
  return groups;
}
function waveDef(i) { if (G.mode === 'endless') return genWave(i, G.map.gates.length); return LEVELS[G.li].waves[i]; }
/* ---------- map hazards ---------- */
function setupHazards() {
  G.hz = {t: 14};
  if (G.map.id === 'm2') { G.hz.lava = []; for (let y = 0; y < G.map.h; y++) for (let x = 0; x < G.map.w; x++) if (tAt(x, y) === TL && [[0, 1], [0, -1]].some(([dx, dy]) => tAt(x + dx, y + dy) === TF)) G.hz.lava.push([x, y]); }
}
function updHazards(dt) {
  const H = G.hz; if (!H || G.phase !== 'wave') return;
  if (H.lava && H.lava.length) {
    H.t -= dt;
    if (H.t <= 0 && !H.pend) { const [x, y] = H.lava[Math.floor(Math.random() * H.lava.length)]; H.pend = {x: tc(x), y: tc(y), t: 1.3}; H.t = 12 + Math.random() * 8; ev('erupt0', {x: tc(x), y: tc(y)}); }
    if (H.pend) { H.pend.t -= dt; if (H.pend.t <= 0) { const {x, y} = H.pend; H.pend = null; ev('erupt', {x, y});
      for (const e of G.enemies) if (alive(e) && !ORCS[e.type].fly && dist2(e.x, e.y, x, y) < 95 * 95) { hurtEnemy(e, 70, {trap: 'lava'}); if (alive(e)) { const a = Math.atan2(e.y - y, e.x - x); pushImpulse(e, Math.cos(a), Math.sin(a), 380); e.burn = 3; e.burnDps = 20; } }
      for (const p of P) if (p && !p.dead && dist2(p.x, p.y, x, y) < 95 * 95) { hurtPlayer(p, 30); knockPlayer(p, Math.atan2(p.y - y, p.x - x), 320); } } }
  }
  if (G.map.doors && G.map.doors.length && !G.doorOpen && G.wave >= 4) openDoors();
}
function openDoors() {
  G.doorOpen = true; for (const d of G.map.doors) G.map.t[tIdx(d.x, d.y)] = TF;
  refreshFlow(); prerenderMap(); ev('doors', {});
}
/* ---------- guardians & pendulum (trap-table entries) ---------- */
Object.assign(TRAPS, {
  pendulum: {name: '摆锤陷阱', place: 'floor', cost: 650, unlock: 3, spr: null, proc: 'pendulum', desc: '沉重摆锤周期横扫三格，把敌人砸飞。R 旋转方向。', dmg: [90, 120, 160], cd: [2.6, 2.2, 1.8], dir: true, tall: true},
  gxbow: {name: '弩手守卫', place: 'floor', cost: 500, unlock: 2, unit: 'gxbow', desc: '驻守的弩手，自动射击 6 格内的敌人（含飞行），会被兽人攻击。', dmg: [18, 24, 32], rate: [1.2, 1.4, 1.7], hp: [260, 340, 440], range: 6, guard: true},
  gknight: {name: '骑士守卫', place: 'floor', cost: 450, unlock: 2, unit: 'gknight', desc: '持盾骑士，挡住道路并砍杀相邻的敌人。', dmg: [30, 40, 52], cd: [0.9, 0.8, 0.7], hp: [600, 800, 1050], guard: true, tall: true, block: true},
});
TRAPS.barricade.block = true;
TRAP_KEYS.length = 0; TRAP_KEYS.push(...Object.keys(TRAPS));
function updGuardian(tr, D, lv, dt) {
  const cx = tc(tr.tx), cy = tc(tr.ty);
  if (tr.k === 'gxbow') {
    if (tr.cd > 0) return; let best = null, bd = Math.pow(D.range * T, 2);
    for (const e of G.enemies) { if (!alive(e) || e.charm > 0) continue; const d = dist2(e.x, e.y, cx, cy); if (d < bd && los(cx, cy - 30, e.x, e.y - 14)) { bd = d; best = e; } }
    if (!best) return; const ey = best.y - (ORCS[best.type].fly ? 40 : ORCS[best.type].r), a = Math.atan2(ey - (cy - 30), best.x - cx);
    tr.face = dirOf(a); tr.cd = 1 / D.rate[lv]; tr.anim = 0.4;
    G.projs.push({id: G.nid++, k: 'tarrow', x: cx + Math.cos(a) * 20, y: cy - 30 + Math.sin(a) * 20, vx: Math.cos(a) * 820, vy: Math.sin(a) * 820, life: 0.6, dmg: D.dmg[lv], team: 't', r: 6, pierce: 0, hit: []});
    ev('trap', {i: tr.id, s: 'arrow', x: cx, y: cy});
  } else if (tr.k === 'gknight') {
    if (tr.cd > 0) return; let best = null, bd = Math.pow(T * 1.25, 2);
    for (const e of G.enemies) { if (!alive(e) || e.charm > 0 || ORCS[e.type].fly) continue; const d = dist2(e.x, e.y, cx, cy); if (d < bd) { bd = d; best = e; } }
    if (!best) return; const a = Math.atan2(best.y - cy, best.x - cx); tr.face = dirOf(a); tr.cd = D.cd[lv]; tr.anim = 0.5;
    hurtEnemy(best, D.dmg[lv], {trap: 'gknight'}); if (alive(best)) pushImpulse(best, Math.cos(a), Math.sin(a), 140);
  } else if (tr.k === 'pendulum') {
    if (tr.cd > 0) return; const ax = tr.rot % 2 === 0 ? [1, 0] : [0, 1];
    const tiles = [-1, 0, 1].map(k => [tr.tx + ax[0] * k, tr.ty + ax[1] * k]);
    const vs = []; for (const [x, y] of tiles) vs.push(...enemiesOnTile(x, y, false));
    if (!vs.length) return;
    tr.cd = D.cd[lv] * (tr.fast ? 0.8 : 1); tr.anim = 0.6; tr.side = -(tr.side || 1);
    ev('trap', {i: tr.id, s: 'pend', x: cx, y: cy});
    for (const e of vs) { hurtEnemy(e, D.dmg[lv], {trap: 'pendulum'}); if (alive(e)) { const s = tr.side; pushImpulse(e, ax[1] * s * 0.9 + ax[0] * 0.3 * s, ax[0] * s * 0.9 + ax[1] * 0.3 * s, 520); } }
  }
}
function drawGuardian(g, tr, now) {
  const D = TRAPS[tr.k], x = tc(tr.tx), y = tc(tr.ty) + 8;
  shadow(g, x, y, 16, 0.35);
  const A = ATLAS.units[D.unit]; const an = tr.anim > 0 && A && A.anims.attack ? 'attack' : 'idle';
  const fi = an === 'attack' ? clamp(Math.floor((1 - tr.anim / (tr.k === 'gknight' ? 0.5 : 0.4)) * A.anims.attack[1]), 0, A.anims.attack[1] - 1) : 0;
  drawUnit(g, D.unit, an, fi, tr.face == null ? 2 : tr.face, x, y);
  if (tr.hp < tr.mhp) { g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(x - 17, y - 72, 34, 5); g.fillStyle = '#5fd068'; g.fillRect(x - 16, y - 71, 32 * clamp(tr.hp / tr.mhp, 0, 1), 3); }
  trapStars(g, tr, x, y - 20);
}
function drawPendulum(g, tr, now) {
  const x = tc(tr.tx), y = tc(tr.ty), ax = tr.rot % 2 === 0 ? [1, 0] : [0, 1];
  // floor rails
  g.fillStyle = 'rgba(30,24,20,.75)'; if (ax[0]) g.fillRect(x - T * 1.4, y - 5, T * 2.8, 10); else g.fillRect(x - 5, y - T * 1.4, 10, T * 2.8);
  g.fillStyle = '#5a5f68'; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill();
  const ph = tr.anim > 0 ? (1 - tr.anim / 0.6) : 0.5 + 0.03 * Math.sin(now * 2 + tr.id);
  const s = tr.side || 1; const off = (tr.anim > 0 ? Math.cos(ph * Math.PI) * s : (ph - 0.5)) * T * 1.25;
  const hx = x + ax[0] * off, hy = y + ax[1] * off;
  shadow(g, hx, hy + 4, 18, 0.4);
  const top = y - 92;
  g.strokeStyle = '#3a3d44'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, top); g.lineTo(hx, hy - 34); g.stroke();
  g.strokeStyle = '#8a8f99'; g.lineWidth = 1.5; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x, top); g.lineTo(hx, hy - 34); g.stroke(); g.setLineDash([]);
  const gr = g.createLinearGradient(hx - 18, 0, hx + 18, 0); gr.addColorStop(0, '#3c4048'); gr.addColorStop(0.45, '#9aa1ac'); gr.addColorStop(1, '#2c2f36');
  g.fillStyle = gr; rrect(g, hx - 18, hy - 44, 36, 26, 4); g.fill();
  g.fillStyle = '#c8ced6'; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(hx + sx * 18, hy - 40); g.lineTo(hx + sx * 28, hy - 31); g.lineTo(hx + sx * 18, hy - 22); g.fill(); }
  g.fillStyle = '#d9a84a'; g.fillRect(hx - 18, hy - 33, 36, 3);
  if (tr.anim > 0.2) { g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 6; g.beginPath(); g.moveTo(x - ax[0] * T * 1.2, y - 30 - ax[1] * T * 1.2); g.lineTo(x + ax[0] * T * 1.2, y - 30 + ax[1] * T * 1.2); g.stroke(); }
  trapStars(g, tr, x, y);
}
/* ---------- chain lightning (sorceress alt weapon) ---------- */
function chainFire(p, a, Pr, mul) {
  let cur = null, sc = 1e9;
  for (const e of G.enemies) { if (!alive(e) || e.charm > 0) continue; const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy); if (d > Pr.range) continue; const da = Math.abs(angDiff(a, Math.atan2(dy, dx))); if (da > 0.55) continue; const s = d * (1 + da * 2); if (s < sc) { sc = s; cur = e; } }
  const pts = [[Math.round(p.x + Math.cos(a) * 20), Math.round(p.y - 26 + Math.sin(a) * 20)]];
  if (!cur) { pts.push([Math.round(p.x + Math.cos(a) * Pr.range * 0.6), Math.round(p.y - 26 + Math.sin(a) * Pr.range * 0.6)]); ev('chain', {p: p.i, pts}); return; }
  const hit = new Set();
  for (let j = 0; j <= Pr.jumps && cur; j++) {
    hit.add(cur.id); pts.push([Math.round(cur.x), Math.round(cur.y - (ORCS[cur.type].fly ? 40 : 22))]);
    hurtEnemy(cur, Pr.dmg * mul * Math.pow(0.8, j), {p: p.i});
    let nx = null, nd = Pr.jr * Pr.jr; for (const e of G.enemies) { if (!alive(e) || e.charm > 0 || hit.has(e.id)) continue; const d = dist2(e.x, e.y, cur.x, cur.y); if (d < nd) { nd = d; nx = e; } }
    cur = nx;
  }
  ev('chain', {p: p.i, pts});
}
/* ---------- ping & revive ---------- */
const PINGS = [];
function drawPings(g, now) {
  for (let i = PINGS.length - 1; i >= 0; i--) { const q = PINGS[i]; q.t += 1 / 60; if (q.t > 3) { PINGS.splice(i, 1); continue; } const k = (q.t % 0.8) / 0.8; g.strokeStyle = q.mine ? 'rgba(243,210,122,' + (1 - k) + ')' : 'rgba(120,220,255,' + (1 - k) + ')'; g.lineWidth = 3; g.beginPath(); g.ellipse(q.x, q.y, 10 + k * 34, (10 + k * 34) * 0.6, 0, 0, TAU); g.stroke(); g.fillStyle = q.mine ? '#f3d27a' : '#9fe3ff'; g.beginPath(); g.moveTo(q.x, q.y - 4); g.lineTo(q.x - 9, q.y - 30); g.lineTo(q.x + 9, q.y - 30); g.closePath(); g.fill(); }
}
function updRevive(dt) { // host: standing next to a fallen teammate speeds up their respawn
  for (const d of P) { if (!d || !d.dead) continue; for (const a of P) if (a && a !== d && !a.dead && dist2(a.x, a.y, d.x, d.y) < 60 * 60) { d.rt -= dt * 2; d.reviving = 0.2; } }
}
/* ---------- music (synthesized, two moods) ---------- */
const MUS = {on: SAVE.music !== false, gain: null, next: 0, step: 0, mood: 'calm', timer: null};
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
function musicGain() { if (!AU.ctx) return null; if (!MUS.gain) { MUS.gain = AU.ctx.createGain(); MUS.gain.gain.value = MUS.on ? 0.32 : 0; MUS.gain.connect(AU.master); } return MUS.gain; }
function mnote(type, f, t, dur, vol, lp) { const C = AU.ctx, o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); let n = o; if (lp) { const fl = C.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); n = fl; } n.connect(g); g.connect(musicGain()); o.start(t); o.stop(t + dur + 0.05); }
function mdrum(kind, t, vol) { const C = AU.ctx; if (kind === 'k') { const o = C.createOscillator(), g = C.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.18); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); o.connect(g); g.connect(musicGain()); o.start(t); o.stop(t + 0.3); } else { const s = C.createBufferSource(); s.buffer = AU.noise; const f = C.createBiquadFilter(); f.type = kind === 's' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 's' ? 1800 : 7000; const g = C.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 's' ? 0.18 : 0.05)); s.connect(f); f.connect(g); g.connect(musicGain()); s.start(t, Math.random() * 0.5); s.stop(t + 0.2); } }
const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
function musicTick() {
  if (!AU.ctx || !MUS.on || AU.muted) return; musicGain();
  const C = AU.ctx; if (MUS.next < C.currentTime) MUS.next = C.currentTime + 0.05;
  const battle = STATE === 'play' && G && G.phase === 'wave', spb = battle ? 0.15 : 0.32; // seconds per 8th
  while (MUS.next < C.currentTime + 0.4) {
    const t = MUS.next, s = MUS.step++, bar = Math.floor(s / 16) % 4, chord = PROG[bar], b8 = s % 16;
    if (b8 === 0) for (const n of chord) mnote('triangle', NOTE(n - 12), t, spb * 15, battle ? 0.035 : 0.05, 900);
    if (!battle) { if (b8 % 4 === 2) mnote('sine', NOTE(chord[(b8 / 4 | 0) % 3] + 12), t, spb * 3, 0.03); }
    else {
      if (b8 % 4 === 0) mdrum('k', t, 0.5); if (b8 % 8 === 4) mdrum('s', t, 0.18); if (b8 % 2 === 1) mdrum('h', t, 0.06);
      if (b8 % 2 === 0) mnote('sawtooth', NOTE(chord[0] - 24 + (b8 % 8 === 6 ? 7 : 0)), t, spb * 1.6, 0.06, 500);
      if (b8 === 10 || b8 === 14) mnote('square', NOTE(chord[2] + 12), t, spb, 0.018, 2200);
    }
    MUS.next += spb;
  }
}
function setMusic(on) { MUS.on = on; SAVE.music = on; saveGame(); if (MUS.gain) MUS.gain.gain.value = on ? 0.32 : 0; }
setInterval(musicTick, 120);
/* ---------- tutorial (first time in level 1) ---------- */
const TUT = {step: -1, t: 0, x: 0, y: 0, used: false};
const TUT_STEPS = [
  () => IS_TOUCH ? '左半屏按住拖动来移动英雄' : '用 W A S D 移动英雄',
  () => IS_TOUCH ? '点底部陷阱栏的尖刺陷阱，再点地上的发光路线放置' : '按 2 选择尖刺陷阱，在发光的兽人路线上点击放置',
  () => IS_TOUCH ? '点上方「准备开战」开始第一波' : '按 G（或点「准备开战」）开始第一波',
  () => IS_TOUCH ? '右半屏拖动瞄准并自动攻击' : '鼠标瞄准，按住左键攻击',
  () => IS_TOUCH ? '试试右下角的技能按钮' : '试试右键技能和 Q 大招',
  () => '守住裂隙！击杀兽人赚金币，波次之间继续布置和升级陷阱',
];
function tutStart() { if (SAVE.tut || G.li !== 0 || G.mode !== 'campaign' || NET.mode === 'online' && !IS_HOST) return; TUT.step = 0; TUT.x = ME.x; TUT.y = ME.y; TUT.used = false; tutShow(); }
function tutShow() { const el = $('tut'); if (TUT.step < 0) { el.style.display = 'none'; return; } el.style.display = 'block'; el.innerHTML = `<span class="mut">新手引导 ${TUT.step + 1}/${TUT_STEPS.length}</span><br>${TUT_STEPS[TUT.step]()}<button class="btn sec" id="tutSkip">跳过</button>`; $('tutSkip').onclick = () => { TUT.step = -1; SAVE.tut = 1; saveGame(); tutShow(); }; }
function tutTick(dt) {
  if (TUT.step < 0 || !G || !ME) return; let adv = false;
  switch (TUT.step) {
    case 0: adv = dist2(ME.x, ME.y, TUT.x, TUT.y) > 90 * 90; break;
    case 1: adv = viewTraps().length > 0; break;
    case 2: adv = G.phase === 'wave'; break;
    case 3: adv = (G.stats.kills || 0) >= 2; break;
    case 4: adv = TUT.used; break;
    case 5: TUT.t += dt; adv = TUT.t > 7; break;
  }
  if (adv) { TUT.step++; TUT.t = 0; if (TUT.step >= TUT_STEPS.length) { TUT.step = -1; SAVE.tut = 1; saveGame(); } else sfx('ready'); tutShow(); }
}
/* ---------- gamepad ---------- */
const PAD = {prev: [], active: false, ax: 0, ay: 0, rx: 0, ry: 0, fire: false};
function padPoll() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : []; const gp = pads && [...pads].find(p => p && p.connected); if (!gp) { PAD.active = false; return; }
  const dz = v => Math.abs(v) < 0.18 ? 0 : v; const b = gp.buttons.map(x => x.pressed || x.value > 0.5);
  PAD.ax = dz(gp.axes[0] || 0); PAD.ay = dz(gp.axes[1] || 0); PAD.rx = dz(gp.axes[2] || 0); PAD.ry = dz(gp.axes[3] || 0);
  if (b.some(Boolean) || PAD.ax || PAD.ay || PAD.rx || PAD.ry) { PAD.active = true; audioInit(); }
  const pr = i => b[i] && !PAD.prev[i]; PAD.prev = b;
  PAD.fire = !!b[7] || !!b[6] && false;
  if (STATE !== 'play') { if (pr(9) && STATE === 'title') {} return; }
  if (pr(9)) togglePause();
  if (PAUSED) return;
  if (pr(0)) useDash(); if (pr(2)) useAlt(); if (pr(3)) useSkill(); if (pr(8)) toggleReady();
  if (pr(1) && ME && ME.slot > 0) selectSlot(0);
  const n = hotbar().length; if (pr(4)) selectSlot(((ME.slot - 1) % n + n) % n); if (pr(5)) selectSlot((ME.slot + 1) % n);
  if (pr(12)) toggleOverview(); if (pr(13)) undoPlace();
  if (pr(7) && ME && ME.slot > 0) { const t = defaultTouchTile(); if (t) { INP.touchTile = t; tryPlace(tc(t[0]), tc(t[1])); INP.touchTile = null; } }
}
