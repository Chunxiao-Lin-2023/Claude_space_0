/* ================= UI: layout, log, dialogue, actions, battle board ================= */
const UI = { layout: '', tab: 'hero', nav: null, selFoe: null };
function layout() {
  const w = innerWidth, h = innerHeight; const L = w >= 1000 ? 'wide' : w >= 700 || (h <= 500 && w >= 600) ? 'mid' : 'narrow';
  const b = document.body; for (const k of ['wide', 'mid', 'narrow']) b.classList.toggle(k, L === k); b.classList.toggle('short', h <= 500); b.classList.toggle('touch', IS_TOUCH);
  if (UI.layout !== L) { UI.layout = L; UI.nav = null; refresh(); } bannerDraw();
}
addEventListener('resize', () => { clearTimeout(UI.rsT); UI.rsT = setTimeout(() => { layout(); if (STATE.mode === 'title') titleDraw(); }, 80); });
addEventListener('orientationchange', () => setTimeout(layout, 150));
function toast(t) { const d = el('div', '', esc(t)); $('toast').appendChild(d); setTimeout(() => d.remove(), 2200); while ($('toast').children.length > 3) $('toast').firstChild.remove(); }

/* ---------- log ---------- */
function logLine(html, cls = '') { const L = $('log'); if (!L) return; L.appendChild(el('div', 'ln ' + cls, html)); while (L.children.length > 240) L.firstChild.remove(); requestAnimationFrame(() => { L.scrollTop = L.scrollHeight; }); if (NETROLE === 'host') netLog(html, cls); }
/* ---------- dialogue ---------- */
let DLG = null;
function dlgShow(o) {
  logLine(o.who ? `<span class="who">${o.icon ? o.icon + ' ' : ''}${esc(o.who)}</span>${o.text}` : o.text, 'say ' + (o.who ? '' : 'nar') + (o.mine ? ' mine' : ''));
  if (window.__dbg && __dbg.auto) return Promise.resolve();
  return new Promise(res => { DLG = { o, res }; renderDlg(); netSync(); });
}
function dlgChoose(opts) {
  if (window.__dbg && __dbg.auto) { const i = __dbg.pick ? __dbg.pick(opts.map(o => o.t)) : opts.findIndex(o => !o.dis); logLine('▸ ' + opts[i].t, 'say mine'); return Promise.resolve(i); }
  return new Promise(res => { DLG = { choice: opts, res }; renderDlg(); netSync(); });
}
function dlgPick(i) { // advance (i = -1) or choose option i
  if (!DLG) return; if (NETROLE === 'guest') { if (!myControl()) { toast('现在是队友在操作'); return; } netSend({ t: 'dlg', i }); return; } if (NETROLE === 'host' && !myControl()) { toast('现在是队友在操作'); return; }
  if (DLG.choice) { if (i < 0 || !DLG.choice[i] || DLG.choice[i].dis) return; const r = DLG.res; logLine('▸ ' + DLG.choice[i].t, 'say mine'); DLG = null; sfx('click'); renderDlg(); r(i); }
  else { const r = DLG.res; DLG = null; sfx('click'); renderDlg(); r(); }
  netSync();
}
function renderDlg() {
  const D = $('dlg'); if (!DLG) { D.classList.remove('on'); D.innerHTML = ''; renderActs(); return; }
  D.classList.add('on'); $('acts').style.display = 'none';
  if (DLG.choice) { D.innerHTML = `<div class="ch">${DLG.choice.map((o, i) => `<button class="chb" ${o.dis ? 'disabled' : ''} data-i="${i}">${o.t}</button>`).join('')}</div>`; D.onclick = null; D.querySelectorAll('.chb').forEach(b => b.onclick = e => { e.stopPropagation(); dlgPick(+b.dataset.i); }); }
  else { const o = DLG.o; D.innerHTML = `${o.who ? `<div class="who"><span class="ic">${o.icon || ''}</span>${esc(o.who)}</div>` : ''}<div class="tx">${o.text}</div><div class="nx">点击继续 ▼</div>`; D.onclick = () => dlgPick(-1); }
  requestAnimationFrame(() => { const L = $('log'); L.scrollTop = L.scrollHeight; });
}
function dlgClose() { if (DLG && !DLG.choice) { const r = DLG.res; DLG = null; r(); } DLG = null; renderDlg(); }
addEventListener('keydown', e => { if (STATE.mode !== 'play' || e.target.tagName === 'INPUT') return;
  if (DLG && !DLG.choice && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); dlgPick(-1); return; }
  if (DLG && DLG.choice && /^[1-9]$/.test(e.key)) { dlgPick(+e.key - 1); return; }
  if (NETROLE === 'guest') return;
  if (STATE.battle && /^[1-9]$/.test(e.key)) { const b = $('acts').querySelectorAll('.skb')[+e.key - 1]; if (b && !b.disabled) b.click(); return; }
  if (!DLG && !STATE.battle && !STATE.scene) { const k = { ArrowUp: 'n', w: 'n', ArrowDown: 's', s: 's', ArrowLeft: 'w', a: 'w', ArrowRight: 'e', d: 'e' }[e.key]; if (k) { const ex = exitsOf(C.loc); if (ex[k]) go(ex[k]); } if (e.key === 'f') explore(); } });

/* ---------- refresh (batched) ---------- */
let refT = 0;
function refresh() { if (refT) return; refT = requestAnimationFrame(() => { refT = 0; if (STATE.mode !== 'play' || !C) return; renderTop(); renderBanner(); if (!DLG) renderActs(); if (STATE.battle) renderBattle(true); else { $('board').classList.remove('on'); document.body.classList.remove('inbattle'); } renderSide(); if (UI.modal) openModal(UI.modal, true); }); }
function renderTop() {
  const s = charStats(), R = realmOf(C.lv); const co = NETROLE ? `<button class="tb net" onclick="openModal('coop')">🔗 ${myControl() ? '你在操作' : '队友操作中'}</button>` : `<button class="tb" onclick="openModal('coop')">🔗<span class="lb"> 联机</span></button>`;
  $('top').innerHTML = `<div class="srv">完美世界</div><div id="stat"><span class="lv">🧒 ${R.name} · ${C.lv}层</span><div class="bars2"><div class="bar" title="气血"><i style="width:${C.hp / s.hpMax * 100}%"></i></div><div class="bar mp" title="符力"><i style="width:${C.mp / s.mpMax * 100}%"></i></div><div class="bar exp" title="经验"><i style="width:${Math.min(100, C.exp / BAL.expNext(C.lv) * 100)}%"></i></div></div></div>
    <div class="sp"></div>${co}<button class="tb" onclick="openModal('set')">⚙️<span class="lb"> 设置</span></button>`;
}
function renderBanner() {
  const P = PLACES[C.loc], A = AREAS[P.area]; $('bnm').textContent = STATE.dungeon ? DUNGEONS[STATE.dungeon.id].name : P.name;
  $('bar').textContent = STATE.dungeon ? `第 ${STATE.dungeon.room + 1}/${DUNGEONS[STATE.dungeon.id].rooms.length} 关` : `${A.name}${P.lv ? ' · ' + P.lv[0] + '-' + P.lv[1] + ' 层' : ''}`;
  const q = curQ(), w = questWhere(); $('bq').innerHTML = `<b>${['', '石村', '出村', '补天阁', '百断山'][q.ch]} · ${q.title}</b><br>${questGoalText()}${w && w !== C.loc && route(C.loc, w) ? '<span class="go">▶ 去</span>' : ''}${q.rec && C.lv < q.rec ? `<br><span class="warn">建议 ${q.rec} 层</span>` : ''}`;
  $('bq').setAttribute('onclick', 'questGo()');
}
function questGo() { const w = questWhere(); if (w && w !== C.loc) autoWalk(w); else showTab('map'); }
/* ---------- actions ---------- */
function renderActs() {
  const A = $('acts'); if (DLG) { A.style.display = 'none'; return; } A.style.display = '';
  if (STATE.battle) return renderBattleActs();
  if (STATE.dungeon) { A.innerHTML = `<div class="dim" style="text-align:center;font-size:14px">${DUNGEONS[STATE.dungeon.id].name} · 第 ${STATE.dungeon.room + 1} 关</div>`; return; }
  if (STATE.scene || STATE.busy) { A.innerHTML = '<div class="dim" style="text-align:center;font-size:13px">……</div>'; return; }
  const P = PLACES[C.loc], ex = exitsOf(C.loc), qw = questWhere(); let h = '<div class="arow">' + Object.entries(ex).map(([d, id]) => { const T = PLACES[id]; return `<button class="ab dir" onclick="go('${id}')">${DIRS[d]} · ${T.name}${qw === id ? ' ★' : ''}${T.lv ? `<small>${T.lv[0]}-${T.lv[1]}层</small>` : ''}</button>`; }).join('') + '</div>';
  const acts = []; const sh = storyHere(); if (sh) acts.push(`<button class="ab q" onclick="storyHereRun()">▶ ${sh}</button>`);
  if (P.mobs) acts.push(`<button class="ab main" onclick="explore()">🔍 探索</button>`);
  if (ROAM && !ROAM.dead && ROAM.loc === C.loc && now() >= ROAM.start && now() < ROAM.end) acts.push(`<button class="ab wb" onclick="fightRoam()">⚔ ${MOBS[ROAM.id].name}</button>`);
  if (P.dungeon) acts.push(`<button class="ab main" onclick="enterDungeon('${P.dungeon}')">🏯 闯${DUNGEONS[P.dungeon].name}</button>`);
  const pa = P.acts || []; if (P.town && P.area !== 'xushen' && (C.loc === 'sc_willow' || C.loc === 'sc_street' || pa.includes('rest'))) acts.push(`<button class="ab" onclick="rest()">🛏 休息</button>`);
  if (pa.includes('train')) acts.push(`<button class="ab" onclick="train()">${C.loc === 'bt_train' ? '⚡ 挨雷劈' : '🪨 举石锁'}</button>`);
  if (pa.includes('arena')) acts.push(`<button class="ab main" onclick="openModal('arena')">🪞 挑战（${(arenaDaily(), C.arena.tries)}次）</button>`);
  if (acts.length) h += '<div class="arow">' + acts.join('') + '</div>';
  const people = (P.npcs || []).filter(n => !(n === 'qingfeng' && !C.story.f.qingfeng) && !(n === 'huolinger' && C.story.q < qi('q_bdgate')));
  if (people.length) h += '<div class="arow">' + people.map(n => { const N = NPCS[n], qo = questTalkOptions(n).length; return `<button class="ab npc ${qo ? 'q' : ''}" onclick="npcTalk('${n}')">${N.icon} ${N.name}${qo ? ' ❗' : ''}</button>`; }).join('') + '</div>';
  A.innerHTML = h;
}
function storyHere() { const q = curQ(); if (q.type === 'enter' && q.loc === C.loc) return q.title; return null; }
function storyHereRun() { const q = curQ(); if (q.type === 'enter') return questComplete(q); }
/* ---------- battle board ---------- */
function renderBattle(quiet) {
  const B = STATE.battle; if (!B) return; const bd = $('board'); bd.classList.add('on'); document.body.classList.add('inbattle');
  const me_ = B.units.find(u => u.kind === 'pc'); if (UI.selFoe && !B.units.some(u => u.id === UI.selFoe && u.alive)) UI.selFoe = null;
  const card = u => { const st = u.st.map(s => `<span style="color:${STATUS[s.k].c}">${STATUS[s.k].n}${s.k === 'shield' ? s.v : ''}</span>`).join('');
    return `<div class="uc ${u.side ? 'foe' : ''} ${u === me_ ? 'me' : ''} ${u.alive ? '' : 'dead'} ${UI.selFoe === u.id ? 'sel' : ''}" data-u="${u.id}" ${u.side ? `onclick="selFoe('${u.id}')"` : ''}><div class="n">${u.icon || ''} ${esc(u.name)}<small>${u.boss ? '首领' : u.lv + '层'}</small></div>
      <div class="bar"><i style="width:${u.hp / u.hpMax * 100}%"></i></div>${u.mpMax ? `<div class="bar mp"><i style="width:${u.mp / u.mpMax * 100}%"></i></div>` : ''}<div class="hpn"><span>${fmt(Math.ceil(u.hp))}/${fmt(u.hpMax)}</span></div>
      <div class="sts">${st}</div>${u.side && u.alive && u.intent ? `<div class="int ${u.plan === 'charge' || u.intent.startsWith('⚠') ? 'chg' : ''}">${u.intent}</div>` : ''}</div>`; };
  bd.innerHTML = `<div class="side">${B.units.filter(u => u.side === 1).map(card).join('')}</div><div class="side">${B.units.filter(u => u.side === 0).map(card).join('')}</div>`;
  const fresh = B.log.slice(STATE.shownFor === B.id ? STATE.shown : 0); fresh.forEach((h, i) => setTimeout(() => logLine(h, 'bat'), SET.fast || quiet ? 0 : i * 110)); STATE.shown = B.log.length; STATE.shownFor = B.id;
  if (fresh.length && B.fx) sfx(B.fx); if (!DLG) renderBattleActs();
  if (C.auto && NETROLE !== 'guest' && me_ && me_.alive && !B.acts[me_.id] && !B.over && !stOf(me_, 'stun')) { clearTimeout(UI.autoT); UI.autoT = setTimeout(() => { if (STATE.battle === B && !B.acts[me_.id] && !B.over) battleAct(botAct(B, me_)); }, window.__dbg && __dbg.instant ? 0 : SET.fast ? 150 : 700); }
}
function selFoe(id) { UI.selFoe = id; sfx('click'); renderBattle(true); }
function renderBattleActs() {
  const B = STATE.battle, A = $('acts'); if (!B) return; const u = B.units.find(x => x.kind === 'pc');
  if (B.over) { A.innerHTML = `<div class="dim" style="text-align:center">${B.win ? '赢了！' : B.fled ? '跑掉了' : '……'}</div>`; return; }
  if (!u || !u.alive) { A.innerHTML = '<div class="dim" style="text-align:center">……</div>'; return; }
  const sk = u.sk.map(id => { const S = SKILLS[id], cd = u.cd[id] || 0, no = u.mp < S.mp; return `<button class="skb" ${cd || no ? 'disabled' : ''} onclick="pickSkill('${id}')" title="${esc(S.desc)}"><span class="i">${S.icon}</span>${S.name}${S.mp ? `<span class="c">${S.mp}</span>` : ''}${cd ? `<span class="cd">${cd}</span>` : ''}</button>`; }).join('');
  const heal = ['milk', 'herb', 'meat', 'lingyao', 'baoyao'].filter(i => itemN(i));
  A.innerHTML = `<div class="arow">${sk}</div><div class="arow">${heal.map(i => `<button class="ab sm" onclick="battleAct({item:'${i}'})">${ITEMS[i].icon}${itemN(i)}</button>`).join('')}
    <button class="ab sm" onclick="battleAct({flee:1})" ${B.flee ? '' : 'disabled'}>🏃 跑</button><button class="ab sm ${C.auto ? 'q' : ''}" onclick="toggleAuto()">🤖 ${C.auto ? '自动中' : '自动'}</button></div>`;
}
function pickSkill(id) { battleAct({ sk: id, tgt: SKILLS[id].tgt === 'enemy' ? UI.selFoe : null }); }
function toggleAuto() { C.auto = !C.auto; save(); renderBattle(true); netSync(); }
function battleEndUI() { document.body.classList.remove('inbattle'); UI.selFoe = null; $('board').classList.remove('on'); refresh(); }
