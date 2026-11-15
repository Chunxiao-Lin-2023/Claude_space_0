/* ================= 双人同屏（第十七轮，RULES 34） =================
   百物语的做法：两台设备用房间码连上，两人看同一个画面、共用陈歌；同一时刻只有一人操作，另一人可以请求接手（操作者同意后交换）。
   房主的游戏是唯一的“真”游戏：队友的点击发给房主执行，房主的状态（存档、对话、小剧场、小游戏、鬼屋）镜像回去。
   完美世界文字版的做法：谁按了哪个按钮，两边屏幕上那个按钮都亮起来并标出“房主/队友点了……”，停一下再往下走。
   白天接待：房主扮陈歌，队友操作一名站岗员工（47_house 的 st.p2）。夜晚任务：两边各开一个夜晚 iframe，百物语引擎自己的联机消息由这里转发（57_night）。 */
let NETROLE = null, MYID = 'local';
const NQS = new URLSearchParams(location.search);
const inArtifact = () => !!window.__ARTIFACT__ || /(^|\.)(claudeusercontent\.com|claude\.ai|claude\.site)$/.test(location.hostname);
const PEER_SRC = ['https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js'];
const PEER_ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }, { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' }] };
const PEER_OPTS = NQS.get('peerhost') ? { host: NQS.get('peerhost'), port: +(NQS.get('peerport') || 9000), path: NQS.get('peerpath') || '/', secure: NQS.get('peersecure') === '1' } : { config: PEER_ICE, pingInterval: 4000 };
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length: 4 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join('');
const NET = { peer: null, conn: null, conns: new Map(), code: '', ctrl: 'host', req: null, tok: 0, syncT: 0, last: '', lastStg: '', lastDlg: '', lastHs: '', lastMg: '', status: '', night: null };
function loadPeer() { return new Promise((res, rej) => { if (window.Peer) return res(); let i = 0; const next = () => { if (window.Peer) return res(); if (i >= PEER_SRC.length) return rej(new Error('load')); const sc = document.createElement('script'); sc.src = PEER_SRC[i++]; sc.onload = () => window.Peer ? res() : next(); sc.onerror = () => { sc.remove(); next(); }; document.head.appendChild(sc); }; next(); }); }
const raw = (c, o) => { try { if (c && c.open) c.send(typeof o === 'string' ? o : JSON.stringify(o)); } catch (e) { } };
const netUp = () => NETROLE === 'guest' ? !!(NET.conn && NET.conn.open) : NETROLE === 'host' && NET.conns.size > 0;
function netSend(o) { if (NETROLE === 'guest') raw(NET.conn, o); }
function netBroadcast(o) { if (NETROLE === 'host') { const s = typeof o === 'string' ? o : JSON.stringify(o); for (const c of NET.conns.values()) raw(c, s); } }
const myControl = () => !NETROLE || !netUp() || (NETROLE === 'host' ? NET.ctrl === 'host' : NET.ctrl === 'guest');
const whoName = w => w === 'host' ? '房主' : '队友';
function netErrText(t) { return ({ 'browser-incompatible': '这个浏览器不支持联机，换 Chrome / Safari / Edge 试试。', 'peer-unavailable': '没找到这个房间：检查房间码，确认房主停在游戏页面上。', 'network': '网络连不上联机服务器，稍后再试。', 'server-error': '联机服务器出错了，稍后再试。', timeout: '连接超时：检查房间码，或者让房主重新开房间。', load: '联机组件没有加载成功（网络被拦了？）' })[t] || ('联机出错：' + t); }
/* 存档里不能有函数、画布和环 */
function jsonSafe(o) { const seen = new WeakSet(); return JSON.stringify(o, (k, v) => { if (typeof v === 'function') return undefined; if (v && typeof v === 'object') { if (typeof HTMLElement !== 'undefined' && (v instanceof HTMLElement || (typeof HTMLCanvasElement !== 'undefined' && v instanceof HTMLCanvasElement))) return undefined; if (v instanceof Set || v instanceof Map) return undefined; if (seen.has(v)) return undefined; seen.add(v); } return v; }); }

/* ---------- 开房间 / 加入 / 离开 ---------- */
async function netHost() {
  if (inArtifact()) { toast('这个预览版不能联机，双人请打开游戏厅网址'); return; }
  try { await loadPeer(); } catch (e) { toast(netErrText('load')); return; }
  netLeave(true); NETROLE = 'host'; NET.ctrl = 'host'; NET.status = '正在开房间……'; const tok = ++NET.tok; coopRender();
  const open = () => { const code = genCode(), peer = new Peer('kongbuwu-' + code, PEER_OPTS); NET.peer = peer;
    peer.on('open', () => { if (tok !== NET.tok) return; NET.code = code; NET.status = '等队友输入房间码'; coopRender(); });
    peer.on('error', e => { if (tok !== NET.tok) return; if (e.type === 'unavailable-id') { try { peer.destroy(); } catch (x) { } open(); return; } NET.status = netErrText(e.type || String(e)); coopRender(); toast(NET.status); });
    peer.on('connection', c => {
      c.on('open', () => { if (NET.conns.size) { raw(c, { t: 'full' }); setTimeout(() => c.close(), 400); return; }   // 只接一位
        NET.conns.set(c.peer, c); NET.status = '队友已加入'; raw(c, { t: 'hello', code: NET.code, lobby: !C }); if (!C) raw(c, { t: 'lobby' }); NET.last = NET.lastStg = NET.lastDlg = NET.lastHs = NET.lastMg = ''; netSync(true); coopFxFull(c); toast('队友加入了'); sfx('ok'); coopRender(); });
      c.on('data', d => { try { hostRecv(JSON.parse(d), c); } catch (e) { console.error(e); } });
      c.on('close', () => { NET.conns.delete(c.peer); NET.ctrl = 'host'; NET.req = null; NET.status = '队友断开了'; if (HS && HS.staff) for (const s of HS.staff) s.p2 = false; toast('队友断开了，你可以继续单人玩'); coopRender(); });
    }); };
  open(); }
async function netJoin(code) {
  code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (code.length !== 4) { toast('房间码是 4 位'); return; }
  if (inArtifact()) { toast('这个预览版不能联机，双人请打开游戏厅网址'); return; }
  try { await loadPeer(); } catch (e) { toast(netErrText('load')); return; }
  if (C && !NETROLE) saveNow(); netLeave(true); NETROLE = 'guest'; NET.ctrl = 'host'; NET.status = '正在连接……'; const tok = ++NET.tok; coopRender();
  const peer = new Peer(undefined, PEER_OPTS); NET.peer = peer; const to = setTimeout(() => fail('timeout'), 15000);
  const fail = t => { if (tok !== NET.tok) return; clearTimeout(to); toast(netErrText(t)); NET.status = netErrText(t); netLeave(true); coopRender(); };
  peer.on('error', e => fail(e.type || String(e)));
  peer.on('open', id => { MYID = id; const c = peer.connect('kongbuwu-' + code, { reliable: true, serialization: 'raw' }); NET.conn = c;
    c.on('open', () => { if (tok !== NET.tok) return; clearTimeout(to); NET.code = code; NET.status = '已加入'; coopRender(); });
    c.on('data', d => { try { guestRecv(JSON.parse(d)); } catch (e) { console.error(e); } });
    c.on('close', () => { if (tok !== NET.tok || NETROLE !== 'guest') return; toast('和房主的连接断开了'); guestDrop(); }); }); }
function netLeave(quiet) {
  const was = NETROLE; try { if (was === 'guest') raw(NET.conn, { t: 'bye' }); netBroadcast({ t: 'bye' }); } catch (e) { } try { NET.peer && NET.peer.destroy(); } catch (e) { }
  NET.tok++; Object.assign(NET, { peer: null, conn: null, code: '', ctrl: 'host', req: null, status: '', night: null }); NET.conns.clear(); NETROLE = null; MYID = 'local';
  if (HS && HS.staff) for (const s of HS.staff) s.p2 = false;
  if (was === 'guest' && !quiet) guestDrop(); coopRender(); }
/* 房主在标题页（还没进存档 / 回了标题）：队友停在等待画面 */
function guestLobby() { NET.lobbyGo = true; try { NET.night && nightGuestClose(); if (STATE.house) { STATE.house = null; HS = null; hsClear(); } if (MG) { MG = null; STATE.mini = null; } STATE.scene = null; STATE.battle = null; STATE.busy = false; DLG.cur = null; DLG.res = null; NET.lastDlg = ''; $('#card').classList.remove('on'); $('#cine').className = ''; C = null; closeModal(); toTitle(); } finally { NET.lobbyGo = false; } coopRender(); }
function coopTitle() { const T = $('#title'); if (!T || !T.classList.contains('on')) return; let st = $('#tcoopst');
  if (!NETROLE) { if (st) st.remove(); const b = $('#tcoop'); if (b) b.textContent = '🔗 双人同屏'; return; }
  if (!st) { st = el('div', 'coopst', ''); st.id = 'tcoopst'; $('#tbtns').insertAdjacentElement('beforebegin', st); }
  const up = netUp(), code = NET.code || '……';
  if (NETROLE === 'host') { st.innerHTML = '🔗 房间 <b>' + code + '</b> · ' + (up ? '队友已加入，选一个存档开始（继续 / 开始 / 📂 存档）' : esc(NET.status || '等队友输入房间码')); const b = $('#tcoop'); if (b) b.textContent = '🔗 房间 ' + code; }
  else { st.innerHTML = '🔗 已加入房间 <b>' + code + '</b>'; const tb = $('#tbtns'); if (tb && !$('#tlobby')) tb.innerHTML = '<p id="tlobby" class="mini" style="text-align:center">等房主选存档……<br>房主进游戏后你这边会自动跟上</p><button class="btn tbtn" onclick="netLeave()">离开房间</button>'; } }
function guestDrop() { const was = NETROLE === 'guest'; NETROLE = null; try { NET.peer && NET.peer.destroy(); } catch (e) { } NET.conn = null; NET.night && nightGuestClose(); if (STATE.house) { STATE.house = null; HS = null; hsClear(); } if (MG) { MG = null; STATE.mini = null; } STATE.scene = null; STATE.battle = null; DLG.cur = null; C = null; coopRender(); if (was || true) { $('#title').classList.add('on'); toTitle(); } }

/* ---------- 房主：快照 ---------- */
function netSync(now) { if (NETROLE !== 'host' || !NET.conns.size) return; clearTimeout(NET.syncT); const go = () => { if (!C) return; const s = jsonSafe(coopSnap()); if (s !== NET.last || now) { NET.last = s; netBroadcast(s); } }; if (now) go(); else NET.syncT = setTimeout(go, 60); }
function coopSnap() { return { t: 'st', C, st: { scene: STATE.scene || null, battle: STATE.battle || null, busy: !!STATE.busy, live: STATE.live || null, house: !!STATE.house, mini: !!STATE.mini }, dlg: DLG.cur || null, feed: UI.feed.slice(-24), ctrl: NET.ctrl, req: NET.req }; }
function coopStg() { const o = {}; for (const k in STG) if (!['cache', 'full', 'remote'].includes(k)) o[k] = STG[k]; return o; }
setInterval(() => { if (NETROLE !== 'host' || !NET.conns.size || !C) return;
  netSync();
  if (STATE.scene) { const s = jsonSafe({ t: 'stg', s: coopStg() }); if (s !== NET.lastStg) { NET.lastStg = s; netBroadcast(s); } }
  if (STATE.mini && MG) { const g = Object.assign({}, MG); delete g.res; delete g.raf; const s = jsonSafe({ t: 'mg', g }); if (s !== NET.lastMg) { NET.lastMg = s; netBroadcast(s); } } else if (NET.lastMg) { NET.lastMg = ''; netBroadcast({ t: 'mg', g: null }); }
}, 110);
/* 鬼屋快照单独走得更勤（10 次/秒），不带地图（队友那边按 o.map 自己建） */
setInterval(() => { if (NETROLE !== 'host' || !NET.conns.size) return; const H = HS;
  if (!H || !STATE.house) { if (NET.lastHs) { NET.lastHs = ''; netBroadcast({ t: 'hs', h: null }); } return; }
  const o = {}; for (const k in H) if (!['M', 'raf', 'rule', 'B', 'focus', 'focusPt', 'cam'].includes(k)) o[k] = H[k];
  o.B = H.B ? { turn: H.B.turn, hero: H.B.hero ? { hp: H.B.hero.hp, mhp: H.B.hero.mhp } : null } : null; o.slots = H.M.slots.map(s => [s.k || '', Math.round((s.cd || 0) * 10) / 10]);
  o.vis = H.vis.map(v => Object.assign({}, v, { u: { key: v.u.key, n: v.u.n, hp: v.u.hp, mhp: v.u.mhp, boss: v.u.boss, st: v.u.st, trait: v.u.trait } }));
  o.staff = H.staff.map(s => Object.assign({}, s, { u: s.u ? { key: s.u.key, hp: s.u.hp } : null, force: null }));
  const s = jsonSafe({ t: 'hs', h: o }); if (s !== NET.lastHs) { NET.lastHs = s; netBroadcast(s); } }, 100);

/* ---------- 房主：收到队友 ---------- */
function hostRecv(m, c) {
  switch (m.t) {
    case 'cmd': if (NET.ctrl !== 'guest') { raw(c, { t: 'toast', s: '现在是房主在操作' }); return; } coopRun(m.fn, m.a || [], 'guest', m.tap); break;
    case 'adv': if (NET.ctrl !== 'guest') return; if (cineRes) cineTap(); else if (cardRes) cardTap(); else CMDS.dlgTap ? CMDS.dlgTap() : dlgTap(); break;
    case 'req': if (NET.ctrl === 'guest') return; NET.req = 'guest'; sfx('select'); coopRender(); netSync(true); break;
    case 'give': if (NET.ctrl === 'guest') { NET.ctrl = 'host'; NET.req = null; toast('队友把操作交给了你'); coopRender(); netSync(true); } break;
    case 'ans': if (NET.req === 'host') { if (m.y) { NET.ctrl = 'host'; toast('队友同意了，你来操作'); } else toast('队友暂时不想交出操作'); NET.req = null; coopRender(); netSync(true); } break;
    case 'hs': coopHsIn(m); break;
    case 'nt': nightRelayIn(m); break;
    case 'say': coopSay(m.s, 'guest'); netBroadcast({ t: 'say', s: m.s, who: 'guest' }); break;
    case 'bye': break;
  } }
/* ---------- 队友：收到房主 ---------- */
function guestRecv(m) {
  switch (m.t) {
    case 'hello': toast(m.lobby ? '已加入房间 ' + m.code + '：等房主选存档' : '已加入房间 ' + m.code + '：房主在操作，想接手就点上面的 🔗'); break;
    case 'lobby': guestLobby(); break;
    case 'full': toast('这个房间已经有队友了'); netLeave(); break;
    case 'st': guestApply(m); break;
    case 'stg': if (C) { Object.assign(STG, m.s); } break;
    case 'mg': guestMini(m.g); break;
    case 'hs': guestHouse(m.h); break;
    case 'fx': guestFx(m); break;
    case 'sfx': sfxRaw(m.n); break;
    case 'tap': coopShowTap(m); break;
    case 'toast': toast(m.s); break;
    case 'say': coopSay(m.s, m.who); break;
    case 'night': nightGuestOpen(m); break;
    case 'nt': nightRelayIn(m); break;
    case 'nightEnd': nightGuestClose(); break;
    case 'bye': toast('房主结束了联机'); guestDrop(); break;
  } }
function guestApply(m) {
  const first = !C; C = m.C; STATE.scene = m.st.scene; STATE.battle = m.st.battle; STATE.busy = m.st.busy; STATE.live = m.st.live; UI.feed = m.feed || []; NET.ctrl = m.ctrl; NET.req = m.req;
  if (first) { $('#title').classList.remove('on'); closeModal(); UI.tab = ''; applyFont(); }
  if (!m.st.house && STATE.house) { STATE.house = null; HS = null; hsClear(); }
  if (!m.st.mini && STATE.mini) { STATE.mini = null; MG = null; }
  const ds = JSON.stringify(m.dlg); if (ds !== NET.lastDlg) { NET.lastDlg = ds; DLG.cur = m.dlg; DLG.res = null; if (m.dlg) renderDlg(); }
  applyMode(); refresh(); coopRender(); }

/* ---------- 画面效果：房主那边播的，队友这边也播 ---------- */
const FXQ = [];
function coopFx(o) { if (NETROLE === 'host' && NET.conns.size) netBroadcast(Object.assign({ t: 'fx' }, o)); }
function coopFxFull(c) { if (cardRes) raw(c, { t: 'fx', f: 'card', html: $('#card').innerHTML }); if (cineRes) raw(c, { t: 'fx', f: 'cine', html: $('#cine').innerHTML, cls: $('#cine').className }); }
function guestFx(m) {
  if (m.f === 'card') { const c = $('#card'); c.innerHTML = m.html; c.classList.add('on'); }
  else if (m.f === 'cardoff') $('#card').classList.remove('on');
  else if (m.f === 'cine') { const c = $('#cine'); c.className = m.cls || 'on'; c.innerHTML = m.html; }
  else if (m.f === 'cineoff') $('#cine').className = '';
  else if (m.f === 'trans') stageTransition(m.s);
  else if (m.f === 'flash') flashRed();
  else if (m.f === 'stamp') fxStamp(m.s);
  else if (m.f === 'banner') fxBanner(m.s, m.c);
  else if (m.f === 'toast') toast(m.s); }
{ const W_ = (name, f) => { const o = window[name]; window[name] = function (...a) { if (NETROLE === 'host') f(a); return o.apply(this, a); }; };
  W_('showCard', a => setTimeout(() => coopFx({ f: 'card', html: $('#card').innerHTML }), 0));
  W_('cine', a => setTimeout(() => coopFx({ f: 'cine', html: $('#cine').innerHTML, cls: $('#cine').className }), 0));
  W_('stageTransition', a => coopFx({ f: 'trans', s: a[0] }));
  W_('flashRed', () => coopFx({ f: 'flash' }));
  W_('fxStamp', a => coopFx({ f: 'stamp', s: a[0] }));
  W_('fxBanner', a => coopFx({ f: 'banner', s: a[0], c: a[1] }));
  W_('toast', a => { if (!/^队友|^已把操作|^已请求接手|^现在是|预览版|房间码/.test(String(a[0]))) coopFx({ f: 'toast', s: a[0] }); });
  const oc = window.cardTap; window.cardTap = function () { const had = !!cardRes; const r = oc.apply(this, arguments); if (had && !cardRes) coopFx({ f: 'cardoff' }); return r; };
  const oi = window.cineTap; window.cineTap = function () { const had = !!cineRes; const r = oi.apply(this, arguments); if (had && !cineRes) coopFx({ f: 'cineoff' }); return r; };
  const os = window.sfx; window.sfx = function (n) { if (NETROLE === 'host' && NET.conns.size) { const t = performance.now(); if (t - (os._b && os._b[n] || 0) > 90) { (os._b = os._b || {})[n] = t; netBroadcast({ t: 'sfx', n }); } } return os.apply(this, arguments); };
  const sv = window.saveNow; window.saveNow = function () { if (NETROLE === 'guest') return; return sv.apply(this, arguments); };
  const sv2 = window.save; window.save = function () { if (NETROLE === 'guest') return; return sv2.apply(this, arguments); };
}

/* ---------- 点了什么，两边都亮一下（完美世界文字版的“选中停顿”） ---------- */
const NET_PICK_MS = 600;
const CMD_NAMES = ['go', 'travel', 'explore', 'camp', 'autoWalk', 'sleepBed', 'storyHereRun', 'questGo', 'npcTalk', 'dailyTake', 'dayRun', 'spinWheel', 'svMeet', 'buyItem', 'buyUpgrade', 'buyDevice', 'sellItem', 'equipGear', 'useItem', 'setPet', 'keepPet', 'toggleBar', 'pickPetMove', 'pickSkillFx', 'guardFx', 'sceneStrike',
  'battleAct', 'battleItem', 'battleUndo', 'battleEnd', 'selFoe', 'toggleAuto', 'dlgTap', 'dlgPick', 'cardTap', 'cineTap', 'miniTap', 'miniKey', 'miniRetry', 'miniGiveUp',
  'hsOpen', 'hsAct', 'hsDev', 'hsLight', 'hsLure', 'hsTape', 'hsAuto', 'hsQuit', 'hsClose', 'hsCosCycle', 'hsAutoLay', 'hsSetPick', 'hsPickClose', 'hsCancel', 'hsHideNear', 'hsPause'];
const NO_HOLD = ['dlgTap', 'cardTap', 'cineTap', 'miniTap', 'miniKey', 'battleUndo', 'toggleAuto', 'hsAct', 'hsDev', 'hsLight', 'hsLure', 'hsTape', 'hsHideNear', 'hsPause', 'hsSetPick', 'hsPickClose', 'hsCancel'];
const HOST_ONLY = ['hsOpen', 'hsAct', 'hsDev', 'hsLight', 'hsLure', 'hsTape', 'hsAuto', 'hsQuit', 'hsClose', 'hsCosCycle', 'hsAutoLay', 'hsSetPick', 'hsPickClose', 'hsCancel', 'hsHideNear'];   // 接待时陈歌和布置都归房主；队友管员工
const CMDS = {};
UI.inClick = false; const markClick = () => { UI.inClick = true; setTimeout(() => { UI.inClick = false; }, 0); };
document.addEventListener('click', markClick, true); document.addEventListener('keydown', markClick, true); document.addEventListener('pointerdown', markClick, true); document.addEventListener('pointerup', markClick, true);
document.addEventListener('pointerdown', e => { UI.tapEl = e.target.closest && e.target.closest('button,[onclick],.li,.chb'); UI.tapAt = Date.now(); }, true);
document.addEventListener('keydown', () => { UI.tapEl = null; }, true);
function tapLabel(e) { return e ? (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 18) : ''; }
function tapInfo() { const e = Date.now() - (UI.tapAt || 0) < 1500 ? UI.tapEl : null; return { oc: e ? e.getAttribute('onclick') || '' : '', label: tapLabel(e) }; }
const pickVis = x => x.offsetParent && x.getBoundingClientRect().width > 0;
function pickFind(p) { let e = p.oc ? [...document.querySelectorAll('[onclick]')].find(x => x.getAttribute('onclick') === p.oc && pickVis(x)) : null; if (!e && p.label) e = [...document.querySelectorAll('button,.li,.chb')].find(x => pickVis(x) && tapLabel(x).startsWith(p.label)); return e || null; }
function applyPick() { for (const x of document.querySelectorAll('.picked')) x.classList.remove('picked'); const p = UI.pick; if (!p) return null; if (Date.now() > p.until) { UI.pick = null; return null; } const e = pickFind(p); if (e) { e.classList.add('picked'); e.dataset.who = whoName(p.who); } return e; }
function coopShowTap(m) { if (!m.tap || (!m.tap.oc && !m.tap.label)) return; UI.pick = { oc: m.tap.oc, label: m.tap.label, who: m.who, until: Date.now() + NET_PICK_MS + 900 };
  for (const x of document.querySelectorAll('.taptag')) x.remove(); const tag = el('div', 'taptag', '👆 ' + esc(whoName(m.who) + '点了「' + (m.tap.label || '…') + '」')); document.body.appendChild(tag);
  const place = () => { const e = applyPick(); if (e) { const r = e.getBoundingClientRect(); tag.style.left = Math.max(6, Math.min(innerWidth - tag.offsetWidth - 6, r.left + r.width / 2 - tag.offsetWidth / 2)) + 'px'; tag.style.top = Math.max(6, r.top - tag.offsetHeight - 6) + 'px'; } else { tag.style.left = Math.max(6, innerWidth / 2 - tag.offsetWidth / 2) + 'px'; tag.style.top = '56px'; } };
  place(); const w = setInterval(place, 60); setTimeout(() => { clearInterval(w); tag.remove(); applyPick(); }, NET_PICK_MS + 900); }
/* 真正执行一条命令（房主这边）：别人在看就先亮一下再执行 */
function coopRun(fn, a, who, tap) {
  const f = CMDS[fn]; if (!f) return;
  if (NO_HOLD.includes(fn) || !NET.conns.size) return f.apply(window, a);
  const t = tap && (tap.oc || tap.label) ? tap : null;
  if (t) { netBroadcast({ t: 'tap', who, tap: t }); coopShowTap({ who, tap: t }); }
  UI.picking = true; setTimeout(() => { UI.picking = false; try { f.apply(window, a); } catch (e) { console.error(e); } netSync(); }, t ? NET_PICK_MS : 0); }
for (const fn of CMD_NAMES) { const orig = window[fn]; if (typeof orig !== 'function') continue; CMDS[fn] = orig;
  window[fn] = function (...a) {
    if (!NETROLE || !netUp() || NET.inRun) return orig.apply(this, a);
    if (!UI.inClick) return orig.apply(this, a);   // 剧本自己调用的，不拦
    if (NETROLE === 'host' && STATE.house && HOST_ONLY.includes(fn)) return orig.apply(this, a);
    if (NETROLE === 'guest' && STATE.house && HOST_ONLY.includes(fn)) { toast('接待时陈歌归房主，你管员工：方向键或点地面走，点游客 = 走过去放招'); return; }
    if (!myControl()) { toast('现在是' + whoName(NET.ctrl) + '在操作（点上面的 🔗 请求接手）'); return; }
    if (UI.picking) return;
    const tap = tapInfo(), args = (fn === 'dlgTap') ? [] : JSON.parse(JSON.stringify(a.filter(x => !(x && typeof x === 'object' && (x instanceof Event || x.nodeType)))));
    if (NETROLE === 'guest') { if (fn === 'dlgTap' || fn === 'cardTap' || fn === 'cineTap') { netSend({ t: 'adv' }); return; } if (!NO_HOLD.includes(fn) && tap.label) coopShowTap({ who: 'guest', tap }); netSend({ t: 'cmd', fn, a: args, tap }); return; }
    coopRun(fn, a, 'host', tap); }; }

/* ---------- 操作权：操作者交出 / 观看者请求（对方同意才换） ---------- */
function coopCtrl() {
  if (!NETROLE || !netUp()) { openModal('coop'); return; }
  const mine = myControl();
  if (NETROLE === 'host') { if (mine) { NET.ctrl = 'guest'; NET.req = null; toast('已把操作交给队友'); } else { NET.req = NET.req === 'host' ? null : 'host'; if (NET.req) toast('已请求接手，等队友同意'); } netSync(true); }
  else { if (mine) { netSend({ t: 'give' }); toast('已把操作交给房主'); } else { netSend({ t: 'req' }); toast('已请求接手，等房主同意'); } }
  sfx('tap'); coopRender(); }
function coopAnswer(y) {
  if (NETROLE === 'host' && NET.req === 'guest' && NET.ctrl === 'host') { if (y) { NET.ctrl = 'guest'; toast('已把操作交给队友'); } else netBroadcast({ t: 'toast', s: '房主暂时不想交出操作' }); NET.req = null; netSync(true); }
  else if (NETROLE === 'guest' && NET.req === 'host' && NET.ctrl === 'guest') { netSend({ t: 'ans', y: !!y }); NET.req = null; }
  coopRender(); }
/* 快捷发言（两边都冒一句） */
const QUICK = ['我来吧', '你来操作', '等一下', '好吓人……', '看那边！', '快跑！', '这个选哪个？', '哈哈哈'];
function coopSay(s, who) { const d = el('div', 'coopsay', esc(whoName(who) + '：' + s)); document.body.appendChild(d); setTimeout(() => d.remove(), 2600); }
function coopQuick(i) { const s = QUICK[i]; if (!s) return; if (NETROLE === 'guest') netSend({ t: 'say', s }); else { coopSay(s, 'host'); netBroadcast({ t: 'say', s, who: 'host' }); } closeModal(); }

/* ---------- 界面：顶栏小牌子、请求提示、联机面板 ---------- */
function coopRender() {
  let chip = $('#coopchip'); const top = $('#top');
  if (!NETROLE) { if (chip) chip.remove(); const q = $('#coopreq'); if (q) q.remove(); if (UI.modal === 'coop') coopModal(); coopTitle(); return; }
  if (!chip && top) { chip = el('button', 'tb', ''); chip.id = 'coopchip'; chip.onclick = () => openModal('coop'); top.insertBefore(chip, top.children[1] || null); }
  if (chip) { const up = netUp(), mine = myControl(); chip.className = 'tb coopchip ' + (up ? (mine ? 'mine' : 'theirs') : 'wait'); chip.innerHTML = '🔗 ' + (NET.code || '…') + ' · ' + (up ? (mine ? '你在操作' : whoName(NET.ctrl) + '在操作') : (NETROLE === 'host' ? '等队友' : '连接中')); }
  let q = $('#coopreq'); const ask = netUp() && NET.req && ((NETROLE === 'host' && NET.req === 'guest' && NET.ctrl === 'host') || (NETROLE === 'guest' && NET.req === 'host' && NET.ctrl === 'guest'));
  if (ask && !q) { q = el('div', '', '<span>' + whoName(NET.req) + '想接手操作</span><button class="btn pri" onclick="coopAnswer(1)">交给' + whoName(NET.req) + '</button><button class="btn" onclick="coopAnswer(0)">再等等</button>'); q.id = 'coopreq'; document.body.appendChild(q); sfx('select'); }
  else if (!ask && q) q.remove();
  if (UI.modal === 'coop') coopModal(); coopTitle(); }
function coopModal() {
  const m = $('#mb'); if (!m) return; let h = '<div class="box"><h3>双人同屏</h3>';
  if (!NETROLE) h += '<p class="mini">两台设备一起玩：房主开房间，把 4 位房间码告诉朋友。两人看同一个画面、共用陈歌，同一时刻一人操作；另一人可以请求接手，操作的人同意后交换。白天接待时房主扮陈歌，朋友操作一名站岗员工。夜晚任务里也一样，谁在操作看屏幕最上方。</p>'
    + '<div class="row"><button class="btn pri big" onclick="netHost()">开房间（我当房主）</button></div><p class="mini">' + (C ? '用现在这个存档一起玩。' : '在标题页开也行：队友进来后你再选存档（继续 / 开始 / 读取），他会自动跟上。') + '</p>'
    + '<div class="row"><input id="cjoin" maxlength="4" placeholder="房间码" style="width:7em;text-transform:uppercase;font-size:18px;text-align:center"><button class="btn" onclick="netJoin($(\'#cjoin\').value)">加入朋友的房间</button></div>';
  else { const up = netUp(), mine = myControl();
    h += '<div class="coopcode">' + (NET.code || '……') + '</div><p class="mini">' + esc(NET.status || '') + '</p>'
      + (up ? '<p>' + (mine ? '现在<b>你</b>在操作。' : '现在是<b>' + whoName(NET.ctrl) + '</b>在操作。') + '</p><div class="row"><button class="btn pri" onclick="coopCtrl();closeModal()">' + (mine ? '把操作交给' + (NETROLE === 'host' ? '队友' : '房主') : '请求接手') + '</button></div>'
        + '<div class="grp">' + QUICK.map((s, i) => '<button class="btn" onclick="coopQuick(' + i + ')">' + esc(s) + '</button>').join('') + '</div>' : '')
      + '<div class="row"><button class="btn" onclick="netLeave();closeModal()">' + (NETROLE === 'host' ? '结束联机' : '离开房间') + '</button></div>'; }
  m.innerHTML = h + '<div class="row"><span></span><button class="btn" onclick="closeModal()">返回</button></div></div>'; }
{ const om = window.openModal; window.openModal = function (k) { if (k === 'coop') { UI.modal = 'coop'; sfx('tap'); $('#modal').classList.add('on'); coopModal(); return; } return om.apply(this, arguments); }; }
/* 标题画面：加入房间；设置面板：开房间 */
{ const tt = window.toTitle; window.toTitle = function () { if (NETROLE === 'guest' && !NET.lobbyGo) netLeave(true); const r = tt.apply(this, arguments); const b = $('#tbtns'); if (b && !$('#tcoop') && NETROLE !== 'guest') b.insertAdjacentHTML('beforeend', '<button class="btn tbtn" id="tcoop" onclick="openModal(\'coop\')">🔗 双人同屏</button>'); if (NETROLE === 'host' && NET.conns.size) { NET.last = NET.lastStg = NET.lastMg = NET.lastHs = ''; netBroadcast({ t: 'lobby' }); } coopTitle(); return r; };
  const om = window.openModal; window.openModal = function (k) { const r = om.apply(this, arguments); if (k === 'set') { const box = $('#mb .box'); if (box && !$('#setcoop')) box.insertAdjacentHTML('beforeend', '<div class="row" id="setcoop"><button class="btn pri" onclick="openModal(\'coop\')">🔗 双人同屏' + (NETROLE ? '（房间 ' + NET.code + '）' : '') + '</button></div>'); } return r; }; }
/* 队友那边：自己的存档、剧情推进都不跑 */
{ const sh = window.storyHereRun; window.storyHereRun = function () { if (NETROLE === 'guest' && !UI.inClick) return; return sh.apply(this, arguments); }; }
if (window.__dbg) { Object.assign(__dbg, { coopTitle, netHost, netJoin, netLeave, coopCtrl, coopAnswer, myControl, coopQuick, guestScare, coopHsSend: m => netSend(Object.assign({ t: 'hs' }, m)) }); Object.defineProperty(__dbg, 'NET', { get() { return NET; }, configurable: true }); Object.defineProperty(__dbg, 'NETROLE', { get() { return NETROLE; }, configurable: true }); Object.defineProperty(__dbg, 'HS', { get() { return HS; }, configurable: true }); Object.defineProperty(__dbg, 'MG', { get() { return MG; }, configurable: true }); }

/* ---------- 白天接待：房主扮陈歌，队友操作一名站岗员工 ---------- */
{ const hs0 = window.houseStart; window.houseStart = function (H) { const r = hs0.apply(this, arguments); if (NETROLE === 'host' && netUp()) { const st = hP2Pick(H); netBroadcast({ t: 'toast', s: st ? '这一场你操作' + PETS[st.k].n + '：方向键或点地面走，点游客 = 走过去放招，「吓！」= 马上放' : '这一场没有员工站岗——你可以看着，或者用快捷发言提醒房主' }); } return r; }; }
function coopHsIn(m) { const H = HS; if (!H || H.phase !== 'live' || H.done) return; let st = H.staff.find(s => s.p2); if (!st && netUp()) st = hP2Pick(H); if (!st) return;
  if (m.a === 'go') hP2Go(H, st, m.x, m.y);
  else if (m.a === 'key') { st.kds = (st.kds || []).filter(x => x !== m.d); if (!m.up) st.kds.push(m.d); st.kd = st.kds.length ? st.kds[st.kds.length - 1] : null; }
  else if (m.a === 'scare') { const v = m.key ? H.vis.find(q => q.u.key === m.key) : null; const r = hP2Scare(H, st, v); if (r) for (const c of NET.conns.values()) raw(c, { t: 'toast', s: r }); } }
function guestHouse(h) {
  if (NETROLE !== 'guest') return;
  if (!h) { if (STATE.house) { cancelAnimationFrame(HS && HS.raf); STATE.house = null; HS = null; hsClear(); applyMode(); refresh(); } return; }
  let H = HS; const gid = h.o.map + '|' + h.o.scene + '|' + (h.o.title || '');
  if (!H || H._gid !== gid) { if (H) cancelAnimationFrame(H.raf); H = hsNew(Object.assign({}, h.o)); H._gid = gid; H.cam = H.cam || { x: 0, y: 0 }; HS = H; STATE.house = H; hsClear(); applyMode(); hsSize(); H.last = performance.now(); H.raf = requestAnimationFrame(guestHsFrame); }
  const lay = JSON.stringify(h.lay || null), ph = H.phase;
  for (const k in h) if (!['o', 'slots', 'B', 'cam', 'z'].includes(k)) H[k] = h[k];
  if (H.z == null) H.z = h.z;
  H.M.slots.forEach((s, i) => { if (h.slots && h.slots[i]) { s.k = h.slots[i][0]; s.cd = h.slots[i][1]; } });
  H.B = Object.assign(H.B || {}, h.B || {}, { foes: H.vis.map(v => v.u) });
  H.focus = H.staff.find(s => s.p2) || H.hero;
  if (H.phase === 'setup' && (lay !== H._lay || ph !== 'setup')) { H._lay = lay; try { hsSetupHtml(H); } catch (e) { } }
  if (H.phase === 'live' && !H._hud) { H._hud = 1; $('#hsset').innerHTML = ''; guestHud(H); }
  if (H.done && H.rw && !H._end) { H._end = 1; try { hsEndPanel(H); } catch (e) { } } }
function guestHsFrame(now) { const H = HS; if (!H || NETROLE !== 'guest' || STATE.house !== H) return; const dt = Math.min(.05, (now - (H.last || now)) / 1000); H.last = now; H.dt = dt; H.t += dt;
  for (const a of [H.hero, ...H.vis, ...H.staff]) if (a && a.mv) hMove(a, dt);
  try { hsCam(H); hsDraw(H); hsTextLayer(H); if (H.phase === 'live' && !H.done) { hsHudTick(H); guestHudTick(H); } } catch (e) { }
  H.raf = requestAnimationFrame(guestHsFrame); }
function guestHud(H) { try { hsHud(H); } catch (e) { } const hud = $('#hshud'); if (!hud) return; hud.classList.add('gview'); const bot = hud.querySelector('.hs-bot'); if (bot) bot.insertAdjacentHTML('beforeend', '<div class="p2bar"><span id="p2who"></span><button class="btn pri big" onclick="guestScare()">吓！</button></div>'); const c = $('#hsctr'); if (c) c.textContent = '📍 回到我'; }
function guestHudTick(H) { const w = $('#p2who'); if (!w) return; const st = H.staff.find(s => s.p2); const t = st ? '你是 ' + PETS[st.k].n + (st.cd > 0 ? ' · 缓 ' + Math.ceil(st.cd) + ' 秒' : ' · 准备好了') + ' · 方向键走，点游客放招' : '这一场没有员工站岗 · 看着房主吓人吧'; if (w.textContent !== t) w.textContent = t; }
function guestScare() { netSend({ t: 'hs', a: 'scare' }); sfx('tap'); }
{ const ht = window.hsTap; window.hsTap = function (ev) { if (NETROLE !== 'guest') return ht.apply(this, arguments); const H = HS; if (!H || H.phase !== 'live' || H.done) return; const [x, y] = hsPt(H, ev);
    const v = hActive(H).filter(q => Math.hypot(q.x - x, q.y - .5 - y) < 1).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (v) { netSend({ t: 'hs', a: 'scare', key: v.u.key }); sfx('tap'); return; } netSend({ t: 'hs', a: 'go', x, y }); sfx('tap'); };
  const hk = window.hsKey; window.hsKey = function (e) { if (NETROLE !== 'guest') return hk.apply(this, arguments); const H = HS; if (!H || H.phase !== 'live' || H.done) return false; const st = H.staff.find(s => s.p2); const d = HKEYS[e.key];
    if (d != null && st) { if (!e.repeat) netSend({ t: 'hs', a: 'key', d }); return true; } if (e.key === ' ' || e.key === 'Enter') { guestScare(); return true; } return false; };
  const hu = window.hsKeyUp; window.hsKeyUp = function (e) { if (NETROLE !== 'guest') return hu.apply(this, arguments); const d = HKEYS[e.key]; if (d != null && HS) netSend({ t: 'hs', a: 'key', d, up: 1 }); };
  const hc = window.hsCenter; window.hsCenter = function () { if (NETROLE === 'guest' && HS) { HS.focusPt = null; return; } return hc.apply(this, arguments); }; }

/* ---------- 小游戏：房主那边在玩，队友看同一块；队友操作时，按键发给房主 ---------- */
function guestMini(g) { if (NETROLE !== 'guest') return;
  if (!g) { if (STATE.mini) { cancelAnimationFrame(MG && MG.raf); MG = null; STATE.mini = null; applyMode(); refresh(); } return; }
  if (!MG || MG.id !== g.id || MG.tries !== g.tries) { MG = g; STATE.mini = g; applyMode(); try { miniHtml(); } catch (e) { } return; }
  const rebuild = MG.ready !== g.ready || MG.over !== g.over || JSON.stringify(MG.decoys) !== JSON.stringify(g.decoys) || MG.watch !== g.watch || MG.final !== g.final || MG.warn !== g.warn;
  Object.assign(MG, g); STATE.mini = MG; try { rebuild ? miniHtml() : miniPaint(); } catch (e) { } }
