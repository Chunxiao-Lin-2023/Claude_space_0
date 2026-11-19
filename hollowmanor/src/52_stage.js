/* ================= pixel theater (floor intros / ending), jump scares, "wrong details" =================
   Scenes play locally on each screen over the live game view: letterbox bars, a speaker plate, typed lines.
   Input is held while a scene runs; E / click / tap advances, Esc skips. The house keeps breathing behind it. */
const STAGE = { sc: null, i: 0, t0: 0, typed: 0, held: false, fx: [], nextOdd: 30, lastFace: -99 };
const SPEAK = { 旁白: '#cfc3ae', 阿岩: '#ffcf6b', 小雾: '#8fd3ff', 温夫人: '#d8a8ff', '???': '#ff8a8a' };
const SCENES = {
  f0: [
    { who: '旁白', t: '雨夜。山路塌了，你们只能躲进路边这座黑着灯的老宅。', fx: 'thunder' },
    { who: '旁白', t: '身后的大门「砰」地一声合上了。', fx: 'slam' },
    { who: '阿岩', t: '……锁死了。手机也没信号。' },
    { who: '小雾', t: '这里不止我们两个。我听得见，有人在楼上哭。', fx: 'whisper' },
    { who: '旁白', t: '楼梯口亮起一圈紫色的灵封，像一只睁开的眼睛。', fx: 'flicker', cam: 'gate' },
    { who: '阿岩', t: '那就先把这层弄清楚。跟紧我的手电。' },
  ],
  f1: [
    { who: '旁白', t: '二楼比楼下更冷。走廊的地毯湿漉漉的，像刚有人赤着脚走过。', fx: 'water' },
    { who: '小雾', t: '镜子……这一层的镜子都在看着我们。' },
    { who: '???', t: '（门后传来指甲划过木头的声音）', fx: 'scrape' },
    { who: '阿岩', t: '别盯着看。找到它怕的东西，然后上楼。' },
  ],
  f2: [
    { who: '旁白', t: '阁楼的门在身后合拢。一盏接一盏，油灯自己熄灭了。', fx: 'snuff' },
    { who: '温夫人', t: '你们终于上来了。', fx: 'boss', cam: 'boss' },
    { who: '温夫人', t: '这座宅子里的每一个人，都是我留下的。你们也一样。', fx: 'scare' },
    { who: '小雾', t: '她的镇物就在这一层……毁掉它们，她就留不住任何人。' },
    { who: '阿岩', t: '先点灯。她怕光。' },
  ],
  end: [
    { who: '旁白', t: '法阵的光一点点暗下去。温夫人的身影散成了灰。', fx: 'flash' },
    { who: '小雾', t: '……她们都走了。哭声停了。' },
    { who: '旁白', t: '屋顶的天窗外，雨停了。东边的天空泛起了白。' },
    { who: '阿岩', t: '走吧。天亮了。' },
  ],
};
function playScene(id) {
  if (window.__dbg && window.__dbg.noStage) return;
  STAGE.sc = SCENES[id]; STAGE.id = id; STAGE.i = -1; STAGE.held = true; nextLine();
}
function nextLine() {
  STAGE.i++; STAGE.t0 = performance.now() / 1000; STAGE.typed = 0;
  const L = STAGE.sc && STAGE.sc[STAGE.i];
  if (!L) { STAGE.sc = null; STAGE.held = false; STAGE.cam = null; return; }
  if (L.fx === 'thunder') { R3.flash = 1; R3.flash2 = 0.4; setTimeout(() => sfx('thunder'), 400); }
  if (L.fx === 'slam') { sfx('slam'); R3.shake = 1; }
  if (L.fx === 'whisper') sfx('whisper');
  if (L.fx === 'water') sfx('water');
  if (L.fx === 'scrape') { sfx('scrape'); R3.shake = 0.4; }
  if (L.fx === 'snuff') { sfx('snuff'); setTimeout(() => sfx('snuff'), 500); setTimeout(() => sfx('snuff'), 1000); }
  if (L.fx === 'flicker') { STAGE.flick = 1.2; sfx('buzz'); }
  if (L.fx === 'boss') { sfx('bossLaugh'); STAGE.bossShow = 3.5; }
  if (L.fx === 'scare') scare('boss', true);
  if (L.fx === 'flash') { R3.flash = 1; R3.flash2 = 0.9; }
  STAGE.cam = L.cam || null;
}
function stageKey(k) { if (!STAGE.sc) return false; if (k === 'Escape') { STAGE.i = STAGE.sc.length; nextLine(); } else lineAdvance(); return true; }
function lineAdvance() { const L = STAGE.sc && STAGE.sc[STAGE.i]; if (!L) return; if (STAGE.typed < L.t.length) STAGE.typed = L.t.length; else nextLine(); }
/* jump scare: a full-screen face for ~0.45 s (falls back to a red flash + heartbeat when scares are switched off) */
function scare(kind, force) {
  const now = performance.now() / 1000;
  if (!force && now - STAGE.lastFace < 50) return; STAGE.lastFace = now;
  if (SET.scare === false) { STAGE.fx.push({ k: 'red', t0: now, dur: 0.6 }); sfx('heart'); return; }
  STAGE.fx.push({ k: 'face', kind, t0: now, dur: 0.48 }); sfx('stinger'); R3.shake = Math.max(R3.shake, 1.4);
}
/* small "wrong" things that happen to the local player now and then (never during a hunt) */
function oddTick(W, me, dt) {
  if (!W || W.menu || STAGE.sc || W.phase !== 'play') return;
  STAGE.nextOdd -= dt; if (STAGE.nextOdd > 0) return; STAGE.nextOdd = rrLocal(35, 80);
  if (W.g && (W.g.st === 'hunt' || W.g.st === 'warn')) return;
  const now = performance.now() / 1000, kinds = me.role === 'L' ? ['figure', 'eyes', 'steps', 'hand'] : ['eyes', 'whisper', 'hand', 'steps'], k = kinds[Math.floor(Math.random() * kinds.length)];
  if (k === 'steps') { sfx('steps', me.x + rrLocal(-3, 3), me.z - 3, 0.7); return; }
  if (k === 'whisper') { sfx('whisper'); STAGE.fx.push({ k: 'text', t0: now, dur: 2.4, s: pick2(['……别回头……', '……留下来……', '……她在看你……', '……这是我的房间……'], (now * 7) | 0), x: me.x + rrLocal(-1.5, 1.5), z: me.z - rrLocal(0.5, 2) }); return; }
  // pick a dark spot a few metres away that the player can see
  for (let n = 0; n < 12; n++) { const a = (me.role === 'L' ? me.aim : rrLocal(0, TAU)) + rrLocal(-0.3, 0.3), d = rrLocal(3.5, 7.5), x = me.x + Math.cos(a) * d, z = me.z + Math.sin(a) * d; if (roomAt(x, z) < 0 || !los(me.x, me.z, x, z, W)) continue; STAGE.fx.push({ k, t0: now, dur: k === 'figure' ? 0.3 : k === 'eyes' ? 1.6 : 2.2, x, z }); if (k === 'figure') sfx('creak', x, z, 0.6); return; }
}
function drawStage(g, t, dt) {
  const VW = R3.VW, VH = R3.VH, now = performance.now() / 1000;
  // queued effects
  STAGE.fx = STAGE.fx.filter(f => now - f.t0 < f.dur);
  for (const f of STAGE.fx) {
    const k = (now - f.t0) / f.dur;
    if (f.k === 'face') { const s = faceSprite(f.kind), sz = Math.round(Math.min(VW, VH) * 0.8 / 32) * 32, X = ((VW - sz) >> 1) + Math.round((Math.random() - 0.5) * 6), Y = ((VH - sz) >> 1) + Math.round((Math.random() - 0.5) * 6); g.fillStyle = '#000'; g.fillRect(0, 0, VW, VH); g.imageSmoothingEnabled = false; g.drawImage(s, X, Y, sz, sz); g.fillStyle = 'rgba(0,0,0,.5)'; for (let y = 0; y < VH; y += 3) g.fillRect(0, y, VW, 1); if (k > 0.7) { g.fillStyle = `rgba(255,255,255,${(k - 0.7) * 2})`; g.fillRect(0, 0, VW, VH); } }
    if (f.k === 'red') { g.fillStyle = `rgba(160,0,10,${0.45 * (1 - k)})`; g.fillRect(0, 0, VW, VH); }
    if (f.k === 'figure') { const s = ghostSprite('faceless', 0, 0, false); g.globalAlpha = 0.7 * (1 - k); g.drawImage(tintedCache(s, '#06060a'), Math.round(wx(f.x) - GW / 2), Math.round(wy(f.z) - GH + 2)); g.globalAlpha = 1; }
    if (f.k === 'eyes') { const X = Math.round(wx(f.x)), Y = Math.round(wy(f.z, 1.3)), blink = Math.sin(k * 20) > 0.85; if (!blink) { g.fillStyle = `rgba(255,${k > 0.6 ? 60 : 230},${k > 0.6 ? 60 : 230},${0.85 * (1 - k * 0.5)})`; g.fillRect(X - 3, Y, 2, 1); g.fillRect(X + 2, Y, 2, 1); } }
    if (f.k === 'hand') { const X = Math.round(wx(f.x)), Y = Math.round(wy(f.z, 1.1)), R = RP(g, X, Y); g.globalAlpha = Math.min(1, (1 - k) * 2); R(-2, -3, 4, 5, '#6a0a10'); for (let i = 0; i < 4; i++) R(-2 + i, -6 - (i === 1 || i === 2 ? 1 : 0), 1, 3, '#6a0a10'); R(-1, 2, 1, 4 + Math.round(k * 6), '#4a060a'); g.globalAlpha = 1; }
    if (f.k === 'text') { g.globalAlpha = Math.sin(k * PI) * 0.85; g.fillStyle = '#b8d8ff'; g.font = '8px serif'; g.textAlign = 'center'; g.fillText(f.s, Math.round(wx(f.x)), Math.round(wy(f.z, 1.8))); g.textAlign = 'left'; g.globalAlpha = 1; }
  }
  if (STAGE.flick > 0) { STAGE.flick -= dt; if (Math.random() < 0.4) { g.fillStyle = 'rgba(0,0,0,.75)'; g.fillRect(0, 0, VW, VH); } }
  if (STAGE.bossShow > 0) { STAGE.bossShow -= dt; const W = STAGE.W; if (W && W.g) { const s = ghostSprite('boss', 0, Math.floor(t * 3) % 4, false); g.globalAlpha = Math.min(1, STAGE.bossShow) * 0.9; g.drawImage(s, Math.round(wx(W.g.x) - GW / 2), Math.round(wy(W.g.z) - GH + 2)); g.globalAlpha = 1; } }
  // the scene itself
  const L = STAGE.sc && STAGE.sc[STAGE.i]; if (!L) return;
  const bar = Math.round(VH * 0.12); g.fillStyle = '#000'; g.fillRect(0, 0, VW, bar); g.fillRect(0, VH - bar, VW, bar);
  STAGE.typed = Math.min(L.t.length, STAGE.typed + dt * 22);
  const el = now - STAGE.t0; if (STAGE.typed >= L.t.length && el > 1.6 + L.t.length * 0.09) nextLine();
}
/* scene text is drawn in the DOM (crisp CJK at any scale); the canvas only does bars and effects */
function stageDOM() {
  const box = document.getElementById('stageBox'); if (!box) return;
  const L = STAGE.sc && STAGE.sc[STAGE.i];
  document.body.classList.toggle('stageOn', !!L);
  if (!L) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  box.querySelector('b').textContent = L.who === '旁白' ? '' : L.who; box.querySelector('b').style.color = SPEAK[L.who] || '#fff';
  box.querySelector('p').textContent = L.t.slice(0, Math.floor(STAGE.typed)); box.querySelector('p').style.fontStyle = L.who === '旁白' ? 'italic' : 'normal';
}
