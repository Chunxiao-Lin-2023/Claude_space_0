/* ===== 慢热工具（RULES 37，暮阳中学样板）=====
   1. 环境音分层：新环境音 rainin（室内闷着的雨）/ rainwin（雨打窗）/ hall（空走廊）/ pipes（水管）/ hush（几乎无声，耳鸣）/ storm（暴雨 + 远雷）/ hill（山上的雨和风）
   2. 紧张层 S.dread(0–3)：一层独立的低频垫音，和环境音叠在一起：1 低频嗡鸣，2 加不和谐的高音和气声，3 加心跳样的脉动
   3. 每张地图 sounds: [[音效, 最短秒, 最长秒], …]：随机的环境声（滴水、远处脚步、门吱呀）；storm: [最短, 最长] 自动闪电
   4. kFlash(S, ids)：闪电——白光一闪，地图一下子亮，flashOnly 的东西只在这一瞬间看得见，0.6–1.6 秒后才打雷
   5. 慢热章节（ch.slow）：弹幕跟着紧张度从稀稀拉拉到刷屏（ch.dmq = [平静, 不安, 慌]），「灵」按钮紧张度到 2 才能用 */
const KSFX = {
  thunder() { const N = this.noise.bind(this); N(.3, .22, 'bandpass', 1400, 400, 1); N(2.6, .34, 'lowpass', 200, 55, .7, .05); N(1.4, .22, 'lowpass', 420, 120, .8, .1); },
  thunderfar() { this.noise(3.2, .16, 'lowpass', 130, 45, .7); },
  farstep() { for (let i = 0; i < 3; i++) this.noise(.07, .025, 'lowpass', 380, 200, 1, i * .45); },
  run2() { for (let i = 0; i < 7; i++) { this.noise(.05, .04, 'lowpass', 520, 260, 1, i * .2); this.noise(.05, .032, 'lowpass', 460, 240, 1, i * .2 + .1); } },
  creak() { this.tone('sawtooth', 190, 120, .9, .022, 0, 700); this.tone('sawtooth', 260, 180, .7, .012, .12, 900); },
  pipe() { this.tone('square', 140, 128, .09, .045, 0, 600); this.noise(.12, .05, 'bandpass', 800, 600, 4); this.tone('square', 140, 128, .09, .015, .32, 500); },
  chalk() { this.noise(.45, .05, 'bandpass', 3300, 2600, 9); this.noise(.3, .04, 'bandpass', 3700, 3100, 9, .55); },
  desk() { this.noise(.38, .08, 'lowpass', 650, 200, 1); this.tone('sawtooth', 92, 70, .32, .028, 0, 300); },
  flap() { this.noise(.16, .2, 'lowpass', 900, 300, 1); this.tone('square', 82, 50, .12, .05); this.noise(.12, .08, 'lowpass', 700, 300, 1, .25); },
  breathe() { this.noise(1.1, .045, 'bandpass', 900, 700, 1.2); this.noise(1.2, .035, 'bandpass', 720, 600, 1.2, 1.35); },
  bellsch() { for (let i = 0; i < 22; i++) { const f = 1150 - Math.max(0, i - 12) * 38; this.tone('square', f, f, .055, .018, i * .075, 2400); } this.tone('sine', 300, 180, 1.4, .03, 1.6); },
  hum() { [[523, 0], [466, .5], [440, 1], [415, 1.5]].forEach(([f, d]) => this.tone('sine', f, f * .99, .5, .028, d)); },
  drop() { this.noise(.25, .18, 'lowpass', 1200, 300, 1); this.tone('square', 220, 90, .15, .05, .05); this.noise(.2, .12, 'bandpass', 2000, 800, 2, .18); this.noise(.15, .08, 'bandpass', 1500, 700, 2, .36); },
  rainhit() { this.noise(.7, .08, 'highpass', 2200, 2600, .6); },
  shovel() { this.noise(.18, .12, 'bandpass', 1500, 700, 2); this.tone('square', 300, 200, .05, .03); },
  stone() { this.tone('square', 600, 580, .05, .06); this.tone('sine', 1200, 1150, .5, .04); },
  clock() { this.tone('square', 2400, 2400, .015, .02, 0, 3500); this.tone('square', 2000, 2000, .015, .016, .5, 3500); },
  doorslam() { this.noise(.25, .25, 'lowpass', 700, 150, 1); this.tone('sine', 70, 40, .3, .2); },
  heartslow() { this.tone('sine', 55, 40, .16, .16); this.tone('sine', 50, 38, .14, .12, .22); }
};
{ const _sx = AU.sfx; AU.sfx = function (n) { const f = KSFX[n]; if (!f) return _sx.call(this, n); if (!this.ctx) return; const tn = now(); if (this.last[n] && tn - this.last[n] < 60) return; this.last[n] = tn; f.call(this); }; }
const KAMB = {
  rainin(h) { h.noi('lowpass', 380, .6, .13); const t = h.noi('bandpass', 1100, 2, .022); h.lfo(t.ng.gain, 1.7, .012, .02); h.osc('sine', 60, .028); },
  rainwin(h) { h.noi('highpass', 1900, .5, .05); h.noi('lowpass', 600, .6, .07); const t = h.noi('bandpass', 3200, 3, .02); h.lfo(t.ng.gain, 3.1, .015, .02); },
  hall(h) { h.osc('sine', 48, .06); const w = h.noi('bandpass', 420, 1.1, .05); h.lfo(w.fl.frequency, .06, 220, 420); h.noi('lowpass', 240, .6, .05); },
  pipes(h) { h.osc('sine', 100, .022); h.osc('sine', 150, .008); h.noi('lowpass', 220, .5, .035); },
  hush(h) { h.osc('sine', 31, .05); h.noi('highpass', 6500, .5, .004); h.osc('sine', 7400, .0025); },
  storm(h) { h.noi('highpass', 1100, .4, .11); h.noi('lowpass', 520, .6, .13); const r = h.noi('lowpass', 90, .7, .1); h.lfo(r.ng.gain, .05, .07, .08); const t = h.noi('bandpass', 2800, 2, .035); h.lfo(t.ng.gain, 2.3, .02, .03); },
  hill(h) { h.noi('highpass', 1300, .4, .08); h.noi('lowpass', 480, .6, .09); const w = h.noi('bandpass', 500, 1.2, .1); h.lfo(w.fl.frequency, .08, 260, 520); }
};
{ const _amb = AU.ambient; AU.ambient = function (name) { const B = KAMB[name]; if (!B) return _amb.call(this, name); if (name === this.ambName) return; this.ambName = name; const c = this.ctx; if (!c) return;
    const old = this.amb; this.amb = null; if (old) { old.g.gain.setTargetAtTime(0.0001, c.currentTime, .6); setTimeout(() => old.nodes.forEach(n => { try { n.stop(); } catch (e) { } }), 3000); }
    const g = c.createGain(); g.gain.value = 0.0001; g.connect(this.master); const nodes = [];
    const h = { osc: (type, f, vol, lp) => { const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = f; og.gain.value = vol; if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); fl.connect(og); } else o.connect(og); og.connect(g); o.start(); nodes.push(o); return { o, og }; },
      noi: (ft, f, Q, vol) => { const s = c.createBufferSource(), fl = c.createBiquadFilter(), ng = c.createGain(); s.buffer = this.nb; s.loop = true; fl.type = ft; fl.frequency.value = f; fl.Q.value = Q; ng.gain.value = vol; s.connect(fl); fl.connect(ng); ng.connect(g); s.start(0, Math.random()); nodes.push(s); return { s, fl, ng }; },
      lfo: (target, f, depth, base) => { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = f; lg.gain.value = depth; l.connect(lg); lg.connect(target); if (base != null) target.value = base; l.start(); nodes.push(l); } };
    B(h); g.gain.setTargetAtTime(1, c.currentTime, 1.1); this.amb = { g, nodes }; }; }
/* 紧张层：三层常驻节点，按等级淡入淡出 */
AU.dreadLv = 0;
AU.dread = function (lv) { this.dreadLv = lv; const c = this.ctx; if (!c) return;
  if (!this.dreadL) { const mk = () => { const g = c.createGain(); g.gain.value = 0.0001; g.connect(this.master); return g; }; const L = this.dreadL = [null, mk(), mk(), mk()];
    const osc = (g, type, f, vol) => { const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = f; og.gain.value = vol; o.connect(og); og.connect(g); o.start(); return og; };
    osc(L[1], 'sine', 36, .22); osc(L[1], 'sine', 38.4, .18); osc(L[1], 'triangle', 73, .03);
    osc(L[2], 'sine', 466.2, .012); osc(L[2], 'sine', 493.9, .01); { const s = c.createBufferSource(), fl = c.createBiquadFilter(), ng = c.createGain(); s.buffer = this.nb; s.loop = true; fl.type = 'bandpass'; fl.frequency.value = 700; fl.Q.value = 1.4; ng.gain.value = .03; s.connect(fl); fl.connect(ng); ng.connect(L[2]); s.start(); const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = .11; lg.gain.value = .025; l.connect(lg); lg.connect(ng.gain); l.start(); }
    { const og = osc(L[3], 'sine', 52, .0); const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 1.15; lg.gain.value = .2; l.connect(lg); lg.connect(og.gain); l.start(); } }
  [0, .9, .8, .9].forEach((v, i) => { if (i) this.dreadL[i].gain.setTargetAtTime(lv >= i ? v : 0.0001, c.currentTime, lv >= i ? 2.2 : 1.2); }); };
{ const _init = AU.init; AU.init = function () { const had = !!this.ctx; _init.call(this); if (!had && this.ctx && this.dreadLv) this.dread(this.dreadLv); }; }
{ const _ae = applyEmit; applyEmit = function (t, a) { if (t === 'dread') { AU.dread(a); return; } if (t === 'place') { kPlace(a); return; } return _ae(t, a); }; }
SAPI.dread = function (lv) { if (!W) return; if ((W.f._dread || 0) === lv) return; W.f._dread = lv; emit('dread', lv); };
/* 闪电 */
async function kFlash(S, ids, o = {}) { const map = W.mapId, d0 = W.mapDark[map]; ids = ids || []; S.fx('flash', { dur: o.dur || .35 }); S.dark(o.lit ?? .25); for (const id of ids) S.show(id); await S.wait(o.hold || 170); if (W.mapId === map) { S.dark(d0 ?? null); for (const id of ids) S.hide(id); }
  if (o.thunder !== false) S.after(o.delay ?? (600 + Math.random() * 1000), async S => S.sfx(o.far ? 'thunderfar' : 'thunder')); }
/* 每帧：随机环境声、自动闪电、慢热章节的弹幕节奏 */
{ const _ht = hostTick; hostTick = function (dt) { _ht(dt); if (!W || W.ended) return; const md = W.ch.maps && W.ch.maps[W.mapId]; W.kmood = W.kmood || {};
    if (md && md.sounds) { const T = W.kmood[W.mapId] = W.kmood[W.mapId] || md.sounds.map(s => s[1] + Math.random() * (s[2] - s[1])); md.sounds.forEach((s, i) => { T[i] -= dt; if (T[i] <= 0) { T[i] = s[1] + Math.random() * (s[2] - s[1]); emit('sfx', s[0]); } }); }
    if (md && md.storm && !W.busy) { const k = 'st_' + W.mapId; W.kmood[k] = (W.kmood[k] ?? (md.storm[0] + Math.random() * (md.storm[1] - md.storm[0]))) - dt; if (W.kmood[k] <= 0) { W.kmood[k] = md.storm[0] + Math.random() * (md.storm[1] - md.storm[0]); runScript(async S => kFlash(S, [], { far: Math.random() < .5 })); } }
    if (W.ch.slow && W.ch.dmq && KDM.on) { KDM.t = 99; const lv = W.f._dread || 0; W.kmood.dm = (W.kmood.dm ?? 3) - dt; if (W.kmood.dm <= 0) { W.kmood.dm = [16, 10, 5, 2.6][lv] + Math.random() * [10, 6, 3, 1.5][lv]; const q = W.ch.dmq[Math.min(2, Math.max(0, lv - 1))]; if (q && q.length) kDm(q, { log: false, n: lv >= 3 ? 2 : 1 }); } }
    if (W.ch.slow && (W.f._dread || 0) < 2) { const b = document.getElementById('hAid'); if (b && !b.classList.contains('hidden')) b.classList.add('hidden'); } }; }
{ const _ka = kAid; kAid = function () { if (W && W.ch.slow && (W.f._dread || 0) < 2) { UI.toast('还没到用的时候。'); return; } return _ka.apply(this, arguments); }; }
/* 开章 / 退出：紧张层归零 */
{ const _sc = startChapter; startChapter = function (id, fromCp) { AU.dread(0); const r = _sc(id, fromCp); if (W && W.f._dread) AU.dread(W.f._dread); return r; }; }
/* 地图进入次数：S.f['v_' + 地图] */
/* 换地图慢一点：脚步声 → 淡出 0.62 秒 → 第一次到有名字的地方，黑屏里浮出地名 → 淡入 0.65 秒（RULES 38）
   地图写 name: '教学楼 · 二楼' 就会显示；o.fade === false 或指定了 o.ms 的照旧 */
{ const _go = SAPI.go; SAPI.go = async function (map, x, y, dir, o = {}) { if (W) W.f['v_' + map] = (W.f['v_' + map] || 0) + 1; if (o.fade === false || o.ms || !W || !W.maps[map]) return _go.call(this, map, x, y, dir, o);
    const g = GEN, md = W.maps[map].def, name = md.name && !W.f['_pn_' + map] ? md.name : null;
    emit('sfx', 'step'); await SAPI.fade(1, 620); emit('sfx', 'step'); if (o.sfx) emit('sfx', o.sfx);
    const p = W.pl; W.mapId = map; p.x = x; p.y = y; p.px = x * TS; p.py = y * TS; p.mv = null; p.prev = [x, y]; if (dir != null) p.dir = dir;
    for (const e of W.maps[map].ents) if (e.follow && !e.hidden) { e.px = p.px; e.py = p.py; e.mv = null; }
    W.forceK++; lastPTile = map + ':' + x + ',' + y; W.camFocus = null; camUpdate(0, true); if (window.bldArrive) bldArrive(); if (md.amb) emit('amb', md.amb);
    if (name) { W.f['_pn_' + map] = 1; emit('place', name); await SAPI.wait(1000); } else await SAPI.wait(220);
    await SAPI.fade(0, 650); chk(g);
    if (md.enter) { const first = !W.f['_v_' + map]; W.f['_v_' + map] = true; await md.enter(SAPI, first); chk(g); } else W.f['_v_' + map] = true; }; }
function kPlace(name) { let e = document.getElementById('kplace'); if (!e) { e = document.createElement('div'); e.id = 'kplace'; document.body.appendChild(e); const st = document.createElement('style'); st.textContent = '#kplace{position:fixed;left:0;right:0;top:42%;text-align:center;font-family:"Songti SC","STSong",serif;font-size:22px;letter-spacing:.5em;text-indent:.5em;color:#e0d6c4;text-shadow:0 0 12px rgba(0,0,0,.9);opacity:0;pointer-events:none;z-index:60;transition:opacity .5s ease}#kplace.on{opacity:1}'; document.head.appendChild(st); }
  e.textContent = name; e.classList.add('on'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), 1300 / (typeof FAST !== 'undefined' ? FAST : 1)); }
