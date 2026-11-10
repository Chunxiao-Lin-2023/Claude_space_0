/* ================= playing: moving, exploring, battles (local or host-run), dungeons ================= */
function go(loc, silent, force) {
  if (!PLACES[loc]) return; if (!force && (STATE.battle || STATE.scene || STATE.dungeon)) { toast(STATE.battle ? '战斗中不能离开' : '先把眼前的事处理完'); return; }
  const from = C.loc; C.loc = loc; const P = PLACES[loc]; C.seen[loc] = 1; if (P.town && P.area !== 'butian' || loc === 'bt_outer') C.home = loc === 'sc_willow' || loc === 'sc_chief' ? 'sc_street' : loc;
  sfx('step'); if (!silent) describe(); save(); netPub(); refresh(); bannerDraw();
  if (NETROLE === 'host' && !STATE.followLock) netBroadcast({ t: 'lead', loc, from });
  if (!force) setTimeout(() => storyArrive(loc), 120);
}
function describe() {
  const P = PLACES[C.loc], night = isNight(); const A = AREAS[P.area];
  logLine(`<div class="lochead">${P.name}<span>${A.name}${P.lv ? ` · ${P.lv[0]}-${P.lv[1]} 级` : P.town ? ' · 安全区' : ''}</span></div>${night ? P.night || P.desc : P.desc}`, 'loc');
  const fk = fakesAt(C.loc); const real = netHumans().filter(h => h.loc === C.loc);
  if (fk.length || real.length) logLine('这里的玩家：' + real.map(h => `<span class="pname real">★${esc(h.name)}</span>`).concat(fk.slice(0, 4).map(x => `<span class="pname" style="color:${CLASSES[x.f.cls].color}">${esc(x.f.name)}</span><span class="dim">（${x.act}）</span>`)).join('　'), 'dim');
  if (WB && !WB.dead && WB.loc === C.loc && now() < WB.end && now() >= WB.start) logLine(`<b class="warn">世界首领 ${MOBS[WB.id].name} 就在这里！</b>`, 'sys');
}
const isNight = () => { const h = new Date().getHours(); return h >= 19 || h < 6; };
function storyArrive(loc) { if (!C || STATE.scene || STATE.battle || STATE.dungeon) return; const q = curQ();
  if (q.type === 'enter' && q.loc === loc) return questComplete(q);
  if (q.onEnter && q.onEnter.loc === loc && !C.story.f['en_' + q.id]) { C.story.f['en_' + q.id] = 1; return runScene(q.onEnter.scene); }
  if (q.type === 'multi') for (const s of q.subs) if (s.type === 'enter' && s.loc === loc && !(C.story.subs || {})[s.k]) return subComplete(q, s);
}
/* route finding for 自动寻路 */
function route(from, to) { if (from === to) return [from]; const prev = { [from]: null }, Q = [from];
  while (Q.length) { const a = Q.shift(); for (const b of Object.values(exitsOf(a))) { if (b in prev) continue; prev[b] = a; if (b === to) { const p = [b]; let c = a; while (c) { p.unshift(c); c = prev[c]; } return p; } Q.push(b); } } return null; }
function exitsOf(loc) { const P = PLACES[loc], ex = Object.assign({}, P.exits); if (loc === 'bc_portal' && (C.story.f.inSect || C.story.q > MAIN.findIndex(q => q.id === 'q_portal'))) ex.u = 'bt_gate'; return ex; }
let walking = null;
async function autoWalk(to) {
  if (STATE.battle || STATE.scene || STATE.dungeon) return; const path = route(C.loc, to); if (!path) { toast('那里暂时去不了'); return; }
  const id = walking = uid(); logLine(`<span class="dim">自动寻路 → ${PLACES[to].name}（${path.length - 1} 步）</span>`, 'dim');
  for (let i = 1; i < path.length; i++) { await sleep(SET.fast ? 120 : 380); if (walking !== id || STATE.battle || STATE.scene) return; go(path[i], i < path.length - 1); }
  walking = null;
}
/* ---------- explore ---------- */
let exploreT = 0;
const FLAVOR = ['草丛里窸窸窣窣地响了一阵。', '你拨开一丛灌木——', '一阵腥风扑面而来。', '脚下的落叶突然动了一下。', '远处传来一声低吼，越来越近。'];
async function explore() {
  if (STATE.battle || STATE.scene || STATE.dungeon || now() < exploreT) return; exploreT = now() + (window.__dbg && __dbg.noCD ? 0 : 700); const P = PLACES[C.loc]; if (!P.mobs) return;
  if (C.hp < charStats().hpMax * 0.15) { toast('气血太低了，先恢复一下'); return; }
  const r = Math.random();
  if (r < 0.62) {
    const team = 1 + partyBots().length + partnersHere().length; const n = clamp(wpick([{ v: 1, w: 6 }, { v: 2, w: 3 }, { v: 3, w: 1 }]).v + (team > 2 ? 1 : 0), 1, 4);
    const mobs = []; for (let i = 0; i < n; i++) { const id = wpick(P.mobs, x => x[1])[0]; mobs.push([id, clamp(rint(P.lv[0], P.lv[1]), 1, 30)]); }
    logLine(pick(FLAVOR) + mobs.map(m => MOBS[m[0]].name).join('、') + '出现了！', 'enc');
    await startBattle({ mobs, title: `${P.name} · 遭遇`, flee: true });
  } else if (r < 0.88 && P.gather) {
    let got = false; for (const [id, p] of P.gather) if (Math.random() < p) { addItem(id, 1); got = true; } if (!got) logLine('你四下找了找，什么也没发现。', 'dim'); sfx('step');
  } else {
    const ev = rint(0, 4);
    if (ev === 0) { const g = rint(5, 15) + C.lv * 3; logLine('你在一具早已风干的兽骨旁，捡到一个破旧的钱袋。', 'enc'); addGold(g); }
    else if (ev === 1) { const f = pick(fakesAt(C.loc).map(x => x.f).concat(FAKES.slice(0, 5))); logLine(`<span class="pname">${esc(f.name)}</span> 从你身边狂奔而过，后面追着一群${P.mobs ? MOBS[P.mobs[0][0]].name : '野兽'}……`, 'enc'); if (chance(0.5)) setTimeout(() => chatPush('near', f.name, pick(['救命啊！！', '别看了快帮忙', '我没事我没事', '这怪怎么这么疼'])), 600); }
    else if (ev === 2) { logLine('你在一块大石下面歇了口气。', 'enc'); const s = charStats(); C.hp = Math.min(s.hpMax, C.hp + s.hpMax * 0.15); C.mp = Math.min(s.mpMax, C.mp + s.mpMax * 0.15); }
    else if (ev === 3) { logLine('你发现了一株长得很好的药草。', 'enc'); addItem(chance(0.3) ? 'lingyao' : 'herb'); }
    else { logLine('四周很安静，只有风吹过树梢的声音。', 'dim'); }
    save(); refresh();
  }
}
function rest() { const P = PLACES[C.loc]; fullHeal(); sfx('heal'); logLine(P.area === 'biancheng' ? '你在客栈要了间上房，美美地睡了一觉。气血、符力已回满。' : C.loc === 'sc_willow' ? '你在柳树下坐了一会儿，一缕神光拂过，伤口都不疼了。' : '你歇了好一会儿，气血、符力已回满。', 'dim'); save(); refresh(); }
async function train() { await startBattle({ mobs: [['dummy', Math.max(1, C.lv)]], title: '木人桩切磋', noLose: true, flee: true, solo: true }); }

/* ---------- battle controller ---------- */
const AUTH = {}; // battles this client is authoritative for: id → { B, res }
function partnersHere() { return netHumans().filter(h => h.loc === C.loc && !h.busy); }
function startBattle(spec) {
  return new Promise(res => {
    spec = Object.assign({ loc: C.loc }, spec); if (!spec.arena && !spec.bots) spec.bots = partyBots();
    const others = spec.solo || spec.arena ? [] : partnersHere();
    if (NETROLE === 'guest' && (others.length || spec.world)) { STATE.battleRes = res; STATE.busy = true; netSend({ t: 'bstart', spec }); netPub(); return; }
    const humans = [{ c: C, pid: MYID }]; for (const h of others) humans.push({ c: h, pid: h.pid, stats: h.stats });
    const B = battleCreate(spec, humans); AUTH[B.id] = { B, res }; STATE.battleRes = res; STATE.battle = B; STATE.busy = true; netPub();
    if (B.world) { B.dmgBy = {}; } battlePush(B);
  });
}
function hostStartFor(pid, spec) { // a guest asked to fight with everyone here
  const asker = NET.roster[pid]; if (!asker) return; const humans = [{ c: asker, pid, stats: asker.stats }];
  for (const h of [{ ...myPub(), pid: MYID }, ...netHumans()]) if (h.pid !== pid && h.loc === asker.loc && !h.busy && !(h.pid === MYID && (STATE.battle || STATE.scene))) humans.push(h.pid === MYID ? { c: C, pid: MYID } : { c: h, pid: h.pid, stats: h.stats });
  spec.bots = (spec.bots || []).concat(); const B = battleCreate(spec, humans); AUTH[B.id] = { B, res: null };
  if (humans.some(h => h.pid === MYID)) { STATE.battle = B; STATE.busy = true; STATE.battleRes = null; netPub(); logLine('队友遇敌，你加入了战斗！', 'enc'); }
  battlePush(B);
}
function battleAct(act) { // my unit's choice
  const B = STATE.battle; if (!B || B.over) return; const u = B.units.find(x => x.kind === 'pc' && x.pid === MYID); if (!u || !u.alive) return;
  if (act.item && !useItem(act.item, true)) return;
  if (AUTH[B.id]) battleInput(B, u.id, act); else netSend({ t: 'bact', bid: B.id, uid: u.id, act, seq: B.seq });
  STATE.myActed = B.seq; refresh();
}
function battleInput(B, uidd, act) { if (B.over) return; B.acts[uidd] = act; if (!needInput(B).length) { battleResolve(B); battlePush(B); } else battlePush(B, true); }
function battleTimeout() { for (const k in AUTH) { const B = AUTH[k].B; if (!B.over && B.deadline && now() > B.deadline) { for (const u of needInput(B)) B.acts[u.id] = botAct(B, u); battleResolve(B); battlePush(B); } } }
function battlePush(B, quiet) { // send state to every human in it and render mine
  for (const u of humansIn(B)) if (u.pid !== MYID) netSendTo(u.pid, { t: 'b', B });
  if (STATE.battle && STATE.battle.id === B.id) { STATE.battle = B; renderBattle(quiet); }
  if (B.over) battleFinish(B);
}
function battleFinish(B) {
  if (B.done) return; B.done = true; const R = B.win ? battleRewards(B) : {};
  for (const u of humansIn(B)) { const r = Object.assign({ win: B.win, fled: !!B.fled, hp: u.hp, mp: u.mp, alive: u.alive, kills: B.kills, noLose: B.noLose, boss: B.room != null && B.dungeon && DUNGEONS[B.dungeon].rooms[B.room]?.boss ? B.dungeon : null, world: !!B.world }, R[u.pid] || {});
    if (u.pid === MYID) setTimeout(() => battleApply(r, B), window.__dbg && __dbg.instant ? 0 : 450); else netSendTo(u.pid, { t: 'bend', bid: B.id, r }); }
  delete AUTH[B.id];
}
function battleApply(r, B) { // every client applies its own result
  const s = charStats(); C.hp = clamp(Math.round(r.hp), 0, s.hpMax); C.mp = clamp(Math.round(r.mp), 0, s.mpMax);
  if (r.win) { sfx('win'); for (const [id, , boss] of r.kills || []) { C.kills[id] = (C.kills[id] || 0) + 1; C.stats.kills++; if (boss) C.stats.bosses++; storyKill(id); }
    if (r.exp) gainExp(r.exp); if (r.gold) addGold(r.gold); for (const it of r.items || []) addItem(it, 1); for (const e of r.eqs || []) addEquip(e);
    if (r.boss) { storyDungeon(r.boss); } if (C.hp <= 0) C.hp = 1; }
  else if (r.fled) { logLine('你逃了出来。', 'dim'); }
  else { sfx('lose'); C.stats.deaths++;
    if (r.noLose) { C.hp = Math.max(C.hp, Math.round(s.hpMax * 0.3)); }
    else { const loss = Math.round(BAL.expNext(C.lv) * BAL.deathExpLoss); C.exp = Math.max(0, C.exp - loss); C.hp = Math.round(s.hpMax * 0.3); C.mp = Math.round(s.mpMax * 0.3);
      logLine(`你倒下了……醒来时已经回到了${PLACES[C.home].name}。<span class="dim">（损失 ${loss} 经验）</span>`, 'sys'); if (STATE.dungeon) STATE.dungeon.failed = true; setTimeout(() => go(C.home, false, true), 300); } }
  STATE.battle = null; STATE.busy = false; STATE.lastBattle = B; netPub(); save(); refresh(); battleEndUI(r);
  const res = STATE.battleRes; STATE.battleRes = null; if (res) res(r);
}

/* ---------- dungeons ---------- */
async function enterDungeon(id) {
  const D = DUNGEONS[id]; if (STATE.battle || STATE.scene || STATE.dungeon) return; if (C.lv < D.lv - 3) { toast(`太危险了（建议 ${D.lv} 级）`); return; }
  if (!STATE.party.length && !partnersHere().length) { STATE.scene = 'match'; const c = await dungeonChoice(['一键匹配队友（推荐）', '单人挑战', '算了']); STATE.scene = null; if (c === 2) { refresh(); return; } if (c === 0) autoMatch(2); }
  STATE.dungeon = { id, room: 0, failed: false }; netPub(); logLine(`<div class="lochead">副本 · ${D.name}<span>${D.rec}</span></div>`, 'loc'); refresh();
  for (let i = 0; i < D.rooms.length; i++) {
    const R = D.rooms[i]; STATE.dungeon.room = i; refresh(); logLine(`<b>【${R.name}】</b>${R.text}`, 'enc'); await sleep(SET.fast ? 100 : 500);
    if (R.mobs) { const r = await startBattle({ mobs: R.mobs.map(m => [m, R.boss ? D.lv : Math.max(1, D.lv - 1 - (R.mobs.length > 2 ? 1 : 0))]), title: `${D.name} · ${R.name}`, flee: !R.boss, dungeon: id, room: i });
      if (!r || !r.win) { if (r && r.fled) logLine('你退出了副本。', 'dim'); STATE.dungeon = null; netPub(); refresh(); return; } }
    else if (R.event) await dungeonEvent(R.event, D);
    if (i < D.rooms.length - 1) { const c = await dungeonChoice(['原地调息，再继续深入（恢复 40% 气血和符力）', '直接继续深入', '退出副本']);
      if (c === 0) { const s = charStats(); C.hp = Math.min(s.hpMax, C.hp + s.hpMax * 0.4); C.mp = Math.min(s.mpMax, C.mp + s.mpMax * 0.4); logLine('你靠着石壁调息了一会儿。', 'dim'); refresh(); }
      if (c === 2) { STATE.dungeon = null; netPub(); refresh(); return; } }
  }
  C.dungeons[id] = (C.dungeons[id] || 0) + 1; logLine(`<b class="lvup">副本「${D.name}」通关！</b>`, 'sys');
  if (C.dungeons[id] === 1) { addGold(D.first.gold); for (const [k, n] of D.first.items) addItem(k, n); logLine('（首次通关奖励）', 'dim'); }
  STATE.dungeon = null; netPub(); save(); refresh(); setTimeout(storyPoll, 300);
}
async function dungeonEvent(k, D) {
  if (k === 'bones') { const c = await dungeonChoice(['翻一翻骨堆', '别碰，绕过去']); if (c === 0) { if (chance(0.6)) { logLine('骨堆里埋着一个猎人的皮囊，里面还有些东西。', 'enc'); addItem('herb', 2); addGold(40); if (chance(0.4)) addEquip(rollEquip(D.lv, 0.4, 1)); } else { logLine('骨堆里钻出一条青鳞蛇！', 'enc'); await startBattle({ mobs: [['snake', D.lv]], title: '骨堆里的蛇', flee: false, dungeon: D.id }); } } }
  if (k === 'chest') { const c = await dungeonChoice(['撬开铜匣', '不动它']); if (c === 0) { if (chance(0.7)) { logLine('铜匣里躺着一件古旧的宝物，被符文封得好好的。', 'enc'); addEquip(rollEquip(D.lv, 0.8, 2)); addItem('soulshard', 1); } else { logLine('铜匣上的符文一亮——是陷阱！', 'enc'); const s = charStats(); C.hp = Math.max(1, C.hp - s.hpMax * 0.25); refresh(); } } }
}
const dungeonChoice = opts => dlgChoose(opts.map(t => ({ t })));
