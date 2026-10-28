/* ================= the two heroes: 小不点 (P1) and the divine-beast partner (P2) ================= */
function makePartnerSpec() { const F = PARTNER_FORMS[PARTY.form]; return F.spec(PARTY.lv); }
function createHeroes(x, z) {
  for (const p of W.P) if (p) rmEnt(p);
  const p1 = mkEnt({ type: 'player', tag: 'xbd', name: '小不点', title: '石村', team: 0, x, z, rot: PI, spec: CHARS.xiaobudian(), r: 0.35, lv: PARTY.lv, spd: BAL.runKid, cull: true, threatK: 1 });
  applyStats(p1); p1.hp = p1.hpMax; p1.mp = p1.mpMax; p1.bar = P1_BAR;
  const p2 = makePartner(x + 1.5, z + 1);
  W.P = [p1, p2]; SPEAKERS['小不点'] = { tag: '@me', col: '#ffe6a0' };
  return [p1, p2];
}
function makePartner(x, z) {
  const F = PARTNER_FORMS[PARTY.form];
  const p2 = mkEnt({ type: 'partner', tag: 'pet', name: PARTY.pname || F.name, title: F.name, team: 0, x, z, rot: PI, spec: makePartnerSpec(), r: 0.35, lv: PARTY.lv, spd: BAL.run, cull: true, threatK: 1.4, ctrl: NETROLE === 'host' ? 'remote' : 'ai' });
  applyStats(p2); p2.hp = p2.hpMax; p2.mp = p2.mpMax;
  const gl = new PLight(F.glow, 14, 5); gl.position.set(0, 0.5, 0); p2.root.add(gl); p2.glowL = gl;
  SPEAKERS[p2.name] = { tag: '@pet', col: '#9ae8ff' }; SPEAKERS['@pet'] = SPEAKERS[p2.name];
  return p2;
}
function evolvePartner(form) {
  const old = W.P[1]; PARTY.form = form; const F = PARTNER_FORMS[form];
  const p2 = makePartner(old ? old.x : 0, old ? old.z : 0); p2.ctrl = old ? old.ctrl : 'ai'; p2.hp = p2.hpMax;
  if (old) { if (old.glowL) old.glowL.removeFromParent(); rmEnt(old); }
  W.P[1] = p2; if (W.me === 1) CAM.tx = p2.x;
  pillarFX(p2.x, p2.y, p2.z, F.glow, 12, 2.2, 1.5); burst(p2.x, p2.y + 1, p2.z, F.glow, 70, 7, 0.6); sfx('evolve');
  banner(`进化 · ${F.name}`, F.desc); hudDirty(); buildHotbar();
  netEv({ k: 'evolve', form }); saveGame();
}
/* ---------- local control ---------- */
function controlLocal(e, dt) {
  if (!e) return;
  if (!e.alive) { e.mvSpd = 0; return; }
  if (W.cine || DLG.open || UI.modal) { e.mvSpd = 0; return; }
  const mv = inputMove(); // camera-relative
  let sp = e.spd * (1 + buffVal(e, 'spdK')); if (e.swim) sp = BAL.swim * 1.4; if (INP.walk) sp *= 0.45;
  if (e.castLock > 0) sp *= 0.25;
  if (e.carry) sp *= 0.7;
  let m = Math.hypot(mv[0], mv[1]);
  if (m > 0.05) { INP.moveTo = null; INP.chase = null; }
  else if (!e.dash && (INP.chase || INP.moveTo)) { // click-to-move / click-to-attack (梦幻西游-style)
    const C = INP.chase; if (C && (!C.alive || C.removed || edist(e, C) > 40)) INP.chase = null;
    if (INP.chase) { const bar = e.type === 'player' ? P1_BAR : partnerBar(), rg = SK[bar[0]].range; const d = edist(e, C) - C.r; if (d > rg * 0.85) { const a = Math.atan2(C.x - e.x, C.z - e.z); mv[0] = Math.sin(a - CAM.yaw); mv[1] = Math.cos(a - CAM.yaw); m = 1; } else { faceTo(e, C.x, C.z); if (canCast(e, bar[0])) castSkill(e, bar[0], C); } }
    else if (INP.moveTo) { const T = INP.moveTo, d = dist(e.x, e.z, T.x, T.z); if (T.ent && T.ent.removed) INP.moveTo = null; else if (d < (T.stop || 0.3)) { INP.moveTo = null; if (T.ent) doInteract(e, T.ent); } else { const a = Math.atan2(T.x - e.x, T.z - e.z); mv[0] = Math.sin(a - CAM.yaw); mv[1] = Math.cos(a - CAM.yaw); m = Math.min(1, d / 0.6 + 0.3); T.stuck = (T.stuck || 0) + ((Math.abs(e.x - (T.lx ?? 1e9)) + Math.abs(e.z - (T.lz ?? 1e9))) < sp * dt * 0.15 ? dt : -T.stuck); T.lx = e.x; T.lz = e.z; if (T.stuck > 0.5) INP.moveTo = null; } }
  }
  if (m > 0.05 && !e.dash) {
    const a = Math.atan2(mv[0], mv[1]) + CAM.yaw; const k = Math.min(1, m);
    if (!e.A.act || e.A.act.k === 'hit') e.rot = angLerp(e.rot, a, Math.min(1, dt * 14));
    moveEnt(e, Math.sin(a) * sp * k * dt, Math.cos(a) * sp * k * dt, dt); e.mvSpd = sp * k; e.moveDir = a;
  } else e.mvSpd = 0;
  if (e.lungeT > 0) { e.lungeT -= dt; const [fx0, fz0] = fwd(e); moveEnt(e, fx0 * e.lunge * dt, fz0 * e.lunge * dt, dt); }
  if (INP.jump) { INP.jump = false; if (e.fly) { } else if (e.onGround || e.swim) { e.vy = BAL.jumpV * (e.type === 'partner' && e.R.kind === 'bird' ? 1.1 : 1); e.onGround = false; e.swim = false; sfx('jump'); } else if (e.canGlide) { e.glide = true; } }
  if (e.glide && !e.onGround) { e.vy = Math.max(e.vy, -2.5); if (!INP.jumpHeld) e.glide = false; } else e.glide = false;
}
function heroTick(e, dt) {
  if (!e) return;
  e.castLock = Math.max(0, (e.castLock || 0) - dt); e.iframe = Math.max(0, (e.iframe || 0) - dt); e.comboT = (e.comboT || 0) - dt;
  for (const k in e.cds) if (e.cds[k] > 0) e.cds[k] -= dt;
  tickBuffs(e, dt); tickDash(e, dt);
  if (e.kbx || e.kbz) { moveEnt(e, e.kbx * dt, e.kbz * dt, dt); e.kbx *= Math.pow(0.02, dt); e.kbz *= Math.pow(0.02, dt); if (Math.abs(e.kbx) + Math.abs(e.kbz) < 0.2) e.kbx = e.kbz = 0; }
  if (e.alive) { const ooc = W.t - (e.inCombat || -99) > BAL.oocT && W.t - (e.lastHit || -99) > BAL.oocT; e.hp = Math.min(e.hpMax, e.hp + e.hpMax * (ooc ? BAL.regenOOC : BAL.regenIn) * dt); e.mp = Math.min(e.mpMax, e.mp + e.mpMax * BAL.mpRegen * dt * (ooc ? 2 : 1)); }
  else if (e.downed) { e.downT -= dt; if (e.downT <= 0 || W.P.every(p => !p || !p.alive)) respawnParty(); }
  physEnt(e, dt);
}
function revive(e, by) { e.alive = true; e.downed = false; e.hp = Math.round(e.hpMax * 0.4); e.A.pose = null; e.iframe = 2; pillarFX(e.x, e.y, e.z, 0x9affb0, 5, 1, 0.8); sfx('revive'); say(`${by ? by.name + ' 扶起了 ' : ''}${e.name}`, '#9aff8a'); }
let respawning = false;
async function respawnParty() {
  if (respawning || NETROLE === 'guest') return; respawning = true; await fade(true, 0.8);
  const cp = W.checkpoint || { x: WILLOW.x + 4, z: WILLOW.z + 10 };
  W.P.forEach((p, i) => { if (!p) return; p.alive = true; p.downed = false; p.hp = Math.round(p.hpMax * 0.6); p.A.pose = null; teleport(p, cp.x + i * 1.5, cp.z + 2); });
  for (const e of W.ents) if (e.type === 'mob' && e.alive) { e.threat = null; e.ai.tgt = null; e.ai.st = 'return'; }
  if (STORY.onWipe) STORY.onWipe(); say('在柳神的庇护下醒来……', '#9aff8a'); await fade(false, 0.8); respawning = false;
}
/* ---------- partner AI (single player, or host when the guest is absent) ---------- */
function partnerAI(e, dt) {
  const me = W.P[0]; if (!e.alive || !me) { e.mvSpd = 0; return; }
  if (W.cine || e.script) { e.mvSpd = 0; return; }
  if (e.lungeT > 0) { e.lungeT -= dt; const [fx0, fz0] = fwd(e); moveEnt(e, fx0 * e.lunge * dt, fz0 * e.lunge * dt, dt); }
  if (e.dash) return;
  // revive the downed hero
  if (!me.alive && me.downed) { const d = edist(e, me); if (d > 1.6) { goTowards(e, me.x, me.z, e.spd, dt); return; } e.mvSpd = 0; e.revT = (e.revT || 0) + dt; if (e.revT > BAL.reviveT) { e.revT = 0; revive(me, e); } return; }
  e.revT = 0;
  // pick a target: what the hero is fighting, or anything hurting us
  let t = e.aiTgt; const heroT = UI.target && UI.target.alive && UI.target.team === 1 ? UI.target : null;
  if (heroT && edist(heroT, me) < 26) t = heroT;
  if (!t || !t.alive || edist(t, me) > 28) { t = null; for (const m of W.ents) { if (m.type === 'mob' && m.alive && m.team === 1 && m.ai && (m.ai.tgt === me || m.ai.tgt === e) && edist(m, me) < 24) { t = m; break; } } }
  e.aiTgt = t;
  const dMe = edist(e, me);
  if (dMe > BAL.partnerTele && !e.fly) { teleport(e, me.x - Math.sin(me.rot) * 2, me.z - Math.cos(me.rot) * 2); }
  if (t) {
    e.inCombat = W.t; const bar = partnerBar(); const d = edist(e, t) - t.r;
    // support skills first
    if (bar.includes('p_shield') && canCast(e, 'p_shield') && W.P.some(p => p && p.alive && p.hp / p.hpMax < 0.55)) { castSkill(e, 'p_shield', t); return; }
    if (bar.includes('q_scale') && canCast(e, 'q_scale') && me.hp / me.hpMax < 0.6) { castSkill(e, 'q_scale', t); return; }
    for (const id of bar.slice(1)) { const S = SK[id]; if (!S || id === 'p_sniff' || id === 'p_shield' || id === 'q_scale') continue; if (canCast(e, id) && d < S.range && rnd() < dt * 3) { castSkill(e, id, t); return; } }
    const br = SK[bar[0]].range;
    if (d > br * 0.8) goTowards(e, t.x, t.z, e.spd, dt); else { e.mvSpd = 0; faceTo(e, t.x, t.z, dt * 10); if (canCast(e, bar[0])) castSkill(e, bar[0], t); }
    return;
  }
  // follow: stay a little behind and to the side of the hero
  const side = Math.sin(W.t * 0.3) > 0 ? 1 : -1, fx2 = me.x - Math.sin(me.rot) * 2.2 + Math.cos(me.rot) * side * 1.4, fz2 = me.z - Math.cos(me.rot) * 2.2 - Math.sin(me.rot) * side * 1.4;
  const d = dist(e.x, e.z, fx2, fz2);
  if (d > 1.2) goTowards(e, fx2, fz2, d > 6 ? e.spd * 1.15 : Math.max(2.5, me.mvSpd || 2.5), dt); else { e.mvSpd = 0; faceTo(e, me.x, me.z, dt * 3); }
  if (me.vy > 5 && e.onGround && dMe < 6) { e.vy = BAL.jumpV * 0.9; e.onGround = false; }
}
function goTowards(e, x, z, sp, dt) { const a = Math.atan2(x - e.x, z - e.z); e.rot = angLerp(e.rot, a, Math.min(1, dt * 10)); const d = dist(e.x, e.z, x, z), st = Math.min(d, sp * dt); moveEnt(e, Math.sin(a) * st, Math.cos(a) * st, dt); e.mvSpd = sp; }
/* ---------- interaction ---------- */
function findInteract(p) {
  let best = null, bd = 1e9;
  for (const e of W.ents) {
    if (e === p || e.removed || !e.vis) continue;
    const can = e.interact || (e.type === 'npc' && (e.talk || npcMark(e) || e.bark)) || (e.type === 'player' || e.type === 'partner') && !e.alive && e !== p;
    if (!can) continue; const r = (e.ir || BAL.interactR) + e.r; const d = d2(e.x, e.z, p.x, p.z); if (d < r * r && d < bd) { bd = d; best = e; }
  }
  return best;
}
function interactLabel(t) { if (!t) return ''; if ((t.type === 'player' || t.type === 'partner') && !t.alive) return '扶起 ' + t.name; if (t.interact) return t.interact.label || '互动'; return '对话 · ' + t.name; }
async function doInteract(p, t) {
  if (!t || W.cine || DLG.open) return;
  if (NETROLE === 'guest') { netSendCtl({ t: 'int', id: t.id }); return; }
  if ((t.type === 'player' || t.type === 'partner') && !t.alive) { p.reviving = t; return; }
  if (tryStepInteract(t)) return;
  if (t.interact) { if (t.interact.fn) t.interact.fn(p, t); return; }
  if (t.type === 'npc') {
    if (t.R && t.R.kind === 'human' && !t.script) faceTo(t, p.x, p.z);
    if (await sideTalk(t)) return;
    if (t.talk) { runFree(async () => { await t.talk(p); }); return; }
    if (t.bark) { const lines = typeof t.bark === 'function' ? t.bark() : t.bark; bubble(t, pick(lines), 3.2); sfx('blip'); }
  }
}
/* free scripts (not part of the main line) */
async function runFree(fn) { if (STORY.running) return; STORY.running = fn; try { await fn(); } catch (e) { console.error(e); } STORY.running = null; W.cine = false; CAM.cine = null; uiCine(false); }
function tickRevive(p, dt) { const t = p.reviving; if (!t) return; if (t.alive || edist(p, t) > 2.6 || !INP.intHeld) { p.reviving = null; p.revT = 0; uiProgress(null); return; } p.revT = (p.revT || 0) + dt; uiProgress('扶起 ' + t.name, p.revT / BAL.reviveT); if (p.revT >= BAL.reviveT) { revive(t, p); p.reviving = null; p.revT = 0; uiProgress(null); } }
