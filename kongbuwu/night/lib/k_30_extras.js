/* ================= 第十六轮：旧版的好东西接回夜晚任务（RULES 33） =================
   ① 直播弹幕（开着直播的夜里，跟着你的一举一动起哄、报警、刷“后面！”）
   ② 「灵」按钮：员工和天赋——阴瞳、殓容、小小、笔仙、白猫；布偶被动挡一次抓
   ③ 大战开场卡（印章 + 三句开场白），靠近时喊出半血那句，解决时出残血那句
   ④ 镜子会照出你——还会慢半拍、盯着你、笑、照不出你
   ⑤ 回忆三种滤镜：梦（发蓝水波）、往事（老胶片）、传闻（旧录像）
   ⑥ 这一夜的对话和笔记带回恐怖屋的回忆录
   ⑧ 按表现评价（没死过 / 没被发现 / 没开口……），回到恐怖屋按评价给奖励
   另外修了：说话人一律显示中文名（章节里写的是人物 id）。 */

/* ---------- 0. 说话人名字 + 回忆录记录 ---------- */
const KNAMES = { me: '陈歌', wangqi: '王琦', landlord: '房东', tattoo: '纹身男', fat: '矮胖的男人', woman: '女人', zp: '张鹏', li: '李队', police: '警察', aunt: '范郁的姑姑', uncle: '301 的大叔', youth: '302 的年轻人', xu: '许童', mn: '门楠', boy: '男孩', liu: '刘刀', driver: '司机', ruoyu: '小女孩', dad: '父亲', mom: '母亲', man: '那个男人' };
const kName = w => (W && W.ch && W.ch.names && W.ch.names[w]) || KNAMES[w] || w;
let KLOG = [];
function kLog(who, text) { if (!text) return; if (KLOG.length < 500) KLOG.push([who || '', String(text)]); }
{ const _say = SAPI.say;
  SAPI.say = function (who, text, o) { const n = kName(who); (Array.isArray(text) ? text : [text]).forEach(t => kLog(n || (o && o.style === 'think' ? '陈歌（心想）' : ''), t)); return _say.call(this, n, text, o); };
  const _ask = SAPI.ask;
  SAPI.ask = async function (text, opts, who, o) { const r = await _ask.call(this, text, opts, who, o); if (text) kLog(kName(who), text); if (opts && opts[r] != null) kLog('陈歌', '→ ' + opts[r]); return r; };
  const _note = SAPI.note;
  SAPI.note = async function (id) { const n = W && W.ch.notes && W.ch.notes[id]; if (n) kLog('笔记', '「' + n.title + '」' + n.text.replace(/\n+/g, ' ')); kDm(DMP.note); return _note.call(this, id); };
  const _card = SAPI.card;
  SAPI.card = async function (t, s, b) { kLog('', t + (s ? ' · ' + s : '') + (b ? '\n' + b : '')); return _card.call(this, t, s, b); };
}

/* ---------- 1. 直播弹幕 ---------- */
const DMP = {
  idle: ['主播还活着吗', '这地方我白天都不敢去', '弹幕护体！！', '前面的别走', '主播手电换个电池吧', '有人一起看吗我害怕', '这氛围绝了', '截图了截图了', '我赌五毛前面有东西', '主播是不是演员', '刚下班，什么情况', '主播呼吸声好重', '音效师加鸡腿', '我开着灯看的', '这真不是剧本？'],
  scare: ['卧槽！！', '啊啊啊啊啊', '我手机摔了', '吓死我了', '刚才那是什么？？', '回放！回放！', '我截到了！', '心脏骤停', '谁让我半夜点进来的'],
  chase: ['跑啊！！', '快跑快跑', '别回头', '左边左边！', '主播冲啊', '完了完了完了', '它追上来了', '报警了报警了'],
  hide: ['躲好别出声', '嘘——', '我都不敢呼吸了', '它在门外吗', '弹幕都小声点'],
  note: ['念出来念出来', '这字迹好吓人', '细思极恐', '所以是谁写的', '我截图放大看了'],
  warn: ['后面！！', '主播你身后', '背后有东西！', '那是什么在动', '右边那个影子……'],
  calm: ['没事了没事了', '刚才好险', '主播稳住', '我腿软了'],
  win: ['牛逼！！', '主播是真的勇', '这都行？？', '刷一波关注'],
  end: ['今晚值了', '关注了', '明天还播吗', '这直播间绝了', '已经分享给室友了'] };
const KDM = { on: false, t: 0, lanes: [], hot: 0 };
function kDmInit() {
  if (document.getElementById('kdm')) return;
  const st = document.createElement('style');
  st.textContent = `#kdm{position:fixed;left:0;right:0;top:calc(var(--st,0px) + 150px);height:30vh;pointer-events:none;z-index:8;overflow:hidden}
#kdm span{position:absolute;left:100%;white-space:nowrap;font-size:14px;color:#f2ece2;text-shadow:0 0 3px #000,0 0 6px #000;opacity:.88;will-change:transform}
#kdm span.w{color:#ff6a5a;font-weight:600}#kdm span.g{color:#9fd8a8}
#klive{position:fixed;left:calc(var(--sl,0px) + 10px);top:calc(var(--st,0px) + 52px);z-index:11;pointer-events:none;font-size:11px;color:#ffb0a8;letter-spacing:1px;text-shadow:0 0 4px #000}
#klive i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#e02828;margin-right:5px;animation:klb 1.2s infinite}@keyframes klb{50%{opacity:.25}}
#kshout{position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:12;pointer-events:none;font-family:var(--serif,serif);font-size:clamp(18px,3.4vw,30px);color:#e8d0c8;text-shadow:0 0 12px #a01010,0 0 3px #000;letter-spacing:.15em;white-space:pre-line;text-align:center;transition:opacity .4s;opacity:0;max-width:90vw}
#card.epic{background:radial-gradient(ellipse at center,#1a0606 0%,#000 70%)}#card.epic .t{color:#f0d8c8;letter-spacing:.4em}
#card .kseal{display:none}#card.epic .kseal{display:flex;align-items:center;justify-content:center;width:84px;height:84px;margin-bottom:18px;border:4px solid #b0201c;color:#d02a24;font-family:var(--serif,serif);font-size:30px;font-weight:700;transform:rotate(-8deg);box-shadow:inset 0 0 0 2px #b0201c;animation:kseal .5s cubic-bezier(.2,1.6,.4,1)}
@keyframes kseal{0%{transform:rotate(-8deg) scale(2.4);opacity:0}100%{transform:rotate(-8deg) scale(1);opacity:1}}
#krec{position:fixed;inset:0;z-index:7;pointer-events:none;display:none}#krec.on{display:block}
#krec .lb{position:absolute;left:50%;top:calc(var(--st,0px) + 46px);transform:translateX(-50%);font-family:var(--serif,serif);font-size:13px;letter-spacing:.3em;padding:3px 12px;border:1px solid currentColor;opacity:.85}
#krec.dream{background:radial-gradient(ellipse at center,rgba(40,80,160,0) 40%,rgba(20,40,110,.45) 100%);color:#9ec0ff}
#krec.past{background:radial-gradient(ellipse at center,rgba(0,0,0,0) 45%,rgba(30,18,6,.6) 100%),repeating-linear-gradient(0deg,rgba(255,240,200,.03) 0 1px,transparent 1px 3px);color:#e8c890;animation:kgr .18s steps(2) infinite}
#krec.tale{background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 1px,transparent 1px 3px);color:#b8e0b0}
#krec.tale .ts{position:absolute;right:calc(var(--sr,0px) + 14px);bottom:calc(var(--sb,0px) + 150px);font-family:monospace;font-size:13px;color:#d8f0d0;text-shadow:0 0 4px #000}
#krec.yin{background:radial-gradient(ellipse at center,rgba(60,140,90,0) 35%,rgba(20,70,40,.5) 100%);color:#a8f0c0}
@keyframes kgr{50%{opacity:.92}}
body.krec-dream #cv{filter:hue-rotate(185deg) saturate(.7) brightness(.95);animation:kwv 3.2s ease-in-out infinite}@keyframes kwv{50%{transform:skewX(.6deg) scale(1.006)}}
body.krec-past #cv{filter:sepia(.85) contrast(1.08) brightness(.92)}
body.krec-tale #cv{filter:grayscale(.75) sepia(.25) hue-rotate(60deg) contrast(1.15)}
body.krec-yin #cv{filter:saturate(.35) hue-rotate(80deg) brightness(1.25) contrast(1.1)}
#hAid{color:#a8e8c0}#hAid.hidden{display:none}`;
  document.head.appendChild(st);
  for (const [id, h] of [['kdm', ''], ['klive', '<i></i>LIVE <b></b>'], ['kshout', ''], ['krec', '<div class="lb"></div><div class="ts"></div>']]) { const d = document.createElement('div'); d.id = id; d.innerHTML = h; document.body.appendChild(d); }
  document.getElementById('klive').style.display = 'none';
  const cd = document.getElementById('card'); if (cd && !cd.querySelector('.kseal')) { const s = document.createElement('div'); s.className = 'kseal'; cd.insertBefore(s, cd.firstChild); }
  const htr = document.getElementById('htr'); if (htr && !document.getElementById('hAid')) { const b = document.createElement('button'); b.className = 'hb hidden'; b.id = 'hAid'; b.title = '叫员工帮忙 (Q)'; b.textContent = '灵'; b.onclick = e => { e.stopPropagation(); kAid(); }; htr.insertBefore(b, htr.firstChild); }
  addEventListener('keydown', e => { if ((e.key === 'q' || e.key === 'Q') && !e.ctrlKey && !e.metaKey) kAid(); });
}
function kDm(pool, o = {}) {
  if (!KDM.on) return; const list = Array.isArray(pool) ? pool : [pool], n = o.n || (1 + (Math.random() * 2 | 0)), out = [];
  for (let i = 0; i < n; i++) out.push(list[(Math.random() * list.length) | 0]);
  if (o.log !== false) kLog('弹幕', out[0]); kDmShow(out, o.cls);
  if (typeof kTell === 'function') kTell({ f: 'dm', list: out, cls: o.cls || '' }); }
function kDmShow(out, cls) {
  const box = document.getElementById('kdm'); if (!box) return;
  out.forEach((t, i) => { const s = document.createElement('span'); s.textContent = t; if (cls) s.className = cls;
    let lane = 0; for (let k = 0; k < 8; k++) { const L = (Math.random() * 8) | 0; if (!KDM.lanes[L] || performance.now() - KDM.lanes[L] > 900) { lane = L; break; } }
    KDM.lanes[lane] = performance.now(); s.style.top = (lane * 12.5) + '%';
    const dur = 7 + Math.random() * 3, delay = i * (250 + Math.random() * 400);
    s.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(calc(-100vw - 100%))' }], { duration: dur * 1000, delay, easing: 'linear' }).onfinish = () => s.remove();
    box.appendChild(s); }); }
{ const _scare = SAPI.scare; SAPI.scare = async function (k, o) { kDm(DMP.warn, { cls: 'w', n: 1, log: false }); const r = await _scare.call(this, k, o); kDm(DMP.scare, { n: 3 }); return r; };
  const _hp = SAPI.hidePlayer; SAPI.hidePlayer = function (b = true) { if (b) kDm(DMP.hide, { n: 2, log: false }); return _hp.call(this, b); };
  const _show = SAPI.show; SAPI.show = function (id, v = true) { if (v) { const e = getEnt(id); if (e && e.hidden && typeof e.spr === 'string' && /^gh_|redshadow/.test(e.spr)) kDm(DMP.warn, { cls: 'w', n: 1, log: false }); } return _show.call(this, id, v); };
  const _end = SAPI.end; SAPI.end = async function (o = {}) { if (!o.bad) kDm(DMP.end, { n: 4, cls: 'g' }); return _end.call(this, o); };
}

/* ---------- 2. 「灵」：员工和天赋 ---------- */
const KAIDS = [
  { id: 'yin', name: '阴瞳', has: () => (KENV.talents || []).includes('yintong'), uses: 2, desc: '看见藏起来的东西' },
  { id: 'mask', name: '殓容', has: () => (KENV.talents || []).includes('lianrong'), uses: 1, desc: '给自己画上死人的妆，它们一时认不出你' },
  { id: 'xiao', name: '小小', has: () => kPet('xiaoxiao'), uses: 2, desc: '指一下该去哪儿' },
  { id: 'pen', name: '笔仙', has: () => kPet('bixian'), uses: 1, desc: '写一个字' },
  { id: 'cat', name: '白猫', has: () => kPet('baimao'), uses: 1, desc: '冲着脏东西弓起背' }];
const kAidsHave = () => KAIDS.filter(a => a.has());
const kDollHave = () => kHas('ragdoll') && !(W && W.ch.nodoll);
function kAidLeft(a) { W.f._aid = W.f._aid || {}; return a.uses - (W.f._aid[a.id] || 0); }
function kAid() {
  if (W && NET.up && !iControl()) { UI.toast('对方在操作 · 按 T 请求操作'); return; }
  if (W && NET.role === 'guest') { netSend({ t: 'act', a: 'kaid' }); return; }
  if (!W || W.ended || W.endScreen || W.busy || W.dlg || W.card || W.note || UI.modal) return;
  const list = kAidsHave(); if (!list.length) return;
  runScript(async S => {
    const opts = list.map(a => a.name + (kAidLeft(a) > 0 ? '（' + a.desc + ' · 还能用 ' + kAidLeft(a) + ' 次）' : '（今晚用完了）')).concat(['算了']);
    const r = await S.ask('叫谁帮忙？', opts); const a = list[r]; if (!a) return;
    if (kAidLeft(a) <= 0) return S.narr(a.name + '今晚已经帮过你了。');
    W.f._aid[a.id] = (W.f._aid[a.id] || 0) + 1; KST.aids[a.id] = (KST.aids[a.id] || 0) + 1;
    await ({ yin: aidYin, mask: aidMask, xiao: aidXiao, pen: aidPen, cat: aidCat })[a.id](S);
  }); }
function kGhosts() { return curMap().ents.filter(e => !e.hidden && (e.chase || (typeof e.spr === 'string' && /^gh_|redshadow|chairg/.test(e.spr)))); }
const kDist = (a, b) => Math.abs(Math.round(a.px / TS) - Math.round(b.px / TS)) + Math.abs(Math.round(a.py / TS) - Math.round(b.py / TS));
function kTarget(S) {
  const m = curMap(), p = W.pl;
  if (W.ch.hint) { const h = W.ch.hint(S); if (h) { if (typeof h === 'string') { const e = getEnt(h); if (e && !e.hidden) return e; } else return { px: h[0] * TS, py: h[1] * TS, id: '' }; } }
  const md = m.def.hint && m.def.hint(S); if (md) { const e = typeof md === 'string' ? getEnt(md) : { px: md[0] * TS, py: md[1] * TS }; if (e && !e.hidden) return e; }
  const cand = m.ents.filter(e => !e.hidden && (typeof e.on === 'function' || typeof e.touch === 'function') && !e.read && e.id !== 'raise' && !/^(raise|smash|push|cat)$/.test(e.id));
  cand.sort((a, b) => kDist(a, p) - kDist(b, p)); return cand[0] || null; }
function kDirWord(dx, dy) { const ax = Math.abs(dx), ay = Math.abs(dy); if (ax < 1 && ay < 1) return '这里'; return ay > ax * 1.6 ? (dy < 0 ? '上' : '下') : ax > ay * 1.6 ? (dx < 0 ? '左' : '右') : (dy < 0 ? '上' : '下') + (dx < 0 ? '左' : '右'); }
async function aidYin(S) {
  kRecallOn('yin', '阴瞳'); const m = curMap(), prev = W.mapDark[W.mapId]; W.mapDark[W.mapId] = Math.min(prev ?? m.def.dark ?? W.ch.dark ?? .85, .55);
  const shown = m.ents.filter(e => e.yin && e.hidden); shown.forEach(e => e.hidden = false);
  const gh = kGhosts(); gh.forEach(e => { e._yl = e.light; e.light = { r: 2.2, col: 'rgba(120,255,170,.25)' }; });
  await S.narr('眼睛一阵刺痛。黑暗褪成了灰色。' + (shown.length || gh.length ? '\n' + (gh.length ? '你看见了它——' + (kDirWord(gh[0].px - W.pl.px, gh[0].py - W.pl.py) === '这里' ? '就在你旁边。' : '在你' + kDirWord(gh[0].px - W.pl.px, gh[0].py - W.pl.py) + '边。') : '有些东西，平时是看不见的。') : '\n这里没有别的东西……至少现在没有。'));
  S.after(7000, async S => { kRecallOff(); W.mapDark[W.mapId] = prev; shown.forEach(e => { if (!e.keep) e.hidden = true; }); gh.forEach(e => { e.light = e._yl; }); }); }
async function aidMask(S) { W.kMask = W.t + 6; await S.narr('你蘸着殓容的油彩，在脸上抹了几道。\n镜子里的那张脸，像是已经躺进棺材里了。\n\n（六秒内，它们认不出你）'); kShout('它们认不出你了', 1600); }
async function aidXiao(S) {
  const t = kTarget(S); if (!t) return S.narr('一个小小的影子拽了拽你的衣角，又松开了。\n这里好像没什么要找的了。');
  const x = t.px + 8, y = t.py + 8; S.lights([[x, y, 1.6, .9]]); if (t.id) S.bubble(t.id, '!', 4000);
  await S.narr('一个小小的影子拽了拽你的衣角，朝' + kDirWord(t.px - W.pl.px, t.py - W.pl.py) + '边指了指。'); S.after(4000, async S => S.lights(null)); }
async function aidPen(S) {
  const g = kGhosts().filter(e => e.chase).sort((a, b) => kDist(a, W.pl) - kDist(b, W.pl))[0];
  if (g) return S.narr('口袋里的圆珠笔自己动了，在你手心写了一个字：\n「' + kDirWord(g.px - W.pl.px, g.py - W.pl.py) + '」\n——它在那边。');
  const t = kTarget(S); const w = W.ch.pen ? W.ch.pen(S) : null;
  await S.narr('口袋里的圆珠笔自己动了，在你手心写：\n「' + (w || (t ? kDirWord(t.px - W.pl.px, t.py - W.pl.py) : '无')) + '」'); }
async function aidCat(S) {
  const g = kGhosts().sort((a, b) => kDist(a, W.pl) - kDist(b, W.pl))[0];
  if (!g || kDist(g, W.pl) > 9) return S.narr('白猫舔了舔爪子。\n这附近很干净。');
  S.sfx('cry'); await S.narr('白猫冲着' + kDirWord(g.px - W.pl.px, g.py - W.pl.py) + '边弓起了背，喉咙里滚出一声低吼。\n那东西停住了。');
  S.freeze(g.id, true); S.after(3200, async S => S.freeze(g.id, false)); }
/* 布偶：每夜挡一次抓（章节里 chase 加 nodoll:true 的不挡） */
{ const _chase = SAPI.chase;
  SAPI.chase = function (id, o = {}) {
    kDm(DMP.chase, { n: 3 });
    if (o.nodoll || !kDollHave()) return _chase.call(this, id, o);
    const orig = o.catch, opts = Object.assign({}, o);
    opts.catch = async S => {
      if (W.f._doll || !kDollHave()) return (orig || (S => S.die(o.msg || '你被抓住了……')))(S);
      W.f._doll = 1; KST.doll = 1; const e = getEnt(id); S.sfx('tear'); S.shake(300, 2);
      await S.narr('领口里的布偶猛地一挣。\n那东西的手，像是被什么烫了一下。');
      const p = W.pl, m = curMap(), dx = Math.sign(p.x - e.x) || 1, dy = Math.sign(p.y - e.y);
      for (let k = 3; k >= 1; k--) { const nx = p.x + dx * k, ny = p.y + dy * k; if (passable(m, nx, ny, p)) { S.pos(nx, ny, p.dir); break; } }
      kDm(DMP.calm, { n: 2 }); S.freeze(id, true); await S.wait(200); S.freeze(id, false);
      e.chase = null; setTimeout(() => { if (W && !W.ended && getEnt(id) && !getEnt(id).hidden) _chase.call(SAPI, id, opts); }, 1800);
      S.toast('布偶替你挡了一次（今晚只有一次）'); };
    return _chase.call(this, id, opts); }; }

/* ---------- 3. 大战开场卡 ---------- */
let KEPIC = null, KEPW = null;
async function kEpic(S, o) {
  KEPIC = o; KEPW = { id: o.id, phase: o.phase, low: o.low, said: false, ids: o.ids || (o.id ? [o.id] : []) };
  kLog('', '【' + o.seal + '】' + o.name);
  try { await S.card(o.name, o.sub || '', (o.intro || []).join('\n')); } finally { KEPIC = null; }
  kDm(['大的来了', '前方高能', 'BOSS 战！', '主播稳住啊'], { n: 3, cls: 'w' }); }
function kShout(t, ms = 2200) { const d = document.getElementById('kshout'); if (!d) return; d.textContent = t; d.style.opacity = 1; clearTimeout(d._t); d._t = setTimeout(() => d.style.opacity = 0, ms); kLog('', t); }
function kEpicLow(S) { if (KEPW && KEPW.low) { kShout(KEPW.low, 2600); kDm(DMP.win, { n: 3, cls: 'g' }); } KEPW = null; }

/* ---------- 4. 镜子：照出你，还会慢半拍 ---------- */
const KMIR = [];
function kMirState(lag) { if (!KMIR.length) return null; if (!lag) return KMIR[KMIR.length - 1]; const t = RT - lag; for (let i = KMIR.length - 1; i >= 0; i--) if (KMIR[i].t <= t) return KMIR[i]; return KMIR[0]; }
/* 在镜面区域（屏幕坐标 gx,gy,gw,gh）里画倒影。e.lag 秒数（慢半拍）、e.stare（不管你怎么动都盯着你）、e.smile（在笑）、e.empty（照不出你）、e.other（照出别的人，人物 id） */
function kReflect(g, e, gx, gy, gw, gh) {
  if (!W || !W.pl || e.empty) return; const st = kMirState(e.lag || 0); if (!st) return;
  const relX = (st.px - e.px) / TS, relY = (st.py - e.py) / TS; if (Math.abs(relX) > 2.2 || relY < 0 || relY > 4.5) return;
  const P = e.other ? sprOf('@' + e.other) : sprOf(st.spr || '@me'); if (typeof P !== 'object') return;
  const d = e.stare ? 0 : st.dir === 3 ? 0 : st.dir === 0 ? 3 : st.dir, c = personSprite(P, d, e.stare ? 0 : st.fr || 0);
  const sc = Math.min(gw / 16, gh / 22) * (1 - relY * .06), w = 16 * sc, h = 24 * sc, x = gx + gw / 2 - w / 2 + relX * gw * .35, y = gy + gh - h * .82 + relY * .6;
  g.save(); g.beginPath(); g.rect(gx, gy, gw, gh); g.clip(); g.globalAlpha = (g.globalAlpha || 1) * .78; g.drawImage(c, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  if (e.smile) { g.globalAlpha = .95; g.fillStyle = '#5a0a0e'; const fy = y + h * .27, fx = x + w * .3; g.fillRect(Math.round(fx), Math.round(fy), Math.max(2, Math.round(w * .4)), 1); g.fillRect(Math.round(fx - 1), Math.round(fy - 1), 1, 1); g.fillRect(Math.round(fx + w * .4), Math.round(fy - 1), 1, 1); }
  g.restore(); }
{ const _m = SPR.mirror; SPR.mirror = function (g, e, t, R) { _m(g, e, t, R); if (!e.covered && !e.face) kReflect(g, e, e.sx + 4, e.sy, 8, 12); }; }

/* ---------- 5. 回忆滤镜（也给阴瞳用） ---------- */
function kRecallOn(kind, title) { const d = document.getElementById('krec'); if (!d) return; d.className = 'on ' + kind; d.querySelector('.lb').textContent = title || ''; d.querySelector('.ts').textContent = kind === 'tale' ? '▶ PLAY  ' + ['05:14:22', '00:47:09', '23:58:31'][(Math.random() * 3) | 0] : ''; document.body.classList.remove('krec-dream', 'krec-past', 'krec-tale', 'krec-yin'); document.body.classList.add('krec-' + kind); kLog('', '（' + (title || kind) + '）'); }
function kRecallOff() { const d = document.getElementById('krec'); if (d) d.className = ''; document.body.classList.remove('krec-dream', 'krec-past', 'krec-tale', 'krec-yin'); }
/* 一段回忆：切到回忆用的地图（在章节 maps 里，名字 o.map），演完回到原处 */
async function kRecall(S, kind, title, o, fn) {
  const back = [W.mapId, W.pl.x, W.pl.y, W.pl.dir], hid = W.pl.hidden;
  await S.fade(1, 500); kRecallOn(kind, ({ dream: '梦 · ', past: '往事 · ', tale: '传闻 · ' })[kind] + title);
  S.hidePlayer(true); await S.go(o.map, o.x ?? 1, o.y ?? 2, 0, { fade: false }); if (o.focus) S.focus(o.focus[0], o.focus[1]);
  await S.fade(0, 500);
  try { await fn(S); } finally {
    await S.fade(1, 500); kRecallOff(); S.focus(null); S.hidePlayer(hid); await S.go(back[0], back[1], back[2], back[3], { fade: false }); await S.fade(0, 500); } }

/* ---------- 8. 评价 ---------- */
let KST = { deaths: 0, aids: {}, doll: 0 };
function kResetRun() { KLOG = []; KST = { deaths: 0, aids: {}, doll: 0 }; KEPW = null; KMIR.length = 0; kRecallOff(); }
{ const _die = SAPI.die; SAPI.die = async function (t, ti) { KST.deaths++; kLog('', '（' + (ti || '死了') + '）' + (t || '')); kDm(['主播？？', '黑屏了？', '不会吧……', '刷个 1 祈祷'], { n: 3, cls: 'w' }); return _die.call(this, t, ti); }; }
function kGrade(kind) {
  if (kind === 'skip') return { g: 'C', why: '跳过了这一夜' };
  const f = (W && W.f) || {}, bad = [], d = KST.deaths;
  if (f.k_fail) bad.push('没做完'); if (f.k_seen) bad.push('被发现了'); if (f.k_spoke) bad.push('开了口');
  let s = d === 0 ? 3 : d <= 2 ? 2 : 1; if (bad.length) s--; s = Math.max(0, s);
  const why = (d ? '死过 ' + d + ' 次' : '一次都没死') + (bad.length ? '，' + bad.join('、') : '') + (KST.doll ? '，布偶挡过一次' : '');
  return { g: ['C', 'B', 'A', 'S'][s], why }; }

/* ---------- 每帧 ---------- */
{ const _ht = hostTick;
  hostTick = function (dt) {
    const mask = W && W.kMask > W.t; let h; if (mask) { h = W.pl.hidden; W.pl.hidden = true; }
    _ht(dt); if (mask && W) W.pl.hidden = h; if (!W) return;
    const p = W.pl; KMIR.push({ t: RT, px: p.px, py: p.py, dir: p.dir, fr: p.fr, spr: p.spr }); while (KMIR.length > 2 && RT - KMIR[0].t > 3) KMIR.shift();
    if (KDM.on && !W.ended) { KDM.t -= dt; if (KDM.t <= 0) { KDM.t = 5 + Math.random() * 6; kDm((W.ch.danmu || []).concat(DMP.idle), { log: false }); } }
    if (KEPW && KEPW.phase && !KEPW.said) { const es = KEPW.ids.map(id => getEnt(id)).filter(e => e && !e.hidden); if (es.some(e => kDist(e, p) <= 3)) { KEPW.said = true; kShout(KEPW.phase, 2400); kDm(DMP.chase, { n: 2, cls: 'w' }); } }
    const b = document.getElementById('hAid'); if (b) { const on = kAidsHave().length > 0; if (on === b.classList.contains('hidden')) b.classList.toggle('hidden', !on); }
  }; }
function kStartRun(id) { kDmInit(); kResetRun(); const ch = (typeof CHAPTERS !== 'undefined' && CHAPTERS.find(c => c.id === id)) || (W && W.ch) || {}; KDM.on = !!(KENV.live || ch.live); KDM.t = 2; const L = document.getElementById('klive'); if (L) { L.style.display = KDM.on ? '' : 'none'; L.querySelector('b').textContent = KENV.liveHot ? (KENV.liveHot >= 10000 ? (KENV.liveHot / 10000).toFixed(1) + ' 万' : KENV.liveHot) + ' 人' : ''; } }
{ const _sc = startChapter; startChapter = function (id, fromCp) { kStartRun(id); return _sc(id, fromCp); }; }   // 不管是恐怖屋打开的还是测试页直接开的，都先准备好弹幕层、清空记录
