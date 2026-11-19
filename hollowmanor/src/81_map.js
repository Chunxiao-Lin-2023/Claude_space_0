/* ================= where am I: room tracking, room-name card, minimap (M / tap to enlarge) ================= */
const NAV = { W: null, fi: -1, seen: null, cur: [-1, -1], cand: [-1, -1], candT: [0, 0], big: false, toastT: 0, cv: null, g: null, dpr: 1 };
function navReset(W) { NAV.W = W; NAV.fi = MAP.fi; NAV.seen = new Uint8Array(MAP.rooms.length); NAV.cur = [-1, -1]; NAV.cand = [-1, -1]; NAV.candT = [0, 0]; NAV.toastT = 0; const t = document.getElementById('roomToast'); if (t) t.classList.remove('on'); toggleMap(false); }
function roomName(ri) { return ri >= 0 && MAP.rooms[ri] ? MAP.rooms[ri].name : ''; }
/* called every frame from updateHUD */
function navTick(W, me, dt) {
  if (NAV.W !== W || NAV.fi !== MAP.fi || !NAV.seen || NAV.seen.length !== MAP.rooms.length) navReset(W);
  const who = STATE.local ? W.p : [me];
  for (const p of who) {
    const k = STATE.local ? p.id : 0, ri = roomAt(p.x, p.z);
    if (ri < 0) continue;
    NAV.seen[ri] = 1;
    // a short dwell so walking along a doorway doesn't flicker the name
    if (ri !== NAV.cand[k]) { NAV.cand[k] = ri; NAV.candT[k] = 0; } else NAV.candT[k] += dt;
    if (NAV.cand[k] !== NAV.cur[k] && NAV.candT[k] > 0.25) {
      const first = NAV.cur[k] < 0; NAV.cur[k] = ri;
      if (!first && W.phase === 'play' && !STAGE.sc) navToast(ri, STATE.local ? p : null);
    }
  }
  const tEl = document.getElementById('roomToast');
  if (NAV.toastT > 0) { NAV.toastT -= dt; if (NAV.toastT <= 0) tEl.classList.remove('on'); }
  drawMinimap(W, me);
}
function navToast(ri, p) {
  const el = document.getElementById('roomToast'); if (!el) return;
  el.querySelector('b').innerHTML = (p ? `<small style="color:${ROLES[p.role].color}">${ROLES[p.role].name}</small>` : '') + roomName(ri);
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); NAV.toastT = 1.9;
}
/* HUD sub-line: floor · room */
function navWhere(me) { const ri = NAV.cur[0] >= 0 ? NAV.cur[0] : roomAt(me.x, me.z); return MAP.F.name + (ri >= 0 ? ' · ' + roomName(ri) : ''); }
function toggleMap(on) { NAV.big = on == null ? !NAV.big : on; const c = document.getElementById('mini'); if (c) c.classList.toggle('big', NAV.big); const b = document.getElementById('miniBack'); if (b) b.classList.toggle('hidden', !NAV.big); }
function drawMinimap(W, me) {
  const cv = NAV.cv || (NAV.cv = document.getElementById('mini')); if (!cv) return;
  const show = W.phase === 'play' || W.phase === 'ascend' ? !STAGE.sc || NAV.big : false;
  cv.style.display = show ? 'block' : 'none'; if (!show) return;
  const small = Math.min(innerWidth, innerHeight) < 500;
  const s = NAV.big ? Math.min(innerWidth * 0.86 / MAP.W, (innerHeight - 120) * 0.86 / MAP.H) : (small ? 3.3 : 4.6);
  const pad = NAV.big ? 12 : 4, foot = NAV.big ? 24 : 0, cw = Math.round(MAP.W * s + pad * 2), ch = Math.round(MAP.H * s + pad * 2 + foot), dpr = Math.min(devicePixelRatio || 1, 2);
  if (cv._w !== cw || cv._h !== ch || cv._d !== dpr) { cv.width = cw * dpr; cv.height = ch * dpr; cv.style.width = cw + 'px'; cv.style.height = ch + 'px'; cv._w = cw; cv._h = ch; cv._d = dpr; }
  if (!NAV.big) { const tr = document.querySelector('#hud .tr'); if (tr) { const b = tr.getBoundingClientRect(); cv.style.top = Math.round(b.bottom + 8) + 'px'; } } else cv.style.top = '';
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cw, ch);
  const X = x => pad + x * s, Y = z => pad + z * s;
  g.fillStyle = NAV.big ? '#08060a' : 'rgba(8,6,10,.62)'; g.fillRect(0, 0, cw, ch);
  const here = new Set(STATE.local ? NAV.cur : [NAV.cur[0]]);
  // rooms: unexplored ones only as a faint outline
  for (const r of MAP.rooms) {
    const seen = NAV.seen[r.idx], cur = here.has(r.idx), x = X(r.r[0]), y = Y(r.r[1]), w = (r.r[2] - r.r[0]) * s, h = (r.r[3] - r.r[1]) * s;
    if (cur) { g.fillStyle = `rgba(${roomTint(r.idx)},.42)`; g.fillRect(x, y, w, h); }
    else if (seen) { g.fillStyle = `rgba(${roomTint(r.idx)},.16)`; g.fillRect(x, y, w, h); }
    else { g.fillStyle = 'rgba(255,255,255,.025)'; g.fillRect(x, y, w, h); }
  }
  // walls (doors and arches are the gaps), locked doors as short red bars
  g.strokeStyle = 'rgba(225,205,170,.62)'; g.lineWidth = NAV.big ? 2 : 1.2; g.beginPath();
  for (const sg of MAP.segs) { if (sg.dir === 'h') { g.moveTo(X(sg.a), Y(sg.at)); g.lineTo(X(sg.b), Y(sg.at)); } else { g.moveTo(X(sg.at), Y(sg.a)); g.lineTo(X(sg.at), Y(sg.b)); } }
  for (const w of MAP.windows) { if (w.dir === 'h') { g.moveTo(X(w.a), Y(w.at)); g.lineTo(X(w.b), Y(w.at)); } else { g.moveTo(X(w.at), Y(w.a)); g.lineTo(X(w.at), Y(w.b)); } }
  g.stroke();
  for (const d of MAP.doors) {
    const st = W.doors && W.doors[d.idx]; if (d.kind === 'crack' && !R3.seerView) { g.strokeStyle = 'rgba(225,205,170,.62)'; }
    else if (st && st.locked) g.strokeStyle = 'rgba(220,80,70,.9)';
    else if (d.kind === 'crack') g.strokeStyle = 'rgba(140,220,255,.8)';
    else if (d.kind !== 'arch' && st && st.open < 0.5) g.strokeStyle = 'rgba(200,150,90,.75)';
    else continue;
    g.lineWidth = NAV.big ? 3 : 2; g.beginPath();
    if (d.dir === 'h') { g.moveTo(X(d.a) + 1, Y(d.at)); g.lineTo(X(d.b) - 1, Y(d.at)); } else { g.moveTo(X(d.at), Y(d.a) + 1); g.lineTo(X(d.at), Y(d.b) - 1); }
    g.stroke();
  }
  // stairs / stairwell / roof hatch once their room has been seen
  g.font = `${NAV.big ? 15 : 9}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const f of MAP.furn) if ((f.k === 'stairs' || f.k === 'stairwell' || f.k === 'roofHatch') && f.room >= 0 && NAV.seen[f.room]) { g.fillStyle = f.k === 'stairwell' ? 'rgba(200,190,170,.7)' : '#e2b45c'; g.fillText(f.k === 'stairwell' ? '▼' : '▲', X(f.x), Y(f.z)); }
  // names on the big map
  if (NAV.big) {
    for (const r of MAP.rooms) { const cur = here.has(r.idx); g.font = `${cur ? 'bold ' : ''}${Math.max(11, Math.min(16, s * 0.75))}px "Noto Serif SC", serif`; g.fillStyle = cur ? '#ffe2a8' : NAV.seen[r.idx] ? 'rgba(234,223,202,.8)' : 'rgba(234,223,202,.25)'; g.fillText(NAV.seen[r.idx] || cur ? r.name : '？', X(r.cx), Y(r.cz) + (r.r[3] - r.r[1] > 3.5 ? -s * 0.6 : 0)); }
    g.font = '13px sans-serif'; g.fillStyle = 'rgba(234,223,202,.55)'; g.textAlign = 'left'; g.fillText(MAP.F.title.split(' · ')[0] + '　·　红色＝锁着的门　' + (IS_TOUCH ? '点一下关闭' : 'M / Esc 关闭'), pad, ch - 12); g.textAlign = 'center';
  }
  // pings
  const now = performance.now();
  for (const p of UI.pings) { const a = 1 - (now - p.t) / 6000; if (a <= 0) continue; g.strokeStyle = p.c; g.globalAlpha = a; g.lineWidth = 1.5; g.beginPath(); g.arc(X(p.x), Y(p.z), (NAV.big ? 6 : 3) + ((now / 160) % 4), 0, TAU); g.stroke(); g.globalAlpha = 1; }
  // people: me with a facing tick, partner as a dot (hidden in a wardrobe → hollow)
  const pr = NAV.big ? 6 : 3;
  W.p.forEach((p, i) => {
    const mine = STATE.local || i === ME, col = ROLES[p.role].color, x = X(p.x), y = Y(p.z);
    if (mine) { g.strokeStyle = col; g.lineWidth = NAV.big ? 2.5 : 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(p.aim) * pr * 2.2, y + Math.sin(p.aim) * pr * 2.2); g.stroke(); }
    g.beginPath(); g.arc(x, y, mine ? pr : pr * 0.85, 0, TAU);
    if (p.hide >= 0) { g.strokeStyle = col; g.lineWidth = 1.5; g.stroke(); } else { g.fillStyle = p.down ? '#ff6b6b' : col; g.fill(); g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = 1; g.stroke(); }
  });
}
{ const c = document.getElementById('mini'); if (c) c.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toggleMap(); }); }
