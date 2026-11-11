/* ================= title & boot ================= */
function toTitle() {
  if (C && NETROLE !== 'guest') save(true); STATE.mode = 'title'; closeModal(); UI.nav = null; $('title').style.display = 'flex'; titleDraw(); musicMode();
  const sv = loadSave(); const hub = HUB ? `<button class="hub" onclick="hubBack2(this)">‹ 游戏厅</button>` : '';
  $('tbx').innerHTML = `${hub}<h1>完美世界</h1><div class="sub">石昊篇 · 文字版</div>
    <div class="btns">${sv ? `<button class="big" onclick="enterGame()">继续<br><span style="font-size:13px;font-weight:400">${realmOf(sv.lv).name} · 第 ${sv.lv} 层 · ${esc(MAIN[sv.story.q].title)}</span></button><button class="big sec" onclick="newGame(this)">从头开始</button>` : `<button class="big" onclick="newGame()">开始</button>`}
    <div class="join"><input id="tjoin" class="namein" maxlength="4" placeholder="朋友的房间码"><button class="big sec" style="min-width:0" onclick="netJoin($('tjoin').value)">加入</button></div><div id="tstat" class="warn" style="font-size:13px"></div></div>
    <div class="note">你是石村的小不点。<br>根据辰东《完美世界》改编：石村 → 出村 → 补天阁 → 百断山。<br>朋友有存档码？开始后在 ⚙️ 设置里读取。</div>`;
}
function titleStatus(t) { const e = document.getElementById('tstat'); if (e) e.textContent = t || ''; }
function hubBack2(b) { if (!b.dataset.arm) { b.dataset.arm = 1; b.textContent = '再点一次确认'; setTimeout(() => { b.dataset.arm = ''; b.textContent = '‹ 游戏厅'; }, 3000); return; } location.href = '../'; }
function newGame(b) { if (b && !b.dataset.arm) { b.dataset.arm = 1; b.textContent = '再点一次（会清掉现在的存档）'; return; } audioInit(); C = newChar(); fullHeal(); JOURNAL = []; saveJournal(); save(true); enterGame(true); }
function enterGame(fresh) {
  audioInit(); if (!fresh) C = loadSave(); if (!C) return newGame(); fixHp(); arenaDaily();
  STATE.mode = 'play'; $('title').style.display = 'none'; $('log').innerHTML = ''; UI.nav = null; UI.memo = null; bannerKey = ''; layout();
  if (fresh) logLine('<div class="lochead">完美世界</div>大荒，八百万里群山，凶兽横行。群山之间，有一个叫石村的小村子。', 'loc'); else { describe(); logLine('欢迎回来，小不点。', 'dim'); }
  refresh(); bannerDraw(); musicMode(); setTimeout(storyPoll, 600);
}
setInterval(() => { if (STATE.mode !== 'play' || !C) return; try { roamTick(); npcTick(); } catch (e) { console.error(e); } }, 1000);
setInterval(() => { if (STATE.mode === 'play' && C && !STATE.battle && !DLG) { renderTop(); if (UI.night !== isNight()) { UI.night = isNight(); bannerDraw(); refresh(); } } }, 5000);
addEventListener('pointerdown', () => { audioInit(); musicMode(); }, { once: true });
document.addEventListener('visibilitychange', () => { if (document.hidden && C) save(true); });
addEventListener('pagehide', () => { if (C) save(true); });
layout(); toTitle();
/* ---------- test hooks ---------- */
if (window.__dbg) { Object.defineProperties(window.__dbg, { C: { get: () => C }, STATE: { get: () => STATE }, NET: { get: () => NET }, ROAM: { get: () => ROAM }, DLG: { get: () => DLG }, NETROLE: { get: () => NETROLE } });
  Object.assign(window.__dbg, { MAIN, PLACES, go, explore, startBattle, battleAct, curQ, questComplete, storyPoll, enterDungeon, autoWalk, newChar, enterGame, save, refresh, openModal, closeModal, gainExp, addItem, npcTalk, questTalkOptions,
    arenaFight, arenaOpponents, useItem, fightRoam, feedPet, setPet, netHost, netJoin, takeControl, dlgPick, CMDS, runeTap, runeSkip, arenaClaim, arenaMilestones, exportCode, importCode, wildEventFor, runWild, storyEvents, WILD, EVENTS, navTo, ready: true });
  Object.defineProperty(window.__dbg, 'JOURNAL', { get: () => JOURNAL }); }
