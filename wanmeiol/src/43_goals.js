/* ================= long-term goals and conveniences =================
   宝骨 · 灵兽觉醒 · 材料兑换 · 每日悬赏 · 地点探索度 · 称号 · 传送 · 睡到天黑/天亮 · 洞天重开 · 困难秘境 · 战斗教学 */

/* ---------- 宝骨 ---------- */
function gainRelic(id, quiet) { C.relics = C.relics || {}; if (C.relics[id]) return; C.relics[id] = 1; const R = RELICS[id]; C.eq = C.eq || []; if (C.eq.length < relicSlots(C.lv)) C.eq.push(id);
  if (!quiet) { logLine(`<b class="lvup">得到宝骨</b>：${R.i}<b>${R.n}</b>——${R.d}${C.eq.includes(id) ? '（已经戴上了）' : '（在“石昊”页里换着戴）'}`, 'sys'); sfx('epic'); bigFlash(R.n, 'relic'); } fixHp(); }
function relicFromKills(kills) { for (const [mob, , boss] of kills || []) if (boss) for (const [id, R] of Object.entries(RELICS)) if (R.from === mob) gainRelic(id); }
function equipRelic(id) { if (!C.relics || !C.relics[id]) return; C.eq = C.eq || []; const i = C.eq.indexOf(id); if (i >= 0) C.eq.splice(i, 1); else { if (C.eq.length >= relicSlots(C.lv)) { toast('宝骨栏满了（' + relicSlots(C.lv) + ' 件），先摘下一件'); return; } C.eq.push(id); } fixHp(); sfx('click'); save(); refresh(); }

/* ---------- 灵兽觉醒 at full affection ---------- */
const EVO_TEXT = {
  maoqiu: ['毛球蹲在石头上晒太阳，晒着晒着，它身上的金毛一根根竖了起来，像着了火。', '你眨了眨眼——它投在地上的影子，有那么一瞬间，大得像一座山。', '影子缩了回去。毛球打了个哈欠，跳上你的肩膀。可你知道，它不一样了。'],
  dahong: ['大红在你头顶盘旋了三圈，忽然一声长鸣，翅膀上的红羽一片片亮起来，像烧透的炭。', '它落下来的时候，羽毛尖上还跳着小小的火苗。它得意地冲你“嘎”了一声。'],
  ertuzi: ['二秃子缩在你衣领里，忽然浑身发起光来，五种颜色的光一圈一圈往外荡。', '光散了。你凑近了仔细看——它脑袋顶上，终于冒出了一根毛。只有一根。'],
};
function petEvoCheck(id) { const p = C.pets[id]; if (!p || p.evo || p.aff < 100 || NETROLE === 'guest') return; p.evo = 1;
  setTimeout(() => runScene(async () => { for (const t of EVO_TEXT[id]) await nar(t); if (id === 'ertuzi') await me('……恭喜你。'); const P = PETS[id], sk = P.sk.find(s => s.evo);
    logLine(`<b class="lvup">灵兽觉醒</b>：${P.icon}<b>${P.name}</b> 全身属性 +15%，学会了 <b>${sk.n}</b>。`, 'sys'); sfx('epic'); bigFlash(P.name + ' · 觉醒', 'relic'); }, { title: PETS[id].name + '觉醒' }), 500); }

/* ---------- trading surplus materials ---------- */
function tradeOptions(npc) { return TRADES.map((T, i) => [T, i]).filter(([T]) => T.npc === npc).map(([T, i]) => ({ t: `🔁 ${T.t}`, dis: !T.need.every(([k, n]) => itemN(k) >= n), f: () => tradeDo(i) })); }
async function tradeDo(i) { const T = TRADES[i]; if (!T || !T.need.every(([k, n]) => itemN(k) >= n)) { toast('东西不够'); return; }
  if (T.prof) { if (!C.sk.length) { toast('你还没学会宝术'); return; } await runScene(async () => { await say(T.npc, '想练哪一门？'); const c = await choose([...C.sk.map(id => SKILLS[id].icon + SKILLS[id].name + `（${(C.prof && C.prof[id]) || 0}）`), '算了']); if (c >= C.sk.length) return;
      for (const [k, n] of T.need) takeItem(k, n); const id = C.sk[c]; for (let k = 0; k < T.prof; k++) profUse(id); await say(T.npc, '照着这上面的纹路，再走几遍。'); logLine(`${SKILLS[id].name} 熟练度 +${T.prof}（${C.prof[id]}）`, 'sys'); }); return; }
  for (const [k, n] of T.need) takeItem(k, n); T.give(); sfx('loot'); save(); refresh(); }

/* ---------- daily bounties ---------- */
function bountyToday() { // one per person per day; someone who becomes available later in the day gets theirs then
  const d = gameDay(); if (!C.bounty || C.bounty.day !== d) C.bounty = { day: d, list: [] }; const list = C.bounty.list;
  for (const B of BOUNTY_FROM) { if (!B.open() || list.some(b => b.npc === B.npc)) continue; const r = srng('bounty' + d + C.created + B.npc);
    const ps = Object.values(PLACES).filter(p => B.areas.includes(p.area) && placeOpen(p.id) && p.mobs && p.lv && p.lv[0] <= C.lv + 2);
    if (ps.length && r() < 0.7) { const P = ps[Math.floor(r() * ps.length)], m = P.mobs[Math.floor(r() * P.mobs.length)][0]; list.push({ npc: B.npc, kind: 'kill', id: m, n: 4 + Math.floor(r() * 3), got: 0, st: 'new', where: P.name, loc: P.id }); }
    else { const it = ['bone', 'herb', 'meat', 'lingyao'][Math.floor(r() * 4)]; list.push({ npc: B.npc, kind: 'item', id: it, n: it === 'lingyao' ? 2 : 3 + Math.floor(r() * 2), got: 0, st: 'new' }); } }
  return list; }
const bountyText = b => b.kind === 'kill' ? `打 ${b.n} 头${MOBS[b.id].name}（${b.where}，${Math.min(b.got, b.n)}/${b.n}）` : `带 ${b.n} 个${ITEMS[b.id].name}（${Math.min(itemN(b.id), b.n)}/${b.n}）`;
const bountyReady = b => b.kind === 'kill' ? b.got >= b.n : itemN(b.id) >= b.n;
function bountyOptions(npc) { const out = []; bountyToday().forEach((b, i) => { if (b.npc !== npc || b.st === 'done') return;
  out.push({ t: b.st === 'new' ? `📋 今日悬赏：${bountyText(b)}` : bountyReady(b) ? `✔ 交悬赏：${bountyText(b)}` : `📋 悬赏进行中：${bountyText(b)}`, dis: b.st === 'on' && !bountyReady(b), f: () => bountyTake(i) }); }); return out; }
function bountyTake(i) { const b = bountyToday()[i]; if (!b || b.st === 'done') return;
  if (b.st === 'new') { b.st = 'on'; logLine(`【悬赏】${NPCS[b.npc].name}：${bountyText(b)}`, 'quest'); save(); refresh(); return; }
  if (!bountyReady(b)) return; if (b.kind === 'item') takeItem(b.id, b.n); b.st = 'done'; C.stats.bounty = (C.stats.bounty || 0) + 1;
  logLine(`【悬赏完成】${NPCS[b.npc].name}很满意。`, 'quest'); gainMoney(20 + C.lv * 4, '赏钱'); addItem('baoyao'); addItem('lingyao'); gainExp(BAL.expNext(C.lv) * 0.3); const sk = C.bar.length ? pick(C.bar) : null; if (sk) { for (let k = 0; k < 5; k++) profUse(sk); logLine(`${SKILLS[sk].name} 熟练度 +5`, 'dim'); } sfx('loot'); save(); refresh(); }
function bountyKill(mob) { if (!C.bounty || C.bounty.day !== gameDay()) return; for (const b of C.bounty.list) if (b.st === 'on' && b.kind === 'kill' && b.id === mob && b.got < b.n) { b.got++; if (b.got === b.n) logLine(`【悬赏】${MOBS[mob].name} 够数了，回去找${NPCS[b.npc].name}。`, 'quest'); } }

/* ---------- 地点探索度: every kind of beast here beaten + everything here gathered ---------- */
function exTargets(P) { const m = [...new Set((P.mobs || []).map(x => x[0]))], g = [...new Set((P.gather || []).map(x => x[0]))]; return { m, g, n: m.length + g.length }; }
function exState(loc) { C.ex = C.ex || {}; return C.ex[loc] || (C.ex[loc] = { m: {}, g: {} }); }
function exCount(loc) { const P = PLACES[loc], T = exTargets(P), E = (C.ex && C.ex[loc]) || { m: {}, g: {} }; return { have: T.m.filter(x => E.m[x]).length + T.g.filter(x => E.g[x]).length, n: T.n, done: !!E.done }; }
function exNote(loc, k, id) { const P = PLACES[loc]; if (!P || !P.lv) return; const T = exTargets(P); if (!T[k].includes(id)) return; const E = exState(loc); if (E[k][id]) return; E[k][id] = 1;
  const c = exCount(loc); if (c.have >= c.n && !E.done) { E.done = 1; logLine(`<b class="lvup">${P.name} 探索完成</b>：这里的凶兽都交过手，能采的东西也都找到了。`, 'sys'); addItem('baoyao'); addItem('lingyao'); gainMoney(30 + C.lv * 5, '还翻出了'); gainExp(BAL.expNext(C.lv) * 0.3); sfx('epic'); bigFlash(P.name + ' · 探索完成', 'relic'); } }

/* ---------- 称号 ---------- */
function achCheck() { if (!C || NETROLE === 'guest') return; C.ach = C.ach || {}; for (const A of ACH) if (!C.ach[A.id]) { let ok = false; try { ok = A.ok(); } catch (e) { } if (ok) { C.ach[A.id] = now(); logLine(`<b class="lvup">获得称号「${A.n}」</b>——${A.d}`, 'sys'); toast('称号：' + A.n); sfx('level'); } } }
function setTitle(id) { C.title = C.title === id ? '' : id; sfx('click'); save(); refresh(); }

/* ---------- 传送 (阁主's jade token, after joining 补天阁) ---------- */
const TP = [{ id: 'sc_street', n: '石村' }, { id: 'bt_court', n: '补天阁内院' }, { id: 'bd_gate', n: '百断山口' }, { id: 'sg_market', n: '石国皇都' }, { id: 'sg_hou', n: '荒天侯府' }, { id: 'hg_city', n: '火国皇城' }, { id: 'bz_camp', n: '百族营地' }, { id: 'sj_town', n: '上界 · 天仙城' }, { id: 'sq_town', n: '三千州 · 争霸城' }, { id: 'dg_city', n: '帝关城' }, { id: 'jt_gate', n: '九天 · 天门' }, { id: 'xy_city', n: '仙域古城' }, { id: 'jt_court', n: '天庭' }, { id: 'xs_hall', n: '虚神界（神魂过去）' }];
const canTeleport = () => !!C.story.f.joined && (PLACES[C.loc].town || C.loc === 'bd_gate');
async function teleport() { if (!canTeleport() || STATE.scene || STATE.battle || STATE.dungeon) return; const L = TP.filter(t => t.id !== C.loc && placeOpen(t.id)); if (!L.length) return; let to = null;
  await runScene(async () => { const c = await dlgChoose([...L.map(t => ({ t: '🌀 ' + t.n })), { t: '算了' }], '玉符在掌心微微发烫。去哪儿？'); if (c < L.length) to = L[c].id; });
  if (to) { logLine('玉符一亮，眼前的景物像水面一样晃了晃——', 'dim'); go(to); } }

/* ---------- 休息：歇一会儿 / 睡到天黑 / 睡到天亮 ---------- */
async function rest() { if (STATE.scene || STATE.battle) return; let c = 0;
  await runScene(async () => { c = await dlgChoose([{ t: '🛏 歇一会儿（气血符力回满）' }, { t: '🌙 一觉睡到天黑', dis: isNight() }, { t: `🌅 一觉睡到天亮（第 ${(C.day || 1) + 1} 天：虚神界、悬赏换新）` }, { t: '算了' }], C.loc === 'sc_willow' ? '柳枝在头顶轻轻晃着。' : C.loc === 'bt_court' ? '神藤下很安静。' : '石屋里铺着兽皮，暖烘烘的。'); });
  if (c === 3) return; fullHeal(); sfx('heal'); if (c === 1) { C.tick = BAL.duskAt; bannerKey = ''; } if (c === 2) newDay();
  logLine(c === 1 ? '你一觉睡到了天黑。窗外的大荒换了一副样子，夜行的东西都出来了。' : c === 2 ? '你一觉睡到了天亮，伸了个懒腰，浑身是劲。' : C.loc === 'sc_willow' ? '你在柳树下坐了一会儿，一缕神光拂过，身上的伤都不疼了。' : C.loc === 'bt_court' ? '你在神藤下打坐了一个时辰，气血、符力都回满了。' : '你美美地睡了一觉，气血、符力都回满了。', 'dim'); save(); refresh(); bannerDraw(); }

/* ---------- 洞天重开 at 柳神 ---------- */
async function dongtianRedo() { if (!C.dt.length || !itemN('lingyao')) return;
  await runScene(async () => { await say('willow', '（柳枝垂下来，点在你胸口。你体内的洞天一座座亮了起来。）'); const c = await choose([...C.dt.map((k, i) => `第 ${i + 1} 座：${DONGTIAN.find(d => d.k === k).n}`), '算了']); if (c >= C.dt.length) return;
    const old = C.dt[c], opts = shuffle(DONGTIAN.filter(d => d.k !== old).slice()).slice(0, 2); const c2 = await choose([...opts.map(o => `${o.n}（${o.d}）`), '还是留着原来的']); if (c2 >= 2) return;
    takeItem('lingyao'); C.dt[c] = opts[c2].k; fixHp(); logLine(`第 ${c + 1} 座洞天重开成了<b>${opts[c2].n}</b>（${opts[c2].d}）。`, 'sys'); sfx('epic'); }); }

/* ---------- 困难秘境 ---------- */
function enterDungeonHard(id) { if (!C.dungeons[id]) return; enterDungeon(id, true); }

/* ---------- 任务列表: main line, side errands and bounties side by side; pick which one to follow ---------- */
const npcLocNow = n => { const P = Object.values(PLACES).find(p => placeOpen(p.id) && npcsHere(p.id).includes(n)); return P ? P.id : null; };
function itemWhere(id) { // the open wild place closest to your level where it can be gathered, or else where a beast drops it
  const open = Object.values(PLACES).filter(p => placeOpen(p.id) && p.lv && route(C.loc, p.id)), by = L => L.sort((a, b) => Math.abs(a.lv[0] - C.lv) - Math.abs(b.lv[0] - C.lv))[0];
  const g = open.filter(p => (p.gather || []).some(x => x[0] === id)), m = open.filter(p => (p.mobs || []).some(x => (MOBS[x[0]].loot || []).some(l => l[0] === id)));
  const P = by(g.length ? g : m); return P ? P.id : null; }
function tasks() {
  const q = curQ(), out = [{ key: 'main', kind: '主线', title: `${CH_NAMES[q.ch].split(' · ')[1] || ''} · ${q.title}`, goal: questGoalText(), where: questWhere() }];
  for (const [id, S] of Object.entries(SIDE)) { const st = C.side && C.side[id]; if (st === 'done' || C.story.q < qi(S.minQ)) continue; const N = NPCS[S.npc];
    if (!st) { out.push({ key: 'side:' + id, kind: '支线 · 可接', title: S.title, goal: `去找${N.name}`, where: npcLocNow(S.npc) }); continue; }
    const miss = S.need.find(([k, n]) => itemN(k) < n), prog = S.need.map(([k, n]) => `${ITEMS[k].name} ${Math.min(itemN(k), n)}/${n}`).join('、');
    out.push({ key: 'side:' + id, kind: '支线', title: S.title, goal: miss ? `${prog}（${PLACES[itemWhere(miss[0])]?.name || '野外'}能找到）` : `${prog} → 交给${N.name}`, where: miss ? itemWhere(miss[0]) : npcLocNow(S.npc) }); }
  for (const q of SIDEQ) { if (!q.open()) continue; const s = q.st(); if (s >= q.max) continue; out.push({ key: 'sideq:' + q.id, kind: '支线', title: q.n, goal: q.hint(s), where: q.loc(s) }); }
  for (const b of bountyToday()) { if (b.st === 'done') continue; const N = NPCS[b.npc], ready = b.st === 'on' && bountyReady(b);
    const loc = b.st === 'new' || ready ? npcLocNow(b.npc) : b.kind === 'kill' ? (b.loc || Object.values(PLACES).find(p => p.name === b.where)?.id) : itemWhere(b.id);
    out.push({ key: 'bounty:' + b.npc, kind: b.st === 'new' ? '悬赏 · 可接' : '悬赏', title: `${N.name}的悬赏`, goal: bountyText(b) + (b.st === 'new' ? ` · 去找${N.name}接` : ready ? ` → 交给${N.name}` : ''), where: loc }); }
  return out; }
function curTask() { const T = tasks(); return T.find(t => t.key === C.track) || T[0]; }
const taskWhere = () => curTask().where;
function trackTask(key) { C.track = key; sfx('click'); save(); refresh(); }

/* ---------- 歇脚 in the wild: once per visit, 40% back, and something may come sniffing ---------- */
async function camp() { const P = PLACES[C.loc]; if (STATE.scene || STATE.battle || STATE.dungeon || !P.mobs || P.town) return; const key = C.loc + C.seenN; if (UI.campAt === key) { toast('刚歇过了，换个地方再歇'); return; } UI.campAt = key;
  passTime(1); if (chance(0.25)) { logLine('你刚找了块石头坐下，草丛里就有东西扑了过来——', 'enc'); const id = wpick(P.mobs, x => x[1])[0]; const r = await startBattle({ mobs: [[id, clamp(rint(P.lv[0], P.lv[1]), 1, 30)]], title: `${P.name} · 歇脚被打断`, flee: true }); if (!r || !r.win) return; }
  const s = charStats(); C.hp = Math.min(s.hpMax, C.hp + s.hpMax * 0.4); C.mp = Math.min(s.mpMax, C.mp + s.mpMax * 0.4); sfx('heal');
  logLine(isNight() ? '你拢了一小堆火，靠着火歇了一会儿。气血、符力回了四成。' : '你找了块背风的石头靠着歇了一会儿。气血、符力回了四成。', 'dim'); save(); refresh(); }

/* ---------- 灵石 and trading: sell in any town, buy where there is a stall ---------- */
const PRICE = { milk: 6, herb: 8, meat: 10, lingyao: 30, baoyao: 90, bone: 6 }; // buying price; selling gets half
const sellPrice = id => Math.max(1, Math.floor((PRICE[id] || 0) / 2));
const canTrade = () => !!(PLACES[C.loc].town && PLACES[C.loc].area !== 'xushen');
function sellItem(id, all) { const it = ITEMS[id]; if (!canTrade() || !it || !PRICE[id] || !itemN(id)) return; const n = all ? itemN(id) : 1; takeItem(id, n); C.money = (C.money || 0) + sellPrice(id) * n; logLine(`卖掉 ${it.icon}${it.name} ×${n}，得到 💎${sellPrice(id) * n} 灵石。`, 'loot'); sfx('gold'); save(); refresh(); }
function buyItem(id) { const P = PLACES[C.loc]; if (!P.shop || !P.shop.includes(id)) return; if ((C.money || 0) < PRICE[id]) { toast('灵石不够'); return; } C.money -= PRICE[id]; addItem(id, 1, true); logLine(`买了 ${ITEMS[id].icon}${ITEMS[id].name}，花了 💎${PRICE[id]}。`, 'loot'); sfx('gold'); save(); refresh(); }
function gainMoney(n, why) { n = Math.round(n); if (n <= 0) return; C.money = (C.money || 0) + n; if (why) logLine(`${why} 💎${n} 灵石`, 'loot'); }

/* ---------- partner loadout: 4 moves in battle (5 once awakened); a new move replaces the lowest-tier one of its kind ---------- */
const petSlots = id => 4 + (C.pets[id] && C.pets[id].evo ? 1 : 0);
const petOpen = id => PETS[id].sk.map((s, i) => ({ s, i })).filter(x => (!x.s.aff || C.pets[id].aff >= x.s.aff) && (!x.s.evo || C.pets[id].evo)).map(x => x.i);
function petBar(id) { const p = C.pets[id]; if (!p) return []; const open = petOpen(id), n = petSlots(id);
  if (!p.bar) p.bar = open.slice(0, n);
  for (const i of open) if (!p.bar.includes(i) && !(p.seen || []).includes(i)) { p.seen = [...(p.seen || []), i]; // newly learned: take a free slot, or replace the lowest-tier move of the same kind
    if (p.bar.length < n) p.bar.push(i); else { const cat = PETS[id].sk[i].cat, old = p.bar.filter(k => PETS[id].sk[k].cat === cat)[0]; if (old != null) { p.bar[p.bar.indexOf(old)] = i; if (STATE.mode === 'play') toast(`${PETS[id].name} 学会「${PETS[id].sk[i].n}」，换下了「${PETS[id].sk[old].n}」`); } } }
  p.seen = [...new Set([...(p.seen || []), ...open])]; p.bar = p.bar.filter(i => open.includes(i)).slice(0, n); return p.bar; }
function togglePetMove(id, i) { const p = C.pets[id]; if (!p || !petOpen(id).includes(i)) return; const bar = petBar(id), n = petSlots(id);
  if (bar.includes(i)) { if (bar.length <= 1) { toast('至少留一招'); return; } p.bar = bar.filter(k => k !== i); }
  else if (bar.length < n) p.bar = [...bar, i];
  else { const cat = PETS[id].sk[i].cat, same = bar.filter(k => PETS[id].sk[k].cat === cat), old = same.length ? same[0] : bar[0]; p.bar = bar.map(k => k === old ? i : k); toast(`换下了「${PETS[id].sk[old].n}」`); }
  sfx('click'); save(); refresh(); }
function setDuo(v) { C.duo = v; sfx('click'); save(); if (STATE.battle) renderBattle(true); netSync(); }

/* ---------- partner growth: its own level (to 30, past 石昊's cap), move ranks (材料), and a second awakening (返祖) ---------- */
const PET_LV_CAP = 85;
const petLv = id => { const p = C.pets[id]; return p ? (p.lv || C.lv) : C.lv; };
const petNeed = lv => Math.round(BAL.expNext(Math.min(lv, 20)) * (lv >= 20 ? 1 + (lv - 19) * 0.35 : 1));
function petGainExp(id, n) { const p = C.pets[id]; if (!p || n <= 0) return; if (!p.lv) p.lv = C.lv; p.exp = (p.exp || 0) + Math.round(n * (p.lv < C.lv ? 1.6 : 1));
  const cap = C.story.f.end ? PET_LV_CAP : Math.min(PET_LV_CAP, C.lv + 2); // before the end of volume one: at most 2 above 石昊
  while (p.lv < cap && p.exp >= petNeed(p.lv)) { p.exp -= petNeed(p.lv); p.lv++; logLine(`${PETS[id].icon}<b>${PETS[id].name}</b> 长到了 <b>${p.lv} 级</b>${p.lv > C.lv ? '（比石昊还高，属性 +' + Math.round((p.lv - C.lv) * 3) + '%）' : ''}。`, 'sys'); if (id === C.pet) bigFlash(PETS[id].name + ' · ' + p.lv + ' 级', 'lv'); }
  if (p.lv >= cap) p.exp = Math.min(p.exp, petNeed(p.lv)); petEvo2Check(id); petEvo3Check(id); }
function petBattleExp(exp) { for (const id of Object.keys(C.pets)) petGainExp(id, exp * (id === C.pet ? 1 : 0.3)); }
/* move ranks: 1 → 2 → 3, each +20% (rank 3 also lasts a round longer) */
const RANK_COST = { 2: { need: [['bone', 4], ['lingyao', 2]], lv: 1 }, 3: { need: [['bone', 8], ['baoyao', 1]], lv: 15 } };
const petRank = (id, i) => (C.pets[id] && C.pets[id].rk && C.pets[id].rk[i]) || 1;
function rankedMove(s, rk) { if (rk <= 1) return s; const m = 1 + 0.2 * (rk - 1), o = Object.assign({}, s);
  for (const k of ['dmg', 'healAlly', 'shieldAll', 'shieldHero']) if (o[k]) o[k] = o[k] * m;
  if (o.buffHero) o.buffHero = Object.assign({}, o.buffHero, { v: o.buffHero.v * m, t: o.buffHero.t + (rk >= 3 ? 1 : 0) });
  if (o.st) o.st = Object.assign({}, o.st, { v: o.st.k === 'brk' ? Math.min(0.6, (o.st.v || 0) * m) : (o.st.v || 0) * m, t: o.st.t + (rk >= 3 ? 1 : 0), p: Math.min(1, (o.st.p ?? 1) * m) });
  if (o.taunt) o.taunt = o.taunt + (rk >= 3 ? 1 : 0); return o; }
function petRankUp(id, i) { const p = C.pets[id]; if (!p || !petOpen(id).includes(i)) return; const r = petRank(id, i); if (r >= 3) return; const R = RANK_COST[r + 1];
  if (petLv(id) < R.lv) { toast(`${PETS[id].name} 要 ${R.lv} 级才能练到 3 阶`); return; } if (!R.need.every(([k, n]) => itemN(k) >= n)) { toast('材料不够：' + R.need.map(([k, n]) => ITEMS[k].name + '×' + n).join('、')); return; }
  for (const [k, n] of R.need) takeItem(k, n); p.rk = p.rk || {}; p.rk[i] = r + 1; const mv = PETS[id].sk[i]; logLine(`${PETS[id].icon}${PETS[id].name} 的「${mv.n}」练到了 <b>${r + 1} 阶</b>（效果 +${r * 20}%${r + 1 >= 3 ? '，持续多一回合' : ''}）。`, 'sys'); sfx('epic'); save(); refresh(); }
/* 返祖: full affection, already awakened, and 25 级 */
const EVO2_TEXT = { maoqiu: '毛球站在山梁上，冲着大荒深处长啸了一声。那一瞬间，四野的凶兽全都伏低了身子——它们闻到了一股很古老的气息。', dahong: '大红在云里翻了个身，身后拖出一条长长的火尾，烧得半边天都红了。它落下来，得意地啄了啄你的脑门。', ertuzi: '二秃子身上的五色光一圈圈收拢，最后凝在它光溜溜的脑袋上，像戴了一顶小小的冠。……毛还是只有那一根。' };
function petEvo2Check(id) { const p = C.pets[id]; if (!p || p.evo2 || !p.evo || p.aff < 100 || petLv(id) < 25 || NETROLE === 'guest') return; p.evo2 = 1;
  setTimeout(() => runScene(async () => { await nar(EVO2_TEXT[id]); logLine(`<b class="lvup">血脉返祖</b>：${PETS[id].icon}<b>${PETS[id].name}</b> 全身属性再 +15%。`, 'sys'); sfx('epic'); bigFlash(PETS[id].name + ' · 返祖', 'relic'); }, { title: PETS[id].name + '返祖' }), 600); }
