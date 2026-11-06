# 第十七夜 魔王 · 自动通关步骤（格式见 tests/play.py 顶部）
# 主线：问婆婆 → 马灯/斗篷/木马/歌单/画 → 抱起卢卡斯 → 上马 → 赤杨林岔路（信他，往东）→ 枯叶坡（信他）→ 神龛
#       → 萨勒河岔路（信他，往右下）→ 石桥 → 真人速度骑马躲雾团、抱紧不松 → 城门 → 拉铃（看见了）→ 天亮了
D = 'window.__dbg'

# 真人速度骑马：按住「右」+ 奔跑键；雾团出现在本道前方时换一条道；遇到对话就翻页、选项选 0（抱紧）
GALLOP = ("(async () => { const D = window.__dbg, sl = ms => new Promise(r => setTimeout(r, ms)), t0 = performance.now();"
          " IN.stack = [2]; IN.run = true; let sw = null;"
          " while (performance.now() - t0 < 40000) { const w = D.W; if (!w || w.endScreen || w.mapId === 'town') break;"
          "  if (w.dlg || w.card || w.busy) { IN.stack = []; await window.__auto([0], 400); IN.stack = sw ? [sw.d] : [2]; continue; }"
          "  const p = w.pl;"
          "  if (sw) { if ((p.mv && p.mv.fy !== p.mv.ty) || p.y === sw.ty) { sw = null; IN.stack = [2]; } await sl(8); continue; }"
          "  for (const k of ['nb1', 'nb2']) { const e = D.ent(k); if (e && !e.hidden && Math.round(e.py / 16) === p.y && e.px > p.px && e.px - p.px < 16 * 6) { const ty = p.y === 17 ? 16 : p.y + 1; sw = { ty, d: ty > p.y ? 0 : 3 }; IN.stack = [sw.d]; break; } }"
          "  await sl(16); }"
          " IN.stack = []; IN.run = false; })()")

SOL = [
    [],
    ['shot', 'farm'],
    ['use', 'grete'],
    ['expect', f"{D}.W.f.rules"],
    ['use', 'lanternw'], ['use', 'chest'], ['use', 'toy'], ['use', 'table'], ['use', 'drawing'], ['use', 'tea'], ['use', 'fire'],
    ['use', 'luka'],
    ['expect', f"{D}.W.f.carry && {D}.W.pl.spr === '@meK' && {D}.W.inv.includes('lantern') && {D}.W.inv.includes('toy')"],
    ['use', 'horse'],
    ['expect', f"{D}.W.pl.spr === 'ride' && {D}.ent('hdoor').solid"],
    ['shot', 'yard'],
    ['step', 25, 5],
    ['expect', f"{D}.W.mapId === 'forest' && {D}.W.timer && {D}.W.timer.label === '卢卡斯醒着'"],
    ['step', 10, 15, [1]],
    ['expect', f"{D}.W.f.f1d && !{D}.W.f.deny"],
    ['shot', 'fork1'],
    ['step', 13, 15],
    ['expect', f"{D}.W.f.stage === 'slope'"],
    ['step', 22, 10, [1]],
    ['expect', f"{D}.W.f.b2 && {D}.W.f.lure"],
    ['use', 'shrine'],
    ['shot', 'slope'],
    ['step', 44, 17],
    ['expect', f"{D}.W.mapId === 'river' && {D}.W.f.stage === 'f2'"],
    ['step', 8, 9, [1]],
    ['expect', f"{D}.W.f.f2d && !{D}.W.f.deny"],
    ['step', 8, 12],
    ['expect', f"{D}.W.f.stage === 'bridgeway'"],
    ['step', 13, 16],
    ['expect', f"{D}.W.f.stage === 'gallop' && !!{D}.ent('d1').chase && !{D}.W.timer"],
    ['shot', 'bridge'],
    ['js', GALLOP],
    ['expect', f"{D}.W.mapId === 'town' && {D}.W.f.grabbed && ({D}.W.f.hits || 0) === 0"],
    ['shot', 'town'],
    ['use', 'bell', [1]],
]
