/* ================= boot, title / lobby, zone loading, main loop, save ================= */
function loadZone(id) {
  clearCombat(); for (const e of [...W.ents]) rmEnt(e); W.P = [null, null]; clearStatic(); clearCols(); sceneClear(); WILLOWOBJ = null; LOOTS.length = 0;
  const Z = ZONES[id]; W.zone = Z; RNG = mulberry32(777);
  buildTerrain(Z); setLight(Z.light, true);
  if (Z.build) Z.build(); else if (id === 'shicun') { buildShicunProps(); makeWillow(WILLOW.x, WILLOW.z); }
  buildStatic(); buildMapImage();
  RNG = mulberry32(Date.now() & 0xffff);
}
function setupWorld() { if (W.zone.populate) W.zone.populate(); }
/* ---------- save ---------- */
function saveGame() { if (NETROLE === 'guest' || STATE.mode !== 'play' || !W.P[0]) return; const p = W.P[0]; LS.set('save', { v: 1, zone: W.zone.id, x: p.x, z: p.z, party: PARTY, qi: STORY.qi, si: STORY.si, side: Object.fromEntries(Object.entries(SIDEQ).map(([k, v]) => [k, { st: v.st, n: v.n }])), t: Date.now() }); }
function loadSave() { return LS.get('save', null); }
/* ---------- title ---------- */
function titleScreen() {
  STATE.mode = 'title'; const T = $('title'); T.classList.remove('hide'); const sv = loadSave();
  T.innerHTML = `${HUB ? '<button class="btn sm" id="hubback">‹ 游戏厅</button>' : ''}<h1>完美世界</h1><div class="sub">双人剧情 · 石村篇（试玩）<br><span style="font-size:13px;letter-spacing:2px;color:#a89a7a">一粒尘可填海，一根草斩尽日月星辰。一个少年从大荒中走出，一切从这里开始……</span></div>
    <div class="menu">${sv ? `<button class="btn" id="bcont">继续 · ${esc(QUESTS[sv.qi] ? QUESTS[sv.qi].chapter || '' : '')}</button>` : ''}<button class="btn" id="bnew">开始新的旅程（单人）</button><button class="btn" id="bhost">创建房间 · 双人联机</button><button class="btn" id="bjoin">加入房间 · 扮演神兽伙伴</button></div>
    <div class="note">单人时神兽伙伴由 AI 跟随。双人联机：房主扮演小不点，另一位扮演神兽伙伴。${inArtifact() ? '<br>当前页面环境不支持联机，请在游戏厅网址打开。' : ''}<br>根据辰东《完美世界》改编的同人试玩，非商业。</div>`;
  const hb = $('hubback'); if (hb) hb.onclick = () => location.href = '../';
  if ($('bcont')) $('bcont').onclick = () => { audioInit(); startSolo(sv); };
  $('bnew').onclick = () => { audioInit(); if (sv && !$('bnew').dataset.c) { $('bnew').dataset.c = 1; $('bnew').textContent = '会覆盖存档，再点一次确认'; return; } namePet(name => { PARTY.pname = name; startSolo(null); }); };
  $('bhost').onclick = () => { audioInit(); if (inArtifact()) { toast('这里不支持联机，请在游戏厅网址打开'); return; } STATE.mode = 'lobby'; STATE.lobbyCont = sv; netHost(); };
  $('bjoin').onclick = () => { audioInit(); if (inArtifact()) { toast('这里不支持联机'); return; } joinUI(); };
}
function titleConfirm() { const b = $('bcont') || $('bnew'); if (b) b.click(); }
function namePet(cb) {
  const T = $('title'); T.innerHTML = `<div class="panel frame"><h3>为你的神兽伙伴起个名字</h3><p style="color:var(--dim);line-height:1.6;margin:0 0 12px">序章那一夜，柳神护下了一枚发光的灵卵。<br>孵出的幼崽会和小不点一起长大、一起进化。</p><input id="pn" maxlength="6" placeholder="绒灵" value="${esc(SET.petName || '')}"><div style="margin-top:14px;display:flex;gap:8px;justify-content:center"><button class="btn" id="pok">就叫这个</button><button class="btn" id="pback">返回</button></div></div>`;
  const ok = () => { const v = ($('pn').value || '').trim() || '绒灵'; SET.petName = v; saveSet(); cb(v); }; $('pok').onclick = ok; $('pn').onkeydown = e => { if (e.key === 'Enter') ok(); }; $('pback').onclick = titleScreen; setTimeout(() => $('pn').focus(), 50);
}
function joinUI() { STATE.mode = 'lobby'; const T = $('title'); T.innerHTML = `<div class="panel frame"><h3>加入房间</h3><p style="color:var(--dim);margin:0 0 10px">你将扮演小不点的神兽伙伴</p><div style="display:flex;flex-direction:column;gap:10px;align-items:center"><input id="jc" maxlength="4" placeholder="房间码" style="letter-spacing:8px;text-transform:uppercase"><input id="jn" maxlength="6" placeholder="伙伴的名字" value="${esc(SET.petName || '')}"></div><div style="margin-top:14px;display:flex;gap:8px;justify-content:center"><button class="btn" id="jok">加入</button><button class="btn" id="jback">返回</button></div><div id="lmsg" style="margin-top:10px;color:var(--gold)"></div></div>`;
  $('jok').onclick = () => { const n = ($('jn').value || '').trim() || '绒灵'; SET.petName = n; saveSet(); netJoin($('jc').value, n); }; $('jback').onclick = () => { netLeave(); NETROLE = null; titleScreen(); }; }
function lobbyUI(msg) {
  if (STATE.mode !== 'lobby') { if (msg) toast(msg); return; }
  const T = $('title');
  if (NETROLE === 'guest') { const m = $('lmsg'); if (m) m.textContent = msg || ''; else T.innerHTML = `<div class="panel frame"><h3>${esc(msg || '')}</h3><button class="btn" onclick="netLeave();NETROLE=null;titleScreen()">返回</button></div>`; return; }
  const sv = STATE.lobbyCont;
  T.innerHTML = `<div class="panel frame"><h3>双人房间</h3>${NET.code ? `<div style="color:var(--dim)">把房间码告诉同伴</div><div class="code">${NET.code}</div>` : ''}<div style="margin:6px 0 12px;color:var(--txt)">${msg ? esc(msg) : NET.guestName ? `神兽伙伴「${esc(NET.guestName)}」已加入 ✓` : '等待同伴加入…'}</div>
    <div style="display:flex;flex-direction:column;gap:8px;align-items:center">${sv ? `<button class="btn" id="lcont" ${NET.guestName ? '' : 'disabled style="opacity:.5"'}>继续存档 · ${esc(QUESTS[sv.qi] ? QUESTS[sv.qi].chapter : '')}</button>` : ''}<button class="btn" id="lnew" ${NET.guestName ? '' : 'disabled style="opacity:.5"'}>${sv ? '开始新的旅程' : '开始'}</button><button class="btn" id="lback">返回</button></div></div>`;
  if ($('lcont')) $('lcont').onclick = () => { if (!NET.guestName) return; startSolo(sv); };
  $('lnew').onclick = () => { if (!NET.guestName) return; PARTY.pname = NET.guestName; startSolo(null); };
  $('lback').onclick = () => { netLeave(); NETROLE = null; titleScreen(); };
}
/* ---------- start ---------- */
function resetParty() { Object.assign(PARTY, { lv: 1, xp: 0, sp: 0, skills: {}, items: {}, gold: 0, form: 'rongling', flags: {}, kills: {} }); for (const q of QUESTS) q._started = false; for (const s of Object.values(SIDEQ)) { s.st = null; s.n = 0; } }
function startSolo(sv) {
  $('title').classList.add('hide'); STATE.mode = 'play'; document.body.classList.remove('notplay');
  const pname = PARTY.pname; resetParty(); PARTY.pname = pname || SET.petName || '绒灵';
  let zone = 'shicun', qi = 0, si = 0, pos = null;
  if (sv) { Object.assign(PARTY, JSON.parse(JSON.stringify(sv.party))); if (NETROLE === 'host' && NET.guestName) PARTY.pname = NET.guestName; zone = sv.zone; qi = sv.qi; si = 0; pos = [sv.x, sv.z]; for (const [k, v] of Object.entries(sv.side || {})) if (SIDEQ[k]) { SIDEQ[k].st = v.st === 1 || v.st === 2 ? v.st : v.st; SIDEQ[k].n = v.n || 0; } for (let i = 0; i < qi; i++) QUESTS[i]._started = true; }
  loadZone(zone); setupWorld();
  const start = pos || [WILLOW.x + 5, WILLOW.z + 14]; createHeroes(start[0], start[1]); W.me = 0;
  for (const p of W.P) p.specRef = p.type === 'player' ? ['@p1'] : ['@pet'];
  if (W.P[1]) W.P[1].ctrl = NETROLE === 'host' && linkUp() ? 'remote' : 'ai';
  CAM.tx = W.P[0].x; CAM.tz = W.P[0].z; buildHotbar(); buildMenuButtons(); hudDirty();
  if (sv) { STORY.restore && STORY.restore(qi); startStory(qi, 0); } else startStory(0, 0);
  if (NETROLE === 'host') sendStart();
  if (IS_TOUCH) document.body.classList.add('touch');
}
function startGuestWorld(zone) {
  $('title').classList.add('hide'); STATE.mode = 'play'; document.body.classList.remove('notplay');
  loadZone(zone); W.me = 1;
  const p2 = makePartner(WILLOW.x + 6, WILLOW.z + 15); p2.ctrl = 'local'; W.P = [null, p2]; p2.specRef = ['@pet'];
  CAM.tx = p2.x; CAM.tz = p2.z; buildHotbar(); buildMenuButtons(); hudDirty(); if (IS_TOUCH) document.body.classList.add('touch');
  toast('你是「' + p2.name + '」——小不点的神兽伙伴', 3);
}
/* ---------- main loop ---------- */
let lastT = performance.now(), fpsAcc = 0, fpsN = 0;
function frame() {
  requestAnimationFrame(frame);
  const tnow = performance.now(); let dt = Math.min(0.05, (tnow - lastT) / 1000); lastT = tnow; if (DBG && DBG.speed) dt *= DBG.speed;
  if (STATE.mode === 'play' && !STATE.paused) step(dt);
  else if (STATE.mode !== 'play') titleCam(dt);
  render(dt);
}
function step(dt) {
  W.t += dt; const me = W.P[W.me];
  if (NETROLE !== 'guest') {
    controlLocal(me, dt);
    for (const p of W.P) { if (!p) continue; if (p !== me && p.type === 'partner' && (p.ctrl === 'ai' || (p.ctrl === 'remote' && W.t - (p.remoteT || -99) > 3))) partnerAI(p, dt); heroTick(p, dt); }
    if (me) tickRevive(me, dt);
    for (const e of W.ents) { if (e.type === 'mob') { if (e.alive) { for (const k in e.cds) e.cds[k] -= dt; tickBuffs(e, dt); tickDash(e, dt); if (e.kbx || e.kbz) { moveEnt(e, e.kbx * dt, e.kbz * dt, dt); e.kbx *= Math.pow(0.02, dt); e.kbz *= Math.pow(0.02, dt); if (Math.abs(e.kbx) + Math.abs(e.kbz) < 0.3) e.kbx = e.kbz = 0; } } mobAI(e, dt); physEnt(e, dt); } else if (e.type === 'npc') { tickWalk(e, dt); tickDash(e, dt); if (e.npcAI) e.npcAI(e, dt); else if (e.wanderR && !e.script && !e.walk) wander(e, dt, 0.3); physEnt(e, dt); } }
    separate(); updateProj(dt); updateTele(dt); updateLoot(dt); tickRespawn(dt); tickStory(dt);
    if (W.zone.tick) W.zone.tick(dt);
    hostTick(dt);
    // music mood
    AU.mood = W.ents.some(e => e.type === 'mob' && e.alive && e.team === 1 && e.ai && e.ai.tgt && e.ai.st === 'chase') ? 'battle' : LTGT === LIGHTS.night ? 'night' : 'calm';
  } else {
    controlLocal(me, dt); if (me) { heroTick(me, dt); for (const k in me.cds) { } }
    guestTick(dt); updateTele(dt);
  }
  if (W.sniffT > 0) W.sniffT -= dt;
  tickDlg(dt); tickWillow(dt);
  for (const e of W.ents) syncEnt(e, dt);
  updateParticles(dt); updateFX(dt);
  updateCam(dt); updateLight(dt);
  updateHUD(dt); tickMusic(dt);
  W.saveT = (W.saveT || 0) + dt; if (W.saveT > 20) { W.saveT = 0; saveGame(); }
}
let titleT = 0;
function titleCam(dt) { titleT += dt; if (!TER.h) return; W.t += dt; const a = titleT * 0.05; CAM.tx = WILLOW.x + Math.sin(a) * 4; CAM.tz = WILLOW.z - 3.5 + Math.cos(a) * 1; CAM.zoom = 0.75; V.cx = CAM.tx; V.cz = CAM.tz; V.zoom = CAM.zoom; updateLight(dt); tickWillow(dt); updateParticles(dt); }
function render(dt) {
  if (DBG && DBG.skipDraw) return; const g = V.g; SPR.budget = 10; g.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
  g.fillStyle = '#3a5a2a'; g.fillRect(0, 0, V.W, V.H);
  if (!TER.h) return;
  drawGround(g);
  drawTele(g);
  if (UI.target && UI.target.alive !== false && !UI.target.removed) drawTargetRing(g, UI.target);
  queueStatic(); queueScene(); queueFX(); flushQueue(g);
  drawParticles(g);
  LAMPS.length = 0; if (LCUR.dark > 0.02) { for (const L of STATIC.lamps) if (onScreen(L.x, L.z, L.r + 2)) LAMPS.push(L); sceneLamps(LAMPS); } drawLighting(g);
}
function drawTargetRing(g, e) { const [sx, sy] = w2s(e.x, e.z), K = k(), r = Math.max(0.5, e.r * 1.3) * K, c = e.team === 1 ? '255,90,70' : e.team === 2 ? '255,220,90' : '120,230,140'; g.save(); g.strokeStyle = `rgba(${c},0.9)`; g.lineWidth = 2; g.setLineDash([8, 5]); g.lineDashOffset = -W.t * 30; g.beginPath(); g.ellipse(sx, sy, r, r * 0.42, 0, 0, TAU); g.stroke(); g.restore(); }
function boot() {
  initView(); initParticles(); initInput(); wrapFX();
  if (IS_TOUCH) document.body.classList.add('touch');
  loadZone('shicun'); setLight('dusk', true);
  titleScreen(); requestAnimationFrame(frame);
  if (DBG) DBG.ready = true;
}
addEventListener('pagehide', () => { saveGame(); });
