/* ================= animation: battle playback, skill effects, floating numbers, screen transitions, big flashes =================
   The battle engine resolves a round at once and records what happened in B.ev (each tied to its log line).
   Here that record is played back one line at a time: the attacker lunges, the effect lands on the target, the number floats up,
   the health bar drops, the line appears in the feed. Set SET.motion = false (设置 → 动画) to skip all of it. Animations are on by default, even with the system's reduce-motion setting
   (the player asked for them); the old auto-off value `anim` is ignored. */
const animOn = () => SET.motion !== false && !(window.__dbg && __dbg.instant);
const STEP = () => !animOn() ? 0 : SET.fast ? 200 : 460;
UI.animEnd = 0; UI.hpShown = {}; UI.deadShown = {}; UI.reveal = 1e9; UI.fxSeq = -1; UI.fxBid = '';
const animLeft = () => Math.max(0, UI.animEnd - now());
const animBusy = () => UI.inClick && now() < UI.animEnd;
function applyAnimPref() { document.body.classList.toggle('noanim', SET.motion === false); }
delete SET.anim;
applyAnimPref();

/* ---------- battle playback ---------- */
function fxPrepare(B) { // returns true when this render should animate the last round
  if (UI.fxBid !== B.id) { UI.fxBid = B.id; UI.fxSeq = B.seq; UI.reveal = 1e9; UI.hpShown = {}; UI.deadShown = {}; for (const u of B.units) { UI.hpShown[u.id] = u.hp / u.hpMax; if (!u.alive) UI.deadShown[u.id] = 1; } UI.enter = animOn(); return false; }
  UI.enter = false; if (B.seq === UI.fxSeq) return false; UI.fxSeq = B.seq;
  if (!STEP() || !B.ev || !B.ev.length) { for (const u of B.units) { UI.hpShown[u.id] = u.hp / u.hpMax; if (!u.alive) UI.deadShown[u.id] = 1; } UI.reveal = 1e9; return false; }
  for (const u of B.units) if (UI.hpShown[u.id] == null) UI.hpShown[u.id] = u.hp / u.hpMax; UI.reveal = B.lc0 + 1; return true;
}
function fxPlay(B) {
  const st = STEP(), lc0 = B.lc0, n = B.lc - lc0, pause = {}; for (const ev of B.ev) if (ev.k === 'cine' || ev.k === 'finish') pause[ev.li] = (pause[ev.li] || 0) + cineMs(ev); // big moments hold the playback
  const offs = {}; let acc = 0; for (let gl = lc0; gl <= B.lc; gl++) { offs[gl] = Math.max(0, gl - lc0 - 1) * st + acc; acc += pause[gl] || 0; }
  const total = Math.max(1, n - 1) * st + acc; UI.animEnd = now() + total + 120; const bid = B.id, seq = B.seq;
  const at = gl => offs[gl] ?? Math.max(0, gl - lc0 - 1) * st + acc;
  for (let gl = lc0 + 1; gl < B.lc; gl++) setTimeout(() => { if (UI.fxBid !== bid || UI.fxSeq !== seq) return; UI.reveal = gl + 1; const e = document.querySelector(`#bfeed .ln[data-g="${gl}"]`); if (e) e.classList.remove('pend'); $('bfeed').scrollTop = $('bfeed').scrollHeight; }, at(gl));
  for (const ev of B.ev) setTimeout(() => { if (UI.fxBid === bid && UI.fxSeq === seq) fxEvent(B, ev); }, at(ev.li) + (ev.k === 'act' ? 0 : st * 0.35));
  setTimeout(() => { if (UI.fxBid !== bid || UI.fxSeq !== seq) return; for (const u of B.units) { UI.hpShown[u.id] = u.hp / u.hpMax; if (!u.alive) UI.deadShown[u.id] = 1; } UI.reveal = 1e9; UI.animEnd = 0; renderBattle(true); if (B.over) fxStamp(B); }, total + 60);
}
const cardOf = id => document.querySelector(`#vBattle .uc[data-u="${id}"]`);
function fxAt(el) { const r = el.getBoundingClientRect(), V = $('vBattle').getBoundingClientRect(); return { x: r.left - V.left + r.width / 2, y: r.top - V.top + r.height / 2, w: r.width, h: r.height }; }
function fxSpawn(cls, p, html = '', life = 900) { const d = el('div', 'fx ' + cls, html); d.style.left = p.x + 'px'; d.style.top = p.y + 'px'; d.style.setProperty('--w', p.w + 'px'); $('bfx').appendChild(d); setTimeout(() => d.remove(), life); return d; }
function fxFloat(id, text, cls) { const c = cardOf(id); if (!c) return; const p = fxAt(c); p.x += (Math.random() - 0.5) * 30; fxSpawn('fl ' + cls, p, text, 1100); }
function fxClass(id, cls, ms = 450) { const c = cardOf(id); if (!c) return; const L = cls.split(' '); c.classList.remove(...L); void c.offsetWidth; c.classList.add(...L); setTimeout(() => c.classList.remove(...L), ms); }
function fxBar(id, r) { UI.hpShown[id] = r; const c = cardOf(id); if (c) { const i = c.querySelector('.bar i'); if (i) i.style.width = Math.max(0, r * 100) + '%'; } }
function fxEvent(B, ev) {
  if (ev.k === 'act') { const a = cardOf(ev.a); document.querySelectorAll('#bhead .to').forEach(t => t.classList.toggle('now', t.dataset.to === ev.a));
    if (ev.n && (ev.who === 'hero' || ev.who === 'pet' || ev.who === 'boss' || ev.big)) { $('bfx').querySelectorAll('.cutin').forEach(e => e.remove()); const u = (STATE.battle && STATE.battle.units.find(x => x.id === ev.a)) || {}; fxSpawn('cutin ' + ev.who, { x: 0, y: 0, w: 0 }, `<span class="cw">${esc(u.name || '')}</span>${ev.ic ? ev.ic + ' ' : ''}${esc(ev.n)}`, Math.max(700, STEP() * 1.6)); }
    if (ev.fx === 'charge') { fxClass(ev.a, 'charging', 700); return; }
    if (a && !['guard', 'tower', 'heal', 'shield', 'buff', 'bless', 'taunt'].includes(ev.fx)) fxClass(ev.a, ev.side ? 'lunge-d' : 'lunge-u', 420);
    if (ev.fx === 'guard' || ev.fx === 'buff' || ev.fx === 'taunt') { if (a) fxSpawn('fx-' + ev.fx, fxAt(a), ev.fx === 'guard' ? '🛡️' : ev.fx === 'taunt' ? '<b>！</b>' : '', 800); sfx(ev.fx === 'taunt' ? 'hit' : 'magic'); return; }
    const tg = (ev.tg || []).map(cardOf).filter(Boolean); for (const c of tg) fxSpawn('fx-' + ev.fx, fxAt(c), FX_HTML[ev.fx] || '', 900);
    if (ev.fx === 'lei' || ev.fx === 'crush' || ev.big) { $('vBattle').classList.remove('quake'); void $('vBattle').offsetWidth; $('vBattle').classList.add('quake'); }
    if (ev.fx === 'lei') fxSpawn('fx-flash', { x: 0, y: 0, w: 0 }, '', 400);
    sfx(ev.fx === 'lei' || ev.fx === 'magic' || ev.fx === 'bone' ? 'magic' : ev.fx === 'heal' || ev.fx === 'tower' || ev.fx === 'shield' ? 'heal' : 'hit'); return; }
  if (ev.k === 'hit' || ev.k === 'dot') { fxBar(ev.t, ev.hp); fxClass(ev.t, ev.crit ? 'hit crit' : 'hit', 420); fxFloat(ev.t, '-' + ev.v + (ev.crit ? '!' : ''), ev.k === 'dot' ? 'dot ' + ev.st : ev.crit ? 'crit' : ev.weak ? 'weak' : ''); if (ev.weak) fxFloat(ev.t, '要害', 'weak small'); if (ev.crit) sfx('crit'); return; }
  if (ev.k === 'miss') { fxFloat(ev.t, '闪', 'miss'); sfx('miss'); return; }
  if (ev.k === 'heal') { fxBar(ev.t, ev.hp); fxFloat(ev.t, '+' + ev.v, 'heal'); return; }
  if (ev.k === 'shield') { fxFloat(ev.t, '盾+' + ev.v, 'heal small'); return; }
  if (ev.k === 'die') { UI.deadShown[ev.t] = 1; const c = cardOf(ev.t); if (c) c.classList.add('dying', 'dead'); return; }
  if (ev.k === 'int') { fxFloat(ev.t, '打断！', 'weak'); fxClass(ev.t, 'hit', 420); return; }
  if (ev.k === 'phase') { fxClass(ev.t, 'enrage', 1200); $('vBattle').classList.remove('quake'); void $('vBattle').offsetWidth; $('vBattle').classList.add('quake'); fxSpawn('fx-redflash', { x: 0, y: 0, w: 0 }, '', 900); sfx('fail'); return; }
  if (ev.k === 'say') { fxSay(ev.t, ev.text); return; }
  if (ev.k === 'cine') { fxCine(ev); return; }
  if (ev.k === 'finish') { fxFinish(ev); return; }
  if (ev.k === 'swap') { fxClass('pet', 'enter-u', 600); return; }
}
const FX_HTML = {
  lei: '<svg viewBox="0 0 40 120"><path d="M24 0 L10 52 L22 52 L8 120 L34 44 L21 44 L32 0 Z"/></svg>',
  claw: '<i></i><i></i><i></i>', bless: '<b></b><b></b>', curse: '<b></b>', slash: '<i></i><i></i>', blade: '<i></i>', bone: '<b></b>', rock: '<b></b>', fire: '<b></b>', roar: '<b></b>', magic: '<b></b>', wave: '<b></b>', heal: '<b>✚</b>', tower: '<b></b>', shield: '<b></b>', crush: '<b>拳</b>',
};
function fxSay(id, text) { const c = cardOf(id); if (!c || !animOn()) return; $('bfx').querySelectorAll(`.bubble[data-u="${id}"]`).forEach(e => e.remove()); // one bubble per speaker; it stays long enough to read
  const life = Math.round(Math.min(7500, Math.max(3600, 2400 + plainLen(text) * 160)) * (SET.fast ? 0.75 : 1)); const p = fxAt(c);
  const d = fxSpawn('bubble ' + (id === 'hero' ? 'me' : ''), p, esc(text.replace(/^（|）$/g, '')), life); d.dataset.u = id; d.style.setProperty('--life', life + 'ms'); if (text.startsWith('（')) d.classList.add('act'); bubblePlace(d, c); }
function bubblePlace(d, c) { // keep every bubble whole on screen: inside the battle view, clear of the other bubbles, flipped under the card when there's no room above
  const V = $('bfx').getBoundingClientRect(), R = c.getBoundingClientRect(), w = d.offsetWidth, h = d.offsetHeight, cx = R.left - V.left + R.width / 2;
  let left = Math.max(4, Math.min(V.width - w - 4, cx - w / 2)), top = R.top - V.top - h - 8, below = false; if (top < 4) { top = R.bottom - V.top + 8; below = true; }
  const others = [...$('bfx').querySelectorAll('.bubble')].filter(e => e !== d && e.dataset.t).map(e => ({ l: +e.dataset.l, t: +e.dataset.t, r: +e.dataset.l + e.offsetWidth, b: +e.dataset.t + e.offsetHeight })); // placed spots, not mid-animation ones
  const free = (l, t) => t >= 4 && t + h <= V.height - 4 && !others.some(o => l < o.r + 3 && l + w > o.l - 3 && t < o.b + 3 && t + h > o.t - 3);
  const up = R.top - V.top - h - 8, dn = R.bottom - V.top + 8, cands = []; for (let n = 0; n < 5; n++) for (const [t, bl] of [[up - n * (h + 4), false], [dn + n * (h + 4), true]]) { for (const dx of [0, -w * 0.6, w * 0.6, -w * 1.2, w * 1.2]) cands.push([Math.max(4, Math.min(V.width - w - 4, left + dx)), t, bl, n]); for (let x = 4; x <= V.width - w - 4; x += Math.max(24, w / 2)) cands.push([x, t, bl, n + 1]); }
  const lap = (l, t) => others.reduce((a, o) => a + Math.max(0, Math.min(l + w, o.r + 3) - Math.max(l, o.l - 3)) * Math.max(0, Math.min(t + h, o.b + 3) - Math.max(t, o.t - 3)), 0) + (t < 4 || t + h > V.height - 4 ? 1e6 : 0);
  const dist = ([l, t, , n]) => n * 1000 + Math.abs(l + w / 2 - cx); // nearest row first, then nearest to the speaker
  const pickC = cands.filter(([l, t]) => free(l, t)).sort((a, b) => dist(a) - dist(b))[0] || cands.slice().sort((a, b) => lap(a[0], a[1]) - lap(b[0], b[1]))[0]; if (pickC) [left, top, below] = pickC; top = Math.max(4, Math.min(V.height - h - 4, top)); d.style.left = left + 'px'; d.style.top = top + 'px'; d.dataset.l = left; d.dataset.t = top; d.classList.toggle('below', below); d.style.setProperty('--tx', Math.max(10, Math.min(w - 10, cx - left)) + 'px'); }
function fxStamp(B) { if (!animOn() || $('bfx').querySelector('.stamp')) return; const t = B.win ? '胜' : B.fled ? '逃' : '败'; const d = el('div', 'fx stamp ' + (B.win ? 'win' : 'lose'), t); $('bfx').appendChild(d); sfx(B.win ? 'win' : 'lose'); }

/* ---------- screen transitions & big moments ---------- */
function stageTransition(m) { if (!animOn()) return; const s = $('stage'); s.classList.remove('tr-battle', 'tr-talk', 'tr-explore'); void s.offsetWidth; s.classList.add('tr-' + m); clearTimeout(UI.trT); UI.trT = setTimeout(() => s.classList.remove('tr-' + m), 800); }
function bigFlash(text, cls = '') { if (!animOn() || STATE.mode !== 'play') return; const d = el('div', 'bigflash ' + cls, `<span>${esc(text)}</span>`); $('stage').appendChild(d); setTimeout(() => d.remove(), 2200); }
