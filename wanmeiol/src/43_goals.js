/* ================= long-term goals and conveniences =================
   宝骨 · 灵兽觉醒 · 材料兑换 · 每日悬赏 · 地点探索度 · 称号 · 传送 · 睡到天黑/天亮 · 洞天重开 · 困难秘境 · 战斗教学 */

/* ---------- 宝骨 ---------- */
function gainRelic(id, quiet) { C.relics = C.relics || {}; if (C.relics[id]) return; C.relics[id] = 1; const R = RELICS[id]; C.eq = C.eq || []; if (C.eq.length < 2) C.eq.push(id);
  if (!quiet) { logLine(`<b class="lvup">得到宝骨</b>：${R.i}<b>${R.n}</b>——${R.d}${C.eq.includes(id) ? '（已经戴上了）' : '（在“石昊”页里换着戴）'}`, 'sys'); sfx('epic'); bigFlash(R.n, 'relic'); } fixHp(); }
function relicFromKills(kills) { for (const [mob, , boss] of kills || []) if (boss) for (const [id, R] of Object.entries(RELICS)) if (R.from === mob) gainRelic(id); }
function equipRelic(id) { if (!C.relics || !C.relics[id]) return; C.eq = C.eq || []; const i = C.eq.indexOf(id); if (i >= 0) C.eq.splice(i, 1); else { if (C.eq.length >= 2) C.eq.shift(); C.eq.push(id); } fixHp(); sfx('click'); save(); refresh(); }

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
  const d = today(); if (!C.bounty || C.bounty.day !== d) C.bounty = { day: d, list: [] }; const list = C.bounty.list;
  for (const B of BOUNTY_FROM) { if (!B.open() || list.some(b => b.npc === B.npc)) continue; const r = srng('bounty' + d + C.created + B.npc);
    const ps = Object.values(PLACES).filter(p => B.areas.includes(p.area) && placeOpen(p.id) && p.mobs && p.lv && p.lv[0] <= C.lv + 2);
    if (ps.length && r() < 0.7) { const P = ps[Math.floor(r() * ps.length)], m = P.mobs[Math.floor(r() * P.mobs.length)][0]; list.push({ npc: B.npc, kind: 'kill', id: m, n: 4 + Math.floor(r() * 3), got: 0, st: 'new', where: P.name }); }
    else { const it = ['bone', 'herb', 'meat', 'lingyao'][Math.floor(r() * 4)]; list.push({ npc: B.npc, kind: 'item', id: it, n: it === 'lingyao' ? 2 : 3 + Math.floor(r() * 2), got: 0, st: 'new' }); } }
  return list; }
const bountyText = b => b.kind === 'kill' ? `打 ${b.n} 头${MOBS[b.id].name}（${b.where}，${Math.min(b.got, b.n)}/${b.n}）` : `带 ${b.n} 个${ITEMS[b.id].name}（${Math.min(itemN(b.id), b.n)}/${b.n}）`;
const bountyReady = b => b.kind === 'kill' ? b.got >= b.n : itemN(b.id) >= b.n;
function bountyOptions(npc) { const out = []; bountyToday().forEach((b, i) => { if (b.npc !== npc || b.st === 'done') return;
  out.push({ t: b.st === 'new' ? `📋 今日悬赏：${bountyText(b)}` : bountyReady(b) ? `✔ 交悬赏：${bountyText(b)}` : `📋 悬赏进行中：${bountyText(b)}`, dis: b.st === 'on' && !bountyReady(b), f: () => bountyTake(i) }); }); return out; }
function bountyTake(i) { const b = bountyToday()[i]; if (!b || b.st === 'done') return;
  if (b.st === 'new') { b.st = 'on'; logLine(`【悬赏】${NPCS[b.npc].name}：${bountyText(b)}`, 'quest'); save(); refresh(); return; }
  if (!bountyReady(b)) return; if (b.kind === 'item') takeItem(b.id, b.n); b.st = 'done'; C.stats.bounty = (C.stats.bounty || 0) + 1;
  logLine(`【悬赏完成】${NPCS[b.npc].name}很满意。`, 'quest'); addItem('baoyao'); addItem('lingyao'); gainExp(BAL.expNext(C.lv) * 0.3); const sk = C.bar.length ? pick(C.bar) : null; if (sk) { for (let k = 0; k < 5; k++) profUse(sk); logLine(`${SKILLS[sk].name} 熟练度 +5`, 'dim'); } sfx('loot'); save(); refresh(); }
function bountyKill(mob) { if (!C.bounty || C.bounty.day !== today()) return; for (const b of C.bounty.list) if (b.st === 'on' && b.kind === 'kill' && b.id === mob && b.got < b.n) { b.got++; if (b.got === b.n) logLine(`【悬赏】${MOBS[mob].name} 够数了，回去找${NPCS[b.npc].name}。`, 'quest'); } }

/* ---------- 地点探索度: every kind of beast here beaten + everything here gathered ---------- */
function exTargets(P) { const m = [...new Set((P.mobs || []).map(x => x[0]))], g = [...new Set((P.gather || []).map(x => x[0]))]; return { m, g, n: m.length + g.length }; }
function exState(loc) { C.ex = C.ex || {}; return C.ex[loc] || (C.ex[loc] = { m: {}, g: {} }); }
function exCount(loc) { const P = PLACES[loc], T = exTargets(P), E = (C.ex && C.ex[loc]) || { m: {}, g: {} }; return { have: T.m.filter(x => E.m[x]).length + T.g.filter(x => E.g[x]).length, n: T.n, done: !!E.done }; }
function exNote(loc, k, id) { const P = PLACES[loc]; if (!P || !P.lv) return; const T = exTargets(P); if (!T[k].includes(id)) return; const E = exState(loc); if (E[k][id]) return; E[k][id] = 1;
  const c = exCount(loc); if (c.have >= c.n && !E.done) { E.done = 1; logLine(`<b class="lvup">${P.name} 探索完成</b>：这里的凶兽都交过手，能采的东西也都找到了。`, 'sys'); addItem('baoyao'); addItem('lingyao'); gainExp(BAL.expNext(C.lv) * 0.3); sfx('epic'); bigFlash(P.name + ' · 探索完成', 'relic'); } }

/* ---------- 称号 ---------- */
function achCheck() { if (!C || NETROLE === 'guest') return; C.ach = C.ach || {}; for (const A of ACH) if (!C.ach[A.id]) { let ok = false; try { ok = A.ok(); } catch (e) { } if (ok) { C.ach[A.id] = now(); logLine(`<b class="lvup">获得称号「${A.n}」</b>——${A.d}`, 'sys'); toast('称号：' + A.n); sfx('level'); } } }
function setTitle(id) { C.title = C.title === id ? '' : id; sfx('click'); save(); refresh(); }

/* ---------- 传送 (阁主's jade token, after joining 补天阁) ---------- */
const TP = [{ id: 'sc_street', n: '石村' }, { id: 'bt_court', n: '补天阁内院' }, { id: 'bd_gate', n: '百断山口' }, { id: 'xs_hall', n: '虚神界（神魂过去）' }];
const canTeleport = () => !!C.story.f.joined && (PLACES[C.loc].town || C.loc === 'bd_gate');
async function teleport() { if (!canTeleport() || STATE.scene || STATE.battle || STATE.dungeon) return; const L = TP.filter(t => t.id !== C.loc && placeOpen(t.id)); if (!L.length) return; let to = null;
  await runScene(async () => { const c = await dlgChoose([...L.map(t => ({ t: '🌀 ' + t.n })), { t: '算了' }], '玉符在掌心微微发烫。去哪儿？'); if (c < L.length) to = L[c].id; });
  if (to) { logLine('玉符一亮，眼前的景物像水面一样晃了晃——', 'dim'); go(to); } }

/* ---------- 休息：歇一会儿 / 睡到天黑 / 睡到天亮 ---------- */
async function rest() { if (STATE.scene || STATE.battle) return; let c = 0;
  await runScene(async () => { c = await dlgChoose([{ t: '🛏 歇一会儿（气血符力回满）' }, { t: '🌙 一觉睡到天黑' }, { t: '🌅 一觉睡到天亮' }, { t: '算了' }], C.loc === 'sc_willow' ? '柳枝在头顶轻轻晃着。' : C.loc === 'bt_court' ? '神藤下很安静。' : '石屋里铺着兽皮，暖烘烘的。'); });
  if (c === 3) return; fullHeal(); sfx('heal'); if (c > 0) { C.tod = { night: c === 1, until: now() + 40 * 60000 }; bannerKey = ''; }
  logLine(c === 1 ? '你一觉睡到了天黑。窗外的大荒换了一副样子，夜行的东西都出来了。' : c === 2 ? '你一觉睡到了天亮，伸了个懒腰，浑身是劲。' : C.loc === 'sc_willow' ? '你在柳树下坐了一会儿，一缕神光拂过，身上的伤都不疼了。' : C.loc === 'bt_court' ? '你在神藤下打坐了一个时辰，气血、符力都回满了。' : '你美美地睡了一觉，气血、符力都回满了。', 'dim'); save(); refresh(); bannerDraw(); }

/* ---------- 洞天重开 at 柳神 ---------- */
async function dongtianRedo() { if (!C.dt.length || !itemN('lingyao')) return;
  await runScene(async () => { await say('willow', '（柳枝垂下来，点在你胸口。你体内的洞天一座座亮了起来。）'); const c = await choose([...C.dt.map((k, i) => `第 ${i + 1} 座：${DONGTIAN.find(d => d.k === k).n}`), '算了']); if (c >= C.dt.length) return;
    const old = C.dt[c], opts = shuffle(DONGTIAN.filter(d => d.k !== old).slice()).slice(0, 2); const c2 = await choose([...opts.map(o => `${o.n}（${o.d}）`), '还是留着原来的']); if (c2 >= 2) return;
    takeItem('lingyao'); C.dt[c] = opts[c2].k; fixHp(); logLine(`第 ${c + 1} 座洞天重开成了<b>${opts[c2].n}</b>（${opts[c2].d}）。`, 'sys'); sfx('epic'); }); }

/* ---------- 困难秘境 ---------- */
function enterDungeonHard(id) { if (!C.dungeons[id]) return; enterDungeon(id, true); }
