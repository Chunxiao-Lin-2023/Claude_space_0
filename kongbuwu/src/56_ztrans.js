/* ===== 换地点的过场（RULES 38）=====
   同一区域走过去：画面渐暗 → 脚步声 → 地点名 + 一句副标题 → 渐亮（约 1.2 秒）。夜里、凶地的地点名是红的。
   打车去别的区域：黑屏，窗外的路灯一道道往后退，引擎声，一句路上的话 → 区域名 + 副标题（约 2.6 秒）。
   点一下跳过；设置里关掉动画就没有过场；测试副本默认不放（__dbg.trans 打开）。双人模式下队友那边也会放。 */
const PTR_MS = { walk: [320, 520, 420], taxi: [420, 1700, 560] };
const PTR_TAXI = {
  park: ['车窗外的游乐场灯牌，一块一块地暗下去。', '司机放着收音机。新闻在说，西郊又有人失踪了。'],
  pingan: ['越往西郊开，路灯越少。', '司机问你去平安公寓干嘛。你说回家。他就不说话了。'],
  xicheng: ['司机说那学校封了四年了。说完从后视镜里看了你一眼。', '西城的路很新。新得像是没有人走过。'],
  muyang: ['第一辆出租车听到地名就拒载了。', '车开到荒地边上就停了。司机说：再往前，我的车进不去。'],
  haiming: ['海明公寓的方向，有一扇窗户一直亮着。', '司机说那栋楼的租金便宜得不正常。'],
  kangfu: ['出了城，路两边只剩下荒草。', '司机把收音机开得很大。像是怕听见别的声音。']
};
const PTR_NIGHT = ['夜里的路很长。', '你一路都没碰见人。', '有一盏路灯，在你走过以后才灭。'];
let ptrBusy = false, ptrSkip = false;
const ptrOn = () => animOn() && !(window.__dbg && !__dbg.trans);
function ptrEl() { let e = $('#ptr'); if (!e) { e = el('div', '', '<div class="pt-road"></div><div class="pt-box"><div class="pt-t"></div><div class="pt-s"></div><div class="pt-n"></div></div>'); e.id = 'ptr'; e.onclick = () => { ptrSkip = true; }; document.body.appendChild(e); } return e; }
const ptrWait = ms => new Promise(r => { const t0 = performance.now(), f = () => (ptrSkip || performance.now() - t0 >= ms) ? r() : requestAnimationFrame(f); f(); });
/* 只放画面（队友那边也用这个） */
async function ptrShow(o, mid) { const e = ptrEl(), [a, b, c] = PTR_MS[o.kind] || PTR_MS.walk; ptrSkip = false;
  e.className = 'on ' + o.kind + (o.red ? ' red' : ''); e.querySelector('.pt-t').textContent = o.title || ''; e.querySelector('.pt-s').textContent = o.sub || ''; e.querySelector('.pt-n').textContent = o.note || '';
  void e.offsetWidth; e.classList.add('in'); ptrSound(o); await ptrWait(a); if (mid) mid(); e.classList.add('show'); await ptrWait(b); e.classList.remove('in'); e.classList.add('out'); await ptrWait(c); e.className = ''; }
function ptrSound(o) { if (o.kind === 'taxi') { sfx('door'); V({ type: 'sawtooth', f0: 52, f1: 58, dur: 2.2, vol: .05, lp: 260, att: .4 }); V({ noise: 1, lp: 380, dur: 2.2, vol: .05, att: .4 }); setTimeout(() => sfx('door'), 2200); return; }
  sfx('steps'); setTimeout(() => sfx('steps'), 380); if (o.red) setTimeout(() => sfx(pick(['wind', 'drip', 'creak'])), 520); }
async function ptrPlay(o, mid) { if (ptrBusy) return; ptrBusy = true; try { if (typeof coopFx === 'function') coopFx({ f: 'ptr', o }); await ptrShow(o, mid); } finally { ptrBusy = false; } }
function ptrWalk(to) { const P = PLACES[to], night = isNight(), scary = !P.town && P.area !== 'park'; return { kind: 'walk', title: P.name, sub: AREAS[P.area].name + (night ? ' · 夜里' : ''), note: night && scary && chance(.5) ? pick(PTR_NIGHT) : '', red: night && scary }; }
/* 点出口走过去 */
async function goT(to) { if (ptrBusy) return; if (!ptrOn() || STATE.scene || STATE.battle || STATE.busy || !exitsOf(C.loc).some(e => e[1] === to)) return go(to); await ptrPlay(ptrWalk(to), () => go(to)); }
/* 打车 */
{ const _tr = travel; travel = async function (area) { if (ptrBusy) return; if (!ptrOn() || STATE.scene || STATE.battle || STATE.busy || !AREAS[area] || !ENTRY[area] || !areasOpen().includes(area) || PLACES[C.loc].area === area) return _tr(area);
    const L = PTR_TAXI[area] || ['车窗外的路灯，一盏一盏往后退。']; await ptrPlay({ kind: 'taxi', title: AREAS[area].name, sub: AREAS[area].sub, note: isNight() ? pick(L.concat(['司机从后视镜里看了你好几眼。'])) : pick(L), red: isNight() && area !== 'park' }, () => _tr(area)); }; }
{ const _th = travelHome; travelHome = async function () { if (ptrBusy) return; if (!ptrOn() || STATE.scene || STATE.battle) return _th(); await ptrPlay({ kind: 'taxi', title: AREAS.park.name, sub: AREAS.park.sub, note: pick(PTR_TAXI.park) }, () => _th()); }; }
/* 点地图自动走：同一区域的一段算一次走路过场，跨区域那一步是打车过场 */
{ const _aw = autoWalk; autoWalk = async function (to) { if (!ptrOn() || ptrBusy) return _aw(to); if (STATE.scene || STATE.battle) return false; const r = route(C.loc, to); if (!r) { toast('现在还去不了那里'); return false; } if (!r.length) return true;
    const segs = []; let cur = []; for (const s of r) { if (s[0] === '>') { if (cur.length) segs.push(cur); segs.push(s); cur = []; } else cur.push(s); } if (cur.length) segs.push(cur);
    for (const sg of segs) { if (STATE.scene || STATE.battle) return false; if (typeof sg === 'string') { await travel(sg.slice(1)); continue; }
      const last = sg[sg.length - 1]; let ok = true; await ptrPlay(ptrWalk(last), () => { for (const s of sg) { if (STATE.scene || STATE.battle || !go(s, s !== last)) { ok = false; break; } } }); if (!ok) return false; }
    return C.loc === to; }; }
