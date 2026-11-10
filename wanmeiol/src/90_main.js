/* ================= title, character creation, boot ================= */
function toTitle() {
  if (C) save(true); STATE.mode = 'title'; closeModal(); $('title').style.display = 'flex'; titleDraw();
  const sv = loadSave(); const hub = HUB ? `<button class="hub" onclick="hubBack2(this)">‹ 游戏厅</button>` : '';
  $('tbx').innerHTML = `${hub}<h1>完美世界<small>OL</small></h1><div class="sub">文字版 · ${SERVER} · 在线 ${fmt(onlineCount())} 人</div>
    <div class="btns">${sv ? `<button class="big" onclick="enterGame()">进入游戏<br><span style="font-size:13px;font-weight:400">${esc(sv.name)} · ${CLASSES[sv.cls].name} · Lv${sv.lv}</span></button>` : `<button class="big" onclick="createUI()">创建角色</button>`}
    ${sv ? `<button class="big sec" onclick="createUI()">新建角色（会覆盖存档）</button>` : ''}</div>
    <div class="note">根据辰东《完美世界》改编的文字网游。手写剧情：石村 → 大荒 → 石国边城 → 补天阁。<br>世界频道、组队、公会、交易行、强化、世界首领、虚神界排名；也可以和朋友真人联机组队。</div>`;
}
function hubBack2(b) { if (!b.dataset.arm) { b.dataset.arm = 1; b.textContent = '再点一次确认'; setTimeout(() => { b.dataset.arm = ''; b.textContent = '‹ 游戏厅'; }, 3000); return; } location.href = '../'; }
let NEWCLS = 'kunpeng';
function createUI() {
  audioInit(); const sv = loadSave();
  $('tbx').innerHTML = `<h1 style="font-size:52px">创建角色</h1><div class="sub">选择你的宝术传承</div>
    <div class="clsrow">${Object.entries(CLASSES).map(([k, K]) => `<div class="clsc ${k === NEWCLS ? 'on' : ''}" onclick="NEWCLS='${k}';createUI2()"><div class="i">${K.icon}</div><div class="n">${K.name}</div><div class="r">${K.role}</div><p>${K.desc}</p></div>`).join('')}</div>
    <input class="namein" id="nm" maxlength="8" placeholder="给自己起个名字（最多 8 个字）" value="${esc(UI.newName || '')}">
    <div class="btns" style="margin-top:12px"><button class="big" onclick="createGo()">进入大荒</button><button class="big sec" onclick="toTitle()">返回</button></div>${sv ? '<div class="note warn">注意：会覆盖现有角色 ' + esc(sv.name) + '。</div>' : ''}`;
  $('nm').oninput = e => UI.newName = e.target.value;
}
function createUI2() { UI.newName = $('nm').value; sfx('click'); createUI(); }
function createGo() {
  const n = ($('nm').value || '').trim().replace(/[<>&"]/g, ''); if (!n) { toast('起个名字吧'); return; } if (FAKE_NAMES.includes(n)) { toast('这个名字已经被人用了'); return; }
  C = newChar(n.slice(0, 8), NEWCLS); fullHeal(); C.mail.push({ id: uid(), t: now(), from: '系统', title: '开服礼包', body: `欢迎来到${SERVER}！这是给新人的一点心意。`, items: [['gift', 1]], gold: 100, read: false, got: false });
  C.mail.push({ id: uid(), t: now(), from: '系统', title: '欢迎', body: '每天记得签到、做悬赏；世界首领每 15 分钟刷新一只。遇到问题可以在世界频道问问别的玩家。', read: false, got: true });
  save(true); enterGame(true);
}
function enterGame(fresh) {
  audioInit(); if (!fresh) C = loadSave(); if (!C) return createUI(); genFakes(); fixHp();
  // offline progress: market sales while away
  if (C.savedAt) { const mins = Math.min(600, Math.floor((now() - C.savedAt) / 60000)); if (mins > 0) marketTick(mins); }
  STATE.mode = 'play'; $('title').style.display = 'none'; $('log').innerHTML = ''; dailyCheck(); layout();
  sysMsg(`欢迎来到 <b>${SERVER}</b>！当前在线 ${fmt(onlineCount())} 人。`); for (let i = 0; i < 4; i++) fakeSay('world');
  if (fresh) logLine('<div class="lochead">完美世界OL</div>大荒，八百万里群山，凶兽横行。一个少年在一座小石村醒来……', 'loc'); else describe();
  refresh(); bannerDraw(); setTimeout(storyPoll, 600);
  if (!fresh) logLine(`欢迎回来，${esc(C.name)}。`, 'dim');
}
setInterval(() => { try { ambientTick(); } catch (e) { console.error(e); } if (STATE.mode === 'play' && C && !STATE.battle && !DLG) { const t = now(); if (!UI.topT || t - UI.topT > 5000) { UI.topT = t; renderTop(); if (UI.layout !== 'narrow' || UI.sgroup) renderSides(true); } } }, 1000);
addEventListener('pointerdown', audioInit, { once: true });
document.addEventListener('visibilitychange', () => { if (document.hidden && C) save(true); });
addEventListener('pagehide', () => { if (C) save(true); });
layout(); toTitle();
/* ---------- test hooks ---------- */
if (window.__dbg) { Object.defineProperties(window.__dbg, { C: { get: () => C }, STATE: { get: () => STATE }, NET: { get: () => NET }, WB: { get: () => WB, set: v => { WB = v; } }, DLG: { get: () => DLG }, NETROLE: { get: () => NETROLE } }); Object.assign(window.__dbg, {
  MAIN, PLACES, go, explore, startBattle, battleAct, curQ, questComplete, storyPoll, enterDungeon, autoWalk, newChar, enterGame, save, refresh, openModal, closeModal, sendChat, gainExp, breakthrough, addItem, fakesAt, inviteFake, FAKES: () => FAKES, netHost, netJoin, MYID: () => MYID, CHAT, npcTalk, questTalkOptions, subComplete,
  arenaFight, arenaOpponents, bountyClaim, SIDE, sideDone, enhance, marketList, marketBuy, signIn, claimMail, useItem, fightWB, wbForSlot, wbSlot, joinGuild, ready: true }); }
