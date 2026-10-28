/* ================= story engine: quests, steps, async cutscene scripts, dialogue ================= */
const STORY = { qi: 0, si: 0, running: null, flags: {}, done: false, side: {}, onKill: () => { }, onItem: () => { }, onLevel: () => { }, onSniff: () => { } };
let QUESTS = [];          // main line, filled by story files
const SIDEQ = {};         // side quests by id
const wait = s => new Promise(r => { const t0 = W.t; const f = () => { if (W.t - t0 >= s || W.skip) r(); else requestAnimationFrame(f); }; f(); });
function animate(dur, fn) { return new Promise(res => { const t0 = W.t; let last = W.t; const f = () => { const t = W.t - t0, dt = W.t - last; last = W.t; fn(Math.min(t, dur), dt, Math.min(1, t / dur)); if (t < dur && !W.skip) requestAnimationFrame(f); else { if (W.skip) fn(dur, 0, 1); res(); } }; f(); }); }
const waitUntil = (fn, maxS = 1e9) => new Promise(r => { const t0 = W.t; const f = () => { if (fn() || W.t - t0 > maxS) r(); else requestAnimationFrame(f); }; f(); });
function curQ() { return QUESTS[STORY.qi]; }
function curStep() { const q = curQ(); return q ? q.steps[STORY.si] : null; }
/* ---------- dialogue ---------- */
const DLG = { open: false, lines: [], i: 0, res: null, typing: 0, full: '', choice: null };
const SPEAKERS = {}; // name -> {ent tag, color}
function talk(lines, o = {}) {
  return new Promise(res => {
    if (NETROLE !== 'guest') netEv({ k: 'dlg', lines: lines.map(l => [l[0], l[1], l[2] || '']) });
    if (W.skip) { res(); return; } DLG.open = true; DLG.lines = lines; DLG.i = 0; DLG.res = res; DLG.o = o; showLine(); });
}
function showLine() {
  const L = DLG.lines[DLG.i]; if (!L) { closeDlg(); return; }
  const [who, text, mood] = L; const sp = SPEAKERS[who] || {}; const e = sp.tag ? (sp.tag === '@me' ? W.P[0] : sp.tag === '@pet' ? W.P[1] : entByTag(sp.tag)) : null;
  DLG.full = text.replace(/\{pet\}/g, PARTY.pname || '绒灵'); DLG.typing = 0; DLG.who = who; DLG.e = e;
  if (DLG.prevE && DLG.prevE.A) DLG.prevE.A.talking = false;
  if (e && e.A) { e.A.talking = true; if (mood) e.A.face = mood; else if (e.A.face && e.A.face !== 'open') e.A.face = 'open'; DLG.prevE = e; }
  uiDialog(who === '旁白' ? '' : who.replace(/^@/, ''), '', e, sp.col);
  sfx('blip');
}
function advanceDlg() {
  if (!DLG.open) return;
  if (DLG.typing < DLG.full.length) { DLG.typing = DLG.full.length; return; }
  DLG.i++; if (NETROLE === 'host') netEv({ k: 'dlgi', i: DLG.i });
  if (DLG.i >= DLG.lines.length) closeDlg(); else showLine();
}
function closeDlg() { if (DLG.prevE && DLG.prevE.A) { DLG.prevE.A.talking = false; } DLG.open = false; uiDialog(null); const r = DLG.res; DLG.res = null; if (r) r(); if (NETROLE === 'host') netEv({ k: 'dlgx' }); }
function tickDlg(dt) { if (!DLG.open) return; if (DBG && DBG.autoDlg) { DLG.autoT = (DLG.autoT || 0) + dt; if (DLG.autoT > DBG.autoDlg) { DLG.autoT = 0; DLG.typing = DLG.full.length; advanceDlg(); } } if (DLG.typing < DLG.full.length) { DLG.typing = Math.min(DLG.full.length, DLG.typing + dt * 38); uiDialogText(DLG.full.slice(0, Math.floor(DLG.typing))); } else uiDialogText(DLG.full, true); if (DLG.o.auto && DLG.typing >= DLG.full.length) { DLG.autoT = (DLG.autoT || 0) + dt; if (DLG.autoT > DLG.o.auto) { DLG.autoT = 0; advanceDlg(); } } }
/* choices: resolves to index */
function choose(prompt, opts) { return new Promise(res => { uiChoice(prompt, opts, i => { uiChoice(null); res(i); }); }); }
/* ---------- quest flow ---------- */
function startStory(qi = 0, si = 0) { STORY.qi = qi; STORY.si = si; enterStep(); }
function enterStep() {
  const q = curQ(); if (!q) { STORY.done = true; hudDirty(); return; }
  const s = curStep(); if (!s) { finishQuest(); return; }
  if (STORY.si === 0 && !q._started) { q._started = true; if (q.chapter && !q.noTitle) chapterCard(q.chapter, q.chapterSub); if (q.onStart) q.onStart(); say(`【主线】接受任务：${q.title}`, '#ffd86a'); sfx('quest'); }
  s._n = 0; const go = () => { if (curStep() !== s) return; if (s.onStart) s.onStart(s); if (s.t === 'script') runScript(s.run); hudDirty(); };
  if (UI.chapterOn && !(DBG && DBG.skipDraw)) { STORY.hold = true; setTimeout(() => { STORY.hold = false; go(); }, 2600); } else go();
  hudDirty(); saveGame();
}
async function runScript(fn) { if (STORY.running) return; STORY.running = fn; W.cine = false; W.skip = false; try { await fn(); } catch (err) { console.error(err); } STORY.running = null; W.skip = false; W.cine = false; CAM.cine = null; uiCine(false); stepDone(); }
function stepDone() { const s = curStep(); if (!s) return; if (s.onDone) s.onDone(s); STORY.si++; if (STORY.si >= curQ().steps.length) finishQuest(); else enterStep(); }
function finishQuest() { const q = curQ(); if (q.onDone) q.onDone(); if (q.xp) gainXP(q.xp); if (q.reward) for (const [id, n] of q.reward) addItem(id, n); say(`【主线】完成：${q.title}${q.xp ? '  经验 +' + q.xp : ''}`, '#9aff8a'); sfx('questdone'); STORY.qi++; STORY.si = 0; enterStep(); }
/* event hooks from gameplay */
STORY.onKill = e => { const s = curStep(); if (s && s.t === 'kill' && (e.kind === s.mob || e.tag === s.mob || (s.mobs && s.mobs.includes(e.kind)))) { s._n = (s._n || 0) + 1; hudDirty(); if (s._n >= (s.n || 1)) stepDone(); } for (const sq of Object.values(SIDEQ)) if (sq.st === 1 && sq.kill && (sq.kill.includes(e.kind))) { sq.n = (sq.n || 0) + 1; hudDirty(); if (sq.n >= sq.need) sideReady(sq); } };
STORY.onItem = id => { const s = curStep(); if (s && s.t === 'collect' && s.item === id && hasItem(id, s.n || 1)) stepDone(); for (const sq of Object.values(SIDEQ)) if (sq.st === 1 && sq.item === id && hasItem(id, sq.need)) sideReady(sq); hudDirty(); };
function tickStory(dt) {
  if (NETROLE === 'guest' || STORY.hold) return; const s = curStep(); if (!s || STORY.running) return;
  const P = W.P.filter(p => p && p.alive);
  if (s.t === 'goto') { if (P.some(p => d2(p.x, p.z, s.x, s.z) < (s.r || 4) ** 2 && (!s.both || P.length < 2 || P.every(q => d2(q.x, q.z, s.x, s.z) < (s.r || 4) ** 2)))) stepDone(); }
  else if (s.t === 'cond') { if (s.check()) stepDone(); }
  else if (s.t === 'collect') { if (hasItem(s.item, s.n || 1)) stepDone(); }
  else if (s.t === 'boss') { const b = entByTag(s.tag); if (b && !b.alive) stepDone(); }
}
/* talk/interact steps complete through interaction */
function tryStepInteract(target) {
  const s = curStep(); if (!s || STORY.running || STORY.hold) return false;
  if ((s.t === 'talk' || s.t === 'interact') && target.tag === s.npc) { if (s.say || s.run) { runScript(async () => { if (s.say) await talk(s.say); if (s.run) await s.run(target); }); } else stepDone(); return true; }
  return false;
}
function stepTarget() { const s = curStep(); if (!s) return null; if (s.go) return typeof s.go === 'function' ? s.go() : s.go; if (s.t === 'goto') return { x: s.x, z: s.z }; if (s.npc) { const e = entByTag(s.npc); if (e) return { x: e.x, z: e.z }; } if (s.t === 'boss' || s.t === 'kill') { const e = entByTag(s.tag || s.mob); if (e) return { x: e.x, z: e.z }; } return null; }
function stepText() { const s = curStep(); if (!s) return STORY.done ? '主线暂告一段落' : ''; let t = s.text || ''; if (s.t === 'kill' && s.n > 1) t += `（${s._n || 0}/${s.n}）`; if (s.t === 'collect') t += `（${Math.min(PARTY.items[s.item] || 0, s.n || 1)}/${s.n || 1}）`; if (s.prog) t += s.prog(); return t; }
/* ---------- side quests (MMO style: ! givers, ? turn-in) ---------- */
function sideOffer(sq) { return SIDEQ[sq].st == null && (!SIDEQ[sq].req || SIDEQ[sq].req()); }
function sideReady(sq) { if (sq.st !== 1) return; sq.st = 2; say(`【支线】${sq.title} 可以交付了`, '#9ad8ff'); sfx('quest'); hudDirty(); }
async function sideTalk(npc) {
  for (const sq of Object.values(SIDEQ)) {
    if (sq.giver !== npc.tag) continue;
    if (sq.st == null && (!sq.req || sq.req())) { await talk(sq.offer); const c = await choose(sq.title, ['接受', '下次再说']); if (c === 0) { sq.st = 1; sq.n = 0; say(`【支线】接受：${sq.title}`, '#9ad8ff'); sfx('quest'); if (sq.item && hasItem(sq.item, sq.need)) sideReady(sq); hudDirty(); } return true; }
    if (sq.st === 1) { await talk(sq.wip || [[npc.name, '还没好吗？']]); return true; }
    if (sq.st === 2) { if (sq.item) takeItem(sq.item, sq.need); await talk(sq.done); sq.st = 3; if (sq.xp) gainXP(sq.xp); if (sq.reward) for (const [id, n] of sq.reward) addItem(id, n); if (sq.onDone) sq.onDone(); say(`【支线】完成：${sq.title}`, '#9aff8a'); sfx('questdone'); if (sq.repeat) setTimeout(() => { sq.st = null; hudDirty(); }, sq.repeat * 1000); hudDirty(); return true; }
  }
  return false;
}
function npcMark(e) { // '!' main/side available, '?' turn-in
  const s = curStep(); if (s && (s.t === 'talk' || s.t === 'interact') && s.npc === e.tag) return { m: '!', main: true };
  for (const sq of Object.values(SIDEQ)) { if (sq.giver !== e.tag) continue; if (sq.st === 2) return { m: '?' }; if (sq.st == null && (!sq.req || sq.req())) return { m: '!' }; }
  return null;
}
/* ---------- cutscene helpers ---------- */
function cine(on) { W.cine = on; uiCine(on); if (!on) camRelease(); }
async function walkTo(e, x, z, sp, o = {}) { e.script = true; const s = sp || e.spd || 3; await new Promise(res => { e.walk = { x, z, s, res, run: o.run }; }); if (!o.keep) e.script = o.keepScript || false; if (o.face != null) e.rot = o.face; }
function tickWalk(e, dt) { const w = e.walk; if (!w) return; if (W.skip) { e.x = w.x; e.z = w.z; e.y = groundH(e.x, e.z); } const d = dist(e.x, e.z, w.x, w.z); if (d < 0.25) { e.walk = null; e.mvSpd = 0; w.res(); return; } const a = Math.atan2(w.x - e.x, w.z - e.z); e.rot = angLerp(e.rot, a, Math.min(1, dt * 10)); const st = Math.min(d, w.s * dt), ox = e.x, oz = e.z; moveEnt(e, Math.sin(a) * st, Math.cos(a) * st, dt); e.mvSpd = w.s; const moved = Math.hypot(e.x - ox, e.z - oz); w.stuck = moved < st * 0.3 ? (w.stuck || 0) + dt : 0; if (w.stuck > 0.8) { e.walk = null; e.mvSpd = 0; w.res(); } }
function teleport(e, x, z, rot) { e.x = x; e.z = z; e.y = groundH(x, z); if (rot != null) e.rot = rot; e.dispRot = e.rot; e.vy = 0; }
function npc(tag, specKey, x, z, o = {}) { let e = entByTag(tag); if (e) { if (o.move !== false) teleport(e, x, z, o.rot); return e; } const spec = typeof specKey === 'string' ? CHARS[specKey](o.seed || 1, o.kind) : specKey; e = mkEnt(Object.assign({ type: 'npc', tag, team: 0, x, z, rot: o.rot ?? 0, spec, name: o.name || tag, title: o.title || '', r: spec.rig === 'bird' ? 0.6 : 0.4, ai: { st: 'idle', wt: 0, cd: 0, lock: 0 } }, o)); e.specRef = typeof specKey === 'string' ? [specKey, o.seed || 1, o.kind] : null; if (o.weapon) e.weaponRef = o.weapon; if (o.pose) e.A.pose = o.pose; if (o.weapon) { const w = weaponMesh(o.weapon[0], o.weapon[1] || 1); attach(e.R, o.weapon[2] || 'R', w, 0, -0.05, 0, o.weapon[3] ?? HP, 0, 0); } return e; }
function despawn(tag) { for (const e of entsByTag(tag)) rmEnt(e); }
async function fade(out, d = 0.6) { uiFade(out, d); await wait(d); }
function chapterCard(ch, sub) { uiChapter(ch, sub); sfx('chapter'); netEv({ k: 'chap', ch, sub }); }
function emote(e, txt, d = 2.5) { bubble(e, txt, d); }
