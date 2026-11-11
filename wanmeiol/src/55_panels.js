/* ================= the sheet over the screen: 石昊 / 灵兽 / 背包 / 地图 (bottom bar) and 📜 记录 (top bar) =================
   plus three small windows: 虚神界, 联机, 设置 */
const NAV = [{ k: 'adv', i: '🧭', n: '探索' }, { k: 'hero', i: '🧒', n: '石昊' }, { k: 'pet', i: '🐒', n: '灵兽' }, { k: 'bag', i: '🎒', n: '背包' }, { k: 'map', i: '🗺️', n: '地图' }];
const SHEET_T = { hero: '石昊', pet: '灵兽伙伴', bag: '背包', map: '地图', log: '记录' };
function navTo(k) { sfx('click'); UI.nav = k === 'adv' || UI.nav === k ? null : k; if (UI.nav && UI.nav !== 'log') UI.tab = UI.nav; refresh(); renderSide(); }
function showTab(k) { navTo(k); }
function renderSide() {
  if (!C) return; const navs = NAV.filter(t => t.k !== 'pet' || Object.keys(C.pets).length || itemN('peaegg'));
  $('bnav').innerHTML = navs.map(t => `<button class="${(UI.nav || 'adv') === t.k ? 'on' : ''}" onclick="navTo('${t.k}')"><span class="i">${t.i}</span>${t.n}${t.k === 'hero' && STATE.dtPending ? '<span class="dot"></span>' : ''}</button>`).join('');
  const sh = $('sheet'); sh.classList.toggle('on', !!UI.nav); if (!UI.nav) return;
  if (UI.nav === 'pet' && !navs.some(t => t.k === 'pet')) UI.nav = 'hero';
  $('sht').textContent = SHEET_T[UI.nav];
  const body = $('sbody'), key = UI.nav + (UI.nav === 'log' ? UI.logTab : ''), same = body.dataset.k === key, st = body.scrollTop, atEnd = st + body.clientHeight >= body.scrollHeight - 30;
  $('stabs').innerHTML = UI.nav === 'log' ? [['log', '刚才'], ['memo', '回忆录'], ['codex', '凶兽图鉴']].map(([k, n]) => `<button class="${UI.logTab === k ? 'on' : ''}" onclick="UI.logTab='${k}';renderSide()">${n}</button>`).join('') : '';
  body.innerHTML = UI.nav === 'log' ? ({ log: pLog, memo: pMemo, codex: pCodex })[UI.logTab]() : ({ hero: pHero, pet: pPet, bag: pBag, map: pMap })[UI.nav]();
  body.dataset.k = key; if (UI.nav === 'log' && UI.logTab === 'log' && (!same || atEnd)) body.scrollTop = body.scrollHeight; else if (same) body.scrollTop = st; else body.scrollTop = 0;
}
function pLog() { return `<div class="logv">${$('log').innerHTML}</div>`; }
function pMemo() {
  if (NETROLE === 'guest') return '<div class="card dim">回忆录记在房主的浏览器里，联机加入时看不到。</div>';
  if (!JOURNAL.length) return '<div class="card dim">还没有记下什么。从这一版开始，你经历的每一段剧情都会记在这里，随时可以翻回来重读。</div>';
  const by = {}; JOURNAL.forEach((e, i) => (by[e.ch] = by[e.ch] || []).push([e, i]));
  if (UI.memo != null && JOURNAL[UI.memo]) { const e = JOURNAL[UI.memo];
    return `<button class="sb" onclick="UI.memo=null;renderSide()">‹ 目录</button><div class="memo" style="margin-top:8px"><h4>${esc(e.t)}</h4>${e.l.map(([w, t, m]) => w === '▸' ? `<p class="mc">▸ ${t}</p>` : `<p>${w ? `<span class="mw" ${m ? 'style="color:#8a5a10"' : ''}>${esc(w)}</span>` : ''}${t}</p>`).join('')}</div>`; }
  return Object.keys(by).sort().map(ch => `<div class="chap">${CH_NAMES[ch] || ''}</div><div class="list">${by[ch].map(([e, i]) => `<div class="li" onclick="UI.memo=${i};renderSide()"><span class="ic">📖</span><div class="t">${esc(e.t)}<small>${esc(String(e.l.find(x => x[0] !== '▸')?.[1] || '').replace(/<[^>]+>/g, '').slice(0, 34))}……</small></div></div>`).join('')}</div>`).join('');
}
function pCodex() {
  const ids = Object.keys(MOBS).filter(id => !MOBS[id].nocodex), seen = ids.filter(id => C.codex && C.codex[id]);
  return `<div class="card"><div class="row"><div>见过 <b>${seen.length}</b> / ${ids.length} 种</div><span class="sp"></span><div class="dim" style="font-size:.8rem">打中弱点后会记下它怕什么</div></div></div><div class="list">${ids.map(id => { const M = MOBS[id], k = C.kills[id] || 0;
    if (!C.codex || !C.codex[id]) return `<div class="li unk"><span class="ic">？</span><div class="t">？？？<small>${M.night ? '只在夜里出没' : M.roam ? '游荡的凶兽首领' : '还没遇见过'}</small></div></div>`;
    const wk = Object.keys(M.weak || {}), known = knownWeak(id);
    return `<div class="li"><span class="ic">${M.boss ? '👹' : '🐾'}</span><div class="t"><b>${M.name}</b> ${M.boss ? '<span class="pill gold">首领</span>' : ''}${M.night ? '<span class="pill">夜</span>' : ''}<span class="pill">打倒 ${k}</span>${wk.length ? `<span class="pill ${known.length ? 'gold' : ''}">怕：${wk.map(e => known.includes(e) ? EL[e].i + EL[e].n : '？').join(' ')}</span>` : ''}<small>${M.d || ''}</small></div></div>`; }).join('')}</div>`;
}
function pHero() {
  const s = charStats(), R = realmOf(C.lv);
  const sk = C.sk.length ? C.sk.slice().sort((a, b) => SKILL_ORDER.indexOf(a) - SKILL_ORDER.indexOf(b)).map(id => { const S = SKILLS[id], on = C.bar.includes(id), n = (C.prof && C.prof[id]) || 0, pl = profLevel(id), nx = PROF[pl + 1];
    return `<div class="li ${on ? 'on' : ''}" onclick="toggleBar('${id}')"><span class="ic">${S.icon}</span><div class="t"><b>${S.name}</b> ${pl ? `<span class="pill gold">${PROF[pl].n}</span>` : ''}<span class="pill">${S.mp} 符力</span>${S.cd ? `<span class="pill">冷却 ${S.cd}</span>` : ''}${S.el ? `<span class="pill">${EL[S.el].i}${EL[S.el].n}</span>` : ''}<small>${S.desc}</small>
      <div class="pf-bar" title="熟练度"><i style="width:${nx ? Math.min(100, n / nx.at * 100) : 100}%"></i></div><small>熟练度 ${n}${nx ? ` / ${nx.at} → ${nx.n}（威力 +${nx.b * 100}%）` : ' · 已大成'}</small></div><span class="chk">${on ? '✔' : ''}</span></div>`; }).join('') : '<div class="dim">还没有学会宝术。跟着主线走，会有机缘的。</div>';
  const gf = C.gf.map(g => GONGFA[g]).map(G => `<div class="li"><span class="ic">${G.icon}</span><div class="t"><b>${G.name}</b><small>${G.desc}</small></div></div>`).join('');
  const relics = Object.keys(C.relics || {}).length ? `<div class="list">${Object.keys(C.relics).map(id => { const R = RELICS[id], on = (C.eq || []).includes(id); return `<div class="li ${on ? 'on' : ''}" onclick="equipRelic('${id}')"><span class="ic">${R.i}</span><div class="t"><b>${R.n}</b><small>${R.d}</small></div><span class="chk">${on ? '✔' : ''}</span></div>`; }).join('')}</div>` : '';
  const dt = C.dt.length ? `<div class="dts">${C.dt.map(k => { const d = DONGTIAN.find(x => x.k === k); return `<span class="pill" title="${d.d}">${d.n}</span>`; }).join('')}</div>` : '';
  return `<div class="card"><div class="me-hd"><div style="flex:1;min-width:0"><div class="nm">石昊 <span class="dim" style="font-size:.85rem">小不点</span>${C.title && ACH.find(a => a.id === C.title) ? ` <span class="pill gold">${ACH.find(a => a.id === C.title).n}</span>` : ''}</div><div class="sub">${R.name} · 第 ${C.lv} 层${C.dt.length ? ` · ${C.dt.length} 座洞天` : ''}</div></div><div class="pw" title="战力">${fmt(s.power)}</div></div>
    <div class="bars" style="margin-top:8px">气血 ${Math.ceil(C.hp)}/${s.hpMax}<div class="bar"><i style="width:${C.hp / s.hpMax * 100}%"></i></div>符力 ${Math.floor(C.mp)}/${s.mpMax}<div class="bar mp"><i style="width:${C.mp / s.mpMax * 100}%"></i></div>经验 ${fmt(C.exp)}/${fmt(BAL.expNext(C.lv))}<div class="bar exp"><i style="width:${Math.min(100, C.exp / BAL.expNext(C.lv) * 100)}%"></i></div></div>
    <div class="kv"><div><span>攻击</span> ${s.atk}</div><div><span>防御</span> ${s.def}</div><div><span>身法</span> ${s.spd}</div><div><span>暴击</span> ${(s.crit * 100).toFixed(0)}%</div></div>${dt}</div>
    <div class="card"><h3>宝术 <span class="dim" style="font-size:.8rem;font-family:var(--ff)">点选带进战斗（${C.bar.length}/4）· 越用越熟</span></h3><div class="list">${sk}</div></div>
    <div class="card"><h3>宝骨 <span class="dim" style="font-size:.8rem;font-family:var(--ff)">打倒首领得到，戴两件（${(C.eq || []).length}/2）</span></h3>${relics || '<div class="dim" style="font-size:.87rem">还没有。第一次打倒一个首领，它会留下点东西。</div>'}</div>
    <div class="card"><h3>修炼</h3><div class="list">${gf}</div></div>
    <div class="card"><h3>称号 <span class="dim" style="font-size:.8rem;font-family:var(--ff)">${Object.keys(C.ach || {}).length}/${ACH.length} · 点一个戴上</span></h3><div class="dts">${ACH.map(A => (C.ach || {})[A.id] ? `<button class="sb ${C.title === A.id ? 'pri' : ''}" style="min-height:30px" title="${A.d}" onclick="setTitle('${A.id}')">${A.n}</button>` : `<span class="pill" title="${A.d}">？ ${A.d}</span>`).join('')}</div></div>`;
}
function pPet() {
  const ids = Object.keys(C.pets); let h = '';
  if (!ids.length && itemN('peaegg')) h += `<div class="card"><h3>🥚 奇怪的蛋</h3><div class="dim">揣在怀里暖着。再打 ${Math.max(0, 8 - (C.story.f.eggWins || 0))} 场胜仗，它也许就孵出来了。</div></div>`;
  const foods = Object.keys(C.bag).filter(k => ITEMS[k].food);
  for (const id of ids) { const P = PETS[id], p = C.pets[id], on = C.pet === id, open = petSkillsOpen(id);
    h += `<div class="card"><div class="row"><span style="font-size:1.9rem">${P.icon}</span><div style="flex:1"><h3 style="margin:0">${P.name} <span class="pill gold">${P.role}</span></h3><div class="dim" style="font-size:.8rem">${P.race}</div></div><button class="sb ${on ? 'pri' : ''}" onclick="setPet('${id}')">${on ? '跟着你' : '让它跟着'}</button></div>
      <div class="dim" style="font-size:.87rem;margin:6px 0">${P.desc}</div>
      <div class="bars">亲近 ${p.aff}/100${p.evo ? ' · <b>已觉醒</b>（全属性 +15%）' : ' · 满 100 会觉醒'}<div class="bar exp"><i style="width:${p.aff}%"></i></div></div>
      <div style="font-size:.87rem">${P.sk.map(s => `<span class="pill" style="${open.includes(s) ? 'color:#f0d79a;border-color:#a8843e' : ''}">${s.n}${s.aoe ? '·群' : ''}${s.healAlly ? '·治疗' : ''}${s.shieldAll ? '·护盾' : ''}${s.st && s.st.k === 'stun' ? '·晕' : ''}${s.el ? EL[s.el].i : ''}${s.aff && p.aff < s.aff ? ` · 亲近${s.aff}` : ''}</span>`).join('')}</div>
      ${foods.length ? `<div class="row" style="flex-wrap:wrap;margin-top:6px">${foods.map(f => `<button class="sb" onclick="feedPet('${id}','${f}')">喂${ITEMS[f].icon}${ITEMS[f].name}×${itemN(f)}</button>`).join('')}</div>` : '<div class="dim" style="font-size:.8rem;margin-top:4px">没有能喂的东西（兽奶、凶兽肉、灵药、兽骨……）</div>'}</div>`; }
  if (itemN('peaegg') && ids.length) h += `<div class="card"><div class="dim">🥚 怀里的蛋还没孵出来（${C.story.f.eggWins || 0}/8 场胜仗）。</div></div>`;
  if (ids.length) h = '<div class="card dim" style="font-size:.85rem">灵兽伙伴跟着你打仗，每回合石昊出完招就轮到它，由你给它选招。战斗里可以点 ⇄ 换另一个上场。</div>' + h;
  return h || '<div class="dim">还没有灵兽伙伴。</div>';
}
function pBag() {
  const ids = Object.keys(C.bag).sort((a, b) => ['use', 'gf', 'mat', 'key'].indexOf(ITEMS[a].type) - ['use', 'gf', 'mat', 'key'].indexOf(ITEMS[b].type));
  if (!ids.length) return '<div class="dim">空空如也。</div>';
  return '<div class="list">' + ids.map(id => { const it = ITEMS[id]; const a = it.type === 'use' ? `<button class="sb" onclick="useItem('${id}')">用</button>` : it.type === 'gf' ? `<button class="sb pri" onclick="useItem('${id}')">炼化</button>` : '';
    return `<div class="li"><span class="ic">${it.icon}</span><div class="t">${it.name} ×${C.bag[id]}<small>${it.desc}</small></div><div class="acts">${a}</div></div>`; }).join('') + '</div>';
}
function pMap() {
  const area = UI.mapArea && Object.values(PLACES).some(p => p.area === UI.mapArea && placeOpen(p.id)) ? UI.mapArea : PLACES[C.loc].area, ps = Object.values(PLACES).filter(p => p.area === area && placeOpen(p.id)), qw = questWhere();
  const xs = ps.map(p => p.x), ys = ps.map(p => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const W = 300, H = Math.max(120, (y1 - y0 + 1) * 66), px = p => 50 + (x1 > x0 ? (p.x - x0) / (x1 - x0) * (W - 100) : (W - 100) / 2), py = p => 24 + (y1 > y0 ? (p.y - y0) / (y1 - y0) * (H - 48) : (H - 48) / 2);
  let lines = ''; for (const p of ps) for (const t of Object.values(exitsOf(p.id))) { const q = PLACES[t]; if (q.area === area && p.id < t) lines += `<line x1="${px(p)}" y1="${py(p)}" x2="${px(q)}" y2="${py(q)}" stroke="#5a4a34" stroke-width="2"/>`; }
  const nodes = ps.map(p => `<div class="mn ${p.id === C.loc ? 'cur' : ''} ${p.id === qw ? 'q' : ''} ${ROAM && !ROAM.dead && ROAM.loc === p.id && now() < ROAM.end ? 'wb' : ''}" style="left:${px(p)}px;top:${py(p)}px" onclick="${p.id === C.loc ? '' : `navTo('adv');autoWalk('${p.id}')`}">${p.name}${p.lv && exCount(p.id).done ? ' ✓' : ''}${p.lv ? `<small>${p.lv[0]}-${p.lv[1]}层${exCount(p.id).n && !exCount(p.id).done ? ` · ${exCount(p.id).have}/${exCount(p.id).n}` : ''}</small>` : ''}</div>`).join('');
  const areas = Object.entries(AREAS).filter(([k]) => Object.values(PLACES).some(p => p.area === k && placeOpen(p.id)));
  const q = curQ();
  return `<div class="card"><h3>${CH_NAMES[q.ch].split(' · ')[1] || ''} · ${q.title}</h3><div style="font-size:.93rem">${questGoalText()}</div>${qw && qw !== C.loc ? `<button class="sb pri" style="margin-top:6px" onclick="navTo('adv');autoWalk('${qw}')">▶ 去${PLACES[qw].name}</button>` : ''}
    ${Object.entries(SIDE).filter(([id]) => C.side?.[id] === 'on').map(([id, S]) => `<div class="dim" style="font-size:.87rem;margin-top:4px">支线 · ${S.title}：${S.need.map(([k, n]) => `${ITEMS[k].name} ${Math.min(itemN(k), n)}/${n}`).join('、')} → ${NPCS[S.npc].name}</div>`).join('')}</div>
    ${areas.length > 1 ? `<div class="row" style="flex-wrap:wrap;gap:4px">${areas.map(([k, A]) => `<button class="sb ${k === area ? 'pri' : ''}" style="min-height:30px" onclick="UI.mapArea='${k}';renderSide()">${A.name}</button>`).join('')}</div>` : ''}
    ${bountyToday().length ? `<div class="card"><h4 style="margin-top:0">今日悬赏</h4>${bountyToday().map(b => `<div style="font-size:.87rem">${b.st === 'done' ? '✔' : b.st === 'on' ? (bountyReady(b) ? '❗' : '·') : '○'} ${NPCS[b.npc].name}：${bountyText(b)}${b.st === 'new' ? ' <span class="dim">（去找他接）</span>' : ''}</div>`).join('')}</div>` : ''}
    <div class="map" style="width:${W}px;height:${H}px"><svg width="${W}" height="${H}" style="position:absolute;inset:0">${lines}</svg>${nodes}</div>
    ${ROAM && !ROAM.dead && now() < ROAM.end && now() >= ROAM.start ? `<div class="dim" style="font-size:.87rem">⚔ 凶兽首领 <b class="warn">${MOBS[ROAM.id].name}</b> 在 ${PLACES[ROAM.loc].name}</div>` : ''}<div class="dim" style="font-size:.8rem">点地点自动走过去 · ★ 主线目标 · ✓ 探索完成（数字 = 打过的凶兽种类 + 采到的东西）${isNight() ? ' · 现在是夜里，野外会有夜行的凶兽' : ''}</div>`;
}

/* ---------- small windows ---------- */
function closeModal() { $('modal').classList.remove('on'); UI.modal = null; UI.hubArm = 0; UI.delArm = 0; }
$('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
function openModal(k, again) {
  if (!again) sfx('click'); UI.modal = k; const box = $('mb'), st = again ? box.scrollTop : 0; let t = '', h = '';
  if (k === 'arena') { t = '虚神界'; arenaDaily(); const os = arenaOpponents(); UI.ao = os; const r = arenaRank(), g = arenaGift(r), claimed = C.arena.claimed === today();
    h = `<div class="card"><div class="row"><div>我的排名 <span class="pw">${r > 100 ? '榜外' : r}</span></div><span class="sp"></span><div>今天还能打 <b>${C.arena.tries}</b> 次</div></div><div class="dim" style="font-size:.8rem">赢了排名比你高的人，就换到他的名次。只伤神魂，不伤肉身。</div>
      <div class="row" style="margin-top:8px;flex-wrap:wrap"><button class="sb pri" ${claimed ? 'disabled' : ''} onclick="arenaClaim()">${claimed ? '今天的奖励领过了' : '领今日奖励'}</button><span class="dim" style="font-size:.8rem">按排名：${g.items.map(([k, n]) => ITEMS[k].name + '×' + n).join('、')} + 经验</span></div>
      <div class="dim" style="font-size:.8rem;margin-top:6px">首次进前 50 / 前 10 / 第 1：${ARENA_MS.map(M => (C.arena.got && C.arena.got[M.r] ? '✔' : '·') + ' 前' + M.r).join('　')}</div></div>
      <div class="list">${os.map((o, i) => `<div class="li"><span class="ic">${o.icon}</span><div class="t"><b>${esc(o.name)}</b><small>第 ${o.rank} 名 · ${realmOf(o.lv).name}${o.lv}层</small></div><div class="acts"><button class="sb pri" ${C.arena.tries > 0 ? '' : 'disabled'} onclick="arenaFight(UI.ao[${i}])">挑战</button></div></div>`).join('')}</div>
      <h4 style="margin:12px 0 4px;color:var(--gold2)">光幕前十</h4><div style="font-size:.87rem;line-height:1.8">${Array.from({ length: 10 }, (_, i) => i + 1).map(n => n === r ? `<b>${n}. 石昊（你）</b>` : `${n}. ${esc(rivalAt(n).name)}`).join('<br>')}</div>`; }
  if (k === 'coop') { t = '联机';
    if (inArtifact()) h = '<div class="card">这个页面运行在 claude.ai 里，浏览器安全策略不允许联机。请从游戏厅网址打开。</div>';
    else if (NETROLE) h = `<div class="card"><h3>房间 ${NET.code}</h3><div style="font-size:.93rem">两个人看的是同一个画面。谁点“我来操作”，就由谁来控制石昊。</div>
        <div style="margin:8px 0;font-size:1rem">现在：<b>${myControl() ? '你在操作' : '队友在操作'}</b>${NET.peers ? '' : '<br><span class="warn">还没有人加入</span>'}</div>
        <div class="row"><button class="sb pri" ${myControl() ? 'disabled' : ''} onclick="takeControl()">🎮 我来操作</button><button class="sb" onclick="netLeave();openModal('coop',1)">离开房间</button></div></div>`;
    else h = `<div class="card"><h3>开房间</h3><div class="dim" style="font-size:.87rem">用你的存档开一个房间，朋友加入后和你看同一个画面，可以随时交换操作。</div><button class="sb pri" style="margin-top:6px" onclick="netHost()">开房间</button></div>
        <div class="card"><h3>加入</h3><div class="row"><input id="jcode" class="namein" style="font-size:20px;letter-spacing:6px;text-transform:uppercase" maxlength="4" placeholder="房间码"><button class="sb pri" onclick="netJoin($('jcode').value)">加入</button></div></div>${NET.status ? `<div class="warn">${esc(NET.status)}</div>` : ''}`; }
  if (k === 'set') { t = '设置'; const seg = (key, opts) => `<div class="seg">${opts.map(([v, n]) => `<button class="sb ${SET[key] === v ? 'on' : ''}" onclick="setOpt('${key}',${JSON.stringify(v)})">${n}</button>`).join('')}</div>`;
    h = `<div class="card"><h4>难度 <span class="dim" style="font-size:.8rem">随时可以换，只影响敌人的气血和攻击</span></h4>${NETROLE === 'guest' ? '<div class="dim">房主决定</div>' : `<div class="seg">${DIFF.map((d, i) => `<button class="sb ${(C.diff ?? 1) === i ? 'on' : ''}" onclick="setDiff(${i})">${d.n}</button>`).join('')}</div>`}
      <h4>字号</h4>${seg('fs', [[0, '标准'], [1, '大'], [2, '特大']])}
      <h4>动画</h4><label class="row"><input type="checkbox" ${SET.anim === false ? '' : 'checked'} onchange="SET.anim=this.checked;saveSet();applyAnimPref()"> 战斗动画、画面切换动画</label>
      <h4>声音</h4><label class="row"><input type="checkbox" ${SET.mute ? '' : 'checked'} onchange="SET.mute=!this.checked;saveSet();musicMode()"> 音效</label>
      <label class="row"><input type="checkbox" ${SET.music ? 'checked' : ''} onchange="SET.music=this.checked;saveSet();musicMode()"> 背景音乐</label>
      <label class="row">音量 <input type="range" min="0" max="1" step="0.05" value="${SET.vol}" oninput="SET.vol=+this.value;if(AU.master)AU.master.gain.value=SET.vol;saveSet()"></label>
      <h4>战斗</h4><label class="row"><input type="checkbox" ${SET.fast ? 'checked' : ''} onchange="SET.fast=this.checked;saveSet()"> 自动战斗加快</label></div>
      <div class="card"><h4>存档码</h4><div class="dim" style="font-size:.8rem">存档只在这个浏览器里。想换手机或电脑接着玩：在这里生成存档码，复制过去，在新浏览器的这里粘贴、读取。回忆录也一起带走。</div>
      <div class="row" style="margin:6px 0;flex-wrap:wrap">${NETROLE === 'guest' ? '<span class="dim">联机加入时不能导出房主的存档</span>' : `<button class="sb" onclick="doExport()">生成存档码</button>`}<button class="sb" onclick="doImport()">读取存档码</button></div><textarea id="scode" class="code" placeholder="存档码会出现在这里；要读取，把存档码粘贴进来再点“读取”"></textarea><div id="scmsg" class="dim" style="font-size:.8rem"></div></div>
      <div class="card dim" style="font-size:.87rem">每次行动后自动保存。电脑上：方向键 / WASD 移动，F 探索，空格继续对话，数字键选选项和宝术，Esc 关闭面板。</div>
      <div class="row" style="flex-wrap:wrap"><button class="sb" onclick="toTitle()">回到标题</button>${HUB ? `<button class="sb" onclick="hubBack(this)">${UI.hubArm ? '再点一次确认' : '返回游戏厅'}</button>` : ''}<button class="sb" style="color:#ff8a7a" onclick="delChar(this)">${UI.delArm ? '再点一次，从头开始' : '删档重来'}</button></div>`; }
  $('mt').innerHTML = t; const keep = k === 'set' && again && $('scode') ? [$('scode').value, $('scmsg').textContent] : null; box.innerHTML = h; if (keep) { $('scode').value = keep[0]; $('scmsg').textContent = keep[1]; } $('modal').classList.add('on'); box.scrollTop = st;
}
function setDiff(i) { C.diff = i; save(); toast('难度：' + DIFF[i].n); openModal('set', 1); }
function setOpt(k, v) { SET[k] = v; saveSet(); if (k === 'fs') { applyFont(); setTimeout(() => { bannerKey = ''; bannerDraw(); }, 50); } openModal('set', 1); }
async function doExport() { try { $('scode').value = await exportCode(); $('scode').select(); try { await navigator.clipboard.writeText($('scode').value); $('scmsg').textContent = '已生成，并复制到剪贴板。'; } catch (e) { $('scmsg').textContent = '已生成，长按或 Ctrl+C 复制。'; } } catch (e) { $('scmsg').textContent = '生成失败'; } }
async function doImport() { const v = $('scode').value.trim(); if (!v) { $('scmsg').textContent = '先把存档码粘贴进上面的框里。'; return; }
  try { if (NETROLE) netLeave(); const c = await importCode(v); C = c; closeModal(); toast('存档已读取'); enterGame(); } catch (e) { $('scmsg').textContent = '这个存档码读不出来，检查一下有没有复制完整。'; } }
function hubBack(b) { if (!UI.hubArm) { UI.hubArm = 1; b.textContent = '再点一次确认'; return; } save(true); location.href = '../'; }
function delChar(b) { if (!UI.delArm) { UI.delArm = 1; b.textContent = '再点一次，从头开始'; return; } store.del('save2'); store.del('journal2'); JOURNAL = []; netLeave(); C = null; closeModal(); toTitle(); }
