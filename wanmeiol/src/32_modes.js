/* ================= 守城 (waves) and 守擂 (an endless stage) =================
   守城: a fight in waves. Before it starts you choose where to stand —
     守城门 (gate)   everyone on your side +30% 防御        守城头 (wall)  +20% 攻击        守粮道 (supply) 20% 气血 back after every wave
   The story uses it at 边荒战场, 仙域城下 and 九天之巅; 帝关城头 offers it again whenever you like (best wave is kept).
   守擂 (争霸台, after 第六卷): challengers keep coming, a little stronger every 5; 气血 is not refilled (10% back per win).
   Leave whenever you like (逃跑) or fall — nothing is lost. The best streak is kept, with rewards per 10 wins. */
const STANCES = [{ id: 'gate', t: '守城门 · 全队防御 +30%' }, { id: 'wall', t: '守城头 · 全队攻击 +20%' }, { id: 'supply', t: '守粮道 · 每波打完回 20% 气血' }];
function stanceApply(B) { const s = B.stance; if (!s) return; for (const u of alive(B, 0)) { if (s === 'gate') addSt(u, { k: 'def', t: 99, v: 0.3 }); if (s === 'wall') addSt(u, { k: 'atk', t: 99, v: 0.2 }); } }
function spawnFoes(B, list) { for (const [id, lv] of list) { const u = mobUnit(id, lv, 1); u.hp = u.hpMax; u.alive = true; partyFoe(B, u); B.units.push(u); planMob(B, u); if (!MOBS[id].nocodex) { C.codex = C.codex || {}; C.codex[id] = C.codex[id] || { wk: [] }; } } }
function mechWave(B) { // called when every foe is down: true = the fight goes on
  if (B.waves && B.waves.length) { const next = B.waves.shift(); B.waveN = (B.waveN || 1) + 1; if (B.stance === 'supply') for (const u of alive(B, 0)) { const v = Math.round(u.hpMax * 0.2); u.hp = Math.min(u.hpMax, u.hp + v); fxe(B, { k: 'heal', t: u.id, v, hp: hpr(u) }); }
    B.units = B.units.filter(u => u.side === 0 || u.alive); spawnFoes(B, next); blog(B, `<span class="phase">第 ${B.waveN} 波！${B.waves.length ? '' : '（最后一波）'}</span>`); fxe(B, { k: 'phase', t: B.units.find(u => u.side === 1).id }); B.title = `${B.baseTitle}（第 ${B.waveN}/${B.waveN + B.waves.length} 波）`; return true; }
  if (B.endless) { const E = B.endless; E.n++; const h = B.units.find(u => u.kind === 'pc'); for (const u of alive(B, 0)) { const v = Math.round(u.hpMax * 0.1); u.hp = Math.min(u.hpMax, u.hp + v); }
    if (E.n % 10 === 0) blog(B, `<span class="phase">${E.n} 连胜！</span>`); B.units = B.units.filter(u => u.side === 0 || u.alive); spawnFoes(B, leitaiFoes(E.n, h.lv)); B.title = `争霸台 · 守擂（${E.n} 连胜）`; B.round = 1; return true; }
  return false; }
async function siege(spec, stancePrompt) {
  const c = await choose(STANCES.map(s => s.t), stancePrompt || '你站在哪儿？');
  const waves = spec.waves.slice(); const first = waves.shift();
  const r = await startBattle(Object.assign({ flee: false, story: 1, noLose: true }, spec, { mobs: first, waves, stance: STANCES[c].id, title: spec.title }));
  return r && r.win; }
async function siegeRetry(spec, prompt) { for (; ;) { if (await siege(spec, prompt)) return true; await nar('城头上的人把你拖了下来。伤口包好了，城还在。'); fullHeal(); refresh(); const c = await choose(['再守一次！', '先回去练练']); if (c === 1) return false; } }
/* 帝关城头: the siege you can play again */
const SIEGE_POOL = [['yiyubing', 'yiyuqi', 'bhhun'], ['yiyubing', 'yiyubing', 'yiyuqi'], ['bhhun', 'yiyuqi', 'yiyuqi'], ['yiyubing', 'bhhun', 'bhhun'], ['dizu']];
function siegeOpen() { return C.story.q > qi('q_dizu'); }
async function siegeStart() { if (NETROLE === 'guest' || STATE.scene || STATE.battle) return;
  await runScene(async () => { const lv = Math.max(55, C.lv); const waves = SIEGE_POOL.map((w, i) => w.map(id => [id, lv + (i === 4 ? 1 : 0)]));
    await nar(`异域的兵又压上来了。帝关城头上，你上一次守到了第 <b>${(C.records && C.records.siege) || 0}</b> 波。`);
    const c = await choose(STANCES.map(s => s.t), '你站在哪儿？'); const w = waves.slice(), first = w.shift();
    const r = await startBattle({ mobs: first, waves: w, stance: STANCES[c].id, title: '帝关 · 守城', flee: true, noLose: true, siegeMode: 1 });
    const got = r && r.win ? 5 : Math.max(0, (r && r.wave ? r.wave : 1) - 1); C.records = C.records || {}; const best = C.records.siege || 0; if (got > best) C.records.siege = got;
    if (got) { addItem('baoyao', got >= 5 ? 3 : 1); gainExp(Math.round(BAL.expNext(C.lv) * 0.08 * got)); }
    await nar(r && r.win ? '五波全守住了。城头上的兵冲你举了举枪。' : `守到了第 ${got} 波。${got > best ? '比上一次多。' : ''}`); }, { title: '帝关守城' }); refresh(); }
/* 争霸台: 守擂 */
const LEITAI_MOBS = ['tiaozhan', 'tianjiao6', 'yytj', 'tianrenzu', 'txdizi', 'jinwu', 'zhengzu', 'yiyubing'];
function leitaiFoes(n, lv) { const k = 1 + (n % 4 === 3 ? 1 : 0), L = Math.max(30, lv - 3 + Math.floor(n / 5)); return Array.from({ length: k }, () => [LEITAI_MOBS[(n * 3 + Math.floor(Math.random() * 3)) % LEITAI_MOBS.length], L]); }
const leitaiOpen = () => !!C.story.f.v6end;
async function leitaiStart() { if (NETROLE === 'guest' || STATE.scene || STATE.battle) return;
  await runScene(async () => { C.records = C.records || {}; await nar(`争霸台上又站满了人。你上一回守了 <b>${C.records.leitai || 0}</b> 场。争霸那一回，你在台上站了五百八十八场。`);
    const r = await startBattle({ mobs: leitaiFoes(0, C.lv), endless: 1, title: '争霸台 · 守擂', flee: true, noLose: true });
    const n = (r && r.streak) || 0, best = C.records.leitai || 0; if (n > best) C.records.leitai = n;
    if (n) { gainMoney(Math.round(n * C.lv * 3), '守擂'); gainExp(Math.round(BAL.expNext(C.lv) * 0.04 * n)); const bags = Math.floor(n / 10); if (bags) addItem('baoyao', bags); }
    await nar(`守了 <b>${n}</b> 场。${n > best ? '比上一回多——台下有人记下了这个数。' : '台下的人散了，明天还会来。'}`); }, { title: '争霸台守擂' }); refresh(); }
