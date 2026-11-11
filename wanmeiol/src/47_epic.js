/* ================= climaxes: making the big moments feel big =================
   Story side
     cine(text, kind)   a full-screen line over the location painting (no paper box). kind: '' (night ink), 'mem' (a memory, sepia), 'card' (chapter title)
     chapterCard(no, title, sub)
   Battle side — pass `epic` in a fight spec (or a dungeon boss room):
     { name, sub, seal, intro:[lines], phase:'line at half health', low:{who, t}, end:[lines] }
     · a boss card (huge name, epithet, a few lines) before the first turn, with the boss music
     · at half health the boss's line crosses the screen
     · 绝境: the first time 石昊 drops under 30% (or would fall) someone's words come back to him — he recovers 25% 气血,
       shakes off bad effects and hits 30% harder for 3 rounds. Once per fight.
     · the killing blow flashes white, then the closing lines.
   Battle overlays are recorded as events (k:'cine' / 'finish'), so a co-op partner sees them too, and the playback waits for them. */
const cine = (text, kind = '') => dlgShow({ who: '', text, cine: kind || 'ink' });
const chapterCard = async (no, title, sub = '') => { await cine(`<div class="cc"><small>${no}</small><b>${title}</b>${sub ? `<i>${sub}</i>` : ''}</div>`, 'card'); if (STATE.bridgeQ) await playBridge(); };
const plainLen = t => String(t || '').replace(/<[^>]+>/g, '').length;
const cineMs = ev => ev.k === 'finish' ? 900 : Math.min(4600, 2000 + plainLen(ev.text) * 75) * (SET.fast ? 0.7 : 1);
const EPIC_BAD = ['stun', 'bleed', 'burn', 'poison', 'weak', 'bound', 'brk', 'mark', 'dark'];

/* ---------- battle hooks (called from the engine) ---------- */
function epicLow(B, d) { // 绝境
  const E = B.epic; if (!E || !E.low || B.burst || d.kind !== 'pc' || d.hp >= d.hpMax * 0.3) return; B.burst = 1; if (d.hp <= 0) d.hp = 1;
  const h = Math.round(d.hpMax * 0.25); d.hp = Math.min(d.hpMax, d.hp + h); d.st = d.st.filter(s => !EPIC_BAD.includes(s.k)); addSt(d, { k: 'burst', t: 3, v: 0.3 });
  fxe(B, { k: 'cine', cls: 'burst', who: E.low.who || '', text: E.low.t }); blog(B, `<span class="cine">${E.low.who ? `<b>${esc(E.low.who)}</b>　` : ''}${E.low.t}</span>`);
  fxe(B, { k: 'heal', t: d.id, v: h, hp: hpr(d) }); blog(B, `<span class="phase">绝境！${uName(d)} 气血回复 ${h}，身上的伤病一扫而空，接下来 3 回合攻击 +30%</span>`); }
function epicPhase(B, d) { const E = B.epic; if (!E || !E.phase) return; fxe(B, { k: 'cine', cls: 'phase', who: d.name, text: E.phase }); blog(B, `<span class="cine red">${E.phase}</span>`); }
function epicKill(B, d) { if (B.epic && d.side === 1 && (d.boss || alive(B, 1).length === 0)) fxe(B, { k: 'finish', t: d.id }); }
function epicEnd(B) { const E = B.epic; if (!E || !E.end || !E.end.length) return; const t = E.end.join('<br>'); fxe(B, { k: 'cine', cls: 'end', text: t }); blog(B, `<span class="cine">${t}</span>`); }

/* ---------- battle overlays ---------- */
function fxBossCard(B) { const E = B.epic, intro = E.intro || [], dur = Math.round((2600 + intro.length * 1000) * (SET.fast ? 0.75 : 1));
  const d = el('div', 'fx bosscard', `<div class="bc-ink"></div><div class="bc-sub">${esc(E.sub || '')}</div><div class="bc-name">${esc(E.name)}</div><div class="bc-seal">${esc(E.seal || '首领')}</div><div class="bc-lines">${intro.map((t, i) => `<div class="bc-line" style="animation-delay:${0.9 + i * 0.95}s">${t}</div>`).join('')}</div><div class="bc-skip">点击跳过</div>`);
  d.style.setProperty('--dur', dur + 'ms'); $('bfx').appendChild(d); sfx('epic'); $('vBattle').classList.remove('quake'); void $('vBattle').offsetWidth; $('vBattle').classList.add('quake');
  const end = () => { if (!d.parentNode) return; d.classList.add('out'); setTimeout(() => d.remove(), 400); }; d.onclick = e => { e.stopPropagation(); end(); UI.animEnd = Math.min(UI.animEnd, now() + 200); setTimeout(() => { if (STATE.battle && STATE.battle.id === B.id) renderBattle(true); }, 260); };
  setTimeout(end, dur); return dur; }
function fxCine(ev) { $('bfx').querySelectorAll('.cineband').forEach(e => e.remove()); const ms = cineMs(ev);
  const d = el('div', 'fx cineband ' + (ev.cls || ''), `${ev.who ? `<small>${esc(ev.who)}</small>` : ''}<span>${ev.text}</span>`); d.style.setProperty('--dur', ms + 'ms'); $('bfx').appendChild(d); $('bfx').classList.add('cining'); clearTimeout(UI.cineT); UI.cineT = setTimeout(() => { d.remove(); $('bfx').classList.remove('cining'); }, ms); // speech bubbles step aside while the band is up
  if (ev.cls === 'burst') { fxSpawn('fx-burstflash', { x: 0, y: 0, w: 0 }, '', 1400); fxClass('hero', 'bursting', 1600); sfx('level'); }
  else if (ev.cls === 'phase') sfx('fail'); else sfx('magic'); }
function fxFinish(ev) { const c = cardOf(ev.t); fxSpawn('fx-whiteflash', { x: 0, y: 0, w: 0 }, '', 900); if (c) fxSpawn('fx-inkburst', fxAt(c), '<b></b><b></b><b></b>', 1100);
  $('vBattle').classList.remove('quake'); void $('vBattle').offsetWidth; $('vBattle').classList.add('quake'); sfx('crit'); }
