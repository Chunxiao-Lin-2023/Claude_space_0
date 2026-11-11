/* 界面：一次只显示一种画面（探索 / 对话 / 对峙），交叉淡化，不许闪（RULES 3） */
const UI = { tab: '', logTab: 'log', bagTab: 'use', memo: -1, phTab: 'home', mapArea: '', feed: [], pickScene: false, lastWho: '', modeT: 0 };
const animOn = () => SET.motion && !(window.__dbg && __dbg.instant);
function toast(s) { const t = $('#toast'); if (!t) return; t.textContent = s; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200); }
function shake() { if (!animOn()) return; document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 380); }
function logLine(s, cls) { UI.feed.push({ s, cls: cls || '' }); if (UI.feed.length > 60) UI.feed.shift(); if (!C) return; if (!C.log) C.log = []; C.log.push([C.day, s, cls || '']); if (C.log.length > 120) C.log.shift(); renderFeed(); }
function renderFeed() { const f = $('#feed'); if (f) f.innerHTML = UI.feed.slice(-3).map(l => '<div class="' + l.cls + '">' + esc(l.s) + '</div>').join(''); }
function curMode() { return STATE.battle ? 'bt' : (STATE.scene || STATE.mini) ? 'dlg' : 'ex'; }
function applyMode() { const m = curMode(), b = document.body; clearTimeout(UI.modeT); const set = () => { b.classList.remove('m-ex', 'm-dlg', 'm-bt'); b.classList.add('m-' + m); b.classList.toggle('m-mini', !!STATE.mini); };
  /* 离开对话先等 140ms：下一句往往马上就来 */ if (b.classList.contains('m-dlg') && m === 'ex' && animOn()) UI.modeT = setTimeout(() => { if (curMode() === 'ex') set(); }, 140); else set();
  b.classList.toggle('nomo', !SET.motion); b.classList.toggle('night', !!C && isNight() && m !== 'bt'); b.classList.toggle('lowmp', !!C && C.mp < charStats().mmp * .2 && isNight()); if (m !== 'ex') closeSide(true); }

/* —— 对话 —— */
const DLG = { cur: null, prev: '', res: null };
function sealOf(who) { return SEAL_BY_NAME[who] || 'visitor'; }
function journalAdd(who, text) { const j = STATE.jr; if (j) j.l.push([who, text]); }
function dlgShow(o) { return new Promise(res => { DLG.prev = DLG.cur && !DLG.cur.choices ? DLG.cur : DLG.prev; DLG.cur = o; DLG.res = res; renderDlg(); if (o.kind === 'ph') sfx('phone'); else sfx('page');
  if (window.__dbg && __dbg.auto) { const r = DLG.res; DLG.res = null; if (o.choices) { const want = __dbg.pick ? __dbg.pick(o) : 0; setTimeout(() => r(clamp(want | 0, 0, o.choices.length - 1)), 0); } else setTimeout(() => r(), 0); } }); }
function dlgTap(e) { if (!DLG.res || !DLG.cur || DLG.cur.choices) return; if (performance.now() - (DLG.t0 || 0) < 120) return; const r = DLG.res; DLG.res = null; r(); }
function dlgPick(i) { if (!DLG.res || !DLG.cur || !DLG.cur.choices) return; const r = DLG.res, c = DLG.cur.choices[i]; DLG.res = null; journalAdd('▸', c[0] || c); sfx('tap'); r(i); }
function renderDlg() { const d = $('#dlg'), o = DLG.cur; if (!d || !o) return; DLG.t0 = performance.now(); const ph = o.kind === 'ph'; d.classList.toggle('ph', ph); const who = ph ? '黑色手机' : o.who || '';
  const q = curQ(); let h = '<div class="dh"><span>' + (who ? '<span class="seal s-' + sealOf(who) + (who !== UI.lastWho ? ' in' : '') + '">' + esc(who) + (NPC_TITLE[who] && who !== UI.lastWho ? '<small>' + NPC_TITLE[who] + '</small>' : '') + '</span>' : '') + '</span><span>' + (STATE.live ? '<span class="live">直播中 ' + hotText() + '</span>' : (q ? CH_NAMES[q.ch] || '' : '')) + '</span></div>';
  UI.lastWho = who; const p = DLG.prev; if (p && p.text && !o.choices) h += '<div class="dprev">' + (p.who ? esc(p.who) + '：' : '') + esc(p.text) + '</div>'; if (o.choices && o.text == null && p && p.text) h += '<div class="dtext' + (p.who ? '' : ' nar') + '">' + esc(p.text) + '</div>';
  if (o.text != null) h += '<div class="dtext' + (o.who || ph ? '' : ' nar') + '">' + esc(o.text) + '</div>';
  if (o.choices) h += '<div class="dch">' + o.choices.map((c, i) => '<button onclick="event.stopPropagation();dlgPick(' + i + ')">' + esc(c[0] || c) + (c[1] ? '<small>' + esc(c[1]) + '</small>' : '') + '</button>').join('') + '</div>'; else h += '<div class="dhint">点击继续 ▼</div>';
  d.innerHTML = h; d.scrollTop = 0; }
const NPC_TITLE = {}; for (const k in NPCS) if (NPCS[k].title) NPC_TITLE[NPCS[k].name] = NPCS[k].title;
function hotText() { const n = STATE.live ? STATE.live.hot : 0; return n >= 10000 ? (n / 10000).toFixed(1) + ' 万' : String(n); }

/* —— 顶栏 / 探索画面 —— */
let refT = 0;
function refresh() { if (!C) return; cancelAnimationFrame(refT); refT = requestAnimationFrame(() => { applyMode(); renderTop(); if (STATE.battle) renderBattle(); else { renderBanner(); renderDesc(); renderActs(); renderFeed(); } renderNav(); if (UI.tab) renderSide(); musicMode(STATE.mini ? 'phone' : moodNow()); }); }
function renderTop() { const s = charStats(), t = $('#tl'); if (!t) return; t.innerHTML = '<div class="bars"><div class="bar"><i style="width:' + C.hp / s.mhp * 100 + '%"></i></div><div class="bar mp"><i style="width:' + C.mp / s.mmp * 100 + '%"></i></div></div><span>第 <b>' + C.day + '</b> 天 · <b>' + clockText() + '</b></span><span>💴 <b>' + C.money + '</b></span>' + (STATE.live ? '<span class="live">直播 ' + hotText() + '</span>' : '<span>' + (C.title ? TITLES[C.title].n : rankOf(C.lv)) + '</span>'); }
function renderBanner() { const p = PLACES[C.loc], night = isNight(); $('#pn').textContent = p.name; $('#pa').textContent = AREAS[p.area].name; const key = p.art + (night ? 'N' : 'D') + (C.q === 'q_end' ? '' : '');
  const c = $('#bnr'); if (c.dataset.k !== key) { c.dataset.k = key; paintScene(c, p.art, night); for (const id of ['#bgEx', '#bgDlg', '#bgBt']) { const b = $(id); b.getContext('2d').drawImage(c, 0, 0, b.width, b.height); } } renderDanmuWide(); }
function renderDesc() { let d = pdesc(C.loc); if (isNight() && C.mp < charStats().mmp * .2) d = glitch(d); $('#desc').textContent = d + (STATE.walkTip ? '' : ''); }
function glitch(s) { const g = '▓░▒█'; return s.split('').map((ch, i) => (hashI(i + C.tick * 7 + C.day) % 9 === 0 && ch !== '，' && ch !== '。') ? g[i % 4] : ch).join(''); }
function hashI(n) { n = (n ^ 61) ^ (n >>> 16); n += n << 3; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); return (n ^ (n >>> 15)) >>> 0; }
function renderNav() { const n = $('#nav'); if (!n) return; const items = [['ex', '🔦', '探索'], ['hero', '🧑', '陈歌'], ['pet', '👻', '员工'], ['bag', '🎒', '背包'], ['map', '🗺', '地图'], ['phone', '📱', '手机']];
  n.innerHTML = items.filter(i => i[0] !== 'phone' || C.f.phone).map(i => '<button class="' + ((UI.tab || 'ex') === i[0] ? 'on' : '') + (i[0] === 'phone' && phoneDot() ? ' dot' : '') + '" onclick="navTo(\'' + i[0] + '\')"><b>' + i[1] + '</b>' + i[2] + '</button>').join(''); }
function questGo() { const q = curQ(); if (!q) return; const at = questWhere(q); if (!at) { toast(q.goal || '看看手机'); return; } if (at === C.loc) return storyHereRun(); autoWalk(at); }
function renderActs() { const a = $('#acts'); if (!a) return; const p = PLACES[C.loc], night = isNight(), q = curQ(); let h = '';
  if (q) { const at = questWhere(q), here = at === C.loc; h += '<div class="quest"><span class="tag">主线</span><div class="qt">' + esc(q.title) + '<small>' + esc(questGoal(q)) + '</small></div>' + (here ? '<button class="btn pri" id="qgo" onclick="storyHereRun()">▶ ' + esc(q.act || '开始') + '</button>' : (at ? '<button class="btn" id="qgo" onclick="questGo()">▶ 去</button>' : '')) + '</div>'; }
  else h += '<div class="quest"><span class="tag">主线</span><div class="qt">第一卷到这里结束<small>怪谈协会的宣传单已经塞进了门缝。可以继续经营恐怖屋、夜探旧地。</small></div></div>';
  h += '<div class="grp"><label>做事</label>';
  if (C.loc === 'hh_door' && !night && C.f.open) h += UI.pickScene ? sceneList().map(s => '<button class="btn pri" onclick="UI.pickScene=false;receive(\'' + s + '\')">🎫 ' + SCENES[s].n + ' <small>' + starTxt(SCENES[s].star) + '</small></button>').join('') + '<button class="btn" onclick="UI.pickScene=false;renderActs()">取消</button>' : '<button class="btn pri" onclick="UI.pickScene=true;renderActs()">🎫 接待游客</button>';
  if (C.loc === 'hh_door' && night) h += '<button class="btn" disabled>🎫 乐园关门了</button>';
  h += '<button class="btn" onclick="explore()">' + (night ? '🔦 夜探' : '👀 转转') + '</button><button class="btn" onclick="camp()">🪑 歇一会</button>';
  if (p.bed) h += '<button class="btn" onclick="sleepBed()">🛏 ' + (night ? '睡到天亮' : '睡到天黑') + '</button>'; if (p.shop) h += '<button class="btn" onclick="UI.bagTab=\'shop\';navTo(\'bag\')">🛒 买卖</button>';
  h += '<button class="btn' + (C.auto ? ' on' : '') + '" onclick="C.auto=C.auto?0:1;save();renderActs()">🤖 自动对峙：' + (C.auto ? '开' : '关') + '</button></div>';
  const ns = npcsHere(); if (ns.length) h += '<div class="grp"><label>说话</label>' + ns.map(k => '<button class="btn" onclick="npcTalk(\'' + k + '\')">' + NPCS[k].name + (talkNext(k) ? ' 💬' : '') + '</button>').join('') + '</div>';
  h += '<div class="grp"><label>去往</label>' + exitsOf(C.loc).map(e => '<button class="btn" onclick="go(\'' + e[1] + '\')">' + e[0] + '</button>').join('');
  if (Object.values(ENTRY).includes(C.loc)) h += areasOpen().filter(k => k !== p.area).map(k => '<button class="btn" onclick="travel(\'' + k + '\')">🚕 ' + AREAS[k].name + '</button>').join('');
  else if (p.area !== 'park' && !C.f.lockArea) h += '<button class="btn" onclick="autoWalk(\'' + ENTRY[p.area] + '\')">↩ 回到入口</button>';
  h += '</div>'; a.innerHTML = h; }

/* —— 对峙画面 —— */
function stTags(u) { return Object.keys(u.st).filter(k => STATUS[k] && k !== 'steady').map(k => '<i title="' + STATUS[k][1] + '">' + STATUS[k][0] + '</i>').join(''); }
function cardHtml(B, u, i, anim) { const hp = anim && B.snap ? B.snap[u.key] : u.hp, foe = u.side === 'f', cd = foe ? (C.codex[u.id] || { wk: [] }) : null; const it = foe ? intentText(B, u) : '';
  return '<div class="card ' + (foe ? 'foe' : 'ally') + (hp <= 0 ? ' dead' : '') + (foe && B.sel === i && B.phase !== 'end' ? ' sel' : '') + '" id="c_' + u.key + '"' + (foe ? ' onclick="selFoe(' + i + ')"' : '') + '><div class="nm"><span>' + esc(u.n) + (u.boss ? ' ☠' : '') + '</span><small>' + u.lv + '级</small></div><div class="hpb"><i style="width:' + Math.max(0, hp / u.mhp * 100) + '%"></i></div><div class="hp"><span>' + (B.scare ? (foe ? '胆量 ' : (u.pet ? '' : '氛围 ')) : '') + Math.max(0, Math.round(hp)) + '/' + u.mhp + '</span>' + (u.dmgT && !anim ? '<span style="color:#f98">-' + u.dmgT + '</span>' : '') + '</div>' + (foe ? '<div class="it' + (it[0] === '⚠' ? ' w' : '') + '">' + esc(it) + '</div>' + (cd.wk.length ? '<div class="wk">怕：' + cd.wk.map(e => EL[e]).join('、') + '</div>' : '') : (u.key === 'hero' ? '<div class="hp"><span>精神 ' + C.mp + '</span></div>' : '')) + '<div class="sts">' + stTags(u) + '</div></div>'; }
function selFoe(i) { const B = STATE.battle; if (!B || B.foes[i].hp <= 0 || B.phase === 'anim') return; B.sel = i; sfx('tap'); renderBattle(); }
function renderBattle(anim) { const B = STATE.battle, box = $('#bt'); if (!B || !box) return; $('#vBt').classList.toggle('scare', B.scare); if (B.foes[B.sel].hp <= 0) { const i = B.foes.findIndex(f => f.hp > 0); if (i >= 0) B.sel = i; }
  const ord = (B.pet && B.pet.hp > 0 ? (C.duo ? [B.pet.n, '陈歌'] : ['陈歌', B.pet.n]) : ['陈歌']).map(n => '<span class="ord me">' + esc(n) + '</span>').join('→') + '→<span class="ord">' + (B.scare ? '游客' : '对方') + '</span>';
  let h = '<div class="b-top"><span class="t">' + esc(B.o.title || '') + ' · 第 ' + B.turn + ' 回合</span>' + ord + '</div><div class="b-foes">' + B.foes.map((f, i) => cardHtml(B, f, i, anim)).join('') + '</div>';
  const from = Math.max(0, B.log.length - 9); h += '<div class="b-log" id="blog">' + B.log.slice(from).map((l, i) => '<div class="' + l.cls + (from + i >= (B.firstNew || 0) ? ' new' : '') + '"' + ' data-i="' + (from + i) + '">' + esc(l.s) + '</div>').join('') + '</div>';
  h += '<div class="b-ally">' + cardHtml(B, B.hero, 0, anim) + (B.pet ? cardHtml(B, B.pet, 0, anim) : '') + '</div>';
  if (B.phase === 'end') { const r = B.rw; h += '<div class="b-end">' + (B.result === 'win' ? (B.scare ? '游客尖叫着跑了出去。' : '你还站着。') + (r ? '<br>经验 +' + r.exp + (r.money ? ' · ' + r.money + ' 元' : '') + (r.screams ? ' · 尖叫 +' + r.screams : '') : '') : B.result === 'flee' ? '你甩开了它。' : (B.scare ? '他们打着哈欠出来了。' : '眼前一黑。')) + '<div class="mg-row"><button class="btn pri big" id="bcont" onclick="battleEnd()">继续</button></div></div>'; }
  else if (B.phase === 'hero') { const mode = B.scare ? 'd' : 'n', f = B.foes[B.sel], cd = C.codex[f.id] || { wk: [] }; h += '<div class="b-turn">陈歌的回合' + (B.auto ? '（自动）' : '') + '</div><div class="b-acts">';
    for (const k of C.bar[mode]) { const S = SKILLS[k]; if (!S) continue; const wk = !S.self && cd.wk.includes(S.el); h += '<button class="sk' + (C.mp < S.cost ? ' no' : '') + (wk ? ' wk' : '') + '" onclick="pickSkill(\'' + k + '\')"><b>' + S.ic + '</b>' + S.n + '<small>' + (S.cost ? S.cost + ' 精神' : '不耗') + (wk ? ' · 弱点' : '') + '</small></button>'; }
    h += '<button class="sk" onclick="battleAct({t:\'guard\'})"><b>🛡</b>' + (B.scare ? '稳住' : '防御') + '<small>减半</small></button>'; if (B.o.candy && !B.candyUsed && itemN('candy')) h += '<button class="sk wk" id="candy" onclick="battleAct({t:\'candy\'})"><b>🍬</b>糖果<small>最后的底牌</small></button>';
    h += '</div><div class="b-acts">'; for (const k of ['drink', 'bandage', 'bread', 'coffee', 'smoke', 'saltbag']) if (itemN(k) && !(B.scare && (ITEMS[k].heal || ITEMS[k].battle))) h += '<button class="sk it' + (B.itemUsed ? ' no' : '') + '" onclick="battleItem(\'' + k + '\')">' + ITEMS[k].ic + itemN(k) + '</button>';
    if (!B.o.story && !B.scare) h += '<button class="sk it" onclick="battleAct({t:\'flee\'})">🏃 跑</button>'; h += '<button class="sk it' + (B.auto ? ' wk' : '') + '" onclick="toggleAuto()">🤖 自动</button></div>'; }
  else if (B.phase === 'pet') { h += '<div class="b-turn">' + esc(B.pet.n) + ' 的回合 · 陈歌已选好</div><div class="b-acts">'; petMovesB(B).forEach((m, i) => { h += '<button class="sk" onclick="pickPetMove(' + i + ')"><b>' + ({ atk: '⚔', buf: '✨', deb: '🌀', def: '🧷' })[m.c] + '</b>' + m.n + '<small>' + PET_CAT[m.c] + '</small></button>'; });
    h += '<button class="sk" onclick="battleAct({t:\'guard\'})"><b>🛡</b>防御</button></div><div class="b-acts"><button class="sk it" onclick="battleUndo()">‹ 重选陈歌</button><button class="sk it" onclick="C.duo=C.duo?0:1;renderBattle()">先后：' + (C.duo ? esc(B.pet.n) + '先' : '陈歌先') + '</button></div>'; }
  else h += '<div class="b-turn">……</div>';
  box.innerHTML = h; const lg = $('#blog'); if (lg) lg.scrollTop = lg.scrollHeight; renderTop(); }
function pickSkill(k) { const B = STATE.battle; if (!B) return; battleAct({ t: 'sk', k, tg: B.sel }); }
function pickPetMove(i) { const B = STATE.battle; if (!B) return; battleAct({ t: 'mv', mv: petMovesB(B)[i], tg: B.sel }); }

/* —— 动画：只是回放 B.ev；关掉动画也能在卡片上看到“本回合 -N” —— */
function fxFloat(key, txt, cls) { const c = $('#c_' + key); if (!c) return; const f = el('div', 'fl ' + (cls || ''), txt); c.appendChild(f); setTimeout(() => f.remove(), 950); }
function fxBar(key, hp) { const c = $('#c_' + key), B = STATE.battle; if (!c || !B) return; const u = unitByKey(B, key); if (!u) return; const i = c.querySelector('.hpb i'); if (i) i.style.width = Math.max(0, hp / u.mhp * 100) + '%'; const t = c.querySelector('.hp span'); if (t) t.textContent = (B.scare ? (u.side === 'f' ? '胆量 ' : (u.pet ? '' : '氛围 ')) : '') + Math.max(0, Math.round(hp)) + '/' + u.mhp; }
function fxBanner(txt, cls) { const s = $('#stage'); const b = el('div', 'bn ' + cls, esc(txt)); s.appendChild(b); setTimeout(() => b.remove(), 720); }
const BUBS = {};
function fxSay(key, txt, foe) { const c = $('#c_' + key), st = $('#vBt'); if (!c || !st || !animOn()) return; if (BUBS[key]) BUBS[key].remove(); const b = el('div', 'bub' + (foe ? ' foe' : ''), esc(txt)); st.appendChild(b); BUBS[key] = b; bubblePlace(b, c);
  const ms = clamp(1800 + txt.length * 190, 3600, 7500); setTimeout(() => { if (BUBS[key] === b) delete BUBS[key]; b.remove(); }, ms); }
/* 气泡自己找空位：屏内、不叠别的气泡；实在没有就挑重叠最少的（RULES 39） */
function bubblePlace(b, card) { const sr = $('#vBt').getBoundingClientRect(), cr = card.getBoundingClientRect(), bw = b.offsetWidth, bh = b.offsetHeight; const others = Object.values(BUBS).filter(x => x !== b).map(x => x.getBoundingClientRect()); let best = null, bo = 1e9;
  const ys = [cr.bottom - sr.top + 4, cr.top - sr.top - bh - 4], xs = []; for (let x = 4; x <= sr.width - bw - 4; x += Math.max(12, (sr.width - bw - 8) / 8)) xs.push(x); xs.sort((a, c2) => Math.abs(a + bw / 2 - (cr.left - sr.left + cr.width / 2)) - Math.abs(c2 + bw / 2 - (cr.left - sr.left + cr.width / 2)));
  for (const y of ys) { if (y < 2 || y + bh > sr.height - 2) continue; for (const x of xs) { let ov = 0; for (const o of others) { const ox = Math.max(0, Math.min(x + bw, o.right - sr.left) - Math.max(x, o.left - sr.left)), oy = Math.max(0, Math.min(y + bh, o.bottom - sr.top) - Math.max(y, o.top - sr.top)); ov += ox * oy; } if (ov < bo) { bo = ov; best = [x, y]; } if (ov === 0) break; } if (bo === 0) break; }
  if (!best) best = [4, Math.max(2, cr.bottom - sr.top + 4)]; b.style.left = best[0] + 'px'; b.style.top = best[1] + 'px'; }
async function fxPlay(B) { if (!animOn()) { renderBattle(); for (const e of B.ev) if (e.t === 'say') blogOnly(); return; }
  for (const e of B.ev) { if (STATE.battle !== B) return; const c = e.who && $('#c_' + e.who);
    if (e.t === 'banner') { fxBanner((e.ic ? e.ic + ' ' : '') + e.txt, e.foe ? 'f' : e.who === 'pet' ? 'p' : 'h'); if (c) { c.classList.add('act'); setTimeout(() => c.classList.remove('act'), 500); } await sleep(e.big ? 620 : 430); }
    else if (e.t === 'hit') { fxFloat(e.who, (e.dot ? e.dot + ' ' : '') + '-' + e.v + (e.weak ? ' 弱点' : '') + (e.crit ? '！' : ''), e.dot ? 'dot' : e.crit ? 'crit' : e.weak ? 'weak' : ''); fxBar(e.who, e.hp); if (c && !e.dot) { c.classList.remove('shk'); void c.offsetWidth; c.classList.add('shk'); } sfx(e.dot ? 'drip' : e.who === 'hero' ? 'hurt' : (e.crit || e.weak ? 'heavy' : 'hit')); if (e.crit) shake(); await sleep(e.dot ? 200 : 300); }
    else if (e.t === 'st') { fxFloat(e.who, STATUS[e.k][0], 'txt'); await sleep(140); } else if (e.t === 'txt') { fxFloat(e.who, e.txt, 'txt'); if (e.big) { sfx('ok'); shake(); } await sleep(180); }
    else if (e.t === 'ko') { if (c) c.classList.add('dead'); if (e.who !== 'hero' && e.who !== 'pet') sfx(B.scare ? 'scream' : 'heavy'); await sleep(240); }
    else if (e.t === 'phase') { flashRed(); shake(); sfx('stinger'); if (e.txt) fxBanner('“' + e.txt + '”', 'f'); await sleep(820); }
    else if (e.t === 'low') { flashRed(); sfx('heart'); fxBar('hero', e.hp); await cine([e.txt], 'mem', 2200); }
    else if (e.t === 'say') { fxSay(e.who, e.txt, e.foe); await sleep(520); } else if (e.t === 'sfx') sfx(e.n); }
  await sleep(160); }
function blogOnly() {}
function flashRed() { const f = $('#flash'); if (!f || !animOn()) return; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
async function fxStamp(txt) { const s = $('#stamp'); if (!s || !animOn()) return; s.textContent = txt; s.classList.remove('on'); void s.offsetWidth; s.classList.add('on'); await sleep(950); }
async function stageTransition(txt) { const t = $('#trans'); if (!t || !animOn()) { applyMode(); return; } t.textContent = txt; t.classList.remove('on'); void t.offsetWidth; t.classList.add('on'); sfx('door'); await sleep(260); applyMode(); await sleep(380); }

/* —— 整屏旁白、章节卡、首领登场卡 —— */
let cineRes = null, cineReady = 0;
function cine(lines, cls, autoMs) { if (window.__dbg && (__dbg.auto || __dbg.instant)) { for (const l of lines) journalAdd('', l); return Promise.resolve(); } return new Promise(res => { const c = $('#cine'); c.className = 'on ' + (cls || ''); c.innerHTML = lines.map((l, i) => '<p style="animation-delay:' + (i * (animOn() ? .9 : 0)) + 's">' + esc(l) + '</p>').join('') + '<div class="hint">点击继续</div>'; for (const l of lines) journalAdd('', l);
    cineReady = performance.now() + (animOn() ? Math.min(1600, lines.length * 500) : 0); cineRes = () => { c.className = ''; cineRes = null; res(); }; if (autoMs) setTimeout(() => cineRes && cineRes(), autoMs); }); }
function cineTap() { if (cineRes && performance.now() >= cineReady) cineRes(); }
let cardRes = null;
function showCard(html, minMs) { if (window.__dbg && (__dbg.auto || __dbg.instant)) return Promise.resolve(); return new Promise(res => { const c = $('#card'); c.innerHTML = html; c.classList.add('on'); const t0 = performance.now(); cardRes = () => { if (performance.now() - t0 < (minMs || 600)) return; c.classList.remove('on'); cardRes = null; res(); }; }); }
function cardTap() { if (cardRes) cardRes(); }
function chapterCard(n, title, sub) { sfx('door'); return showCard('<div class="c1">第 ' + n + ' 章</div><div class="c2">' + esc(title) + '</div><div class="c3">' + esc(sub || '') + '</div>', 900); }
function fxBossCard(e) { sfx('stinger'); musicMode('door'); return showCard('<div class="c1">' + esc(e.sub || '') + '</div><div class="c2">' + esc(e.name) + '</div><div class="c3">' + (e.intro || []).map(esc).join('<br>') + '</div><div class="seal2">' + esc(e.seal || '凶') + '</div>', 900).then(() => { applyMode(); }); }
function epicLow(B) { return (B.o.epic && B.o.epic.low) || pick(['“自杀是最懦弱的行为，请努力的活下去！”——手机里那句话，语气真像老爹。', '布偶在领口动了一下。你想起做它的那个下午，爸妈都在。', '恐怖屋还没还清水电费。你不能倒在这种地方。']); }
function epicPhase(B, u) { return (B.o.epic && B.o.epic.phase) || (SAY[u.id] && SAY[u.id].low ? pick(SAY[u.id].low) : ''); }

/* —— 惊吓：整屏一闪的脸。设置里能关（关掉只剩红光和心跳） —— */
function scareFlash() { flashRed(); sfx('heart'); shake(); }
function scare(kind) { if (window.__dbg && (__dbg.auto || __dbg.instant)) return Promise.resolve(); if (!SET.scare || !SET.motion) { scareFlash(); return sleep(300); } const box = $('#scare'), cv = $('#scv'), x = cv.getContext('2d'), W = cv.width, H = cv.height; paintScare(x, W, H, kind || 'face'); box.classList.add('on'); sfx('stinger'); shake();
  return new Promise(res => { let n = 0; const iv = setInterval(() => { n++; cv.style.transform = 'scale(' + (1 + n * .035) + ') translate(' + (Math.random() * 8 - 4) + 'px,' + (Math.random() * 8 - 4) + 'px)'; if (n > 9) { clearInterval(iv); box.classList.remove('on'); cv.style.transform = ''; flashRed(); res(); } }, 48); }); }

/* —— 直播弹幕 —— */
function danmu(list) { if (typeof list === 'string') list = [list]; for (const s of list) { C.dlog.push([C.day, s]); if (C.dlog.length > 90) C.dlog.shift(); } if (STATE.live) STATE.live.hot = Math.round(STATE.live.hot * (1.04 + list.length * .03) + list.length * 37); renderDanmuWide(); if (!animOn()) return;
  list.forEach((s, i) => setTimeout(() => { for (const id of ['#dm', '#dm2']) { const d = $(id); if (!d) continue; const sp = el('span', '', esc(s)); sp.style.top = (6 + ((i * 37 + (danmu.n = (danmu.n || 0) + 1) * 23) % 70)) + '%'; sp.style.animationDuration = (7 + s.length * .12) + 's'; d.appendChild(sp); setTimeout(() => sp.remove(), 11000); } }, i * 700)); }
function renderDanmuWide() { const w = $('#dmw'); if (!w || !C) return; w.innerHTML = STATE.live || C.dlog.length ? C.dlog.slice(-3).map(d => '<div>' + esc(d[1]) + '</div>').join('') : ''; }
function liveOn(hot) { STATE.live = { hot: hot || 30 }; C.f.live = 1; renderTop(); } function liveOff() { if (STATE.live) { C.fans += Math.round(STATE.live.hot * .12); } STATE.live = null; delete C.f.live; renderTop(); }
