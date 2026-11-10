/* ================= side panel (wide: always shown; phone: opened from the bottom bar) and small windows ================= */
const TABS = [{ k: 'hero', i: '🧒', n: '石昊' }, { k: 'pet', i: '🐒', n: '宠物' }, { k: 'bag', i: '🎒', n: '背包' }, { k: 'map', i: '🗺️', n: '地图' }];
function showTab(k) { UI.tab = k; if (UI.layout === 'narrow') UI.nav = k; sfx('click'); refresh(); }
function navTo(k) { sfx('click'); UI.nav = k === 'adv' || UI.nav === k ? null : k; if (UI.nav) UI.tab = k; refresh(); }
function renderSide() {
  const tabs = TABS.filter(t => t.k !== 'pet' || Object.keys(C.pets).length || itemN('peaegg'));
  const body = UI.layout === 'narrow' ? $('sbody') : $('rbody'); const head = UI.layout === 'narrow' ? $('stabs') : $('rtabs');
  if (UI.layout === 'narrow') { $('bnav').innerHTML = [{ k: 'adv', i: '⚔️', n: '冒险' }, ...tabs].map(t => `<button class="${(UI.nav || 'adv') === t.k ? 'on' : ''}" onclick="navTo('${t.k}')"><span class="i">${t.i}</span>${t.n}${t.k === 'hero' && STATE.dtPending ? '<span class="dot"></span>' : ''}</button>`).join(''); $('sheet').classList.toggle('on', !!UI.nav); if (!UI.nav) return; head.innerHTML = `<button class="on">${tabs.find(t => t.k === UI.tab)?.n || ''}</button>`; }
  else head.innerHTML = tabs.map(t => `<button class="${t.k === UI.tab ? 'on' : ''}" onclick="showTab('${t.k}')">${t.n}</button>`).join('');
  if (!tabs.some(t => t.k === UI.tab)) UI.tab = 'hero';
  const same = body.dataset.k === UI.tab, st = body.scrollTop; body.innerHTML = ({ hero: pHero, pet: pPet, bag: pBag, map: pMap })[UI.tab](); body.dataset.k = UI.tab; if (same) body.scrollTop = st;
}
function pHero() {
  const s = charStats(), R = realmOf(C.lv);
  const sk = C.sk.length ? C.sk.slice().sort((a, b) => SKILL_ORDER.indexOf(a) - SKILL_ORDER.indexOf(b)).map(id => { const S = SKILLS[id], on = C.bar.includes(id); return `<div class="li ${on ? 'on' : ''}" onclick="toggleBar('${id}')"><span class="ic">${S.icon}</span><div class="t"><b>${S.name}</b> <span class="pill">${S.mp} 符力</span>${S.cd ? `<span class="pill">冷却 ${S.cd}</span>` : ''}<small>${S.desc}</small></div><span class="chk">${on ? '✔' : ''}</span></div>`; }).join('') : '<div class="dim">还没有学会宝术。跟着主线走，会有机缘的。</div>';
  const gf = C.gf.map(g => GONGFA[g]).map(G => `<div class="li"><span class="ic">${G.icon}</span><div class="t"><b>${G.name}</b><small>${G.desc}</small></div></div>`).join('');
  const dt = C.dt.length ? `<div class="dts">${C.dt.map(k => { const d = DONGTIAN.find(x => x.k === k); return `<span class="pill" title="${d.d}">${d.n}</span>`; }).join('')}</div>` : '';
  return `<div class="card"><div class="me-hd"><div class="avatar">🧒</div><div style="flex:1;min-width:0"><div class="nm">石昊 <span class="dim" style="font-size:13px">小不点</span></div><div class="sub">${R.name} · 第 ${C.lv} 层${C.dt.length ? ` · ${C.dt.length} 座洞天` : ''}</div></div></div>
    <div class="bars" style="margin-top:8px">气血 ${Math.ceil(C.hp)}/${s.hpMax}<div class="bar"><i style="width:${C.hp / s.hpMax * 100}%"></i></div>符力 ${Math.floor(C.mp)}/${s.mpMax}<div class="bar mp"><i style="width:${C.mp / s.mpMax * 100}%"></i></div>经验 ${fmt(C.exp)}/${fmt(BAL.expNext(C.lv))}<div class="bar exp"><i style="width:${Math.min(100, C.exp / BAL.expNext(C.lv) * 100)}%"></i></div></div>
    <div class="kv"><div><span>攻击</span> ${s.atk}</div><div><span>防御</span> ${s.def}</div><div><span>身法</span> ${s.spd}</div><div><span>暴击</span> ${(s.crit * 100).toFixed(0)}%</div></div>${dt}</div>
    <div class="card"><h3>宝术 <span class="dim" style="font-size:12px;font-family:var(--ff)">点选带进战斗（${C.bar.length}/4）</span></h3><div class="list">${sk}</div></div>
    <div class="card"><h3>修炼</h3><div class="list">${gf}</div></div>`;
}
function pPet() {
  const ids = Object.keys(C.pets); let h = '';
  if (!ids.length && itemN('peaegg')) h += `<div class="card"><h3>🥚 奇怪的蛋</h3><div class="dim">揣在怀里暖着。再打 ${Math.max(0, 8 - (C.story.f.eggWins || 0))} 场胜仗，它也许就孵出来了。</div></div>`;
  const foods = Object.keys(C.bag).filter(k => ITEMS[k].food);
  for (const id of ids) { const P = PETS[id], p = C.pets[id], on = C.pet === id, open = petSkillsOpen(id);
    h += `<div class="card"><div class="row"><span style="font-size:30px">${P.icon}</span><div style="flex:1"><h3 style="margin:0">${P.name}</h3><div class="dim" style="font-size:12px">${P.race}</div></div><button class="sb ${on ? 'pri' : ''}" onclick="setPet('${id}')">${on ? '跟着你' : '让它跟着'}</button></div>
      <div class="dim" style="font-size:13px;margin:6px 0">${P.desc}</div>
      <div class="bars">亲近 ${p.aff}/100<div class="bar exp"><i style="width:${p.aff}%"></i></div></div>
      <div style="font-size:13px">${P.sk.map(s => `<span class="pill" style="${open.includes(s) ? 'color:#f0d79a;border-color:#a8843e' : ''}">${s.n}${s.aff && p.aff < s.aff ? ` · 亲近${s.aff}` : ''}</span>`).join('')}</div>
      ${foods.length ? `<div class="row" style="flex-wrap:wrap;margin-top:6px">${foods.map(f => `<button class="sb" onclick="feedPet('${id}','${f}')">喂${ITEMS[f].icon}${ITEMS[f].name}×${itemN(f)}</button>`).join('')}</div>` : '<div class="dim" style="font-size:12px;margin-top:4px">没有能喂的东西（兽奶、凶兽肉、灵药、兽骨……）</div>'}</div>`; }
  if (itemN('peaegg') && ids.length) h += `<div class="card"><div class="dim">🥚 怀里的蛋还没孵出来（${C.story.f.eggWins || 0}/8 场胜仗）。</div></div>`;
  return h || '<div class="dim">还没有伙伴。</div>';
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
  const W = 290, H = Math.max(120, (y1 - y0 + 1) * 64), px = p => 46 + (x1 > x0 ? (p.x - x0) / (x1 - x0) * (W - 92) : (W - 92) / 2), py = p => 24 + (y1 > y0 ? (p.y - y0) / (y1 - y0) * (H - 48) : (H - 48) / 2);
  let lines = ''; for (const p of ps) for (const t of Object.values(exitsOf(p.id))) { const q = PLACES[t]; if (q.area === area && p.id < t) lines += `<line x1="${px(p)}" y1="${py(p)}" x2="${px(q)}" y2="${py(q)}" stroke="#5a4a34" stroke-width="2"/>`; }
  const nodes = ps.map(p => `<div class="mn ${p.id === C.loc ? 'cur' : ''} ${p.id === qw ? 'q' : ''} ${ROAM && !ROAM.dead && ROAM.loc === p.id && now() < ROAM.end ? 'wb' : ''}" style="left:${px(p)}px;top:${py(p)}px" onclick="${p.id === C.loc ? '' : `autoWalk('${p.id}')`}">${p.name}${p.lv ? `<small>${p.lv[0]}-${p.lv[1]}层</small>` : ''}</div>`).join('');
  const areas = Object.entries(AREAS).filter(([k]) => Object.values(PLACES).some(p => p.area === k && placeOpen(p.id)));
  const q = curQ();
  return `<div class="card"><h3>${['', '石村', '出村', '补天阁', '百断山'][q.ch]} · ${q.title}</h3><div style="font-size:14px">${questGoalText()}</div>${qw && qw !== C.loc ? `<button class="sb pri" style="margin-top:6px" onclick="autoWalk('${qw}')">▶ 去${PLACES[qw].name}</button>` : ''}
    ${Object.entries(SIDE).filter(([id]) => C.side?.[id] === 'on').map(([id, S]) => `<div class="dim" style="font-size:13px;margin-top:4px">支线 · ${S.title}：${S.need.map(([k, n]) => `${ITEMS[k].name} ${Math.min(itemN(k), n)}/${n}`).join('、')} → ${NPCS[S.npc].name}</div>`).join('')}</div>
    ${areas.length > 1 ? `<div class="row" style="flex-wrap:wrap;gap:4px">${areas.map(([k, A]) => `<button class="sb ${k === area ? 'pri' : ''}" style="min-height:30px" onclick="UI.mapArea='${k}';refresh()">${A.name}</button>`).join('')}</div>` : ''}
    <div class="map" style="width:${W}px;height:${H}px"><svg width="${W}" height="${H}" style="position:absolute;inset:0">${lines}</svg>${nodes}</div>
    ${ROAM && !ROAM.dead && now() < ROAM.end && now() >= ROAM.start ? `<div class="dim" style="font-size:13px">⚔ 凶兽首领 <b class="warn">${MOBS[ROAM.id].name}</b> 在 ${PLACES[ROAM.loc].name}</div>` : ''}<div class="dim" style="font-size:12px">点地点自动走过去 · ★ 主线目标</div>`;
}

/* ---------- small windows ---------- */
function showModal(title, html) { $('mt').innerHTML = title; $('mb').innerHTML = html; $('modal').classList.add('on'); }
function closeModal() { $('modal').classList.remove('on'); UI.modal = null; UI.hubArm = 0; UI.delArm = 0; }
$('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
function openModal(k, again) {
  if (!again) sfx('click'); UI.modal = k; const box = $('mb'), st = again ? box.scrollTop : 0; let t = '', h = '';
  if (k === 'arena') { t = '虚神界'; arenaDaily(); const os = arenaOpponents(); UI.ao = os; const r = arenaRank();
    h = `<div class="card"><div class="row"><div>我的排名 <span class="pw">${r > 100 ? '榜外' : r}</span></div><span class="sp"></span><div>今天还能打 <b>${C.arena.tries}</b> 次</div></div><div class="dim" style="font-size:12px">赢了排名比你高的人，就换到他的名次。只伤神魂，不伤肉身。</div></div>
      <div class="list">${os.map((o, i) => `<div class="li"><span class="ic">${o.icon}</span><div class="t"><b>${esc(o.name)}</b><small>第 ${o.rank} 名 · ${realmOf(o.lv).name}${o.lv}层</small></div><div class="acts"><button class="sb pri" ${C.arena.tries > 0 ? '' : 'disabled'} onclick="arenaFight(UI.ao[${i}])">挑战</button></div></div>`).join('')}</div>
      <h4 style="margin:12px 0 4px;color:var(--gold2)">光幕前十</h4><div style="font-size:13px;line-height:1.8">${Array.from({ length: 10 }, (_, i) => i + 1).map(n => n === r ? `<b>${n}. 石昊（你）</b>` : `${n}. ${esc(rivalAt(n).name)}`).join('<br>')}</div>`; }
  if (k === 'coop') { t = '联机';
    if (inArtifact()) h = '<div class="card">这个页面运行在 claude.ai 里，浏览器安全策略不允许联机。请从游戏厅网址打开。</div>';
    else if (NETROLE) h = `<div class="card"><h3>房间 ${NET.code}</h3><div style="font-size:14px">两个人看的是同一个画面。谁点“我来操作”，就由谁来控制石昊。</div>
        <div style="margin:8px 0;font-size:15px">现在：<b>${myControl() ? '你在操作' : '队友在操作'}</b>${NET.peers ? '' : '<br><span class="warn">还没有人加入</span>'}</div>
        <div class="row"><button class="sb pri" ${myControl() ? 'disabled' : ''} onclick="takeControl()">🎮 我来操作</button><button class="sb" onclick="netLeave();openModal('coop',1)">离开房间</button></div></div>`;
    else h = `<div class="card"><h3>开房间</h3><div class="dim" style="font-size:13px">用你的存档开一个房间，朋友加入后和你看同一个画面，可以随时交换操作。</div><button class="sb pri" style="margin-top:6px" onclick="netHost()">开房间</button></div>
        <div class="card"><h3>加入</h3><div class="row"><input id="jcode" class="namein" style="font-size:20px;letter-spacing:6px;text-transform:uppercase" maxlength="4" placeholder="房间码"><button class="sb pri" onclick="netJoin($('jcode').value)">加入</button></div></div>${NET.status ? `<div class="warn">${esc(NET.status)}</div>` : ''}`; }
  if (k === 'set') { t = '设置';
    h = `<div class="card"><label class="row"><input type="checkbox" ${SET.mute ? '' : 'checked'} onchange="SET.mute=!this.checked;saveSet()"> 音效</label>
      <label class="row">音量 <input type="range" min="0" max="1" step="0.05" value="${SET.vol}" oninput="SET.vol=+this.value;if(AU.master)AU.master.gain.value=SET.vol;saveSet()"></label>
      <label class="row"><input type="checkbox" ${SET.fast ? 'checked' : ''} onchange="SET.fast=this.checked;saveSet()"> 战斗文字一次显示完</label></div>
      <div class="card dim" style="font-size:13px">存档保存在这个浏览器里，每次行动后自动保存。<br>电脑上可以用方向键 / WASD 移动，F 探索，空格继续对话，数字键选选项和宝术。</div>
      <div class="row" style="flex-wrap:wrap"><button class="sb" onclick="toTitle()">回到标题</button>${HUB ? `<button class="sb" onclick="hubBack(this)">${UI.hubArm ? '再点一次确认' : '返回游戏厅'}</button>` : ''}<button class="sb" style="color:#ff8a7a" onclick="delChar(this)">${UI.delArm ? '再点一次，从头开始' : '删档重来'}</button></div>`; }
  $('mt').innerHTML = t; box.innerHTML = h; $('modal').classList.add('on'); box.scrollTop = st;
}
function hubBack(b) { if (!UI.hubArm) { UI.hubArm = 1; b.textContent = '再点一次确认'; return; } save(true); location.href = '../'; }
function delChar(b) { if (!UI.delArm) { UI.delArm = 1; b.textContent = '再点一次，从头开始'; return; } store.del('save2'); netLeave(); C = null; closeModal(); toTitle(); }
