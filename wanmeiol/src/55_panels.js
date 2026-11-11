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
  $('stabs').innerHTML = UI.nav === 'log' ? [['log', '刚才'], ['rumor', '江湖传闻'], ['memo', '回忆录'], ['codex', '凶兽图鉴']].map(([k, n]) => `<button class="${UI.logTab === k ? 'on' : ''}" onclick="UI.logTab='${k}';renderSide()">${n}</button>`).join('') : '';
  body.innerHTML = UI.nav === 'log' ? ({ log: pLog, rumor: pRumor, memo: pMemo, codex: pCodex })[UI.logTab]() : ({ hero: pHero, pet: pPet, bag: pBag, map: pMap })[UI.nav]();
  body.dataset.k = key; if (UI.nav === 'log' && UI.logTab === 'log' && (!same || atEnd)) body.scrollTop = body.scrollHeight; else if (same) body.scrollTop = st; else body.scrollTop = 0;
}
/* 江湖传闻 history, drawn as a roadside tavern: patrons' seals and paper bubbles, days as hanging tags, newest on top */
const TAVERN_SVG = `<svg class="tv-scene" viewBox="0 0 600 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs><linearGradient id="tvw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#21140b"/><stop offset="1" stop-color="#3d2615"/></linearGradient>
  <radialGradient id="tvg"><stop offset="0" stop-color="#ffb35a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb35a" stop-opacity="0"/></radialGradient></defs>
  <rect width="600" height="150" fill="url(#tvw)"/>
  <g stroke="#120a05" stroke-width="2" fill="#2c1c10" opacity=".9"><rect x="250" y="36" width="100" height="62" fill="#5a3a1c"/><path d="M275 36v62M300 36v62M325 36v62M250 57h100M250 78h100" fill="none"/></g>
  <rect x="250" y="36" width="100" height="62" fill="#ffcf7a" opacity=".12"/>
  <rect y="0" width="600" height="14" fill="#140b05"/><rect x="34" y="0" width="12" height="150" fill="#1a0f07"/><rect x="554" y="0" width="12" height="150" fill="#1a0f07"/>
  <g class="tv-lan"><circle cx="120" cy="52" r="34" fill="url(#tvg)"/><line x1="120" y1="14" x2="120" y2="30" stroke="#0c0703" stroke-width="2"/><rect x="111" y="29" width="18" height="5" rx="1" fill="#c99a3a"/><ellipse cx="120" cy="52" rx="15" ry="19" fill="#b8322a"/><path d="M110 40q10 12 0 24M130 40q-10 12 0 24M120 33v38" stroke="#7a1d18" fill="none"/><rect x="111" y="70" width="18" height="5" rx="1" fill="#c99a3a"/><path d="M116 75v10M120 75v12M124 75v10" stroke="#d6a640"/></g>
  <g class="tv-lan b"><circle cx="200" cy="48" r="28" fill="url(#tvg)"/><line x1="200" y1="14" x2="200" y2="28" stroke="#0c0703" stroke-width="2"/><rect x="192" y="27" width="16" height="4" rx="1" fill="#c99a3a"/><ellipse cx="200" cy="47" rx="12" ry="16" fill="#b8322a"/><path d="M200 31v32" stroke="#7a1d18"/><rect x="192" y="62" width="16" height="4" rx="1" fill="#c99a3a"/></g>
  <line x1="470" y1="14" x2="470" y2="122" stroke="#120a05" stroke-width="5"/>
  <g class="tv-flag"><path d="M472 20h52v74l-8-6-9 7-8-6-9 7-9-6-9 6z" fill="#ead9b4" stroke="#9b2a22" stroke-width="3"/><text x="498" y="66" text-anchor="middle" font-size="30" fill="#a8261e" font-family="serif" font-weight="700">酒</text></g>
  <g fill="#140b05"><rect x="60" y="112" width="130" height="8" rx="2"/><rect x="72" y="120" width="7" height="30"/><rect x="171" y="120" width="7" height="30"/><path d="M95 112q8-11 16 0zM140 112q6-9 12 0z"/><rect x="232" y="120" width="140" height="30"/><rect x="226" y="113" width="152" height="8" rx="2"/><path d="M270 113q10-12 20 0z"/><rect x="400" y="116" width="120" height="7" rx="2"/><rect x="410" y="123" width="6" height="27"/><rect x="503" y="123" width="6" height="27"/><path d="M440 116v-12h14v12zM480 116q7-10 14 0z"/></g>
  <g fill="#2b1a0d"><ellipse cx="112" cy="104" rx="11" ry="13"/><rect x="100" y="112" width="24" height="38" rx="8"/><ellipse cx="160" cy="106" rx="10" ry="12"/><rect x="149" y="113" width="22" height="37" rx="8"/><ellipse cx="300" cy="103" rx="11" ry="13"/><rect x="288" y="111" width="24" height="39" rx="8"/><ellipse cx="462" cy="104" rx="10" ry="12"/><rect x="451" y="111" width="22" height="39" rx="8"/></g>
</svg>`;
function pRumor() { const L = (C.rumorLog || []).slice().reverse(), tav = b => `<div class="tavern"><div class="tv-top">${TAVERN_SVG}<div class="tv-plaque">闲话酒肆</div></div>${b}</div>`;
  if (!L.length) return tav('<div class="tv-xiao">店小二擦着桌子：「客官来得早，今儿还没什么新鲜事。到外头多走走，回来再听。」</div>');
  const by = []; for (const r of L) { if (!by.length || by[by.length - 1][0] !== r.day) by.push([r.day, []]); by[by.length - 1][1].push(r); }
  let k = 0; const row = r => { const s = sealOf({ who: r.who }), act = /^（/.test(r.t), side = k++ % 2 ? 'r' : '', pl = r.at && PLACES[r.at] ? PLACES[r.at].name : '';
    return `<div class="tv-r ${side}">${sealHtml(s)}<div class="tv-b ${act ? 'act' : ''}">${k === 1 ? '<span class="tv-new">新</span>' : ''}${r.t}${pl || r.nt != null ? `<div class="tv-at">${pl ? '在' + esc(pl) : ''}${r.nt != null ? (r.nt ? ' · 夜里' : ' · 白天') : ''}听来</div>` : ''}</div></div>`; };
  return tav(`<div class="tv-intro">南来北往的客人，嘴里没一句闲着的——有说你的，也有说还没发生的事。共听到 ${L.length} 条。</div>`
    + by.map(([d, rs]) => `<div class="tv-day"><span>第 ${d} 天</span></div>${rs.map(row).join('')}`).join('')
    + '<div class="tv-xiao">店小二拎着铜壶走过：「客官，再添一壶？」</div>'); }
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
      <div class="pf-bar" title="熟练度"><i style="width:${nx ? Math.min(100, n / nx.at * 100) : 100}%"></i></div><small>熟练度 ${n}${nx ? ` / ${nx.at} → ${nx.n}（威力 +${Math.round(nx.b * 100)}%）` : ` · 已${PROF[PROF_MAX].n}（威力 +${Math.round(PROF[PROF_MAX].b * 100)}%）`}</small></div><span class="chk">${on ? '✔' : ''}</span></div>`; }).join('') : '<div class="dim">还没有学会宝术。跟着主线走，会有机缘的。</div>';
  const gf = C.gf.map(g => GONGFA[g]).map(G => `<div class="li"><span class="ic">${G.icon}</span><div class="t"><b>${G.name}</b><small>${G.desc}</small></div></div>`).join('');
  const relics = Object.keys(C.relics || {}).length ? `<div class="list">${Object.keys(C.relics).map(id => { const R = RELICS[id], on = (C.eq || []).includes(id); return `<div class="li ${on ? 'on' : ''}" onclick="equipRelic('${id}')"><span class="ic">${R.i}</span><div class="t"><b>${R.n}</b><small>${R.d}</small></div><span class="chk">${on ? '✔' : ''}</span></div>`; }).join('')}</div>` : '';
  const dt = C.dt.length ? `<div class="dts">${C.dt.map(k => { const d = DONGTIAN.find(x => x.k === k); return `<span class="pill" title="${d.d}">${d.n}</span>`; }).join('')}</div>` : '';
  return `<div class="card"><div class="me-hd"><div style="flex:1;min-width:0"><div class="nm">石昊 <span class="dim" style="font-size:.85rem">小不点</span>${C.title && ACH.find(a => a.id === C.title) ? ` <span class="pill gold">${ACH.find(a => a.id === C.title).n}</span>` : ''}</div><div class="sub">${R.name} · 第 ${C.lv} 层${C.dt.length ? ` · ${C.dt.length} 座洞天` : ''}</div></div><div class="pw" title="战力">${fmt(s.power)}</div></div>
    <div class="bars" style="margin-top:8px">气血 ${Math.ceil(C.hp)}/${s.hpMax}<div class="bar"><i style="width:${C.hp / s.hpMax * 100}%"></i></div>符力 ${Math.floor(C.mp)}/${s.mpMax}<div class="bar mp"><i style="width:${C.mp / s.mpMax * 100}%"></i></div>经验 ${fmt(C.exp)}/${fmt(BAL.expNext(C.lv))}<div class="bar exp"><i style="width:${Math.min(100, C.exp / BAL.expNext(C.lv) * 100)}%"></i></div></div>
    <div class="kv"><div><span>攻击</span> ${s.atk}</div><div><span>防御</span> ${s.def}</div><div><span>身法</span> ${s.spd}</div><div><span>暴击</span> ${(s.crit * 100).toFixed(0)}%</div></div>${dt}</div>
    <div class="card"><h3>宝术 <span class="dim" style="font-size:.8rem;font-family:var(--ff)">点选带进战斗（${C.bar.length}/${barSlots(C.lv)}，境界越高能带越多）· 越用越熟</span></h3><div class="list">${sk}</div></div>${fuseHtml()}
    <div class="card"><h3>宝骨 <span class="dim" style="font-size:.8rem;font-family:var(--ff)">打倒首领得到（${(C.eq || []).length}/${relicSlots(C.lv)}，境界越高能戴越多）</span></h3>${relics || '<div class="dim" style="font-size:.87rem">还没有。第一次打倒一个首领，它会留下点东西。</div>'}</div>
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
      <div class="bars">等级 <b>${petLv(id)}</b>${petLv(id) >= PET_LV_CAP ? '（满级）' : !C.story.f.end && petLv(id) >= C.lv + 2 ? '（第一卷里最多比石昊高 2 级）' : ` · 经验 ${fmt(p.exp || 0)}/${fmt(petNeed(petLv(id)))}`}${petLv(id) > C.lv ? ` · <b>比石昊高 ${petLv(id) - C.lv} 级，属性 +${(petLv(id) - C.lv) * 3}%</b>` : petLv(id) < C.lv ? ' · 比石昊低，经验 ×1.6 追得快' : ''}<div class="bar"><i style="width:${petLv(id) >= PET_LV_CAP ? 100 : Math.min(100, (p.exp || 0) / petNeed(petLv(id)) * 100)}%;background:#7fd36f"></i></div>
      亲近 ${p.aff}/100${p.evo2 ? ' · <b>已返祖</b>（再 +15%）' : p.evo ? ' · <b>已觉醒</b>（+15%）· 25 级时返祖' : ' · 满 100 觉醒'}<div class="bar exp"><i style="width:${p.aff}%"></i></div></div>
      ${(() => { const u = petUnit(id); return `<div class="kv" style="margin-bottom:4px"><div><span>气血</span> ${u.hpMax}</div><div><span>攻击</span> ${u.atk}</div><div><span>防御</span> ${u.def}</div><div><span>身法</span> ${u.spd.toFixed(1)}</div></div>`; })()}
      <h4 style="margin:8px 0 2px">招式栏 <span class="dim" style="font-size:.8rem;font-weight:400">点选带进战斗（${petBar(id).length}/${petSlots(id)}，觉醒后 +1）；栏满了再选，会换下同类里最低阶的</span></h4>
      <div class="list" style="margin-top:4px">${P.sk.map((s, i) => { const ok = open.includes(s), on = ok && petBar(id).includes(i); return `<div class="li ${ok ? '' : 'unk'} ${on ? 'on' : ''}" style="padding:5px 8px" ${ok ? `onclick="togglePetMove('${id}',${i})"` : ''}><span class="pill" style="color:${PET_CAT[s.cat].c};border-color:${PET_CAT[s.cat].c}">${PET_CAT[s.cat].n}</span><div class="t"><b>${s.n}</b>${ok ? '' : s.evo ? ' <span class="dim">（觉醒后）</span>' : ` <span class="dim">（亲近 ${s.aff}）</span>`}<small>${s.d || ''}</small></div>${ok ? (() => { const r = petRank(id, i), R = RANK_COST[r + 1]; return `<span class="pill gold">${r} 阶</span>${R ? `<button class="sb" style="min-height:30px" title="${R.need.map(([k, n]) => ITEMS[k].name + '×' + n).join('、')}${R.lv > 1 ? '，伙伴 ' + R.lv + ' 级' : ''}" onclick="event.stopPropagation();petRankUp('${id}',${i})" ${R.need.every(([k, n]) => itemN(k) >= n) && petLv(id) >= R.lv ? '' : 'disabled'}>升阶</button>` : ''}`; })() : ''}<span class="chk">${on ? '✔' : ''}</span></div>`; }).join('')}</div>
      <div class="dim" style="font-size:.78rem;margin-top:4px">升阶：2 阶要 兽骨×4、灵药×2；3 阶要 兽骨×8、宝药×1，伙伴 15 级。每阶效果 +20%，3 阶持续多一回合。</div>
      ${foods.length ? `<div class="row" style="flex-wrap:wrap;margin-top:6px">${foods.map(f => `<button class="sb" onclick="feedPet('${id}','${f}')">喂${ITEMS[f].icon}${ITEMS[f].name}×${itemN(f)}</button>`).join('')}</div>` : '<div class="dim" style="font-size:.8rem;margin-top:4px">没有能喂的东西（兽奶、凶兽肉、灵药、兽骨……）</div>'}</div>`; }
  if (itemN('peaegg') && ids.length) h += `<div class="card"><div class="dim">🥚 怀里的蛋还没孵出来（${C.story.f.eggWins || 0}/8 场胜仗）。</div></div>`;
  if (ids.length) h = '<div class="card dim" style="font-size:.85rem">灵兽伙伴跟着你打仗，每回合石昊出完招就轮到它，由你给它选招。它自己也会升级（最高 30 级，比石昊还能多练十级），招式能用材料升阶。它的招分四种：<b>攻击</b>、给石昊的<b>增益</b>、给敌人的<b>减益</b>、<b>防守</b>——破甲、印记、战吼都能让石昊的宝术打得更狠；石昊把敌人打晕，伙伴打它也更痛。亲近越高会的越多。战斗里可以点 ⇄ 换另一个上场。</div>' + h;
  return h || '<div class="dim">还没有灵兽伙伴。</div>';
}
const BAG_TABS = [['use', '药品'], ['mat', '材料'], ['gf', '修炼'], ['key', '要物'], ['shop', '买卖']];
function pBag() {
  const P = PLACES[C.loc], tab = BAG_TABS.some(t => t[0] === UI.bagTab) ? UI.bagTab : 'use', trade = canTrade();
  const head = `<div class="card"><div class="row"><div>灵石 <span class="pw">💎${fmt(C.money || 0)}</span></div><span class="sp"></span><span class="dim" style="font-size:.8rem">${trade ? (P.shop ? `${P.shopBy}：能买能卖` : '这里能卖东西') : '到村子、补天阁才能买卖'}</span></div></div>
    <div class="seg" style="margin-bottom:8px">${BAG_TABS.map(([k, n]) => `<button class="sb ${tab === k ? 'on' : ''}" onclick="UI.bagTab='${k}';renderSide()">${n}${k !== 'shop' ? ` ${Object.keys(C.bag).filter(id => ITEMS[id].type === k).length}` : ''}</button>`).join('')}</div>`;
  if (tab === 'shop') { const sell = Object.keys(C.bag).filter(id => PRICE[id]);
    return head + (P.shop ? `<div class="card"><h4 style="margin-top:0">${P.shopBy} · 买</h4><div class="list">${P.shop.map(id => `<div class="li"><span class="ic">${ITEMS[id].icon}</span><div class="t">${ITEMS[id].name} <span class="dim">（有 ${itemN(id)}）</span><small>${ITEMS[id].desc}</small></div><div class="acts"><button class="sb pri" ${(C.money || 0) < PRICE[id] ? 'disabled' : ''} onclick="buyItem('${id}')">💎${PRICE[id]}</button></div></div>`).join('')}</div></div>` : `<div class="card dim" style="font-size:.87rem">这里没有卖东西的摊子。村中有货郎，补天阁山门外有外门坊市。</div>`)
      + `<div class="card"><h4 style="margin-top:0">卖${trade ? '' : '（到城镇才能卖）'}</h4>${sell.length ? `<div class="list">${sell.map(id => `<div class="li"><span class="ic">${ITEMS[id].icon}</span><div class="t">${ITEMS[id].name} ×${C.bag[id]}<small>一个卖 💎${sellPrice(id)}</small></div><div class="acts"><button class="sb" ${trade ? '' : 'disabled'} onclick="sellItem('${id}')">卖 1</button><button class="sb" ${trade ? '' : 'disabled'} onclick="sellItem('${id}',1)">全卖</button></div></div>`).join('')}</div>` : '<div class="dim">没有能卖的东西。</div>'}</div>`; }
  const ids = Object.keys(C.bag).filter(id => ITEMS[id].type === tab);
  if (!ids.length) return head + '<div class="dim">这一栏是空的。</div>';
  return head + '<div class="list">' + ids.map(id => { const it = ITEMS[id]; const a = (it.type === 'use' ? `<button class="sb" onclick="useItem('${id}')">用</button>` : it.type === 'gf' ? `<button class="sb pri" onclick="useItem('${id}')">炼化</button>` : '') + (trade && PRICE[id] ? `<button class="sb" onclick="sellItem('${id}')">卖 💎${sellPrice(id)}</button>` : '');
    return `<div class="li"><span class="ic">${it.icon}</span><div class="t">${it.name} ×${C.bag[id]}<small>${it.desc}</small></div><div class="acts">${a}</div></div>`; }).join('') + '</div>';
}
function pMap() {
  const area = UI.mapArea && Object.values(PLACES).some(p => p.area === UI.mapArea && placeOpen(p.id)) ? UI.mapArea : PLACES[C.loc].area, ps = Object.values(PLACES).filter(p => p.area === area && placeOpen(p.id)), qw = taskWhere();
  const xs = ps.map(p => p.x), ys = ps.map(p => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const W = 300, H = Math.max(120, (y1 - y0 + 1) * 66), px = p => 50 + (x1 > x0 ? (p.x - x0) / (x1 - x0) * (W - 100) : (W - 100) / 2), py = p => 24 + (y1 > y0 ? (p.y - y0) / (y1 - y0) * (H - 48) : (H - 48) / 2);
  let lines = ''; for (const p of ps) for (const t of Object.values(exitsOf(p.id))) { const q = PLACES[t]; if (q.area === area && p.id < t) lines += `<line x1="${px(p)}" y1="${py(p)}" x2="${px(q)}" y2="${py(q)}" stroke="#5a4a34" stroke-width="2"/>`; }
  const nodes = ps.map(p => `<div class="mn ${p.id === C.loc ? 'cur' : ''} ${p.id === qw ? 'q' : ''} ${ROAM && !ROAM.dead && ROAM.loc === p.id && now() < ROAM.end ? 'wb' : ''}" style="left:${px(p)}px;top:${py(p)}px" onclick="${p.id === C.loc ? '' : `navTo('adv');autoWalk('${p.id}')`}">${p.name}${p.lv && exCount(p.id).done ? ' ✓' : ''}${p.lv ? `<small>${p.lv[0]}-${p.lv[1]}层${exCount(p.id).n && !exCount(p.id).done ? ` · ${exCount(p.id).have}/${exCount(p.id).n}` : ''}</small>` : ''}</div>`).join('');
  const areas = Object.entries(AREAS).filter(([k]) => Object.values(PLACES).some(p => p.area === k && placeOpen(p.id)));
  const q = curQ();
  const T = tasks(), cur = curTask();
  return `<div class="card"><h3>任务 <span class="dim" style="font-size:.8rem;font-family:var(--ff)">选一个追踪，探索页的提示和 ▶ 去 就跟着它走</span></h3><div class="list">${T.map(t => `<div class="li ${t.key === cur.key ? 'on' : ''}"><div class="t"><span class="pill ${t.key === 'main' ? 'gold' : ''}">${t.kind}</span><b>${esc(t.title)}</b><small>${t.goal}</small></div><div class="acts">${t.key === cur.key ? '<span class="chk">★</span>' : `<button class="sb" onclick="trackTask('${t.key}')">追踪</button>`}${t.where && t.where !== C.loc ? `<button class="sb pri" onclick="trackTask('${t.key}');navTo('adv');autoWalk('${t.where}')">▶ 去</button>` : ''}</div></div>`).join('')}</div></div>
    ${areas.length > 1 ? `<div class="row" style="flex-wrap:wrap;gap:4px">${areas.map(([k, A]) => `<button class="sb ${k === area ? 'pri' : ''}" style="min-height:30px" onclick="UI.mapArea='${k}';renderSide()">${A.name}</button>`).join('')}</div>` : ''}
    <div class="map" style="width:${W}px;height:${H}px"><svg width="${W}" height="${H}" style="position:absolute;inset:0">${lines}</svg>${nodes}</div>
    ${ROAM && !ROAM.dead && now() < ROAM.end && now() >= ROAM.start ? `<div class="dim" style="font-size:.87rem">⚔ 凶兽首领 <b class="warn">${MOBS[ROAM.id].name}</b> 在 ${PLACES[ROAM.loc].name}</div>` : ''}<div class="dim" style="font-size:.8rem">点地点自动走过去 · ★ 正在追踪的任务 · ✓ 探索完成（数字 = 打过的凶兽种类 + 采到的东西）${isNight() ? ' · 现在是夜里，野外会有夜行的凶兽' : ''}</div>`;
}

/* ---------- small windows ---------- */
function closeModal() { $('modal').classList.remove('on'); UI.modal = null; UI.hubArm = 0; UI.delArm = 0; }
$('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
function openModal(k, again) {
  if (!again) sfx('click'); UI.modal = k; const box = $('mb'), st = again ? box.scrollTop : 0; let t = '', h = '';
  if (k === 'arena') { t = '虚神界'; arenaDaily(); const os = arenaOpponents(); UI.ao = os; const r = arenaRank(), g = arenaGift(r), claimed = C.arena.claimed === gameDay();
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
      <h4>动画</h4><label class="row"><input type="checkbox" ${SET.motion === false ? '' : 'checked'} onchange="SET.motion=this.checked;saveSet();applyAnimPref()"> 战斗动画、画面切换动画</label>
      <h4>声音</h4><label class="row"><input type="checkbox" ${SET.mute ? '' : 'checked'} onchange="SET.mute=!this.checked;saveSet();musicMode()"> 音效</label>
      <label class="row"><input type="checkbox" ${SET.music ? 'checked' : ''} onchange="SET.music=this.checked;saveSet();musicMode()"> 背景音乐</label>
      <label class="row">音量 <input type="range" min="0" max="1" step="0.05" value="${SET.vol}" oninput="SET.vol=+this.value;if(AU.master)AU.master.gain.value=SET.vol;saveSet()"></label>
      <h4>战斗</h4><label class="row"><input type="checkbox" ${SET.fast ? 'checked' : ''} onchange="SET.fast=this.checked;saveSet()"> 自动战斗加快</label></div>
      ${jumpHtml()}
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
