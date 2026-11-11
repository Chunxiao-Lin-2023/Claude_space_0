/* ================= moving, exploring, battles, dungeons, roaming 凶兽首领 ================= */
const exitsOf = loc => { const ex = {}; for (const [d, id] of Object.entries(PLACES[loc].exits)) if (placeOpen(id)) ex[d] = id; return ex; };
const isNight = () => { if (window.__dbg && __dbg.night != null) return __dbg.night; if (C && C.tod && C.tod.until > now()) return C.tod.night; const h = new Date().getHours(); return h >= 19 || h < 6; };
const pdesc = P => C.story.f.moved && P.moved ? P.moved : P.desc;
function go(loc, silent, force) {
  if (!PLACES[loc] || !placeOpen(loc)) return; if (!force && (STATE.battle || STATE.scene || STATE.dungeon)) { toast(STATE.battle ? '打着呢，走不开' : '先把眼前的事办完'); return; }
  C.loc = loc; C.seen[loc] = 1; const P = PLACES[loc]; if (P.town && P.area !== 'xushen') C.home = loc === 'sc_willow' || loc === 'sc_chief' ? 'sc_street' : loc;
  sfx('step'); if (!silent) describe(); save(); refresh(); bannerDraw(); npcOnArrive(loc);
  if (!force) setTimeout(() => storyArrive(loc), 120);
}
function describe() {
  const P = PLACES[C.loc], A = AREAS[P.area];
  logLine(`<div class="lochead">${P.name}<span>${A.name}${P.lv ? ` · ${P.lv[0]}-${P.lv[1]} 层` : ''}</span></div>${isNight() && P.night ? P.night : pdesc(P)}`, 'loc');
  if (ROAM && !ROAM.dead && ROAM.loc === C.loc && now() < ROAM.end) logLine(`<b class="warn">${MOBS[ROAM.id].name}就在附近！</b>`, 'sys');
}
function storyArrive(loc) { if (!C || STATE.scene || STATE.battle || STATE.dungeon || NETROLE === 'guest') return; const q = curQ();
  if (q.type === 'enter' && q.loc === loc) return questComplete(q);
  if (q.onEnter && q.onEnter.loc === loc && !C.story.f['en_' + q.id]) { C.story.f['en_' + q.id] = 1; return runScene(q.onEnter.scene); }
  storyEvents(loc);
}
function route(from, to) { if (from === to) return [from]; const prev = { [from]: null }, Q = [from];
  while (Q.length) { const a = Q.shift(); for (const b of Object.values(exitsOf(a))) { if (b in prev) continue; prev[b] = a; if (b === to) { const p = [b]; let c = a; while (c) { p.unshift(c); c = prev[c]; } return p; } Q.push(b); } } return null; }
let walking = null;
async function autoWalk(to) {
  if (STATE.battle || STATE.scene || STATE.dungeon) return; const path = route(C.loc, to); if (!path) { toast('那里还去不了'); return; }
  const id = walking = uid(); for (let i = 1; i < path.length; i++) { await sleep(window.__dbg && __dbg.instant ? 10 : SET.fast ? 120 : 360); if (walking !== id || STATE.battle || STATE.scene) return; go(path[i], i < path.length - 1); }
  walking = null;
}
/* ---------- explore ---------- */
let exploreT = 0;
const NIGHT_MOBS = { dahuang: 'owl', butian: 'owl', baiduan: 'wisp' };
const FLAVOR_N = ['黑暗里亮起几点绿光——', '月亮被云遮住的一瞬间，', '夜风里夹着一股腥气，', '你踩断了一根枯枝，四周猛地安静下来——'];
const FLAVOR = ['草丛里窸窸窣窣地响了一阵——', '你拨开一丛灌木，', '一阵腥风扑面而来，', '脚下的落叶突然动了一下，', '远处一声低吼，越来越近，'];
async function explore() {
  if (STATE.battle || STATE.scene || STATE.dungeon || now() < exploreT) return; exploreT = now() + (window.__dbg && __dbg.noCD ? 0 : 700); const P = PLACES[C.loc]; if (!P.mobs) return;
  if (C.hp < charStats().hpMax * 0.15) { toast('气血太低了，先歇一歇'); return; }
  const r = Math.random(), night = isNight(), pool = night && NIGHT_MOBS[P.area] ? [...P.mobs, [NIGHT_MOBS[P.area], 3]] : P.mobs;
  const ev = r >= 0.6 ? wildEventFor(P) : null; if (ev && (ev.once || chance(0.5))) return runWild(ev);
  if (r < 0.6) { const n = wpick([{ v: 1, w: 6 }, { v: 2, w: 3 }, { v: 3, w: 1 }]).v; const mobs = []; for (let i = 0; i < n; i++) { const id = wpick(pool, x => x[1])[0]; mobs.push([id, clamp(rint(P.lv[0], P.lv[1]), 1, 30)]); }
    logLine((night ? pick(FLAVOR_N) : pick(FLAVOR)) + mobs.map(m => MOBS[m[0]].name).join('、') + '冲了出来！', 'enc'); const res = await startBattle({ mobs, title: `${P.name} · ${night ? '夜袭' : '遭遇'}`, flee: true }); if (res && res.win) logLine(`打赢了：${mobs.map(m => MOBS[m[0]].name).join('、')}。`, 'dim'); }
  else if (r < 0.88 && P.gather) { let got = false; for (const [id, p] of P.gather) if (Math.random() < p) { addItem(id, 1); exNote(C.loc, 'g', id); got = true; } if (!got) logLine('你四下翻了翻，什么也没找到。', 'dim'); sfx('step'); save(); refresh(); }
  else { const ev = rint(0, 3);
    if (ev === 0 && C.pet) { const Pp = PETS[C.pet]; logLine(`${Pp.icon}${Pp.name}${pick(['从草丛里叼回来一块兽骨，得意地放在你脚边。', '追着一只蝴蝶跑出去老远，又灰头土脸地跑回来。', '蹲在树杈上冲你叫，好像发现了什么。'])}`, 'enc'); if (chance(0.5)) addItem('bone'); }
    else if (ev === 1) { logLine('你靠着一块大石头歇了口气。', 'enc'); const s = charStats(); C.hp = Math.min(s.hpMax, C.hp + s.hpMax * 0.15); C.mp = Math.min(s.mpMax, C.mp + s.mpMax * 0.15); }
    else if (ev === 2) { logLine('你发现了一株长得很好的药草。', 'enc'); addItem(chance(0.3) ? 'lingyao' : 'herb'); }
    else logLine('四周很安静，只有风吹过树梢的声音。', 'dim'); save(); refresh(); }
}
async function train() { C.stats.train = (C.stats.train || 0) + (C.loc === 'bt_train' ? 1 : 0); await startBattle({ mobs: [['dummy', Math.max(1, C.lv)]], title: C.loc === 'bt_train' ? '雷池 · 挨劈' : '举石锁', noLose: true, flee: true, noPet: true }); }

/* ---------- battle controller (only the host / solo player runs battles; co-op guests just watch the state) ---------- */
function startBattle(spec) {
  return new Promise(res => { const B = battleCreate(spec); STATE.battle = B; STATE.battleRes = res; STATE.busy = true; renderBattle(); netSync(); });
}
function battleAct(act, who = 'hero') { // 石昊 and the 灵兽伙伴 each choose; once everyone has, the round plays out in speed order
  const B = STATE.battle; if (!B || B.over || animBusy()) return; const u = B.units.find(x => x.id === who); if (!u || !u.alive || B.acts[who] || !needInput(B).includes(u)) return;
  if (act.item && !useItem(act.item, true)) return; B.acts[who] = act;
  if (needInput(B).length) { renderBattle(true); netSync(); return; }
  battleResolve(B); renderBattle(); netSync(); if (B.over) battleFinish(B);
}
function battleUndo() { const B = STATE.battle; if (!B || B.over || !B.acts.hero || B.acts.hero.item) return; delete B.acts.hero; renderBattle(true); netSync(); }
function battleFinish(B) { if (B.done) return; B.done = true; const r = Object.assign({ win: B.win, fled: !!B.fled, kills: B.kills, noLose: B.noLose }, B.win ? battleRewards(B) : {});
  const hero = B.units.find(u => u.kind === 'pc'); r.hp = hero.hp; r.mp = hero.mp; r.boss = B.room != null && B.dungeon && DUNGEONS[B.dungeon].rooms[B.room]?.boss ? B.dungeon : null;
  setTimeout(() => battleApply(r, B), window.__dbg && __dbg.instant ? 0 : animLeft() + (SET.motion === false ? 500 : 1100)); }
function battleApply(r, B) {
  const s = charStats(); C.hp = clamp(Math.round(r.hp), 0, s.hpMax); C.mp = clamp(Math.round(r.mp), 0, s.mpMax);
  if (r.win) { sfx('win'); for (const [id, , boss] of r.kills || []) { C.kills[id] = (C.kills[id] || 0) + 1; C.stats.kills++; if (boss) C.stats.bosses++; storyKill(id); }
    if (C.pet && C.pets[C.pet]) { const p = C.pets[C.pet]; if (p.aff < 100 && chance(0.35)) { p.aff = Math.min(100, p.aff + 1); petEvoCheck(C.pet); } }
    relicFromKills(r.kills); for (const [id] of r.kills || []) exNote(C.loc, 'm', id);
    if (C.pets.ertuzi && C.pets.ertuzi.hatch < 0) { /* reserved */ }
    if (r.exp) gainExp(r.exp); for (const it of r.items || []) addItem(it, 1); if (r.boss) storyDungeon(r.boss); if (C.hp <= 0) C.hp = 1; }
  else if (r.fled) logLine('你逃了出来。', 'dim');
  else { sfx('lose'); C.stats.deaths++;
    if (r.noLose) C.hp = Math.max(C.hp, Math.round(s.hpMax * 0.3));
    else { const loss = Math.round(BAL.expNext(C.lv) * BAL.deathExpLoss); C.exp = Math.max(0, C.exp - loss); C.hp = Math.round(s.hpMax * 0.3); C.mp = Math.round(s.mpMax * 0.3);
      logLine(`你被打晕了过去……醒来时已经回到了${PLACES[C.home].name}。<span class="dim">（损失 ${loss} 经验）</span>`, 'sys'); if (STATE.dungeon) STATE.dungeon.failed = true; setTimeout(() => go(C.home, false, true), 300); } }
  STATE.battle = null; STATE.busy = false; save(); battleEndUI(r); netSync();
  const res = STATE.battleRes; STATE.battleRes = null; if (res) res(r);
}

/* ---------- dungeons ---------- */
async function enterDungeon(id, hard) {
  const D = DUNGEONS[id]; if (STATE.battle || STATE.scene || STATE.dungeon) return; if (C.lv < D.lv - 3) { toast(`太危险了（建议 ${D.lv} 层）`); return; } const lvB = hard ? Math.max(D.lv + 5, C.lv + 1) : D.lv; if (hard) logLine('<b class="warn">困难</b>：里面的东西比上回凶得多。', 'sys');
  STATE.dungeon = { id, room: 0 }; logLine(`<div class="lochead">${D.name}</div>`, 'loc'); refresh(); bannerDraw();
  for (let i = 0; i < D.rooms.length; i++) {
    const R = D.rooms[i]; STATE.dungeon.room = i; refresh(); logLine(`<b>【${R.name}】</b>${R.text}`, 'enc'); await sleep(window.__dbg && __dbg.instant ? 0 : 400);
    if (R.mobs) { const r = await startBattle({ mobs: R.mobs.map(m => [m, R.boss ? lvB : Math.max(1, lvB - 1)]), title: `${hard ? '困难 · ' : ''}${D.name} · ${R.name}`, flee: !R.boss, dungeon: id, room: i });
      if (!r || !r.win) { STATE.dungeon = null; refresh(); bannerDraw(); return; } }
    else if (R.event) await dungeonEvent(R.event, D);
    if (i < D.rooms.length - 1) { const c = await dlgChoose([{ t: '原地调息，再往里走（恢复 40% 气血和符力）' }, { t: '直接往里走' }, { t: '先退出去' }], `「${R.name}」过了。前面还有 ${D.rooms.length - 1 - i} 关。`);
      if (c === 0) { const s = charStats(); C.hp = Math.min(s.hpMax, C.hp + s.hpMax * 0.4); C.mp = Math.min(s.mpMax, C.mp + s.mpMax * 0.4); logLine('你靠着石壁调息了一会儿。', 'dim'); refresh(); }
      if (c === 2) { STATE.dungeon = null; refresh(); bannerDraw(); return; } }
  }
  const key = hard ? id + '_hard' : id, firstHard = hard && !C.dungeons[key]; C.dungeons[key] = (C.dungeons[key] || 0) + 1; logLine(`<b class="lvup">「${hard ? '困难 · ' : ''}${D.name}」走通了！</b>`, 'sys'); bigFlash((hard ? '困难 · ' : '') + D.name + ' · 通关', 'relic');
  if (hard) { addItem('baoyao', 3); addItem('lingyao', 3); gainExp(BAL.expNext(C.lv) * 0.6); if (firstHard) { const left = Object.keys(RELICS).filter(k => !(C.relics || {})[k]); if (left.length) gainRelic(pick(left)); } }
  STATE.dungeon = null; save(); refresh(); bannerDraw(); setTimeout(storyPoll, 300);
}
async function dungeonEvent(k, D) {
  if (k === 'thunder') { const c = await dlgChoose([{ t: '伸手去抓那道雷（雷道熟练度 +20，会挨一下狠的）' }, { t: '绕过去' }], '紫色的雷光就在一步之外，嗡嗡作响。');
    if (c === 0) { const s = charStats(); C.hp = Math.max(1, C.hp - s.hpMax * 0.3); if (C.sk.includes('lei')) { for (let i = 0; i < 20; i++) profUse('lei'); logLine('你被劈得浑身焦黑，可雷光里的纹路，你看得更清了。雷道熟练度 +20。', 'enc'); } else { logLine('你被劈得浑身焦黑，什么也没悟出来。', 'enc'); addItem('lingyao'); } refresh(); } }
  if (k === 'jars') { const c = await dlgChoose([{ t: '撬开陶罐看看' }, { t: '别碰死人的东西' }], '坑边的陶罐封得严严实实。'); if (c === 0) { if (chance(0.65)) { logLine('罐子里是封了不知多少年的药，药香还没散。', 'enc'); addItem('baoyao'); addItem('lingyao', 2); } else { logLine('罐子里“嗡”地飞出一群墓穴蝠！', 'enc'); await startBattle({ mobs: [['tombbat', D.lv], ['tombbat', D.lv]], title: '墓穴蝠', flee: false }); } } }
  if (k === 'runes') { const c = await dlgChoose([{ t: '照着骨文的路子，一点点拆开符文网' }, { t: '硬闯过去' }], '肋骨之间的符文网一明一暗，像在呼吸。'); if (c === 0 && C.gf.includes('guwen')) { logLine('族长教的骨文派上了用场，符文网在你手里一根根松开。网后面躺着一株灵药。', 'enc'); addItem('lingyao', 2); addItem('baoyao'); } else { logLine('符文网一亮，打得你浑身发麻。', 'enc'); const s = charStats(); C.hp = Math.max(1, C.hp - s.hpMax * 0.25); refresh(); } }
}

/* ---------- roaming 凶兽首领 (one at a time, in a wild place you can already reach) ---------- */
let ROAM = null;
function roamTick() {
  if (!C || NETROLE === 'guest') return; const slot = Math.floor(now() / (BAL.bossEvery * 60000));
  if (!ROAM || ROAM.slot !== slot) { const wild = Object.values(PLACES).filter(p => p.mobs && p.lv && placeOpen(p.id) && !p.dungeon); if (!wild.length) return; const r = srng('roam' + slot), P = wild[Math.floor(r() * wild.length)], id = ROAMERS[slot % ROAMERS.length];
    const lv = clamp(Math.max(P.lv[1] + 2, C.lv), 3, 22), E = BAL.enemy(lv), hp = Math.round(E.hp * MOBS[id].mul.hp); const start = slot * BAL.bossEvery * 60000;
    ROAM = { id, loc: P.id, lv, slot, hpMax: hp, hp, start, end: start + BAL.bossOpen * 60000, dead: false, told: false };
    if (store.get('roamDead', 0) === slot) ROAM.dead = true; }
  if (!ROAM.told && !ROAM.dead && now() < ROAM.end) { ROAM.told = true; npcRumor(`听说<b>${PLACES[ROAM.loc].name}</b>那边来了一头<b>${MOBS[ROAM.id].name}</b>，凶得很。`); }
}
async function fightRoam() { if (!ROAM || ROAM.dead) return; const yx = C.story.f.yunxiHelp && PLACES[ROAM.loc].area === 'baiduan'; if (yx) logLine('一道白影落在你身边——云曦来了。', 'sys');
  const r = await startBattle({ mobs: [[ROAM.id, ROAM.lv]], allies: yx ? ['a_yunxi'] : [], title: `凶兽首领 · ${MOBS[ROAM.id].name}`, flee: true, roam: { hpMax: ROAM.hpMax, hp: ROAM.hp } });
  if (r && r.win) { ROAM.dead = true; store.set('roamDead', ROAM.slot); logLine(`你打跑了${MOBS[ROAM.id].name}！`, 'sys'); addItem('baoyao'); } refresh(); }
function roamRound(B) { if (!ROAM) return; ROAM.hp = Math.max(0, ROAM.hpMax - (ROAM.hpMax - ROAM.hp) - (B.roamDmg || 0)); B.roamDmg = 0; const b = B.units.find(u => u.side === 1); if (b) ROAM.hp = Math.max(0, b.hp); }
