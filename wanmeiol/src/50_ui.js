/* ================= UI: one screen at a time =================
   探索 (dark green): location, what just happened, the quest line and what you can do here.
   对话 (paper): who is speaking (a seal with their name), the line, ▼ to continue or the choices.
   战斗 (dark red): enemies on top, what happened this round, your side, the 宝术 bar.
   The full text record, the memoir and the bestiary live behind 📜 in the top bar. */
const UI = { layout: '', tab: 'hero', nav: null, selFoe: null, hist: [], cur: null, logTab: 'log' };
function layout() {
  const w = innerWidth, h = innerHeight, short = h <= 500, narrow = w < 700 && !short, cols = (w >= 760 && !short) || (short && w >= 600);
  const b = document.body; b.classList.toggle('narrow', narrow); b.classList.toggle('short', short); b.classList.toggle('cols', cols); b.classList.toggle('touch', IS_TOUCH);
  const L = (narrow ? 'n' : '') + (short ? 's' : '') + (cols ? 'c' : ''); if (UI.layout !== L) { UI.layout = L; refresh(); } bannerDraw();
}
addEventListener('resize', () => { clearTimeout(UI.rsT); UI.rsT = setTimeout(() => { layout(); if (STATE.mode === 'title') titleDraw(); }, 80); });
addEventListener('orientationchange', () => setTimeout(layout, 150));
function toast(t) { const d = el('div', '', esc(t)); $('toast').appendChild(d); setTimeout(() => d.remove(), 2200); while ($('toast').children.length > 3) $('toast').firstChild.remove(); }
function applyFont() { document.documentElement.style.fontSize = [15, 17, 19.5][SET.fs || 0] + 'px'; }
applyFont();
const curMode = () => DLG ? 'talk' : STATE.battle ? 'battle' : 'explore';
function applyMode() { const m = curMode(), b = document.body; for (const k of ['explore', 'talk', 'battle']) b.classList.toggle('m-' + k, m === k); if (m !== UI.lastMode) { UI.lastMode = m; if (m !== 'explore' && UI.nav && UI.nav !== 'log') { UI.nav = null; renderSide(); } musicMode(); if (m === 'explore') setTimeout(bannerDraw, 0); } if (m === 'talk') talkBgDraw(); }

/* ---------- log (kept for 📜 记录 and co-op; the explore screen shows the latest few lines) ---------- */
function logLine(html, cls = '') { const L = $('log'); if (!L) return; L.appendChild(el('div', 'ln ' + cls, html)); while (L.children.length > 300) L.firstChild.remove(); if (NETROLE === 'host') netLog(html, cls); UI.logDirty = 1; if (STATE.mode === 'play') { clearTimeout(UI.feedT); UI.feedT = setTimeout(() => { renderFeed(); if (UI.nav === 'log') renderSide(); }, 30); } }
function feedLines(max = 5) { const out = []; const kids = $('log').children; for (let i = kids.length - 1; i >= 0 && out.length < max; i--) { const d = kids[i]; if (d.classList.contains('loc')) break; if (d.classList.contains('bat') || d.classList.contains('say')) continue; out.unshift(d); } return out; }
function renderFeed() { const F_ = $('feed'); if (!F_) return; const L = feedLines(); F_.innerHTML = L.map((d, i) => `<div class="${d.className}${i < L.length - 2 ? ' old' : ''}">${d.innerHTML}</div>`).join(''); }

/* ---------- dialogue ---------- */
let DLG = null;
const SEAL_C = { shicun: '#b3342a', butian: '#2f4f86', qf: '#2f7a6a', other: '#4b5a2e', foe: '#5a2e5e' };
const SEAL_NAMED = { 风狈: 'foe', 烈老: 'foe', 雨族高手: 'foe', 守门弟子: 'butian', 雷池师兄: 'butian', 补天阁弟子: 'butian', 外门师兄: 'butian', 老仆: 'other', 云曦: 'other', 石毅: 'other', 外门弟子: 'butian' };
function sealOf(o) { if (!o.who) return null; if (o.mine) return { n: o.who, c: '#a8781e', t: '' }; const N = o.npc && NPCS[o.npc]; const fac = N ? N.fac : SEAL_NAMED[o.who] || 'other'; return { n: o.who, c: SEAL_C[fac] || SEAL_C.other, t: N ? N.title : '' }; }
const sealHtml = (s, cls = '') => s ? `<span class="seal ${cls} ${[...s.n].length > 3 ? 'long' : ''}" style="--sc:${s.c}">${esc(s.n)}</span>` : '';
function journalAdd(o) { if (UI.jEntry && NETROLE !== 'guest') UI.jEntry.l.push(o.choice ? ['▸', o.choice] : [o.who || '', o.text, o.mine ? 1 : 0]); }
function dlgShow(o) {
  logLine(o.who ? `<span class="who">${esc(o.who)}</span>${o.text}` : o.text, 'say ' + (o.who ? '' : 'nar') + (o.mine ? ' mine' : '')); journalAdd(o);
  if (UI.cur) { UI.hist.push(UI.cur); if (UI.hist.length > 3) UI.hist.shift(); } UI.cur = o;
  if (window.__dbg && __dbg.auto) return Promise.resolve();
  return new Promise(res => { DLG = { o, res }; renderDlg(); netSync(); });
}
function dlgChoose(opts, prompt) {
  if (prompt) { if (UI.cur) { UI.hist.push(UI.cur); if (UI.hist.length > 3) UI.hist.shift(); } UI.cur = { who: '', text: prompt }; }
  if (window.__dbg && __dbg.auto) { const i = __dbg.pick ? __dbg.pick(opts.map(o => o.t)) : opts.findIndex(o => !o.dis); logLine('▸ ' + opts[i].t, 'say mine'); journalAdd({ choice: opts[i].t }); return Promise.resolve(i); }
  return new Promise(res => { DLG = { choice: opts, res }; renderDlg(); netSync(); });
}
function dlgPick(i) { // advance (i = -1) or choose option i
  if (!DLG || DLG.rune) return; if (NETROLE === 'guest') { if (!myControl()) { toast('现在是队友在操作'); return; } netSend({ t: 'dlg', i }); return; } if (NETROLE === 'host' && !myControl()) { toast('现在是队友在操作'); return; }
  if (DLG.choice) { if (i < 0 || !DLG.choice[i] || DLG.choice[i].dis) return; const r = DLG.res, t = DLG.choice[i].t; logLine('▸ ' + t, 'say mine'); journalAdd({ choice: t }); DLG = null; sfx('click'); renderDlg(); r(i); }
  else { const r = DLG.res; DLG = null; sfx('click'); renderDlg(); r(); }
  netSync();
}
function dlgCtx() { return { cur: UI.cur, hist: UI.hist.slice(-2) }; }
function renderDlg() {
  const D = $('dlg'); applyMode(); if (!DLG) { D.innerHTML = ''; refresh(); return; }
  const ctx = DLG.ctx || dlgCtx(), P = C && PLACES[C.loc], q = C && curQ();
  const head = `<div class="tplace">${P ? (STATE.dungeon ? DUNGEONS[STATE.dungeon.id].name : P.name) : ''}<span>${q ? CH_NAMES[q.ch] : ''}</span></div>`;
  const histH = h => h.length ? `<div class="hist">${h.map(x => `<div>${x.who ? `<span class="hw">${esc(x.who)}</span>` : ''}${x.text}</div>`).join('')}</div>` : '';
  const lineH = o => { const s = sealOf(o); return `<div class="line">${s ? `<div>${sealHtml(s, o.mine ? 'me' : '')}${s.t ? `<div class="ttl">${esc(s.t)}</div>` : ''}</div>` : ''}<div class="tx ${o.who ? '' : 'nar'} ${o.mine ? 'mine' : ''}">${o.text}</div></div>`; };
  if (DLG.rune) D.innerHTML = head + runeHtml(DLG.rune);
  else if (DLG.choice) { D.innerHTML = head + histH(ctx.hist.slice(-1)) + (ctx.cur ? lineH(ctx.cur) : '') + `<div class="ch">${DLG.choice.map((o, i) => `<button class="chb" ${o.dis ? 'disabled' : ''} data-i="${i}">${o.t}</button>`).join('')}</div>`; D.onclick = null; D.querySelectorAll('.chb').forEach(b => b.onclick = e => { e.stopPropagation(); dlgPick(+b.dataset.i); }); }
  else { D.innerHTML = head + histH(ctx.hist) + lineH(DLG.o) + '<div class="nx">点击继续 ▼</div>'; D.onclick = () => dlgPick(-1); }
  if (DLG.rune) D.onclick = null; D.scrollTop = D.scrollHeight;
}
function dlgClose() { if (DLG && !DLG.choice && !DLG.rune) { const r = DLG.res; DLG = null; r(); } DLG = null; UI.hist = []; UI.cur = null; renderDlg(); }
addEventListener('keydown', e => { if (STATE.mode !== 'play' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'Escape' && UI.nav) { navTo('adv'); return; }
  if (DLG && !DLG.choice && !DLG.rune && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); dlgPick(-1); return; }
  if (DLG && DLG.choice && /^[1-9]$/.test(e.key)) { dlgPick(+e.key - 1); return; }
  if (NETROLE === 'guest' && !myControl()) return;
  if (STATE.battle && /^[1-9]$/.test(e.key)) { const b = $('bacts').querySelectorAll('.skb')[+e.key - 1]; if (b && !b.disabled) b.click(); return; }
  if (!DLG && !STATE.battle && !STATE.scene && !UI.nav) { const k = { ArrowUp: 'n', w: 'n', ArrowDown: 's', s: 's', ArrowLeft: 'w', a: 'w', ArrowRight: 'e', d: 'e' }[e.key]; if (k) { const ex = exitsOf(C.loc); if (ex[k]) go(ex[k]); } if (e.key === 'f') explore(); } });

/* ---------- refresh (batched) ---------- */
let refT = 0;
function refresh() { if (refT) return; refT = requestAnimationFrame(() => { refT = 0; if (STATE.mode !== 'play' || !C) return; applyMode(); musicMode(); renderTop();
  if (curMode() === 'explore') { renderBanner(); renderDesc(); renderFeed(); renderActs(); } if (STATE.battle) renderBattle(true); renderSide(); if (UI.modal) openModal(UI.modal, true); }); }
const CH_NAMES = ['', '第一章 · 石村', '第二章 · 出村', '第三章 · 补天阁', '第四章 · 百断山'];
function renderTop() {
  const s = charStats(), R = realmOf(C.lv); const co = NETROLE ? `<button class="tb net" onclick="openModal('coop')">🔗 ${myControl() ? '你在操作' : '队友操作中'}</button>` : `<button class="tb" onclick="openModal('coop')" title="联机">🔗</button>`;
  $('top').innerHTML = `<div class="who">石昊</div><div class="lv">${R.name} ${C.lv}层</div><div class="bars3"><div class="bar" title="气血 ${Math.ceil(C.hp)}/${s.hpMax}"><i style="width:${C.hp / s.hpMax * 100}%"></i></div><div class="bar mp" title="符力"><i style="width:${C.mp / s.mpMax * 100}%"></i></div><div class="bar exp" title="经验"><i style="width:${Math.min(100, C.exp / BAL.expNext(C.lv) * 100)}%"></i></div></div>
    <div class="sp"></div><button class="tb ${UI.nav === 'log' ? 'on' : ''}" onclick="navTo('log')">📜 记录</button>${co}<button class="tb" onclick="openModal('set')" title="设置">⚙️</button>`;
}
function renderBanner() {
  const P = PLACES[C.loc], A = AREAS[P.area]; $('bnm').textContent = STATE.dungeon ? DUNGEONS[STATE.dungeon.id].name : P.name;
  $('bar').textContent = STATE.dungeon ? `第 ${STATE.dungeon.room + 1}/${DUNGEONS[STATE.dungeon.id].rooms.length} 关` : `${A.name}${P.lv ? ' · ' + P.lv[0] + '-' + P.lv[1] + ' 层' : ''}${isNight() ? ' · 夜' : ''}`;
  const q = curQ(), w = questWhere(); $('bq').innerHTML = `<b>${CH_NAMES[q.ch].split(' · ')[1] || ''} · ${q.title}</b>　${questGoalText()}${w && w !== C.loc && route(C.loc, w) ? '<span class="go">▶ 去</span>' : ''}${q.rec && C.lv < q.rec ? `　<span class="warn">建议 ${q.rec} 层</span>` : ''}`;
  $('bq').setAttribute('onclick', 'questGo()');
}
function renderDesc() { const P = PLACES[C.loc]; if (STATE.dungeon) { const D = DUNGEONS[STATE.dungeon.id], R = D.rooms[STATE.dungeon.room]; $('desc').innerHTML = `<b>【${R.name}】</b>${R.text}`; return; } $('desc').innerHTML = isNight() && P.night ? `<span class="night">${P.night}</span>` : pdesc(P); }
function questGo() { const w = questWhere(); if (w && w !== C.loc) autoWalk(w); else navTo('map'); }
/* ---------- actions ---------- */
function renderActs() {
  const A = $('acts'); if (STATE.battle) return;
  if (STATE.dungeon) { A.innerHTML = `<div class="wait">${DUNGEONS[STATE.dungeon.id].name} · 第 ${STATE.dungeon.room + 1} 关……</div>`; return; }
  if (STATE.scene || STATE.busy) { A.innerHTML = '<div class="wait">……</div>'; return; }
  const P = PLACES[C.loc], ex = exitsOf(C.loc), qw = questWhere(); const g = (l, xs) => xs.length ? `<div class="grp"><span class="gl">${l}</span>${xs.join('')}</div>` : '';
  const dirs = Object.entries(ex).map(([d, id]) => { const T = PLACES[id]; return `<button class="ab dir ${qw === id ? 'q' : ''}" onclick="go('${id}')">${DIRS[d]} · ${T.name}${qw === id ? ' ★' : ''}${T.lv ? `<small>${T.lv[0]}-${T.lv[1]}层</small>` : ''}</button>`; });
  const acts = []; const sh = storyHere(); if (sh) acts.push(`<button class="ab q" onclick="storyHereRun()">▶ ${sh}</button>`);
  if (P.mobs) acts.push(`<button class="ab main" onclick="explore()">🔍 探索</button>`);
  if (ROAM && !ROAM.dead && ROAM.loc === C.loc && now() >= ROAM.start && now() < ROAM.end) acts.push(`<button class="ab wb" onclick="fightRoam()">⚔ ${MOBS[ROAM.id].name}</button>`);
  if (P.dungeon) acts.push(`<button class="ab main" onclick="enterDungeon('${P.dungeon}')">🏯 闯${DUNGEONS[P.dungeon].name}</button>`);
  const pa = P.acts || []; if (P.town && P.area !== 'xushen' && (C.loc === 'sc_willow' || C.loc === 'sc_street' || pa.includes('rest'))) acts.push(`<button class="ab" onclick="rest()">🛏 休息</button>`);
  if (pa.includes('train')) acts.push(`<button class="ab" onclick="train()">${C.loc === 'bt_train' ? '⚡ 挨雷劈' : '🪨 举石锁'}</button>`);
  if (pa.includes('arena')) acts.push(`<button class="ab main" onclick="openModal('arena')">🪞 挑战（${(arenaDaily(), C.arena.tries)}次）</button>`);
  const people = npcsHere(C.loc).map(n => { const N = NPCS[n], qo = questTalkOptions(n).length; return `<button class="ab npc ${qo ? 'q' : ''}" onclick="npcTalk('${n}')">${N.name}${qo ? ' ❗' : ''}</button>`; });
  A.innerHTML = g('做事', acts) + g('说话', people) + g('去往', dirs);
}
function storyHere() { const q = curQ(); if (q.type === 'enter' && q.loc === C.loc) return q.title; return null; }
function storyHereRun() { const q = curQ(); if (q.type === 'enter') return questComplete(q); }
/* ---------- battle screen ---------- */
function renderBattle(quiet) {
  const B = STATE.battle; if (!B) return; applyMode();
  const me_ = B.units.find(u => u.kind === 'pc'); if (UI.selFoe && !B.units.some(u => u.id === UI.selFoe && u.alive)) UI.selFoe = null;
  const card = u => { const st = u.st.filter(s => s.k !== 'rage').map(s => `<span style="color:${STATUS[s.k].c}">${STATUS[s.k].n}${s.k === 'shield' ? s.v : ''}</span>`).join(''); const wk = u.side && u.mob ? knownWeak(u.mob) : [];
    return `<div class="uc ${u.side ? 'foe' : 'ally'} ${u === me_ ? 'me' : ''} ${u.alive ? '' : 'dead'} ${UI.selFoe === u.id ? 'sel' : ''} ${u.raged ? 'rage' : ''}" data-u="${u.id}" ${u.side ? `onclick="selFoe('${u.id}')"` : ''}><div class="n">${esc(u.name)}<small>${u.boss ? '首领' : u.lv + '层'}</small>${wk.length ? `<span class="wk">弱${wk.map(e => EL[e].i).join('')}</span>` : ''}</div>
      <div class="bar"><i style="width:${u.hp / u.hpMax * 100}%"></i></div>${u.mpMax ? `<div class="bar mp"><i style="width:${u.mp / u.mpMax * 100}%"></i></div>` : ''}<div class="hpn"><span>${fmt(Math.ceil(u.hp))}/${fmt(u.hpMax)}</span></div>
      <div class="sts">${st}</div>${u.side && u.alive && u.intent ? `<div class="int ${u.plan === 'charge' || u.intent.startsWith('⚠') ? 'chg' : ''}">${u.intent}</div>` : ''}</div>`; };
  $('bhead').innerHTML = `${esc(B.title || '战斗')}<small>第 ${B.round} 回合</small>`;
  $('foes').innerHTML = B.units.filter(u => u.side === 1).map(card).join(''); $('party').innerHTML = B.units.filter(u => u.side === 0).map(card).join('');
  let k = B.log.length - 1; while (k > 0 && !B.log[k].includes('class="rd"')) k--; const start = Math.max(0, B.log.length - 12);
  $('bfeed').innerHTML = B.log.slice(start).map((h, i) => /class="bt"/.test(h) ? '' : `<div class="ln ${start + i < k ? 'old' : ''}">${h}</div>`).join(''); $('bfeed').scrollTop = $('bfeed').scrollHeight;
  const fresh = B.log.slice(STATE.shownFor === B.id ? STATE.shown : 0); for (const h of fresh) logLine(h, 'bat'); STATE.shown = B.log.length; STATE.shownFor = B.id;
  if (fresh.length && B.fx) sfx(B.fx); renderBattleActs();
  if (C.auto && NETROLE !== 'guest' && me_ && me_.alive && !B.acts[me_.id] && !B.over && !stOf(me_, 'stun')) { clearTimeout(UI.autoT); UI.autoT = setTimeout(() => { if (STATE.battle === B && !B.acts[me_.id] && !B.over) battleAct(botAct(B, me_)); }, window.__dbg && __dbg.instant ? 0 : SET.fast ? 150 : 700); }
}
function selFoe(id) { UI.selFoe = id; sfx('click'); renderBattle(true); }
function renderBattleActs() {
  const B = STATE.battle, A = $('bacts'); if (!B) return; const u = B.units.find(x => x.kind === 'pc');
  if (B.over) { A.innerHTML = `<div class="wait" style="color:#ffcfb8">${B.win ? '赢了！' : B.fled ? '跑掉了' : '……'}</div>`; return; }
  if (!u || !u.alive) { A.innerHTML = '<div class="wait">……</div>'; return; }
  const sk = u.sk.map(id => { const S = SKILLS[id], cd = u.cd[id] || 0, no = u.mp < S.mp, pl = profLevel(id); return `<button class="skb" ${cd || no ? 'disabled' : ''} onclick="pickSkill('${id}')" title="${esc(S.desc)}"><span class="i">${S.icon}</span>${S.name}${S.mp ? `<span class="c">${S.mp}</span>` : ''}${pl ? `<span class="pf">${PROF[pl].s}</span>` : ''}${cd ? `<span class="cd">${cd}</span>` : ''}</button>`; }).join('');
  const heal = ['milk', 'herb', 'meat', 'lingyao', 'baoyao'].filter(i => itemN(i));
  A.innerHTML = `<div class="arow">${sk}</div><div class="arow">${heal.map(i => `<button class="ab sm" onclick="battleAct({item:'${i}'})">${ITEMS[i].icon}${itemN(i)}</button>`).join('')}
    <button class="ab sm" onclick="battleAct({flee:1})" ${B.flee ? '' : 'disabled'}>🏃 跑</button><button class="ab sm ${C.auto ? 'q' : ''}" onclick="toggleAuto()">🤖 ${C.auto ? '自动中' : '自动'}</button></div>`;
}
function pickSkill(id) { battleAct({ sk: id, tgt: SKILLS[id].tgt === 'enemy' ? UI.selFoe : null }); }
function toggleAuto() { C.auto = !C.auto; save(); renderBattle(true); netSync(); }
function battleEndUI() { UI.selFoe = null; refresh(); }
