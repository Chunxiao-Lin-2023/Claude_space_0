/* ================= side panels, sheets, modals ================= */
const PANEL_NAME = { char: '角色', bag: '背包', skill: '宝术', quest: '任务', chat: '聊天', near: '附近', party: '队伍', map: '地图', more: '更多' };
const NAV = [{ k: 'adv', i: '⚔️', n: '冒险' }, { k: 'me', i: '👤', n: '角色', tabs: ['char', 'skill', 'quest'] }, { k: 'bag', i: '🎒', n: '背包', tabs: ['bag'] }, { k: 'soc', i: '💬', n: '社交', tabs: ['chat', 'near', 'party'] }, { k: 'more', i: '☰', n: '更多', tabs: ['map', 'more'] }];
function setPanel(body, k, soft) { if (soft && ['bag', 'char', 'skill', 'chat', 'more'].includes(k)) return; const same = body.dataset.k === k, st = body.scrollTop; body.innerHTML = panel(k); body.dataset.k = k; bindPanel(k, body); if (same) body.scrollTop = st; }
function renderSides(soft) {
  const L = UI.layout; const tabs = (ids, cur, set) => ids.map(k => `<button class="${k === cur ? 'on' : ''}" onclick="${set}('${k}')">${PANEL_NAME[k]}${badge(k) ? '<span class="dot"></span>' : ''}</button>`).join('');
  if (L === 'wide') { $('ltabs').innerHTML = tabs(['char', 'bag', 'skill', 'quest'], UI.ltab, 'setL'); setPanel($('lbody'), UI.ltab, soft);
    if (['char', 'bag', 'skill', 'quest'].includes(UI.rtab)) UI.rtab = 'chat'; $('rtabs').innerHTML = tabs(['chat', 'near', 'party', 'map'], UI.rtab, 'setR'); renderRight(soft); }
  else if (L === 'mid') { $('rtabs').innerHTML = tabs(['chat', 'near', 'party', 'map', 'char', 'bag', 'skill', 'quest'], UI.rtab, 'setR'); renderRight(soft); }
  else { $('bnav').innerHTML = NAV.map(n => `<button class="${(UI.sgroup || 'adv') === n.k ? 'on' : ''}" onclick="navTo('${n.k}')"><span class="i">${n.i}</span>${n.n}${n.tabs && n.tabs.some(badge) ? '<span class="dot"></span>' : ''}</button>`).join('');
    const S = $('sheet'); if (UI.sgroup && UI.sgroup !== 'adv') { const g = NAV.find(n => n.k === UI.sgroup); if (!g.tabs.includes(UI.stab)) UI.stab = g.tabs[0]; S.classList.add('on'); $('stabs').innerHTML = g.tabs.length > 1 ? tabs(g.tabs, UI.stab, 'setS') : `<button class="on">${PANEL_NAME[g.tabs[0]]}</button>`;
      const keep = UI.stab === 'chat' && $('sbody').querySelector('.chat'); if (!keep) setPanel($('sbody'), UI.stab, soft); } else S.classList.remove('on');
    const last = [...CHAT.world, ...CHAT.sys, ...CHAT.party].sort((a, b) => b.t - a.t)[0]; $('ticker').innerHTML = last ? chatLine(last, true) : ''; $('ticker').onclick = () => navTo('soc'); }
}
function renderRight(soft) { const keep = UI.rtab === 'chat' && $('rbody').querySelector('.chat'); if (!keep) setPanel($('rbody'), UI.rtab, soft); }
const badge = k => k === 'char' ? !!canBreak() : k === 'quest' ? false : k === 'party' ? false : false;
function setL(k) { UI.ltab = k; sfx('click'); refresh(); }
function setR(k) { UI.rtab = k; UI.rtabSet = 1; sfx('click'); $('rbody').innerHTML = ''; refresh(); }
function setS(k) { UI.stab = k; sfx('click'); $('sbody').innerHTML = ''; refresh(); }
function navTo(k) { sfx('click'); UI.sgroup = k === 'adv' || UI.sgroup === k && k !== 'soc' ? null : k; if (k === 'soc') UI.stab = 'chat'; $('sbody').innerHTML = ''; refresh(); }
function openSide(k) { if (UI.layout === 'wide') { if (['char', 'bag', 'skill', 'quest'].includes(k)) UI.ltab = k; else UI.rtab = k; } else if (UI.layout === 'mid') UI.rtab = k; else { const g = NAV.find(n => n.tabs && n.tabs.includes(k)); UI.sgroup = g ? g.k : 'more'; UI.stab = k; $('sbody').innerHTML = ''; } refresh(); }

/* ---------- panel html ---------- */
function panel(k) { try { return ({ char: pChar, bag: pBag, skill: pSkill, quest: pQuest, chat: pChat, near: pNear, party: pParty, map: pMap, more: pMore })[k](); } catch (e) { console.error(e); return '<div class="dim">（出错了）</div>'; } }
function bindPanel(k, root) { if (k === 'chat') bindChat(root); }
const rc = r => BAL.rarity[r].c;
function eqLine(e, acts = '', cmp) { const b = EQB[e.b], s = eqStats(e); const main = [s.atk && '攻击 ' + s.atk, s.def && '防御 ' + s.def, s.hp && '气血 ' + s.hp, s.crit && '暴击 ' + (s.crit * 100).toFixed(1) + '%'].filter(Boolean).join(' · ');
  const af = e.af.map(([k, v]) => `${AFX[k].n}${AFX[k].f(v)}`).join('　'); const up = cmp == null ? '' : cmp > 0 ? `<span style="color:#7fd36f">▲${cmp}</span>` : cmp < 0 ? `<span style="color:#e0604f">▼${-cmp}</span>` : '';
  return `<div class="li"><span class="ic">${b.slot === 'weapon' ? '⚔️' : b.slot === 'armor' ? '🥋' : '📿'}</span><div class="t"><span style="color:${rc(e.r)};font-weight:700">${eqName(e)}</span> <span class="pill">${BAL.rarity[e.r].n}</span><span class="pill">${b.lv}级</span>${up}<small>${main}</small>${af ? `<div class="af">${af}</div>` : ''}</div><div class="acts">${acts}</div></div>`; }
function pChar() {
  const s = charStats(), K = CLASSES[C.cls], R = realmOf(C.lv), nb = canBreak(), g = GUILDS.find(x => x.id === C.guild);
  const slot = sl => { const e = C.eq[sl]; return e ? eqLine(e, `<button class="sb" onclick="unequip('${sl}')">卸下</button>`) : `<div class="eqslot dim">${EQ_SLOTS[sl]}：空</div>`; };
  return `<div class="card"><div class="me-hd"><div class="avatar" style="border-color:${K.color}">${K.icon}</div><div style="flex:1;min-width:0"><div class="nm">${esc(C.name)}</div><div class="sub">${K.name} · ${K.role}${C.title ? ' · 「' + esc(C.title) + '」' : ''}</div><div class="sub">${R.name} · ${C.lv} 级${g ? ' · ' + g.name : ''}</div></div><div style="text-align:right"><div class="dim" style="font-size:11px">战力</div><div class="pw">${fmt(s.power)}</div></div></div>
    <div class="bars" style="margin-top:8px">气血 ${Math.ceil(C.hp)}/${s.hpMax}<div class="bar"><i style="width:${C.hp / s.hpMax * 100}%"></i></div>符力 ${Math.floor(C.mp)}/${s.mpMax}<div class="bar mp"><i style="width:${C.mp / s.mpMax * 100}%"></i></div>经验 ${fmt(C.exp)}/${fmt(BAL.expNext(C.lv))}<div class="bar exp"><i style="width:${Math.min(100, C.exp / BAL.expNext(C.lv) * 100)}%"></i></div></div>
    ${nb ? `<button class="sb pri" style="width:100%;margin-top:4px" onclick="breakthrough()">✨ 突破至${nb.name}（需要${ITEMS[nb.need].name}${itemN(nb.need) ? ' ✔' : ' ✘'}）</button>` : ''}
    <div class="kv" style="margin-top:8px"><div><span>攻击</span> ${s.atk}</div><div><span>防御</span> ${s.def}</div><div><span>身法</span> ${s.spd}</div><div><span>暴击</span> ${(s.crit * 100).toFixed(1)}%</div><div><span>吸血</span> ${(s.leech * 100).toFixed(1)}%</div><div><span>银两</span> <span class="gold">${fmt(C.gold)}</span></div>
    ${F().heart ? `<div><span>心性</span> ${{ ren: '仁', yong: '勇', zhi: '智' }[F().heart]}</div>` : ''}<div><span>击杀</span> ${fmt(C.stats.kills)}</div></div></div>
    <div class="card"><h3>装备</h3>${slot('weapon')}${slot('armor')}${slot('acc')}</div>`;
}
function pBag() {
  const inTown = PLACES[C.loc].town, mk = (PLACES[C.loc].acts || []).includes('market'), enh = (PLACES[C.loc].acts || []).includes('enhance'), mates = netHumans();
  let h = `<div class="row" style="margin-bottom:8px"><button class="sb ${UI.bagTab === 'item' ? 'pri' : ''}" onclick="UI.bagTab='item';refresh()">物品</button><button class="sb ${UI.bagTab === 'eq' ? 'pri' : ''}" onclick="UI.bagTab='eq';refresh()">装备 ${C.gear.length}</button><span class="sp"></span><span class="gold">${fmt(C.gold)} 两</span></div>`;
  if (UI.bagTab === 'item') { const ids = Object.keys(C.bag).sort((a, b) => ['use', 'mat', 'key'].indexOf(ITEMS[a].type) - ['use', 'mat', 'key'].indexOf(ITEMS[b].type));
    if (!ids.length) h += '<div class="dim">空空如也。</div>';
    h += '<div class="list">' + ids.map(id => { const it = ITEMS[id]; const a = [];
      if (it.type === 'use') a.push(`<button class="sb" onclick="useItem('${id}')">使用</button>`);
      if (inTown && it.price && it.type !== 'key') a.push(`<button class="sb" onclick="sellItem('${id}',1)">卖 ${Math.floor(it.price / 2)}</button>`);
      if (mk && it.price && it.type !== 'key') a.push(`<button class="sb" onclick="listItemPrompt('item','${id}')">上架</button>`);
      if (mates.length && it.type !== 'key') a.push(`<button class="sb" onclick="giftPrompt('item','${id}')">赠送</button>`);
      return `<div class="li"><span class="ic">${it.icon}</span><div class="t">${it.name} ×${C.bag[id]}<small>${it.desc}</small></div><div class="acts">${a.join('')}</div></div>`; }).join('') + '</div>'; }
  else { if (!C.gear.length) h += '<div class="dim">没有多余的装备。</div>';
    if (inTown && C.gear.some(g => g.r === 0 && !g.p)) h += `<button class="sb" style="margin-bottom:8px" onclick="sellJunk()">一键卖出所有凡品</button>`;
    const sorted = C.gear.slice().sort((a, b) => EQB[a.b].slot.localeCompare(EQB[b.b].slot) || eqPower(b) - eqPower(a));
    h += '<div class="list">' + sorted.map(e => { const cur = C.eq[EQB[e.b].slot]; const d = eqPower(e) - (cur ? eqPower(cur) : 0); const a = [`<button class="sb ${C.lv >= EQB[e.b].lv ? 'pri' : ''}" onclick="equipItem('${e.u}')">装备</button>`];
      if (inTown) a.push(`<button class="sb" onclick="sellEquip('${e.u}')">卖 ${eqPrice(e)}</button>`); if (enh) a.push(`<button class="sb" onclick="openModal('enhance:${e.u}')">强化</button>`);
      if (mk) a.push(`<button class="sb" onclick="listItemPrompt('eq','${e.u}')">上架</button>`); if (mates.length) a.push(`<button class="sb" onclick="giftPrompt('eq','${e.u}')">赠送</button>`);
      return eqLine(e, a.join(''), d); }).join('') + '</div>'; }
  return h;
}
function sellJunk() { let g = 0, n = 0; C.gear = C.gear.filter(e => { if (e.r === 0 && !e.p) { g += eqPrice(e); n++; return false; } return true; }); addGold(g, true); sfx('gold'); toast(`卖出 ${n} 件，获得 ${g} 两`); save(); refresh(); }
function pSkill() {
  const K = CLASSES[C.cls]; const row = (id, own) => { const S = SKILLS[id], ok = own ? true : C.lv >= S.lv; return `<div class="li" style="${ok ? '' : 'opacity:.45'}"><span class="ic">${S.icon}</span><div class="t"><b style="color:${ok ? '#f0d79a' : '#999'}">${S.name}</b> ${S.mp ? `<span class="pill">${S.mp} 符力</span>` : ''}${S.cd ? `<span class="pill">冷却 ${S.cd}</span>` : ''}${!ok ? `<span class="pill">${S.lv} 级领悟</span>` : ''}<small>${S.desc}</small></div></div>`; };
  return `<div class="card"><h3>${K.icon} ${K.name}宝术</h3><div class="list">${K.skills.map(id => row(id)).join('')}</div></div>
    <div class="card"><h3>奇遇宝术</h3><div class="list">${F().thunder ? row('sk_thunder', 1) : '<div class="dim" style="font-size:13px">？？？（在大荒深处，也许能从凶兽的宝骨里悟出宝术）</div>'}${F().suanni ? row('sk_suanni', 1) : ''}</div></div>
    <div class="card"><h3>通用</h3><div class="list">${row('atk', 1)}${row('guard', 1)}</div></div>`;
}
function pQuest() {
  const q = curQ(), w = questWhere(); let h = `<div class="card"><h3>主线 · 第${'一二三四'[q.ch - 1]}章</h3><div><b>${q.title}</b></div><div style="font-size:14px">${questGoalText()}</div>${w && w !== C.loc ? `<button class="sb pri" style="margin-top:6px" onclick="autoWalk('${w}')">▶ 自动寻路：${PLACES[w].name}</button>` : ''}${q.rec ? `<div class="dim" style="font-size:12px;margin-top:4px">建议等级：${q.rec}</div>` : ''}</div>`;
  const sides = Object.entries(SIDE).filter(([id, S]) => C.side[id] === 'on'); if (sides.length) h += `<div class="card"><h3>支线</h3>${sides.map(([id, S]) => `<div style="font-size:14px">· <b>${S.title}</b>：${S.need.map(([k, n]) => `${ITEMS[k].name} ${Math.min(itemN(k), n)}/${n}`).join('、')} → ${NPCS[S.npc].name}</div>`).join('')}</div>`;
  const bt = (C.daily.bounty || []).filter(b => b.taken); if (bt.length) h += `<div class="card"><h3>今日悬赏</h3>${bt.map(b => `<div style="font-size:14px">${b.done ? '✔' : '·'} ${PLACES[b.loc].name}：${MOBS[b.mob].name} ${b.got}/${b.n}</div>`).join('')}</div>`;
  const nx = wbSlot() + 1, t = Math.max(0, Math.round((nx * BAL.worldBossEvery * 60000 - now()) / 60000));
  h += `<div class="card"><h3>世界首领</h3>${WB && !WB.dead && now() < WB.end ? `<div><b class="warn">${MOBS[WB.id].name}</b> 正在 <b>${PLACES[WB.loc].name}</b>（剩余气血 ${Math.round(WB.hp / WB.hpMax * 100)}%）<br><button class="sb pri" onclick="autoWalk('${WB.loc}')">▶ 前往</button></div>` : `<div class="dim" style="font-size:14px">下一只：${MOBS[WORLD_BOSSES[nx % 3].id].name} · ${PLACES[WORLD_BOSSES[nx % 3].loc].name} · 约 ${t} 分钟后</div>`}</div>`;
  h += `<div class="card"><h3>副本</h3>${Object.entries(DUNGEONS).map(([id, D]) => `<div style="font-size:14px">· ${D.name}（${D.lv} 级，${PLACES[D.loc].name}）通关 ${C.dungeons[id] || 0} 次</div>`).join('')}</div>`;
  return h;
}
/* ---------- chat ---------- */
function chatLine(m, short) { const ch = m.ch; const from = m.from ? `<span class="f" style="color:${m.me ? '#9fd4ff' : m.real ? '#8fd0ff' : m.cls ? CLASSES[m.cls].color : '#ddd'}">${m.real && !m.me ? '★' : ''}${esc(m.from)}</span>：` : '';
  return `<span class="c ${ch}">${CH_NAME[ch]}</span>${from}${ch === 'sys' ? m.text : esc(m.text).replace(/&lt;b&gt;|&lt;\/b&gt;/g, '')}`; }
function pChat() { const chs = ['all', 'world', 'near', 'party', 'guild', 'sys']; const nm = { all: '全部', ...CH_NAME };
  return `<div class="chat"><div class="row" style="flex-wrap:wrap;gap:4px;margin-bottom:4px">${chs.map(c => `<button class="sb ${UI.chatCh === c ? 'pri' : ''}" style="min-height:30px;padding:2px 8px" onclick="UI.chatCh='${c}';$('${UI.layout === 'narrow' ? 'sbody' : 'rbody'}').innerHTML='';refresh()">${nm[c]}</button>`).join('')}</div>
    <div class="chlist" id="chlist"></div><div class="chin"><select id="chsel">${['world', 'near', 'party', 'guild'].map(c => `<option value="${c}" ${UI.sendCh === c ? 'selected' : ''}>${CH_NAME[c]}</option>`).join('')}</select><input id="chin" maxlength="80" placeholder="说点什么…" enterkeyhint="send"><button class="sb pri" id="chgo">发送</button></div></div>`; }
function bindChat(root) { const L = root.querySelector('#chlist'); if (!L) return; const list = chatFiltered(); L.innerHTML = list.map(m => `<div class="cm ${m.me ? 'me' : ''}">${chatLine(m)}</div>`).join(''); L.scrollTop = L.scrollHeight;
  const inp = root.querySelector('#chin'), sel = root.querySelector('#chsel'); const send = () => { UI.sendCh = sel.value; if (sel.value === 'guild' && !C.guild) { toast('还没有加入公会'); return; } if (sel.value === 'party' && !STATE.party.length && !NETROLE) { toast('还没有队伍'); return; } sendChat(sel.value, inp.value); inp.value = ''; };
  root.querySelector('#chgo').onclick = send; inp.onkeydown = e => { if (e.key === 'Enter') send(); }; }
function chatFiltered() { const c = UI.chatCh; const all = c === 'all' ? [...CHAT.world, ...CHAT.near, ...CHAT.party, ...CHAT.guild, ...CHAT.sys] : CHAT[c]; return all.slice().sort((a, b) => a.t - b.t).slice(-120); }
function uiChat(m) { if (!C || STATE.mode !== 'play') return; const L = document.getElementById('chlist'); if (L && (UI.chatCh === 'all' || UI.chatCh === m.ch)) { const near = L.scrollHeight - L.scrollTop - L.clientHeight < 60; L.insertAdjacentHTML('beforeend', `<div class="cm ${m.me ? 'me' : ''}">${chatLine(m)}</div>`); while (L.children.length > 140) L.firstChild.remove(); if (near) L.scrollTop = L.scrollHeight; }
  if (UI.layout === 'narrow') $('ticker').innerHTML = chatLine(m, true); if (m.ch === 'party' && !m.me) sfx('chat'); }
/* ---------- social ---------- */
function pNear() {
  const real = netHumans().filter(h => h.loc === C.loc), fk = fakesAt(C.loc); let h = `<div class="dim" style="font-size:12px;margin-bottom:6px">${PLACES[C.loc].name} · 附近的玩家</div><div class="list">`;
  for (const p of real) h += `<div class="li"><span class="ic">${CLASSES[p.cls].icon}</span><div class="t"><span class="pname real">★${esc(p.name)}</span><small>Lv${p.lv} ${CLASSES[p.cls].name} · 战力 ${fmt(p.power)}（队友）</small></div></div>`;
  for (const x of fk) { const inP = STATE.party.some(b => b.id === x.f.id); h += `<div class="li"><span class="ic">${CLASSES[x.f.cls].icon}</span><div class="t"><span class="pname" style="color:${CLASSES[x.f.cls].color}">${esc(x.f.name)}</span><small>Lv${x.lv} ${CLASSES[x.f.cls].name} · ${x.act}</small></div><div class="acts"><button class="sb" onclick="viewFake('${x.f.id}')">查看</button>${inP ? '' : `<button class="sb pri" onclick="inviteFake(FAKES.find(f=>f.id==='${x.f.id}'))">组队</button>`}</div></div>`; }
  if (!real.length && !fk.length) h += '<div class="dim">这里一个人也没有。</div>'; return h + '</div>';
}
function viewFake(id) { const f = FAKES.find(x => x.id === id); const lv = fakeLv(f); const g = GUILDS.find(x => x.id === f.guild); UI.viewF = f;
  showModal(`${CLASSES[f.cls].icon} ${esc(f.name)}`, `<div class="card"><div>Lv${lv} · ${CLASSES[f.cls].name} · ${realmOf(lv).name}</div><div>战力 <span class="pw">${fmt(fakePower(f))}</span></div><div class="dim">${g ? '公会：' + g.name : '无公会'}</div></div>
    <div class="row"><button class="sb pri" onclick="inviteFake(UI.viewF);closeModal()">邀请组队</button><button class="sb" onclick="closeModal();chatPush('near',UI.viewF.name,pick(['你好呀','干嘛','？','嗨','有事吗']),{cls:UI.viewF.cls})">打招呼</button></div>`); }
function pParty() {
  const bots = STATE.party.map(b => FAKES.find(f => f.id === b.id)).filter(Boolean), real = netHumans(); let h = `<div class="card"><h3>我的队伍 ${1 + bots.length + real.length}/${BAL.partyMax}</h3><div class="list">`;
  h += `<div class="li"><span class="ic">${CLASSES[C.cls].icon}</span><div class="t"><b>${esc(C.name)}</b>（我）<small>Lv${C.lv} · ${PLACES[C.loc].name}</small></div></div>`;
  for (const p of real) { const can = p.loc !== C.loc && route(C.loc, p.loc); h += `<div class="li"><span class="ic">${CLASSES[p.cls].icon}</span><div class="t"><span class="pname real">★${esc(p.name)}</span>${p.host ? ' <span class="pill">队长</span>' : ''}<small>Lv${p.lv} · ${PLACES[p.loc]?.name || '?'}${p.busy ? ' · 忙碌中' : ''}</small></div><div class="acts">${can ? `<button class="sb" onclick="autoWalk('${p.loc}')">去找他</button>` : ''}</div></div>`; }
  for (const f of bots) h += `<div class="li"><span class="ic">${CLASSES[f.cls].icon}</span><div class="t"><span class="pname" style="color:${CLASSES[f.cls].color}">${esc(f.name)}</span><small>Lv${fakeLv(f)} ${CLASSES[f.cls].name} · 跟随中</small></div><div class="acts"><button class="sb" onclick="kickBot('${f.id}')">请离</button></div></div>`;
  h += '</div></div>';
  h += `<div class="card"><h3>组队</h3><div style="font-size:13.5px" class="dim">去“附近”找玩家邀请组队，队友会跟你一起战斗、分经验（组队有经验加成）。和真人朋友一起玩点 🔗 联机。</div><div class="row" style="margin-top:6px"><button class="sb pri" onclick="openModal('coop')">🔗 ${NETROLE ? '房间 ' + NET.code : '联机组队'}</button><button class="sb" onclick="openSide('near')">附近的人</button></div></div>`;
  return h;
}
function pMore() { const b = (k, i, n) => `<button class="sb" style="min-height:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:13px" onclick="openModal('${k}')"><span style="font-size:22px">${i}</span>${n}</button>`;
  return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px">${b('sign', '📅', '每日')}${b('mail', '📬', '邮件')}${b('rank', '🏆', '排行')}${b('market', '💰', '交易行')}${b('guild', '🏯', '公会')}${b('coop', '🔗', '联机')}${b('help', '❓', '玩法')}${b('set', '⚙️', '设置')}</div>`; }
/* ---------- map ---------- */
function pMap() {
  const area = UI.mapArea || PLACES[C.loc].area, ps = Object.values(PLACES).filter(p => p.area === area), qw = questWhere();
  const xs = ps.map(p => p.x), ys = ps.map(p => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const W = 290, H = Math.max(140, (y1 - y0 + 1) * 62), px = p => 40 + (x1 > x0 ? (p.x - x0) / (x1 - x0) * (W - 80) : (W - 80) / 2), py = p => 26 + (y1 > y0 ? (p.y - y0) / (y1 - y0) * (H - 52) : (H - 52) / 2);
  let lines = ''; for (const p of ps) for (const t of Object.values(exitsOf(p.id))) { const q = PLACES[t]; if (q.area === area && p.id < t) lines += `<line x1="${px(p)}" y1="${py(p)}" x2="${px(q)}" y2="${py(q)}" stroke="#5a4a34" stroke-width="2"/>`; }
  const nodes = ps.map(p => `<div class="mn ${p.id === C.loc ? 'cur' : ''} ${p.id === qw ? 'q' : ''} ${WB && !WB.dead && WB.loc === p.id && now() < WB.end ? 'wb' : ''} ${C.seen[p.id] ? '' : 'unk'}" style="left:${px(p)}px;top:${py(p)}px" onclick="${p.id === C.loc ? '' : `autoWalk('${p.id}')`}">${p.name}${p.lv ? `<small>${p.lv[0]}-${p.lv[1]}级</small>` : ''}</div>`).join('');
  return `<div class="row" style="flex-wrap:wrap;gap:4px">${Object.entries(AREAS).map(([k, A]) => `<button class="sb ${k === area ? 'pri' : ''}" style="min-height:30px" onclick="UI.mapArea='${k}';refresh()">${A.name}</button>`).join('')}</div>
    <div class="map" style="width:${W}px;height:${H}px"><svg width="${W}" height="${H}" style="position:absolute;inset:0">${lines}</svg>${nodes}</div><div class="dim" style="font-size:12px">点地点自动寻路 · ★ 任务目标 · 红框 世界首领</div>`;
}
