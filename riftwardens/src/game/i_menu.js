/* =================== menus =================== */
const MENU = $('menu');
let MSEL = {lvl: 0, tab: 'lv'};
function showMenu(html, ingame) { MENU.innerHTML = html; MENU.classList.remove('off'); MENU.classList.toggle('ingame', !!ingame); }
function hideMenu() { MENU.classList.add('off'); MENU.innerHTML = ''; }
function on(id, ev, fn) { const el = $(id); if (el) el.addEventListener(ev, e => { audioInit(); sfx('click'); fn(e); }); }
const skullStr = n => `<span class="skulls">${[0, 1, 2, 3, 4].map(i => `<span class="${i < n ? 'on' : ''}">☠</span>`).join('')}</span>`;
const inArtifact = () => !!(window.claude && typeof window.claude.use === 'function') || /(^|\.)(claudeusercontent\.com|claude\.ai|claude\.site)$/.test(location.hostname);
const myName = () => (SAVE.name || '').trim() || HEROES[SAVE.hero].name;

// 游戏厅入口：只在部署于游戏厅文件夹（…/riftwardens/）时显示
const HUB = /\/riftwardens\/(index\.html)?$/.test(location.pathname);
let hubArm = false;
const BRIGHT_N = ['', '明亮', '标准', '昏暗'];
function titleScreen(note = '') {
  STATE = 'title'; PAUSED = false; $('hud').classList.remove('on'); $('touch').classList.remove('on');
  const inRoom = NET.mode === 'online';
  showMenu(`<div class="scr title">
   <div class="logo serif"><h1>裂隙守卫</h1><p>陷阱塔防 · 动作 · 双人合作</p></div>
   <div><div class="cards" id="heroes"></div><div id="heroInfo" class="phoneOnly"></div></div>
   <div class="box" style="margin-top:14px">
    <div class="join"><span class="mut">昵称</span><input id="nm" maxlength="8" placeholder="${HEROES[SAVE.hero].name}" value="${esc(SAVE.name || '')}" style="width:150px;font-size:16px;letter-spacing:0;text-transform:none"></div>
    <div class="btns">
     <button class="btn" id="bSolo">单人游戏</button>
     <button class="btn sec" id="bHost">${inRoom && NET.role === 'host' ? '房间 ' + NET.code : '创建房间'}</button>
    </div>
    <div class="join"><input id="code" maxlength="4" placeholder="房间码" autocomplete="off" autocapitalize="characters"><button class="btn sec" id="bJoin">加入房间</button></div>
    <div class="note" id="tnote">${note}</div>
    <div class="btns"><button class="btn sec" id="bHelp">玩法说明</button><button class="btn sec" id="bBright">亮度：${BRIGHT_N[SAVE.bright] || '标准'}</button>${HUB ? '<button class="btn sec" id="bHub">‹ 游戏厅</button>' : ''}</div>
   </div></div>`);
  const hs = $('heroes');
  for (const k of Object.keys(HEROES)) {
    const H = HEROES[k], d = document.createElement('div'); d.className = 'hcard' + (SAVE.hero === k ? ' sel' : '');
    d.innerHTML = `<canvas width="192" height="220"></canvas><div style="min-width:0"><h3 class="serif">${H.name} <span class="role">${H.role || ''}</span></h3><p>${H.desc}</p><p style="margin-top:5px;color:#cbbfa6">生命 ${H.hp} · 法力 ${H.mp} · ${H.primary.name} / ${H.alt.name} / ${H.skill.name} / ${H.dash.name}</p>${H.passive ? `<p style="margin-top:3px;color:#9fe3ff">${H.passive}</p>` : ''}</div>`;
    portraitCanvas(d.firstChild, k, true);
    d.onclick = () => { audioInit(); sfx('click'); SAVE.hero = k; saveGame(); for (const c of hs.children) c.classList.remove('sel'); d.classList.add('sel'); $('nm').placeholder = H.name; heroInfo(); };
    hs.appendChild(d);
  }
  heroInfo();
  $('nm').addEventListener('input', e => { SAVE.name = e.target.value.slice(0, 8); saveGame(); });
  on('bSolo', 'click', () => { if (NET.mode === 'online') netLeave(); levelScreen(); });
  on('bHost', 'click', () => {
    if (inArtifact()) { $('tnote').textContent = '此页面运行在 claude.ai 预览中，浏览器限制了联机（WebRTC）。请使用托管网址进行双人游戏。'; return; }
    if (NET.mode === 'online' && NET.role === 'host') { levelScreen(); return; }
    netHost(); levelScreen();
  });
  on('bJoin', 'click', () => {
    if (inArtifact()) { $('tnote').textContent = '此页面运行在 claude.ai 预览中，无法联机。请使用托管网址。'; return; }
    netJoin($('code').value);
  });
  $('code').addEventListener('keydown', e => { if (e.key === 'Enter') { audioInit(); netJoin($('code').value); } });
  on('bHelp', 'click', () => helpScreen(() => titleScreen()));
  on('bHub', 'click', () => { location.href = '../'; });
  on('bBright', 'click', () => { SAVE.bright = SAVE.bright % 3 + 1; saveGame(); $('bBright').textContent = '亮度：' + BRIGHT_N[SAVE.bright]; });
}
function heroInfo() { const H = HEROES[SAVE.hero], el = $('heroInfo'); if (el) el.innerHTML = `<b style="color:var(--gold2)">${H.name}</b> · ${H.role} · 生命 ${H.hp}<br>${H.primary.name} / ${H.alt.name} / ${H.skill.name} / ${H.dash.name}<br><span style="color:#9fe3ff">${H.passive}</span>`; }
function setTitleNote(s) { const n = $('tnote'); if (n) n.textContent = s; else toast(s); }

function helpScreen(back, ingame) {
  showMenu(`<div class="scr box help" style="max-width:720px">
   <h2 class="serif">玩法说明</h2>
   <p>兽人从<b style="color:#ff6a4a">红色传送门</b>涌出，沿通路冲向<b style="color:#6be6ff">裂隙</b>。每个兽人进入裂隙都会消耗裂隙能量，能量归零即失败。守住所有波次获得骷髅评价（最多 5 个，裂隙毫发无损才有满分）。</p>
   <p><b>建造阶段</b>：在地面或墙上布置陷阱（花费金币），准备好后按 <kbd>G</kbd> 开战。击杀兽人获得金币，波次结束还有奖励。</p>
   <p><b>键鼠</b>：<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动 · 鼠标瞄准 · 左键射击 · 右键/<kbd>E</kbd> 副技能 · <kbd>Q</kbd> 大招 · <kbd>空格</kbd> 冲刺/闪现<br>
   <kbd>1</kbd> 武器 · <kbd>2</kbd>–<kbd>9</kbd> 选择陷阱（左键放置，右键出售/取消，<kbd>R</kbd> 旋转弹射板，<kbd>X</kbd> 出售）· 滚轮切换 · <kbd>M</kbd> 静音 · <kbd>Esc</kbd> 菜单</p>
   <p><b>触屏</b>：左半屏拖动移动，右半屏拖动瞄准并自动射击；点陷阱栏进入布置模式，点地面选格子，再点一次或按「放置」。</p>
   <p><b>技巧</b>：路障会迫使兽人绕路或停下砸墙；弹射板和震荡冲击能把兽人送进深渊或熔岩直接消灭；飞行的地狱蝙蝠无视地面陷阱，用箭墙、寒霜或武器对付。出售陷阱：建造阶段全额返还，战斗中返还一半。</p>
   <p><b>双人合作</b>：一人「创建房间」，把 4 位房间码发给队友；队友输入后加入。房主选关，金币共享。房主页面需要保持在前台。</p>
   <div class="btns"><button class="btn" id="bBack">返回</button></div></div>`, ingame);
  on('bBack', 'click', back);
}

function levelScreen() {
  STATE = 'title'; $('hud').classList.remove('on'); $('touch').classList.remove('on');
  const guest = NET.mode === 'online' && NET.role === 'guest';
  const host = NET.mode === 'online' && NET.role === 'host';
  const party = NET.mode === 'online' ? `<div class="party"><div class="pc"><b>${esc(host ? myName() : (NET.peerInfo ? NET.peerInfo.name : '房主'))}</b><div class="mut">房主 · ${HEROES[host ? SAVE.hero : (NET.peerInfo ? NET.peerInfo.hero : 'warmage')].name}</div></div>
     <div class="pc">${host ? (NET.peerInfo ? `<b>${esc(NET.peerInfo.name)}</b><div class="mut">队友 · ${HEROES[NET.peerInfo.hero].name}</div>` : `<span class="mut">房间码</span><div class="code">${NET.code || '····'}</div><div class="mut">等待队友加入…</div>`) : `<b>${esc(myName())}</b><div class="mut">你 · ${HEROES[SAVE.hero].name}</div>`}</div></div>` : '';
  showMenu(`<div class="scr">
   <div class="row" style="justify-content:space-between;margin-bottom:8px"><button class="btn sec" id="bBack">‹ 返回</button><div class="serif" style="font-size:18px;color:var(--gold2)">可用骷髅 <b style="color:#f3e6c4">☠ ${skullsFree()}</b> <span class="mut">/ 共获得 ${skullsEarned()}</span></div></div>
   ${party}
   <div class="tabs"><button class="tab ${MSEL.tab === 'lv' ? 'on' : ''}" id="tbLv">${guest ? '等待房主' : '关卡'}</button><button class="tab ${MSEL.tab === 'arm' ? 'on' : ''}" id="tbArm">军械库</button></div>
   <div class="box" id="lvBody"></div></div>`);
  on('bBack', 'click', () => { if (NET.mode === 'online' && !confirm('离开房间？')) return; netLeave(); titleScreen(); });
  on('tbLv', 'click', () => { MSEL.tab = 'lv'; levelScreen(); });
  on('tbArm', 'click', () => { MSEL.tab = 'arm'; levelScreen(); });
  const body = $('lvBody');
  if (MSEL.tab === 'arm') { armory(body); return; }
  if (guest) { body.innerHTML = `<div class="note" style="font-size:16px">已加入房间 <b class="code" style="font-size:22px">${NET.code}</b><br>等待房主选择关卡…</div><div class="note">可以先去「军械库」用骷髅解锁和强化陷阱。</div>`; return; }
  body.innerHTML = `<div class="lvls" id="lvls"></div><div id="lvInfo" style="margin-top:12px"></div>`;
  LEVELS.forEach((L, i) => {
    const open = levelOpen(i), d = document.createElement('div'); d.className = 'lv' + (MSEL.lvl === i ? ' sel' : '') + (open ? '' : ' lock');
    d.innerHTML = `<canvas width="320" height="200"></canvas><b class="serif">${i + 1}. ${L.name}</b><small>${L.waves.length} 波 · ${open ? skullStr(SAVE.best[L.id] || 0) + (SAVE.bestN[L.id] ? ` <span class="nm">噩梦 ☠${SAVE.bestN[L.id]}</span>` : '') : '🔒 通关上一关解锁'}</small>`;
    drawMapPreview(d.firstChild, L.id);
    if (open) d.onclick = () => { audioInit(); sfx('click'); MSEL.lvl = i; levelScreen(); };
    $('lvls').appendChild(d);
  });
  const L = LEVELS[MSEL.lvl];
  $('lvInfo').innerHTML = `<div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:10px"><div style="flex:1;min-width:240px"><b class="serif" style="font-size:20px;color:var(--gold2)">${L.name}</b><div class="mut" style="margin-top:4px;font-size:13px;line-height:1.6">${L.desc}<br>初始金币 ${L.gold}${NET.mode === 'online' ? '（双人 ×' + B.coopGold + '）' : ''} · 敌人 ${countEnemies(L)} 个</div></div>
   <div class="diffs">${Object.entries(DIFF).map(([k, D]) => `<button class="dbtn ${SAVE.diff === k ? 'on' : ''}" data-d="${k}"><b>${D.name}</b><small>${k === 'easy' ? '敌人更弱 · 最多 3 骷髅' : k === 'nightmare' ? '敌人更强更快 · 额外骷髅' : '标准挑战'}</small></button>`).join('')}</div>
   <button class="btn" id="bStart" style="font-size:18px;padding:12px 36px">${host && !NET.peerInfo ? '单独开始' : '开始战斗'}</button></div>`;
  on('bStart', 'click', () => { if (!levelOpen(MSEL.lvl)) return; startLevel(MSEL.lvl); });
  for (const b of document.querySelectorAll('.dbtn')) b.onclick = () => { audioInit(); sfx('click'); SAVE.diff = b.dataset.d; saveGame(); levelScreen(); };
}
function countEnemies(L) { let n = 0; for (const w of L.waves) for (const g of w) n += g[2]; return n; }
function drawMapPreview(c, id) {
  const rows = MAPS[id], h = rows.length, w = rows[0].length, g = c.getContext('2d');
  const s = Math.min(c.width / w, c.height / h); g.fillStyle = '#0a080c'; g.fillRect(0, 0, c.width, c.height);
  const ox = (c.width - w * s) / 2, oy = (c.height - h * s) / 2;
  const col = {'#': null, 't': null, '.': '#6b6152', 'k': '#6b6152', 'G': '#ff4a2a', 'R': '#56c8ff', 'P': '#6b6152', '_': '#050408', '~': '#c4420f', 'o': '#3a3542', 'b': '#7a5a30', 'c': '#7a5a30', 'f': '#ff9a3a'};
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const cc = col[rows[y][x]]; if (cc) { g.fillStyle = cc; g.fillRect(ox + x * s, oy + y * s, s + 0.5, s + 0.5); } else { let nb = false; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const r = rows[y + dy]; if (r && r[x + dx] && !'#t'.includes(r[x + dx])) nb = true; } if (nb) { g.fillStyle = '#2e2a35'; g.fillRect(ox + x * s, oy + y * s, s + 0.5, s + 0.5); } } }
}
function armory(body) {
  body.innerHTML = `<div class="arm" id="arm"></div><h2 class="serif" style="margin-top:16px;font-size:17px">武器精通</h2><div class="arm" id="armH"></div>`;
  for (const k of TRAP_KEYS) {
    const D = TRAPS[k], lv = SAVE.traps[k] || 0, d = document.createElement('div'); d.className = 'ac';
    let btn = '';
    if (lv === 0) btn = `<button class="btn" ${skullsFree() >= D.unlock ? '' : 'disabled'}>解锁 ☠${D.unlock}</button>`;
    else if (lv < 3) btn = `<button class="btn sec" ${skullsFree() >= B.trapUp[lv - 1] ? '' : 'disabled'}>强化 ☠${B.trapUp[lv - 1]}</button>`;
    else btn = '<span class="mut">已满级</span>';
    const stat = trapStat(k, Math.max(0, lv - 1));
    d.innerHTML = `<canvas width="128" height="116"></canvas><div><h4>${D.name} <span class="pips">${[1, 2, 3].map(i => `<span class="${i <= lv ? 'on' : ''}">◆</span>`).join('')}</span></h4><p>${D.desc}<br><span style="color:#cbbfa6">${stat} · ${D.cost} 金</span></p>${btn}</div>`;
    iconCanvas(d.firstChild, D.spr + '_0_2', 0.9);
    const b = d.querySelector('button'); if (b) b.onclick = () => { audioInit(); const cost = lv === 0 ? D.unlock : B.trapUp[lv - 1]; if (skullsFree() < cost) return; SAVE.spent += cost; SAVE.traps[k] = lv + 1; saveGame(); sfx('ready'); levelScreen(); netSendLoadout(); };
    $('arm').appendChild(d);
  }
  for (const h of Object.keys(HEROES)) {
    const lv = SAVE.heroUp[h] || 0, d = document.createElement('div'); d.className = 'ac';
    d.innerHTML = `<canvas width="128" height="116"></canvas><div><h4>${HEROES[h].name}·${HEROES[h].primary.name} <span class="pips">${[1, 2, 3].map(i => `<span class="${i <= lv ? 'on' : ''}">◆</span>`).join('')}</span></h4><p>每级提升全部技能伤害 ${B.heroUpDmg * 100}%</p>${lv < 3 ? `<button class="btn sec" ${skullsFree() >= B.heroUp[lv] ? '' : 'disabled'}>强化 ☠${B.heroUp[lv]}</button>` : '<span class="mut">已满级</span>'}</div>`;
    portraitCanvas(d.firstChild, h);
    const b = d.querySelector('button'); if (b) b.onclick = () => { audioInit(); if (skullsFree() < B.heroUp[lv]) return; SAVE.spent += B.heroUp[lv]; SAVE.heroUp[h] = lv + 1; saveGame(); sfx('ready'); levelScreen(); netSendLoadout(); };
    $('armH').appendChild(d);
  }
}
function trapStat(k, l) {
  const D = TRAPS[k];
  switch (k) {
    case 'spikes': return `伤害 ${D.dmg[l]} / ${D.cd[l]}秒`;
    case 'barricade': return `耐久 ${D.hp[l]}`;
    case 'tar': return `减速 ${Math.round(D.slow[l] * 100)}%`;
    case 'arrow': return `每轮 ${D.dmg[l]} / ${D.cd[l]}秒`;
    case 'spring': return `冷却 ${D.cd[l]}秒`;
    case 'brim': return `${D.dmg[l]} + 燃烧 ${D.burn[l]}/秒`;
    case 'frost': return `冻结 ${D.freeze[l]}秒`;
    case 'grinder': return `${D.dps[l]} 伤害/秒`;
  }
  return '';
}
function loadout() { return {up: SAVE.heroUp[SAVE.hero] || 0, traps: Object.assign({}, SAVE.traps)}; }

/* ---------- start / pause / results ---------- */
function startLevel(li, guestInfo) {
  const coop = NET.mode === 'online' && NET.role === 'host' && !!NET.peerInfo && connected();
  IS_HOST = true; MEI = 0;
  newWorld(li, coop ? 2 : 1, SAVE.diff || 'normal');
  P = [mkPlayer(0, SAVE.hero, myName(), loadout())];
  if (coop) { const pi = NET.peerInfo; P[1] = mkPlayer(1, pi.hero, pi.name, pi.lo); }
  ME = P[0];
  enterPlay();
  if (coop) netSend({t: 'start', li, diff: G.diff, h: {hero: SAVE.hero, name: myName()}});
}
function enterPlay() {
  STATE = 'play'; PAUSED = false; hideMenu(); FX.length = 0; TXT.length = 0; CL.enemies.clear(); CL.projs = []; CL.local = []; CL.drops = []; CL.evMax = 0;
  prerenderMap(); resize();
  const s = spawnPoint(); CAM.x = s.x; CAM.y = s.y;
  $('hud').classList.add('on'); $('touch').classList.add('on');
  ME.slot = 0; buildBar(); buildSkills(); lastGold = G.gold;
  banner(LEVELS[G.li].name, '布置陷阱，准备好后开战');
  G.resShown = false;
}
function togglePause() {
  if (STATE !== 'play') return;
  if (!MENU.classList.contains('off')) { if (G && (G.phase === 'won' || G.phase === 'lost') && G.resShown) return; resume(); return; }
  PAUSED = NET.mode !== 'online'; hubArm = false;
  const canRestart = IS_HOST;
  showMenu(`<div class="scr box" style="max-width:420px;text-align:center"><h2 class="serif">${PAUSED ? '已暂停' : '菜单'}</h2>
   ${NET.mode === 'online' ? '<div class="mut">联机中游戏不会暂停</div>' : ''}
   <div class="btns" style="flex-direction:column;align-items:stretch">
    <button class="btn" id="pRes">继续</button>
    ${canRestart ? '<button class="btn sec" id="pRe">重新开始本关</button>' : ''}
    <button class="btn sec" id="pHelp">玩法说明</button>
    <button class="btn sec" id="pMute">${AU.muted ? '开启声音' : '静音'}</button>
    ${HUB ? '<button class="btn sec" id="pHub">返回游戏厅</button>' : ''}
    <button class="btn sec" id="pBright">亮度：${BRIGHT_N[SAVE.bright] || '标准'}</button>
    <button class="btn red" id="pQuit">${NET.mode === 'online' && NET.role === 'guest' ? '离开房间' : '退出到关卡选择'}</button></div></div>`, true);
  on('pRes', 'click', resume);
  on('pHub', 'click', e => { if (!hubArm) { hubArm = true; e.currentTarget.textContent = '再点一次确认（本关进度不保存）'; return; } location.href = '../'; });
  on('pRe', 'click', () => startLevel(G.li));
  on('pHelp', 'click', () => helpScreen(() => { MENU.classList.add('off'); togglePause(); }, true));
  on('pMute', 'click', () => { setMute(!AU.muted); MENU.classList.add('off'); togglePause(); });
  on('pBright', 'click', () => { SAVE.bright = SAVE.bright % 3 + 1; saveGame(); $('pBright').textContent = '亮度：' + BRIGHT_N[SAVE.bright]; });
  on('pQuit', 'click', () => quitToMenu());
}
function resume() { PAUSED = false; hideMenu(); }
function quitToMenu() {
  if (NET.mode === 'online' && NET.role === 'guest') { netLeave(); G = null; titleScreen('已离开房间'); return; }
  if (NET.mode === 'online' && connected()) netSend({t: 'lobby'});
  G = null; P = []; ME = null; levelScreen();
}
function showResult() {
  if (G.resShown) return; G.resShown = true;
  const won = G.phase === 'won', Df = DIFF[G.diff] || DIFF.normal, L = LEVELS[G.li];
  const sk = won ? Math.min(Df.cap, G.result ? G.result.skulls : skullsFor(true)) : 0;
  const book = G.diff === 'nightmare' ? SAVE.bestN : SAVE.best;
  const prev = book[L.id] || 0; let gained = 0;
  if (won && sk > prev) { gained = sk - prev; book[L.id] = sk; saveGame(); }
  if (won && G.diff === 'nightmare' && (SAVE.best[L.id] || 0) < sk) { gained += sk - (SAVE.best[L.id] || 0); SAVE.best[L.id] = sk; saveGame(); }
  const host = IS_HOST, next = won && G.li + 1 < LEVELS.length;
  const st = G.stats || {};
  showMenu(`<div class="scr box res" style="max-width:520px">
   <div class="big serif" style="color:${won ? 'var(--gold2)' : '#e0574a'}">${won ? '胜 利' : '失 败'}</div>
   <div class="mut">${L.name} · ${Df.name} · ${won ? '守住了全部 ' + G.nWaves + ' 波' : '裂隙被攻破于第 ' + (G.wave + 1) + ' 波'}</div>
   ${won ? `<div style="margin:10px 0">${skullStr(sk)}</div><div class="mut">${gained ? '新纪录！获得 ☠' + gained + '（可在军械库使用）' : '最佳纪录 ' + prev + ' 骷髅'}</div>` : ''}
   ${host ? `<table class="st"><tr><td>击杀</td><td>${st.kills || 0}</td></tr><tr><td>陷阱击杀</td><td>${st.trapKills || 0}</td></tr><tr><td>坠入深渊/熔岩</td><td>${st.falls || 0}</td></tr><tr><td>裂隙剩余</td><td>${G.rift} / ${G.riftMax}</td></tr><tr><td>建造陷阱</td><td>${st.built || 0}</td></tr></table>` : ''}
   <div class="btns">${host ? `<button class="btn sec" id="rRe">再来一次</button>${next ? '<button class="btn" id="rNext">下一关</button>' : ''}<button class="btn sec" id="rBack">关卡选择</button>` : '<div class="mut">等待房主选择下一关…</div><button class="btn sec" id="rBack">返回大厅</button>'}</div></div>`, true);
  on('rRe', 'click', () => startLevel(G.li));
  on('rNext', 'click', () => { MSEL.lvl = G.li + 1; startLevel(G.li + 1); });
  on('rBack', 'click', () => { if (!host) { G = null; P = []; ME = null; levelScreen(); return; } quitToMenu(); });
  sfx(won ? 'win' : 'lose');
}
