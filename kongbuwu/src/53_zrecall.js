/* —— 回忆 / 梦 / 传闻（RULES 28）——
   有人讲自己的梦、往事、听来的怪事时，小剧场切到“那段画面”，讲完再切回来。
   ^recall dream|past|tale [标题]   进入：现在台上的人、布景、效果先存起来，台上清空；
                                     说话的人只出声音（不自动上台），要上台的用 ^at / ^in 摆
   ^recall off                      回到现在（原样恢复）
   道具加 {"keep":1} 就不褪色（“整段发黄，只有那件红衣服还是红的”）。
   回忆里 ^out 的人不走开，是慢慢淡掉（记忆里的人是“没了”，不是“走了”）。
   dream = 梦（发蓝、水波一样晃、重影、浮着的光点）
   past  = 回忆（发黄的老胶片：颗粒、划痕、闪烁、上下黑边）
   tale  = 传闻（灰绿的旧录像：扫描线、一条往下走的噪声带）
   进入后要先 ^stage 换景，再 ^fx（换景会清掉效果）。对白框上会挂一个“梦 · 标题”的小牌子，纸也换颜色。 */
const REC_K = { dream: ['梦', 'reverse'], past: ['回忆', 'clock'], tale: ['传闻', 'static'] };
function stRecallCmd(p) { const k = p[1];
  if (k === 'off') { const s = (STG.recStack || []).pop(); const was = STG.rec; if (!s) { STG.rec = null; return; } Object.assign(STG, s.st); STG.rec = s.rec; STG.lastKey = stageKey(); if (SET.motion && was) { if (was.k === 'tale') STG.glitch = .35; else STG.flash = .5; } if (typeof renderDlg === 'function' && DLG.cur && !DLG.cur.choices) renderDlg(); return; }
  if (!REC_K[k]) return;
  (STG.recStack = STG.recStack || []).push({ rec: STG.rec, st: { over: STG.over, sc: STG.sc, fx: STG.fx, props: STG.props, mir: STG.mir, zoom: STG.zoom, remote: STG.remote, cam: STG.cam } });
  STG.rec = { k, lab: p.slice(2).join(' '), t0: STG.t }; STG.sc = []; STG.fx = {}; STG.props = {}; STG.mir = null; STG.zoom = null; STG.remote = new Set(); STG.lastKey = stageKey(); sfx(REC_K[k][1]); }
/* 对白框上的小牌子 */
function recBadge() { const R = STATE.scene && STG.rec; return R ? '<span class="recb r-' + R.k + '">' + REC_K[R.k][0] + (R.lab ? ' · ' + esc(R.lab) : '') + '</span>' : ''; }
function recBody() { const k = STATE.scene && STG.rec ? STG.rec.k : ''; if ((document.body.dataset.rec || '') === k) return; document.body.dataset.rec = k; for (const x in REC_K) document.body.classList.toggle('rec-' + x, x === k); }
/* 画在最上面（镜头推近之后、裁成手机画面之前）；vx/vw = 这一帧能看见的那一段 */
function stRecallDraw(g, vx, vw) { const R = STG.rec; if (!R) return; const t = STG.t - R.t0, mo = SET.motion, cx = vx + vw / 2;
  const T = STG.rt || (STG.rt = mk(SW, SH)), tg = T.getContext('2d'); tg.clearRect(0, 0, SW, SH); tg.drawImage(g.canvas, 0, 0);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  if (R.k === 'dream' && mo) { const amp = 1 + Math.max(0, 1.1 - t) * 5; for (let y = 0; y < SH; y += 2) { const dx = Math.round(Math.sin(y * .11 + STG.t * 1.7) * amp); if (dx) g.drawImage(T, 0, y, SW, 2, dx, y, SW, 2); } g.globalAlpha = .16; g.drawImage(T, 3, -1); g.globalAlpha = 1; }
  /* 去色 + 染色 */
  g.globalCompositeOperation = 'saturation'; g.globalAlpha = R.k === 'dream' ? .7 : R.k === 'tale' ? .72 : .95; g.fillStyle = '#808080'; g.fillRect(0, 0, SW, SH);
  g.globalCompositeOperation = 'color'; g.globalAlpha = R.k === 'past' ? .72 : R.k === 'dream' ? .5 : .2; g.fillStyle = R.k === 'past' ? '#a87c48' : R.k === 'dream' ? '#4a6ac0' : '#6aa08a'; g.fillRect(0, 0, SW, SH);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  /* 红色留下来（门后的房间、血）：老照片里也要看得出是红的 */
  if (STG.fx.red || (STAGES[stageKey()] || {}).red) { g.fillStyle = 'rgba(150,12,10,.3)'; g.fillRect(0, 0, SW, SH); }
  /* 椭圆暗角 */
  g.save(); g.translate(cx, SH / 2); g.scale(1, .62); const vg = g.createRadialGradient(0, 0, vw * .2, 0, 0, vw * .6); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, R.k === 'dream' ? 'rgba(4,8,24,.95)' : R.k === 'past' ? 'rgba(22,12,4,.85)' : 'rgba(0,0,0,.65)'); g.fillStyle = vg; g.fillRect(-SW, -SH * 2, SW * 2, SH * 4); g.restore();
  if (R.k === 'dream') { for (let i = 0; i < 14; i++) { const x = vx + ((hash(i, 41) * vw + STG.t * (4 + hash(i, 42) * 6)) % vw), y = SH - ((hash(i, 43) * SH + STG.t * (5 + hash(i, 44) * 7)) % SH), a = .25 + .3 * Math.sin(STG.t * 2 + i); g.fillStyle = 'rgba(190,210,255,' + a.toFixed(2) + ')'; g.fillRect(x | 0, y | 0, 1, 1); } }
  if (R.k === 'past') { if (mo) { g.fillStyle = 'rgba(0,0,0,' + (hash(Math.floor(STG.t * 12), 5) * .14).toFixed(3) + ')'; g.fillRect(0, 0, SW, SH);
      for (let i = 0; i < 34; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,238,200,.35)' : 'rgba(0,0,0,.45)'; g.fillRect((vx + Math.random() * vw) | 0, (Math.random() * SH) | 0, 1, 1); }
      const sk = Math.floor(STG.t * 5); if (hash(sk, 9) > .5) { g.fillStyle = 'rgba(232,216,180,.28)'; g.fillRect((vx + hash(sk, 11) * vw) | 0, 0, 1, SH); } }
    g.fillStyle = '#000'; g.fillRect(0, 0, SW, 7); g.fillRect(0, SH - 7, SW, 7); }
  if (R.k === 'tale') { g.fillStyle = 'rgba(0,0,0,.2)'; for (let y = 0; y < SH; y += 2) g.fillRect(0, y, SW, 1);
    if (mo) { const by = ((STG.t * 24) % (SH + 24)) - 12; for (let y = Math.max(0, by | 0); y < Math.min(SH, (by | 0) + 5); y++) g.drawImage(T, 0, y, SW, 1, Math.round((Math.random() - .5) * 8), y, SW, 1); for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(220,230,220,' + (Math.random() * .4).toFixed(2) + ')'; g.fillRect((vx + Math.random() * vw) | 0, (by + Math.random() * 6) | 0, 2, 1); } } }
  /* 进来的那一下 */
  if (mo && t < .7) { const k = 1 - t / .7;
    if (R.k === 'dream') { const bg = g.createRadialGradient(cx, SH / 2, 4, cx, SH / 2, vw * .7); bg.addColorStop(0, 'rgba(230,238,255,' + (k * .9).toFixed(2) + ')'); bg.addColorStop(1, 'rgba(120,140,200,' + (k * .5).toFixed(2) + ')'); g.fillStyle = bg; g.fillRect(0, 0, SW, SH); }
    else if (R.k === 'past') { if (Math.floor(t * 18) % 2 === 0) { g.fillStyle = 'rgba(0,0,0,' + (k * .9).toFixed(2) + ')'; g.fillRect(0, 0, SW, SH); } }
    else { for (let y = 0; y < SH; y += 1) { g.fillStyle = 'rgba(' + ((Math.random() * 200) | 0) + ',' + ((Math.random() * 210) | 0) + ',' + ((Math.random() * 200) | 0) + ',' + (k * .8).toFixed(2) + ')'; g.fillRect(0, y, SW, 1); } } }
  g.restore();
  /* {"keep":1} 的道具不褪色：整段回忆发黄发灰，只有它还是红的 */
  for (const id in STG.props) { const p = STG.props[id]; if (!p[3].keep || !SPR[p[0]]) continue; g.save(); const Z = STG.zoomT; if (Z) g.setTransform(Z.z, 0, 0, Z.z, -Z.sx * Z.z, -Z.sy * Z.z); else g.setTransform(1, 0, 0, 1, 0, 0);
    SPR[p[0]](g, Object.assign({ x: p[1], y: p[2] }, p[3]), STG.t, (x, y, w, h, c) => { if (!c) return; g.fillStyle = c; g.fillRect(p[1] * 16 + Math.floor(x), p[2] * 16 + Math.floor(y), Math.ceil(w), Math.ceil(h)); }); g.restore(); } }

/* 回忆里用到的人：都是通用像素小人，不照着原著或改编作品画 */
Object.assign(PPL, {
  父亲: P_({ hair: '#1c1a18', hs: 'short', top: '#5a5a6a', bottom: '#2a2a30' }), 母亲: P_({ hair: '#2a1a14', hs: 'bun', top: '#a86a5a', skirt: 1, bottom: '#4a3a3a' }),
  女儿: P_({ child: 1, hair: '#1a1416', hs: 'twin', top: '#e8b0c0', dress: 1 }), 儿子: P_({ child: 1, hair: '#1a1416', hs: 'short', top: '#4a8ac0', bottom: '#2a3048' }),
  王海明: P_({ skin: '#d8ccc0', hair: '#1a1614', hs: 'messy', top: '#6a6a5a', bottom: '#3a3a34' }), 王声龙: P_({ child: 1, skin: '#e6dcd6', hair: '#1a1614', hs: 'short', top: '#a8b8c8', bottom: '#a8b8c8' }),
  练舞的女孩: P_({ hair: '#141214', hs: 'bun', top: '#e8d0d8', dress: 1 }), 练舞的女孩乙: P_({ hair: '#1a1614', hs: 'bun', top: '#d8d8e8', dress: 1 }), 练舞的女孩丙: P_({ hair: '#141214', hs: 'bob', top: '#e8e0d0', dress: 1 }), 练舞的女孩丁: P_({ hair: '#2a1a14', hs: 'bun', top: '#d0e0d8', dress: 1 }),
  那个女孩: P_({ skin: '#ece4e0', hair: '#0e0c0c', hs: 'long', top: '#f0ece8', dress: 1 }), 那个男人: P_({ skin: '#d8c8b8', hair: '#1a1614', hs: 'short', top: '#2a2a30', bottom: '#1e1e22', tall: 1.15 }),
  男人: P_({ hair: '#141414', hs: 'short', top: '#3a3430', bottom: '#2a2420', hat: 'cap', hatC: '#2a2420' }), 孕妇: P_({ skin: '#e0d8d4', hair: '#1a1416', hs: 'messy', top: '#c8d0d8', dress: 1 }), 那个女人: P_({ skin: '#e0d8d4', hair: '#1a1416', hs: 'long', top: '#c8d0d8', dress: 1 }),
  孩子: P_({ child: 1, skin: '#ece6e2', hair: '#141214', hs: 'short', top: '#c8d0d8', bottom: '#c8d0d8', ghost: 1 }), 病人: P_({ skin: '#d8d0cc', hair: '#3a3430', hs: 'messy', top: '#a8b8c8', bottom: '#a8b8c8' }), 病人乙: P_({ skin: '#d8d0cc', hair: '#8a8a88', hs: 'short', top: '#a8b8c8', bottom: '#a8b8c8' }),
  陈医生: P_({ hair: '#1c1a18', hs: 'short', top: '#ecece8', coat: 1, bottom: '#2a2a30' }), 院长: P_({ skin: '#e0d4c8', hair: '#a8a8a4', hs: 'short', top: '#ecece8', coat: 1, bottom: '#3a3a40' }), 小门楠: P_({ child: 1, hair: '#2a2826', hs: 'messy', top: '#a8b8c8', bottom: '#a8b8c8' }),
  美丽的女人: P_({ sil: '#2a1e26', hs: 'long', dress: 1, ghost: 1 }), 毁容的男人: P_({ sil: '#2a2424', hs: 'messy', ghost: 1 }), 吴非: P_({ sil: '#141418', hs: 'short', tall: 1.1, ghost: 1 }),
  范郁的爸爸: P_({ hair: '#1c1a18', hs: 'short', top: '#4a5a4a', bottom: '#2a3028' }), 范郁的妈妈: P_({ hair: '#2a1a14', hs: 'long', top: '#8a6a7a', skirt: 1, bottom: '#3a3040' }),
  男生: P_({ hair: '#141214', hs: 'short', top: '#2e3e5e', top2: '#e8e8e8', bottom: '#2e3e5e' }), 男生乙: P_({ hair: '#1c1a18', hs: 'messy', top: '#2e3e5e', top2: '#e8e8e8', bottom: '#2e3e5e' }), 女生: P_({ hair: '#141214', hs: 'bob', top: '#2e3e5e', top2: '#e8e8e8', skirt: 1, bottom: '#2e3e5e' }), 女生乙: P_({ hair: '#2a1a14', hs: 'twin', top: '#2e3e5e', top2: '#e8e8e8', skirt: 1, bottom: '#2e3e5e' }), 王欣: P_({ hair: '#141214', hs: 'long', top: '#2e3e5e', top2: '#e8e8e8', skirt: 1, bottom: '#2e3e5e' }),
  年轻的爸爸: P_({ hair: '#1c1a1e', hs: 'short', top: '#3a4a3a', bottom: '#26262c' }), 年轻的妈妈: P_({ hair: '#1a1416', hs: 'long', top: '#c8b090', skirt: 1, bottom: '#4a3a30' }),
  罗董的女儿: P_({ child: 1, hair: '#1a1416', hs: 'twin', top: '#e8e4c8', dress: 1 }), 老人的女儿: P_({ child: 1, hair: '#1a1416', hs: 'bob', top: '#e8a0a0', dress: 1 }) });
/* 回忆里的两处布景 */
Object.assign(STAGES, {
  oldward: { wall: 'tile', floor: 'linoleum', grime: 1, props: [['curtain', 2, 1], ['window', 3, 1], ['bed', 4, 3], ['bed', 9, 3], ['bed', 14, 3], ['wallclock', 12, 1], ['wheelchair', 17, 4]] },
  fuan: { wall: 'paper', floor: 'wood', props: [['window', 3, 1], ['lamp', 5, 3], ['famphoto', 9, 1, { four: 1 }], ['table', 9, 4], ['chair', 8, 4], ['chair', 11, 4], ['tv', 14, 2], ['door', 17, 2]] } });
/* 窗户里站着一个穿红衣服的，在招手；纸人可以咧嘴 */
SPR.winfig = function (g, e, t, R) { R(1, 0, 14, 13, '#3a2a1a'); R(2, 1, 12, 11, '#c8a860'); R(2, 1, 12, 2, '#a88848'); R(6, 4, 4, 8, '#8a0a0a'); R(6, 2, 4, 3, '#0e0808'); R(7, 3, 1, 1, '#e8d8d0'); const w = Math.sin(t * 5) > 0 ? -2 : 0; R(10, 4 + w, 1, 4, '#8a0a0a'); R(10, 3 + w, 2, 1, '#e0d0c8'); R(7, 1, 1, 11, '#3a2a1a'); };
const _pmSpr = SPR.paperman; SPR.paperman = function (g, e, t, R) { _pmSpr(g, e, t, R); if (e.grin) { R(5, 1, 6, 2, '#c03030'); R(6, 1, 4, 1, '#300'); R(6, 0, 1, 1, Math.sin(t * 3) > .7 ? '#c00' : '#111'); R(9, 0, 1, 1, Math.sin(t * 3) > .7 ? '#c00' : '#111'); } };
