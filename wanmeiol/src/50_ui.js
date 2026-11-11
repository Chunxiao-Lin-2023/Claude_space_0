/* ================= UI: one screen at a time =================
   探索 (dark green): location, what just happened, the quest line and what you can do here.
   对话 (paper): who is speaking (a seal with their name), the line, ▼ to continue or the choices.
   战斗 (dark red): enemies on top, what happened this round, your side, the 宝术 bar.
   The full text record, the memoir and the bestiary live behind 📜 in the top bar. */
const UI = { layout: '', tab: 'hero', nav: null, selFoe: null, hist: [], cur: null, logTab: 'log' };
function layout() {
  const w = innerWidth, h = innerHeight, short = h <= 500, narrow = w < 700 && !short, cols = (w >= 760 && !short) || (short && w >= 600);
  const b = document.body; b.classList.toggle('narrow', narrow); b.classList.toggle('short', short); b.classList.toggle('cols', cols); b.classList.toggle('dock', cols && !short); b.classList.toggle('touch', IS_TOUCH);
  const L = (narrow ? 'n' : '') + (short ? 's' : '') + (cols ? 'c' : ''); if (UI.layout !== L) { UI.layout = L; refresh(); } bannerDraw();
}
addEventListener('resize', () => { clearTimeout(UI.rsT); UI.rsT = setTimeout(() => { layout(); if (STATE.mode === 'title') titleDraw(); }, 80); });
addEventListener('orientationchange', () => setTimeout(layout, 150));
function toast(t) { const d = el('div', '', esc(t)); $('toast').appendChild(d); setTimeout(() => d.remove(), 2200); while ($('toast').children.length > 3) $('toast').firstChild.remove(); }
function applyFont() { document.documentElement.style.fontSize = [15, 17, 19.5][SET.fs || 0] + 'px'; }
applyFont();
const curMode = () => DLG ? 'talk' : STATE.battle ? 'battle' : 'explore';
function applyMode(force) { const m = curMode(), b = document.body;
  // leaving a conversation: wait a moment — the next line usually follows at once, and flipping screens in between makes everything blink
  if (UI.lastMode === 'talk' && m !== 'talk' && !force) { if (!UI.leaveT) UI.leaveT = setTimeout(() => { UI.leaveT = 0; applyMode(true); if (STATE.mode === 'play' && C) refresh(); }, 140); return; }
  if (UI.leaveT) { clearTimeout(UI.leaveT); UI.leaveT = 0; } for (const k of ['explore', 'talk', 'battle']) b.classList.toggle('m-' + k, m === k); if (m !== UI.lastMode) { if (UI.lastMode && m === 'battle') stageTransition(m); UI.lastMode = m; atmoUpdate(); if (m !== 'explore' && UI.nav && UI.nav !== 'log') { UI.nav = null; renderSide(); } musicMode(); if (m === 'explore') setTimeout(bannerDraw, 0); } if (m === 'talk') talkBgDraw(); }

/* ---------- log (kept for 📜 记录 and co-op; the explore screen shows the latest few lines) ---------- */
function logLine(html, cls = '') { const L = $('log'); if (!L) return; L.appendChild(el('div', 'ln ' + cls, html)); while (L.children.length > 300) L.firstChild.remove(); if (NETROLE === 'host') netLog(html, cls); UI.logDirty = 1; if (STATE.mode === 'play') { clearTimeout(UI.feedT); UI.feedT = setTimeout(() => { renderFeed(); if (UI.nav === 'log') renderSide(); }, 30); } }
function feedLines(max = 5) { const out = []; const kids = $('log').children; for (let i = kids.length - 1; i >= 0 && out.length < max; i--) { const d = kids[i]; if (d.classList.contains('loc')) break; if (d.classList.contains('bat') || d.classList.contains('say') || d.classList.contains('rumor')) continue; out.unshift(d); } return out; }
function renderFeed() { const F_ = $('feed'); if (!F_) return; const L = feedLines(); F_.innerHTML = L.map((d, i) => { if (!d.dataset.n) d.dataset.n = ++UI.feedN; const nw = +d.dataset.n > (UI.feedSeen || 0); return `<div class="${d.className}${i < L.length - 2 ? ' old' : ''}${nw ? ' new' : ''}">${d.innerHTML}</div>`; }).join(''); UI.feedSeen = UI.feedN; }
UI.feedN = 0;

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
  if (!DLG || DLG.rune || DLG.mini) return; if (NETROLE === 'guest') { if (!myControl()) { toast('现在是队友在操作'); return; } netSend({ t: 'dlg', i }); return; } if (NETROLE === 'host' && !myControl()) { toast('现在是队友在操作'); return; }
  if (DLG.choice) { if (i < 0 || !DLG.choice[i] || DLG.choice[i].dis) return; const r = DLG.res, t = DLG.choice[i].t; logLine('▸ ' + t, 'say mine'); journalAdd({ choice: t }); DLG = null; sfx('click'); renderDlg(); r(i); }
  else { const r = DLG.res; DLG = null; sfx('click'); renderDlg(); r(); }
  netSync();
}
function dlgCtx() { return { cur: UI.cur, hist: UI.hist.slice(-2) }; }
function renderDlg() {
  const D = $('dlg'); applyMode(); if (!DLG) { D.onclick = null; $('vTalk').classList.remove('cine', 'mem', 'card'); refresh(); return; }
  const ctx = DLG.ctx || dlgCtx(), P = C && PLACES[C.loc], q = C && curQ();
  const head = `<div class="tplace">${P ? (STATE.dungeon ? DUNGEONS[STATE.dungeon.id].name : P.name) : ''}<span>${q ? CH_NAMES[q.ch] : ''}</span></div>`;
  const histH = h => h.length ? `<div class="hist">${h.map(x => `<div>${x.who ? `<span class="hw">${esc(x.who)}</span>` : ''}${x.text}</div>`).join('')}</div>` : '';
  const lineH = o => { const s = sealOf(o), nw = (o.who || '') !== UI.lastWho; UI.lastWho = o.who || ''; return `<div class="line ${nw ? 'newspk' : ''}">${s ? `<div>${sealHtml(s, o.mine ? 'me' : '')}${s.t ? `<div class="ttl">${esc(s.t)}</div>` : ''}</div>` : ''}<div class="tx ${o.who ? '' : 'nar'} ${o.mine ? 'mine' : ''}">${o.text}</div></div>`; };
  const cv = DLG.o && DLG.o.cine && !DLG.choice && !DLG.mini && !DLG.rune ? DLG.o.cine : ''; $('vTalk').classList.toggle('cine', !!cv); $('vTalk').classList.toggle('mem', cv === 'mem'); $('vTalk').classList.toggle('card', cv === 'card');
  if (cv) { D.innerHTML = `<div class="cine-t">${DLG.o.text}</div><div class="nx">▼</div>`; D.onclick = () => dlgPick(-1); }
  else if (DLG.mini) { D.innerHTML = head + miniHtml(DLG.mini); D.onclick = null; }
  else if (DLG.rune) D.innerHTML = head + runeHtml(DLG.rune);
  else if (DLG.choice) { D.innerHTML = head + histH(ctx.hist.slice(-1)) + (ctx.cur ? lineH(ctx.cur) : '') + `<div class="ch">${DLG.choice.map((o, i) => `<button class="chb" ${o.dis ? 'disabled' : ''} data-i="${i}">${o.t}</button>`).join('')}</div>`; D.onclick = null; D.querySelectorAll('.chb').forEach(b => b.onclick = e => { e.stopPropagation(); dlgPick(+b.dataset.i); }); }
  else { D.innerHTML = head + histH(ctx.hist) + lineH(DLG.o) + '<div class="nx">点击继续 ▼</div>'; D.onclick = () => dlgPick(-1); }
  if (DLG.rune) D.onclick = null; D.scrollTop = D.scrollHeight;
  const key = DLG.mini ? 'm' + DLG.mini.k : DLG.rune ? 'r' + DLG.rune.phase + DLG.rune.got.length + DLG.rune.k : DLG.choice ? 'c' + DLG.choice.map(o => o.t).join() : 'o' + DLG.o.text; D.classList.toggle('still', key === UI.dlgKey); UI.dlgKey = key;
}
function dlgClose() { if (DLG && !DLG.choice && !DLG.rune && !DLG.mini) { const r = DLG.res; DLG = null; r(); } DLG = null; UI.hist = []; UI.cur = null; renderDlg(); }
addEventListener('keydown', e => { if (STATE.mode !== 'play' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'Escape' && UI.nav) { navTo('adv'); return; }
  if (DLG && !DLG.choice && !DLG.rune && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); dlgPick(-1); return; }
  if (DLG && DLG.choice && /^[1-9]$/.test(e.key)) { dlgPick(+e.key - 1); return; }
  if (NETROLE === 'guest' && !myControl()) return;
  if (STATE.battle && /^[1-9]$/.test(e.key)) { const b = $('bacts').querySelectorAll('.skb')[+e.key - 1]; if (b && !b.disabled) b.click(); return; }
  if (!DLG && !STATE.battle && !STATE.scene && !UI.nav) { const k = { ArrowUp: 'n', w: 'n', ArrowDown: 's', s: 's', ArrowLeft: 'w', a: 'w', ArrowRight: 'e', d: 'e' }[e.key]; if (k) { const ex = exitsOf(C.loc); if (ex[k]) go(ex[k]); } if (e.key === 'f') explore(); } });

/* ---------- refresh (batched) ---------- */
let refT = 0;
function refresh() { if (refT) return; refT = requestAnimationFrame(() => { refT = 0; if (STATE.mode !== 'play' || !C) return; applyMode(); musicMode(); atmoUpdate(); renderTop();
  if (curMode() === 'explore') { renderBanner(); renderDesc(); renderFeed(); renderActs(); renderRumor(); } if (STATE.battle) renderBattle(true); renderSide(); if (UI.modal) openModal(UI.modal, true); }); }
const CH_NAMES = ['', '第一章 · 石村', '第二章 · 出村', '第三章 · 补天阁', '第四章 · 百断山', '第五章 · 皇都', '第六章 · 寿宴', '第七章 · 双石', '第八章 · 石皇', '第九章 · 七神', '第十章 · 宝界', '第十一章 · 登天', '第十二章 · 上界', '第十三章 · 至尊古台', '第十四章 · 银磨山', '第十五章 · 争霸', '第十六章 · 仙古', '第十七章 · 帝冲', '第十八章 · 帝关', '第十九章 · 边荒', '第二十章 · 黑水', '第二十一章 · 海瀑', '第二十二章 · 仙域', '第二十三章 · 安澜', '第二十四章 · 蛰伏', '第二十五章 · 清算', '第二十六章 · 天庭', '第二十七章 · 造化', '第二十八章 · 帝落', '第二十九章 · 八世', '第三十章 · 火灵儿', '第三十一章 · 仙王', '第三十二章 · 界海', '第三十三章 · 独断万古'];
function renderTop() {
  const s = charStats(), R = realmOf(C.lv); const co = NETROLE ? `<button class="tb net" onclick="openModal('coop')">🔗 ${myControl() ? '你在操作' : '队友操作中'}</button>` : `<button class="tb" onclick="openModal('coop')" title="联机">🔗</button>`;
  $('top').innerHTML = `<div class="who">石昊</div><div class="lv">${R.name} ${C.lv}层</div><div class="bars3"><div class="bar" title="气血 ${Math.ceil(C.hp)}/${s.hpMax}"><i style="width:${C.hp / s.hpMax * 100}%"></i></div><div class="bar mp" title="符力"><i style="width:${C.mp / s.mpMax * 100}%"></i></div><div class="bar exp" title="经验"><i style="width:${Math.min(100, C.exp / BAL.expNext(C.lv) * 100)}%"></i></div></div>
    <div class="sp"></div><button class="tb ${UI.nav === 'log' ? 'on' : ''}" onclick="navTo('log')">📜 记录</button>${co}<button class="tb" onclick="openModal('set')" title="设置">⚙️</button>`;
}
function renderBanner() {
  const P = PLACES[C.loc], A = AREAS[P.area]; $('bnm').textContent = STATE.dungeon ? DUNGEONS[STATE.dungeon.id].name : P.name;
  const exc = P.lv && !STATE.dungeon ? exCount(C.loc) : null;
  $('bar').innerHTML = STATE.dungeon ? `第 ${STATE.dungeon.room + 1}/${DUNGEONS[STATE.dungeon.id].rooms.length} 关` : `${A.name}${P.lv ? ' · ' + P.lv[0] + '-' + P.lv[1] + ' 层' : ''}${` · 第 ${C.day || 1} 天${isNight() ? ' · 夜' : (C.tick || 0) >= BAL.duskAt - 2 ? ' · 黄昏' : ''}`}${exc && exc.n ? ` · <span title="探索度：这里的凶兽种类和能采的东西">${exc.done ? '✓ 探索完成' : `探索 ${exc.have}/${exc.n}`}</span>` : ''}`;
  const q = curQ(), T = curTask(), w = T.where, nT = tasks().length; $('bq').innerHTML = `<span class="qk">${T.kind}</span><b>${esc(T.title)}</b>　${T.goal}${w && w !== C.loc && route(C.loc, w) ? '<span class="go">▶ 去</span>' : ''}${T.key === 'main' && q.rec && C.lv < q.rec ? `　<span class="warn">建议 ${q.rec} 层</span>` : ''}`;
  $('bqs').innerHTML = `任务<br><b>${nT}</b>`; $('bqs').classList.toggle('dot2', tasks().some(t => /可接/.test(t.kind) || / → 交给/.test(t.goal)));
  $('bq').setAttribute('onclick', 'questGo()');
  const key = C.loc + (STATE.dungeon ? STATE.dungeon.id + STATE.dungeon.room : ''); if (UI.bKey !== key) { const first = !UI.bKey; UI.bKey = key; if (!first && animOn()) for (const e of [$('banner'), $('desc'), $('acts')]) { e.classList.remove('swap'); void e.offsetWidth; e.classList.add('swap'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('swap'), 900); } }
}
function renderDesc() { const P = PLACES[C.loc]; if (STATE.dungeon) { const D = DUNGEONS[STATE.dungeon.id], R = D.rooms[STATE.dungeon.room]; $('desc').innerHTML = `<b>【${R.name}】</b>${R.text}`; return; } $('desc').innerHTML = isNight() && P.night ? `<span class="night">${P.night}</span>` : pdesc(P); }
function questGo() { const w = taskWhere(); if (w && w !== C.loc) autoWalk(w); else navTo('map'); }
/* ---------- actions ---------- */
function renderActs() {
  const A = $('acts'); if (STATE.battle) return;
  if (STATE.dungeon) { A.innerHTML = `<div class="wait">${DUNGEONS[STATE.dungeon.id].name} · 第 ${STATE.dungeon.room + 1} 关……</div>`; return; }
  if (STATE.scene || STATE.busy) { A.innerHTML = '<div class="wait">……</div>'; return; }
  const P = PLACES[C.loc], ex = exitsOf(C.loc), qw = taskWhere(); const g = (l, xs) => xs.length ? `<div class="grp"><span class="gl">${l}</span>${xs.join('')}</div>` : '';
  const dirs = Object.entries(ex).map(([d, id]) => { const T = PLACES[id], ec = T.lv ? exCount(id) : null; return `<button class="ab dir ${qw === id ? 'q' : ''}" onclick="go('${id}')">${DIRS[d]} · ${T.name}${qw === id ? ' ★' : ''}${ec && ec.done ? ' ✓' : ''}${T.lv ? `<small>${T.lv[0]}-${T.lv[1]}层</small>` : ''}</button>`; });
  const acts = []; const sh = storyHere(); if (sh) acts.push(`<button class="ab q" onclick="storyHereRun()">▶ ${sh}</button>`);
  if (P.mobs) acts.push(`<button class="ab main" onclick="explore()">🔍 探索</button>`);
  if (ROAM && !ROAM.dead && ROAM.loc === C.loc && now() >= ROAM.start && now() < ROAM.end) acts.push(`<button class="ab wb" onclick="fightRoam()">⚔ ${MOBS[ROAM.id].name}</button>`);
  if (P.dungeon) { acts.push(`<button class="ab main" onclick="enterDungeon('${P.dungeon}')">🏯 闯${DUNGEONS[P.dungeon].name}</button>`); if (C.dungeons[P.dungeon]) acts.push(`<button class="ab" onclick="enterDungeonHard('${P.dungeon}')">🏯 困难</button>`); }
  const pa = P.acts || []; if (P.town && P.area !== 'xushen') acts.push(`<button class="ab" onclick="rest()">🛏 休息</button>`); else if (P.mobs && !P.dungeon) acts.push(`<button class="ab" ${UI.campAt === C.loc + C.seenN ? 'disabled' : ''} onclick="camp()">🔥 歇脚</button>`);
  if (P.shop || P.town && P.area !== 'xushen') acts.push(`<button class="ab" onclick="UI.bagTab='shop';navTo('bag')">${P.shop ? '🛒 买卖' : '💰 卖东西'}</button>`);
  if (P.mobs && !P.dungeon) acts.push(`<button class="ab ${UI.autoEx ? 'q' : ''}" onclick="autoExplore()">🔁 ${UI.autoEx ? `停止自动探索（${UI.autoExN || 0}）` : '自动探索'}</button>`);
  acts.push(`<button class="ab ${C.auto ? 'q' : ''}" onclick="toggleAutoFight()" title="之后的战斗都自动打，战斗里随时能停">🤖 自动对战：${C.auto ? '开' : '关'}</button>`);
  if (pa.includes('train')) acts.push(`<button class="ab" onclick="train()">${C.loc === 'bt_train' ? '⚡ 挨雷劈' : '🪨 举石锁'}</button>`);
  if (pa.includes('arena')) acts.push(`<button class="ab main" onclick="openModal('arena')">🪞 挑战（${(arenaDaily(), C.arena.tries)}次）</button>`);
  if (canTeleport()) acts.push(`<button class="ab" onclick="teleport()">🌀 传送</button>`);
  const people = npcsHere(C.loc).map(n => { const N = NPCS[n], mk = npcMark(n); return `<button class="ab npc ${mk ? 'q' : ''}" onclick="npcTalk('${n}')">${N.name}${mk}</button>`; });
  A.innerHTML = g('做事', acts) + g('说话', people) + g('去往', dirs);
}
function storyHere() { const q = curQ(); if (q.type === 'enter' && q.loc === C.loc) return q.title; return null; }
function storyHereRun() { const q = curQ(); if (q.type === 'enter') return questComplete(q); }
/* ---------- battle screen ---------- */
function renderBattle(quiet) {
  const B = STATE.battle; if (!B) return; applyMode(); const play = fxPrepare(B); if (UI.enter) { $('bfx').innerHTML = ''; const card = B.epic && animOn() ? fxBossCard(B) : 0, t0 = card ? card + 300 : 550, intro = (B.ev || []).filter(e => e.k === 'say'); intro.forEach((e, i) => setTimeout(() => { if (STATE.battle && STATE.battle.id === B.id) fxSay(e.t, e.text); }, t0 + i * 1500));
    const hold = card || intro.length ? t0 + Math.max(0, intro.length - 1) * 1500 + 300 : 0; if (hold && animOn()) { UI.animEnd = now() + hold; setTimeout(() => { if (STATE.battle && STATE.battle.id === B.id && UI.animEnd <= now() + 50) { UI.animEnd = 0; renderBattle(true); } }, hold + 40); } }
  const me_ = B.units.find(u => u.kind === 'pc'); if (UI.selFoe && !B.units.some(u => u.id === UI.selFoe && u.alive)) UI.selFoe = null;
  const cur = !B.over && !play && animLeft() === 0 ? needInput(B)[0] : null;
  const settled = !play && animLeft() === 0, taken = {}; if (settled) for (const e of B.ev || []) if ((e.k === 'hit' || e.k === 'dot') && e.v) taken[e.t] = (taken[e.t] || 0) + e.v;
  const ha = B.acts.hero, aim = ha && !B.over ? (ha.tgt || (ha.sk && SKILLS[ha.sk] && SKILLS[ha.sk].tgt === 'enemies' ? '*' : null)) : null;
  const actTxt = a => actText(B, a);
  const card = (u, i) => { const st = u.st.filter(s => s.k !== 'rage').map(s => `<span style="color:${STATUS[s.k].c}">${STATUS[s.k].n}${s.k === 'shield' ? s.v : ''}</span>`).join(''); const wk = u.side && u.mob ? knownWeak(u.mob) : [];
    const hr = UI.hpShown[u.id] != null ? UI.hpShown[u.id] : u.hp / u.hpMax, dead = UI.deadShown[u.id] || (!u.alive && !play && !(animLeft() > 0));
    return `<div class="uc ${u.side ? 'foe' : 'ally'} ${u === me_ ? 'me' : ''} ${dead ? 'dead' : ''} ${UI.selFoe === u.id ? 'sel' : ''} ${u.raged ? 'rage' : ''} ${u.releasing ? 'warnc' : ''} ${cur === u ? 'turn' : ''} ${UI.enter ? (u.side ? 'enter-d' : 'enter-u') : ''} ${u.side && u.alive && (aim === '*' || aim === u.id) ? 'aim' : ''}" style="--i:${i}" data-u="${u.id}" ${u.side ? `onclick="selFoe('${u.id}')"` : ''}><div class="n">${esc(u.name)}<small>${u.boss ? '首领' : u.lv + '层'}</small>${wk.length ? `<span class="wk">弱${wk.map(e => EL[e].i).join('')}</span>` : ''}${taken[u.id] ? `<span class="tk" title="这回合受到的伤害">-${taken[u.id]}</span>` : ''}</div>
      <div class="bar"><i style="width:${Math.max(0, hr * 100)}%"></i></div>${u.mpMax ? `<div class="bar mp"><i style="width:${u.mp / u.mpMax * 100}%"></i></div>` : ''}<div class="hpn"><span>${fmt(Math.ceil(u.hp))}/${fmt(u.hpMax)}</span></div>
      <div class="sts">${st}</div>${u.kind === 'pc' && ha && !B.over ? `<div class="int ready">✓ ${actTxt(ha)}</div>` : ''}${u.side && u.alive && u.intent ? `<div class="int ${u.plan === 'charge' || u.intent.startsWith('⚠') ? 'chg' : ''}">${u.intent}</div>` : ''}</div>`; };
  const order = turnOrder(B, false);
  $('bhead').innerHTML = `<div>${esc(B.title || '战斗')}<small>第 ${B.round} 回合</small></div><div class="order"><span class="ol">出手顺序</span>${order.map(u => `<span class="to ${u.side ? 'f' : ''} ${cur === u ? 'cur' : ''}" data-to="${u.id}">${esc(u.name.replace(/（.*/, '').slice(0, 4))}</span>`).join('<i>›</i>')}</div>`;
  $('foes').innerHTML = B.units.filter(u => u.side === 1).map(card).join(''); $('party').innerHTML = B.units.filter(u => u.side === 0).map(card).join('');
  let k = B.log.length - 1; while (k > 0 && !B.log[k].includes('class="rd"')) k--; const start = Math.max(0, B.log.length - 12), g0 = B.lc - B.log.length;
  const tut = !C.seen.tut1 && NETROLE !== 'guest' ? `<div class="tut"><b>怎么打</b>：敌人卡片下面写着它<b>下回合要做什么</b>。<br>出现 <b class="warn">⚠</b> 说明它要放大招——点<b>防御</b>能减半；把它<b>打晕</b>或<b>打中弱点</b>能直接打断。<br>先点敌人卡片选目标，再点宝术。石昊出完招，轮到灵兽伙伴。<button class="sb" onclick="C.seen.tut1=1;save();renderBattle(true)">知道了</button></div>` : '';
  $('bfeed').innerHTML = tut + B.log.slice(start).map((h, i) => /class="bt"/.test(h) ? '' : `<div class="ln ${start + i < k ? 'old' : ''} ${g0 + start + i >= UI.reveal ? 'pend' : ''}" data-g="${g0 + start + i}">${h}</div>`).join(''); $('bfeed').scrollTop = $('bfeed').scrollHeight;
  const fresh = B.log.slice(STATE.shownFor === B.id ? STATE.shown : 0); for (const h of fresh) logLine(h, 'bat'); STATE.shown = B.log.length; STATE.shownFor = B.id;
  if (fresh.length && B.fx && !play) sfx(B.fx); if (!C.seen.tut2 && B.units.some(u => u.releasing && u.side) && NETROLE !== 'guest') { C.seen.tut2 = 1; logLine('【指引】敌人头上出现 ⚠：它这回合要放大招。防御能减半；把它打晕、或者打中它的弱点，能直接打断。', 'tip'); toast('⚠ 大招要来了：防御，或者打断它'); }
  renderBattleActs(cur); if (play) fxPlay(B); else if (B.over && animLeft() === 0) fxStamp(B);
  if (B.auto && NETROLE !== 'guest' && me_ && me_.alive && !B.acts[me_.id] && !B.over) { clearTimeout(UI.autoT); UI.autoT = setTimeout(function tick() { if (STATE.battle !== B || B.acts[me_.id] || B.over) return; if (animLeft() > 0) { UI.autoT = setTimeout(tick, animLeft() + 30); return; } battleAct(botAct(B, me_)); }, window.__dbg && __dbg.instant ? 0 : Math.max(animLeft() + 200, SET.fast ? 150 : 650)); }
}
function actText(B, a) { if (!a) return ''; const T = a.tgt && B.units.find(x => x.id === a.tgt);
  return a.crush ? '👊 一拳解决' : a.item ? ITEMS[a.item].icon + ITEMS[a.item].name : a.swap ? '⇄ 换伙伴' : a.flee ? '🏃 跑' : a.sk ? SKILLS[a.sk].icon + SKILLS[a.sk].name + (T ? ' → ' + T.name : SKILLS[a.sk].tgt === 'enemies' ? ' → 全体' : SKILLS[a.sk].tgt === 'enemy' ? ' → 血最少的' : '') : ''; }
function selFoe(id) { UI.selFoe = id; sfx('click'); renderBattle(true); }
function renderBattleActs(cur) {
  const B = STATE.battle, A = $('bacts'); if (!B) return; const u = B.units.find(x => x.kind === 'pc');
  if (B.over) { A.innerHTML = `<div class="wait" style="color:#ffcfb8">${B.win ? '赢了！' : B.fled ? '跑掉了' : '……'}</div>`; return; }
  if (!cur) { A.innerHTML = `<div class="wait">${B.auto ? '🤖 自动战斗中…… <button class="ab sm q" onclick="toggleAuto()">停下</button>' : '……'}</div>`; return; }
  if (cur.pet) { const mv = petMoves(cur); const ha = B.acts.hero; if (ha && !C.seen.tutPet && NETROLE !== 'guest') { C.seen.tutPet = 1; toast('石昊的招选好了——再给伙伴选一招，这回合才开打'); }
    A.innerHTML = `${ha ? `<div class="who-turn ok">🧒 石昊已选好：<b>${actText(B, ha)}</b></div>` : ''}<div class="who-turn">${PETS[cur.mob].icon} 现在轮到 <b>${esc(cur.name)}</b> <span class="dim">· 给它选一招，选完这回合就开打${UI.selFoe ? '' : '（单体招先点敌人选目标）'}</span></div><div class="arow">${PETS[cur.mob].sk.map((s, i) => { const ok = mv.some(x => x.i === i); if (!ok) return ''; const tag = s.aoe ? '全体' : s.healAlly ? '治疗' : s.shieldAll ? '全队盾' : s.shieldHero ? '给石昊盾' : s.buffHero ? '给石昊' : s.taunt ? '嘲讽' : '单体';
      return `<button class="skb pet c-${s.cat}" ${ok ? '' : 'disabled'} title="${esc(s.d || '')}" onclick="battleAct({psk:${i},tgt:UI.selFoe},'pet')"><span class="i">${{ atk: '🐾', buff: '✨', debuff: '🌀', def: '🛡️' }[s.cat]}</span>${s.n}<span class="c">${ok ? PET_CAT[s.cat].n + '·' + tag + (s.el ? EL[s.el].i : '') : '亲近' + s.aff}</span></button>`; }).join('')}</div>
      <div class="arow duo"><span class="dim">这回合</span><button class="ab sm ${(C.duo || 'hero') === 'hero' ? 'q' : ''}" onclick="setDuo('hero')">🧒 石昊先出手</button><button class="ab sm ${C.duo === 'pet' ? 'q' : ''}" onclick="setDuo('pet')">${PETS[cur.mob].icon} 伙伴先出手</button></div>
      <div class="arow"><button class="ab sm" onclick="battleUndo()">‹ 重选石昊</button><button class="ab sm ${B.auto ? 'q' : ''}" onclick="toggleAuto()">🤖 自动</button></div>`; return; }
  const sk = u.sk.map(id => { const S = SKILLS[id], cd = u.cd[id] || 0, no = u.mp < S.mp, pl = profLevel(id); return `<button class="skb" ${cd || no ? 'disabled' : ''} onclick="pickSkill('${id}')" title="${esc(S.desc)}"><span class="i">${S.icon}</span>${S.name}${S.mp ? `<span class="c">${S.mp}</span>` : ''}${pl ? `<span class="pf">${PROF[pl].s}</span>` : ''}${cd ? `<span class="cd">${cd}</span>` : ''}</button>`; }).join('');
  const heal = ['milk', 'herb', 'meat', 'lingyao', 'baoyao'].filter(i => itemN(i)); const swaps = B.noPet ? [] : Object.keys(C.pets).filter(id => id !== C.pet);
  A.innerHTML = `<div class="who-turn">🧒 <b>石昊</b> 的回合</div><div class="arow">${sk}</div><div class="arow">${canCrush(B) ? `<button class="ab sm q" onclick="battleAct({crush:1})">👊 一拳解决</button>` : ''}${heal.map(i => `<button class="ab sm" ${B.itemRound === B.round ? 'disabled' : ''} title="${ITEMS[i].name}：不占回合，每回合能吃一次" onclick="battleAct({item:'${i}'})">${ITEMS[i].icon}${itemN(i)}</button>`).join('')}
    ${swaps.map(id => `<button class="ab sm" onclick="battleAct({swap:'${id}'})" title="换${PETS[id].name}上场">⇄${PETS[id].icon}</button>`).join('')}<button class="ab sm" onclick="battleAct({flee:1})" ${B.flee ? '' : 'disabled'}>🏃 跑</button><button class="ab sm ${C.auto ? 'q' : ''}" onclick="toggleAuto()">🤖 ${C.auto ? '自动中' : '自动'}</button></div>`;
}
function pickSkill(id) { battleAct({ sk: id, tgt: SKILLS[id].tgt === 'enemy' ? UI.selFoe : null }); }
function toggleAuto() { const B = STATE.battle; if (!B) return; B.auto = !B.auto; renderBattle(true); netSync(); }
function toggleAutoFight() { C.auto = !C.auto; save(); toast(C.auto ? '自动对战：开（之后的战斗都自动打，战斗里随时能停）' : '自动对战：关'); refresh(); netSync(); }
async function autoExplore() { // explore here again and again, fights on auto, until told to stop, hurt, or the story needs you
  if (NETROLE === 'guest') return; if (UI.autoEx) { UI.autoEx = false; refresh(); return; } const P = PLACES[C.loc]; if (!P.mobs) return; UI.autoEx = true; UI.autoExN = 0; refresh();
  while (UI.autoEx && STATE.mode === 'play') { if (STATE.scene || DLG || STATE.dungeon || STATE.battle || !PLACES[C.loc].mobs) break;
    if (C.hp < charStats().hpMax * 0.35) { toast('气血不多了，自动探索先停下'); logLine('自动探索停下了：气血不多了。歇一歇再走。', 'sys'); break; }
    UI.autoExN++; UI.forceAuto = true; try { await explore(); } finally { UI.forceAuto = false; } refresh(); await sleep(window.__dbg && __dbg.instant ? 0 : 900); }
  UI.autoEx = false; refresh(); }
function battleEndUI() { UI.selFoe = null; refresh(); }
