/* ================= 双人：夜晚任务也是两个人一起走（第十七轮，RULES 34） =================
   不在 iframe 里另开 PeerJS：百物语引擎自己的联机消息（快照、操作权请求、选择……）经恐怖屋的连接转发。
   NET.ctl 换成一个假通道：send → postMessage 给恐怖屋 → 发给对面的恐怖屋 → 塞进对面的 iframe。
   另外：选项按下去先亮 0.6 秒、标出“房主/队友选了……”再往下走；弹幕、开场卡、喊话、回忆滤镜也同步给队友。 */
const KCHAN = { open: true, label: 'ctl', send(s) { kPost({ t: 'net', d: s }); }, close() { } };
let KCOOP = null;   // 'host' | 'guest' | null
function kCoopStart(role, id, fromCp) {
  KCOOP = role; NET.role = role; NET.up = true; NET.ctl = KCHAN; NET.snap = null; NET.code = 'KBW';
  if (role === 'host') { if (W) { W.ctrl = 'h'; W.req = null; } netSend({ t: 'hello', scene: 'play' }); setTimeout(() => netSnapshot(), 50); }
  else { if (W) quitChapter(); UI.show('play'); $('hud').classList.remove('hidden'); } }
function kCoopStop() { KCOOP = null; NET.role = 'solo'; NET.up = false; NET.ctl = null; }
/* 恐怖屋转进来的联机消息 */
addEventListener('message', ev => { const m = ev.data; if (!m || m.kbwNight !== 1) return;
  if (m.t === 'net') { try { const o = JSON.parse(m.d); if (NET.role === 'host') onNetHost(o); else if (NET.role === 'guest') onNetGuest(o); } catch (e) { console.error(e); } }
  else if (m.t === 'coopGuest') kCoopStart('guest', m.id); });
/* 实体上这些字段也要同步（镜子慢半拍、椅子转过来、门缝……） */
VKEYS.push('lag', 'stare', 'smile', 'empty', 'ghost', 'crack', 'st', 'sit', 'torn', 'up', 'down', 'bent', 'gap', 'spin', 'who', 'turn', 'n', 'other', 'keep', 'yin');

/* ---------- 主机：收到客机的特殊动作 ---------- */
{ const _h = onNetHost; onNetHost = function (m) {
    if (m && m.t === 'act' && m.a === 'kskip') { if (W && W.endScreen) kFinish('skip'); return; }
    if (m && m.t === 'act' && m.a === 'kaid') { if (W && W.ctrl === 'g') kAid(); return; }
    return _h(m); }; }
/* ---------- 客机：主机那边的弹幕、开场卡、喊话、滤镜 ---------- */
{ const _g = onNetGuest; onNetGuest = function (m) {
    if (m && m.t === 'kx') { kDmInit();
      if (m.f === 'dm') kDmShow(m.list, m.cls);
      else if (m.f === 'live') { KDM.on = !!m.on; const L = document.getElementById('klive'); if (L) { L.style.display = m.on ? '' : 'none'; L.querySelector('b').textContent = m.hot || ''; } }
      else if (m.f === 'epic') KEPIC = m.seal ? { seal: m.seal } : null;
      else if (m.f === 'shout') kShout(m.s, m.ms);
      else if (m.f === 'rec') kRecallOn(m.kind, m.title);
      else if (m.f === 'recoff') kRecallOff();
      return; }
    return _g(m); }; }
const kTell = o => { if (KCOOP === 'host' && NET.up) netSend(Object.assign({ t: 'kx' }, o)); };
{ const s1 = kShout; kShout = function (t, ms) { kTell({ f: 'shout', s: t, ms }); return s1(t, ms); };
  const r1 = kRecallOn; kRecallOn = function (k, t) { kTell({ f: 'rec', kind: k, title: t }); return r1(k, t); };
  const r2 = kRecallOff; kRecallOff = function () { kTell({ f: 'recoff' }); return r2(); };
  const e1 = kEpic; kEpic = async function (S, o) { kTell({ f: 'epic', seal: o.seal }); try { return await e1(S, o); } finally { kTell({ f: 'epic', seal: null }); } }; }

/* ---------- 选项：亮一下、标出谁选的，再往下走 ---------- */
{ const _act = doAct; doAct = function (a, v, by) {
    if (a === 'pick' && NET.up && W && W.dlg && W.dlg.choices && !W.dlg.vote) {
      const d = W.dlg; if (d.pkT != null) return; if (RT - d.t0 < .2) return;
      d.full = true; d.sel = v; d.pk = by === 'g' ? 'g' : 'h'; d.pkT = RT; AU.sfx('select'); netSnapshot();
      setTimeout(() => { if (W && W.dlg === d) _act('pick', v, by); }, 600); return; }
    return _act(a, v, by); }; }
/* 客机：自己的屏幕上也马上亮（不等主机回快照），并把“谁选的”写在对话框下面 */
{ const _s = UI.sync.bind(UI); UI.sync = function (dt) { _s(dt); const d = W && W.dlg, D = $('dlg'); if (!D) return;
    const C = D.querySelector('.chs'), Wt = D.querySelector('.watch');
    if (d && d.choices && C) { [...C.children].forEach((b, i) => b.classList.toggle('kpk', d.pk != null && i === d.sel));
      if (d.pk != null && Wt) { const me = NET.role === 'guest' ? 'g' : 'h'; Wt.classList.remove('hidden'); Wt.textContent = (d.pk === me ? '你' : (d.pk === 'h' ? '房主' : '队友')) + '选了「' + d.choices[d.sel] + '」'; } }
    const es = W && W.endScreen;   // 客机：结束画面不能自己“继续”/离开；跳过要发给主机
    if (es && KCOOP === 'guest') { const B = $('enB'); if (B && !B.dataset.kg) { B.dataset.kg = 1; for (const b of [...B.children]) { if (/继续/.test(b.textContent)) { b.disabled = true; b.textContent = '等房主继续……'; } if (/跳过/.test(b.textContent)) b.onclick = () => netSend({ t: 'act', a: 'kskip' }); } } }
    else { const B = $('enB'); if (B) delete B.dataset.kg; } }; }
{ const _ch = document.createElement('style'); _ch.textContent = '#dlg .ch.kpk{outline:2px solid #ffd76a;box-shadow:0 0 14px #ffd76aaa;background:rgba(255,215,106,.18);transform:scale(1.03)}#dlg .ch.kpk::before{content:"✓ ";color:#ffd76a}'; document.head.appendChild(_ch); }
/* 客机：选项按钮按了以后先在自己这边亮起来 */
{ const _sa = sendAct; sendAct = function (a, v) { if (a === 'pick' && NET.role === 'guest' && W && W.dlg && W.dlg.choices && W.dlg.pk == null) { W.dlg.sel = v; W.dlg.pk = 'g'; } if (a === 'kaid') { netSend({ t: 'act', a: 'kaid' }); return; } return _sa(a, v); }; }
/* 客机：镜子倒影要用到玩家的历史位置；离开这一夜只能由房主决定 */
{ const _gt = guestTick; guestTick = function (dt) { _gt(dt); if (W && W.pl) { const p = W.pl; KMIR.push({ t: RT, px: p.px, py: p.py, dir: p.dir, fr: p.fr, spr: p.spr }); while (KMIR.length > 2 && RT - KMIR[0].t > 3) KMIR.shift(); } const b = document.getElementById('hAid'); if (b) { const on = kAidsHave().length > 0 && iControl(); if (on === b.classList.contains('hidden')) b.classList.toggle('hidden', !on); } }; }
{ const _gs = goSelect; goSelect = function () { if (KCOOP === 'guest') { UI.toast('离开这一夜要房主决定'); return; } return _gs(); }; }
