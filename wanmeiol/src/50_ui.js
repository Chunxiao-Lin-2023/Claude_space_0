/* ================= UI: layout, log, dialogue, actions, battle board ================= */
const UI = { layout: '', ltab: 'char', rtab: 'chat', stab: null, sgroup: null, chatCh: 'all', bagTab: 'item', selFoe: null, selAlly: null, mapArea: null, rankTab: 'lv', mkTab: 'buy' };
function layout() {
  const w = innerWidth, h = innerHeight; const L = w >= 1100 ? 'wide' : w >= 700 || (h <= 500 && w >= 600) ? 'mid' : 'narrow';
  const b = document.body; b.classList.toggle('wide', L === 'wide'); b.classList.toggle('mid', L === 'mid'); b.classList.toggle('narrow', L === 'narrow'); b.classList.toggle('short', h <= 500); b.classList.toggle('touch', IS_TOUCH);
  if (UI.layout !== L) { UI.layout = L; if (L === 'mid' && ['char', 'bag', 'skill', 'quest'].includes(UI.ltab) && !UI.rtabSet) UI.rtab = 'chat'; refresh(); bannerDraw(); }
}
addEventListener('resize', () => { clearTimeout(UI.rsT); UI.rsT = setTimeout(() => { layout(); bannerDraw(); if (STATE.mode === 'title') titleDraw(); }, 80); });
addEventListener('orientationchange', () => setTimeout(() => { layout(); bannerDraw(); }, 150));
function toast(t) { const d = el('div', '', esc(t)); $('toast').appendChild(d); setTimeout(() => d.remove(), 2200); while ($('toast').children.length > 3) $('toast').firstChild.remove(); }

/* ---------- log ---------- */
function logLine(html, cls = '') { const L = $('log'); if (!L) return; const d = el('div', 'ln ' + cls, html); L.appendChild(d); while (L.children.length > 260) L.firstChild.remove(); requestAnimationFrame(() => { L.scrollTop = L.scrollHeight; }); }
/* ---------- dialogue ---------- */
let DLG = null;
function dlgShow(o) {
  logLine(o.who ? `<span class="who">${o.icon ? o.icon + ' ' : ''}${esc(o.who)}</span>${o.text}` : o.text, 'say ' + (o.who ? '' : 'nar') + (o.mine ? ' mine' : ''));
  if (window.__dbg && __dbg.auto) return Promise.resolve();
  return new Promise(res => { DLG = { o, res }; renderDlg(); });
}
function dlgChoose(opts) {
  if (window.__dbg && __dbg.auto) { const i = __dbg.pick ? __dbg.pick(opts.map(o => o.t)) : opts.findIndex(o => !o.dis); logLine('▸ ' + opts[i].t, 'say mine'); return Promise.resolve(i); }
  return new Promise(res => { DLG = { choice: opts, res }; renderDlg(); });
}
function renderDlg() {
  const D = $('dlg'); if (!DLG) { D.classList.remove('on'); D.innerHTML = ''; renderActs(); return; }
  D.classList.add('on'); $('acts').style.display = 'none';
  if (DLG.choice) { D.innerHTML = `<div class="ch">${DLG.choice.map((o, i) => `<button class="chb" ${o.dis ? 'disabled' : ''} data-i="${i}">${o.t}</button>`).join('')}</div>`;
    D.querySelectorAll('.chb').forEach(b => b.onclick = () => { sfx('click'); const i = +b.dataset.i, r = DLG.res; logLine('▸ ' + DLG.choice[i].t, 'say mine'); DLG = null; renderDlg(); r(i); }); }
  else { const o = DLG.o; D.innerHTML = `${o.who ? `<div class="who"><span class="ic">${o.icon || ''}</span>${esc(o.who)}</div>` : ''}<div class="tx">${o.text}</div><div class="nx">点击继续 ▼</div>`;
    D.onclick = () => { if (!DLG || DLG.choice) return; sfx('click'); const r = DLG.res; DLG = null; renderDlg(); r(); }; }
  requestAnimationFrame(() => { const L = $('log'); L.scrollTop = L.scrollHeight; });
}
function dlgClose() { if (DLG && !DLG.choice) { const r = DLG.res; DLG = null; r(); } DLG = null; renderDlg(); }
addEventListener('keydown', e => { if (STATE.mode !== 'play') return; if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (DLG && !DLG.choice && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); $('dlg').click(); return; }
  if (DLG && DLG.choice && /^[1-9]$/.test(e.key)) { const b = $('dlg').querySelectorAll('.chb')[+e.key - 1]; if (b && !b.disabled) b.click(); return; }
  if (STATE.battle && /^[1-9]$/.test(e.key)) { const b = $('acts').querySelectorAll('.skb')[+e.key - 1]; if (b && !b.disabled) b.click(); return; }
  if (!DLG && !STATE.battle) { const k = { ArrowUp: 'n', w: 'n', ArrowDown: 's', s: 's', ArrowLeft: 'w', a: 'w', ArrowRight: 'e', d: 'e' }[e.key]; if (k) { const ex = exitsOf(C.loc); if (ex[k]) go(ex[k]); } if (e.key === 'f' || e.key === 'e') explore(); } });

/* ---------- refresh (batched) ---------- */
let refT = 0;
function refresh() { if (refT) return; refT = requestAnimationFrame(() => { refT = 0; if (STATE.mode !== 'play' || !C) return; renderTop(); renderBanner(); if (!DLG) renderActs(); if (STATE.battle) renderBattle(true); else $('board').classList.remove('on'); renderSides(); if ($('modal').classList.contains('on') && UI.modal) openModal(UI.modal, true); }); }

/* ---------- top bar ---------- */
function renderTop() {
  const s = charStats(), mailN = C.mail.filter(m => !m.got).length, sign = !C.daily.sign;
  const btn = (k, i, lb, dot) => `<button class="tb ${k === 'coop' && NETROLE ? 'net' : ''}" onclick="openModal('${k}')">${i}<span class="lb"> ${lb}</span>${dot ? '<span class="dot"></span>' : ''}</button>`;
  $('top').innerHTML = `<div class="srv">完美世界OL</div><div class="on"><i></i>${SERVER} · 在线 ${fmt(onlineCount())}</div>
    <div id="stat"><span class="lv">${CLASSES[C.cls].icon} Lv${C.lv}</span><div class="bars2"><div class="bar"><i style="width:${C.hp / s.hpMax * 100}%"></i></div><div class="bar mp"><i style="width:${C.mp / s.mpMax * 100}%"></i></div><div class="bar exp"><i style="width:${C.exp / BAL.expNext(C.lv) * 100}%"></i></div></div><span class="lv" style="color:#f0c850">${fmt(C.gold)}两</span></div>
    <div class="sp"></div>${btn('sign', '📅', '每日', sign)}${btn('mail', '📬', '邮件', mailN)}${UI.layout !== 'narrow' ? btn('rank', '🏆', '排行') + btn('market', '💰', '交易行') + btn('guild', '🏯', '公会') : ''}${btn('coop', '🔗', NETROLE ? '队伍 ' + (netHumans().length + 1) + '人' : '联机')}${btn('set', '⚙️', '设置')}`;
}
/* ---------- banner & quest tracker ---------- */
function renderBanner() {
  const P = PLACES[C.loc], A = AREAS[P.area]; $('bnm').textContent = STATE.dungeon ? DUNGEONS[STATE.dungeon.id].name : P.name;
  $('bar').textContent = STATE.dungeon ? `副本 · 第 ${STATE.dungeon.room + 1}/${DUNGEONS[STATE.dungeon.id].rooms.length} 关` : `${A.name} · ${P.lv ? P.lv[0] + '-' + P.lv[1] + ' 级' : A.sub}`;
  const q = curQ(), w = questWhere(); $('bq').innerHTML = `<b>第${'一二三四'[q.ch - 1]}章 · ${q.title}</b><br>${questGoalText()}${w && w !== C.loc && route(C.loc, w) ? `<span class="go">▶ 寻路</span>` : ''}${q.rec && C.lv < q.rec ? `<br><span class="warn">建议 ${q.rec} 级</span>` : ''}`;
  $('bq').onclick = () => { const w2 = questWhere(); if (w2 && w2 !== C.loc) autoWalk(w2); else openSide('quest'); };
}
/* ---------- actions ---------- */
function renderActs() {
  const A = $('acts'); if (DLG) { A.style.display = 'none'; return; } A.style.display = '';
  if (STATE.battle) return renderBattleActs();
  if (STATE.dungeon) { A.innerHTML = `<div class="alab">副本进行中</div><div class="dim" style="font-size:14px">${DUNGEONS[STATE.dungeon.id].name} · 第 ${STATE.dungeon.room + 1} 关</div>`; return; }
  if (STATE.scene || STATE.busy) { A.innerHTML = '<div class="dim" style="text-align:center;font-size:13px">……</div>'; return; }
  const P = PLACES[C.loc], ex = exitsOf(C.loc), q = curQ(); let h = '';
  h += '<div class="alab">前往</div><div class="arow">' + Object.entries(ex).map(([d, id]) => { const T = PLACES[id]; return `<button class="ab dir" onclick="go('${id}')">${DIRS[d]} · ${T.name}<small>${T.lv ? T.lv[0] + '-' + T.lv[1] + '级' : T.town ? '安全区' : ''}${questWhere() === id ? ' ★' : ''}</small></button>`; }).join('') + '</div>';
  const acts = [];
  if (P.mobs) acts.push(`<button class="ab main" onclick="explore()">🔍 探索</button>`);
  if (WB && !WB.dead && WB.loc === C.loc && now() >= WB.start && now() < WB.end) acts.push(`<button class="ab wb" onclick="fightWB()">⚔ 讨伐首领 · ${MOBS[WB.id].name}</button>`);
  if (P.dungeon) acts.push(`<button class="ab main" onclick="enterDungeon('${P.dungeon}')">🏯 进入副本 · ${DUNGEONS[P.dungeon].name}</button>`);
  const qs = storyHere(); if (qs) acts.push(`<button class="ab q" onclick="storyHereRun()">▶ 剧情：${qs}</button>`);
  const pa = P.acts || []; if (pa.includes('rest') || C.loc === 'sc_willow') acts.push(`<button class="ab" onclick="rest()">🛏 休息</button>`);
  if (pa.includes('train')) acts.push(`<button class="ab" onclick="train()">🪵 切磋</button>`);
  if (pa.includes('market')) acts.push(`<button class="ab" onclick="openModal('market')">💰 交易行</button>`);
  if (pa.includes('enhance')) acts.push(`<button class="ab" onclick="openModal('enhance')">🔨 强化</button>`);
  if (pa.includes('arena')) acts.push(`<button class="ab" onclick="openModal('arena')">🪞 虚神界</button>`);
  if (pa.includes('bounty')) acts.push(`<button class="ab" onclick="openModal('bounty')">📋 悬赏榜</button>`);
  if (pa.includes('portal') && ex.u) acts.push(`<button class="ab" onclick="go('bt_gate')">🌀 传送 · 补天阁</button>`);
  if (!P.town && itemN('scroll')) acts.push(`<button class="ab" onclick="useItem('scroll')">📜 回城</button>`);
  if (acts.length) h += '<div class="alab">行动</div><div class="arow">' + acts.join('') + '</div>';
  if (P.npcs && P.npcs.length) h += '<div class="alab">人物</div><div class="arow">' + P.npcs.map(n => { const N = NPCS[n], qo = questTalkOptions(n).length; return `<button class="ab npc ${qo ? 'q' : ''}" onclick="npcTalk('${n}')">${N.icon} ${N.name}${qo ? ' ❗' : ''}</button>`; }).join('') + '</div>';
  A.innerHTML = h;
}
function storyHere() { const q = curQ(); if (q.type === 'enter' && q.loc === C.loc) return q.title; if (q.type === 'multi') for (const s of q.subs) if (s.type === 'enter' && s.loc === C.loc && !(C.story.subs || {})[s.k]) return s.goal.split('：')[0]; return null; }
function storyHereRun() { const q = curQ(); if (q.type === 'enter') return questComplete(q); for (const s of q.subs || []) if (s.type === 'enter' && s.loc === C.loc && !(C.story.subs || {})[s.k]) return subComplete(q, s); }
async function npcTalk(id) {
  if (STATE.scene || STATE.battle) return; const N = NPCS[id]; const opts = questTalkOptions(id);
  if (N.shop) opts.push({ t: '🛒 看看货', f: () => openModal('shop:' + N.shop) }); opts.push({ t: '💬 闲聊', f: () => npcTalk(id) }); opts.push({ t: '离开', f: () => { } });
  STATE.scene = 'talk'; renderActs(); await dlgShow({ who: N.name + ' · ' + N.title, icon: N.icon, text: sub(pick(N.talk)) }); const c = await dlgChoose(opts); STATE.scene = null; renderDlg(); refresh(); opts[c].f();
}
async function fightWB() { if (!WB || WB.dead) return; await startBattle({ mobs: [[WB.id, WB.lv]], title: `世界首领 · ${MOBS[WB.id].name}`, flee: true, world: { hpMax: WB.hpMax, hp: WB.hp } }); }

/* ---------- battle board ---------- */
function renderBattle(quiet) {
  const B = STATE.battle; if (!B) return; const bd = $('board'); bd.classList.add('on'); document.body.classList.add('inbattle');
  const mine = B.units.find(u => u.kind === 'pc' && u.pid === MYID);
  if (UI.selFoe && !B.units.some(u => u.id === UI.selFoe && u.alive)) UI.selFoe = null;
  const card = u => { const st = u.st.map(s => `<span style="color:${STATUS[s.k].c}">${STATUS[s.k].n}${s.k === 'shield' ? s.v : ''}</span>`).join(''); const acted = B.acts[u.id] ? '<span class="acted">✔</span>' : '';
    return `<div class="uc ${u.side ? 'foe' : ''} ${u === mine ? 'me' : ''} ${u.alive ? '' : 'dead'} ${UI.selFoe === u.id || UI.selAlly === u.id ? 'sel' : ''}" data-u="${u.id}">${acted}<div class="n">${u.icon || ''} ${esc(u.name)}<small>Lv${u.lv}${u.kind === 'pc' && u !== mine ? ' ★' : ''}${u.boss ? ' 首领' : ''}</small></div>
      <div class="bar"><i style="width:${u.hp / u.hpMax * 100}%"></i></div>${u.mpMax ? `<div class="bar mp"><i style="width:${u.mp / u.mpMax * 100}%"></i></div>` : ''}<div class="hpn"><span>${fmt(Math.ceil(u.hp))}/${fmt(u.hpMax)}</span>${u.mpMax ? `<span>${Math.floor(u.mp)}</span>` : ''}</div>
      <div class="sts">${st}</div>${u.side && u.alive && u.intent ? `<div class="int ${u.plan === 'charge' || u.intent.startsWith('⚠') ? 'chg' : ''}">${u.intent}</div>` : ''}</div>`; };
  bd.innerHTML = `<div class="side">${B.units.filter(u => u.side === 1).map(card).join('')}</div><div class="side">${B.units.filter(u => u.side === 0).map(card).join('')}</div>`;
  bd.querySelectorAll('.uc').forEach(c => c.onclick = () => { const u = B.units.find(x => x.id === c.dataset.u); if (!u || !u.alive) return; if (u.side) UI.selFoe = u.id; else UI.selAlly = u.id; sfx('click'); renderBattle(true); });
  // new log lines
  B.shown = STATE.shownFor === B.id ? STATE.shown : 0; const fresh = B.log.slice(B.shown);
  fresh.forEach((h, i) => setTimeout(() => logLine(h, 'bat'), SET.fast || quiet === 'instant' ? 0 : i * 110));
  STATE.shown = B.log.length; STATE.shownFor = B.id;
  if (fresh.length && B.fx) sfx(B.fx);
  if (!DLG) renderBattleActs();
  if (C.auto && mine && mine.alive && !B.acts[mine.id] && !B.over && !stOf(mine, 'stun')) { clearTimeout(UI.autoT); UI.autoT = setTimeout(() => { if (STATE.battle === B && !B.acts[mine.id]) battleAct(botAct(B, mine)); }, window.__dbg && __dbg.instant ? 0 : SET.fast ? 150 : 700); }
}
function renderBattleActs() {
  const B = STATE.battle, A = $('acts'); if (!B) return; const u = B.units.find(x => x.kind === 'pc' && x.pid === MYID);
  if (B.over) { A.innerHTML = `<div class="dim" style="text-align:center">${B.win ? '胜利！' : B.fled ? '已脱离战斗' : '战斗结束'}</div>`; return; }
  if (!u || !u.alive) { A.innerHTML = '<div class="dim" style="text-align:center">你倒下了，等待队友……</div>'; return; }
  if (B.acts[u.id] || stOf(u, 'stun')) { const wait = needInput(B).map(x => x.name); A.innerHTML = `<div class="dim" style="text-align:center">${stOf(u, 'stun') ? '你被眩晕了。' : '已出手。'}${wait.length ? '等待：' + wait.map(esc).join('、') : ''}${B.deadline ? `<div class="timer">本回合剩余 ${Math.max(0, Math.ceil((B.deadline - now()) / 1000))} 秒</div>` : ''}</div>`; return; }
  const sk = u.sk.map((id, i) => { const S = SKILLS[id], cd = u.cd[id] || 0, no = u.mp < S.mp; return `<button class="skb" ${cd || no ? 'disabled' : ''} onclick="pickSkill('${id}')" title="${esc(S.desc)}"><span class="i">${S.icon}</span>${S.name}${S.mp ? `<span class="c">${S.mp} 符力</span>` : ''}${cd ? `<span class="cd">${cd}</span>` : ''}</button>`; }).join('');
  const heal = ['herb', 'pill', 'elixir', 'meat', 'milk'].filter(i => itemN(i));
  A.innerHTML = `${B.deadline ? `<div class="timer">本回合剩余 ${Math.max(0, Math.ceil((B.deadline - now()) / 1000))} 秒</div>` : ''}<div class="arow">${sk}</div><div class="arow">${heal.map(i => `<button class="ab" onclick="battleAct({item:'${i}'})">${ITEMS[i].icon}${ITEMS[i].name}×${itemN(i)}</button>`).join('')}
    <button class="ab" onclick="battleAct({flee:1})" ${B.flee ? '' : 'disabled'}>🏃 逃跑</button><button class="ab ${C.auto ? 'q' : ''}" onclick="C.auto=!C.auto;save();renderBattle(true)">🤖 自动${C.auto ? '：开' : ''}</button></div>
    <div class="dim" style="font-size:12px">${UI.selFoe ? '目标：' + esc(B.units.find(x => x.id === UI.selFoe)?.name || '') + '　' : ''}点敌人选目标，点队友选治疗对象</div>`;
}
function pickSkill(id) { const S = SKILLS[id], B = STATE.battle; let tgt = null; if (S.tgt === 'enemy') tgt = UI.selFoe; if (S.tgt === 'ally') tgt = UI.selAlly; sfx('click'); battleAct({ sk: id, tgt }); }
function battleEndUI(r) { document.body.classList.remove('inbattle'); UI.selFoe = null; UI.selAlly = null; $('board').classList.remove('on'); refresh(); }
setInterval(() => { if (STATE.battle && STATE.battle.deadline) { battleTimeout(); renderBattleActs(); } }, 1000);
