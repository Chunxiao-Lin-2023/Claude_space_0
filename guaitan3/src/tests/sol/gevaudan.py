# 第二十五夜 热沃当怪兽 · 自动通关步骤（格式见 tests/play.py 顶部）
# 主线：屋里拿棍子 → 村子：告示、钟楼风向、神父（训谕、蜡烛）、圣母像点蜡烛、中士（报纸）、铁匠绑刀、开羊圈（口诀）
#       → 高地：爪印、硬毛 → 正午对峙（始终面向它，挡退三次）→ 十字架 → 找回五只羊 → 进林子：靴印、铁链、窝棚、救出白额
#       → 回村把羊赶进圈、说「说不清」→ 西南角爪印、钟楼 → 推理（先错一次，再答 东北→西南）
#       → 守夜（搬柴添火、它贴上来就转身盯住；测试把夜缩短到 45 秒）→ 天亮：站在火边等猎人 → 隐藏结局「圣母的蜡烛」
D = 'window.__dbg'

NOON = ("(async () => { const D = window.__dbg, sl = ms => new Promise(r => setTimeout(r, ms)), t0 = performance.now();"
        " while (performance.now() - t0 < 40000) { const w = D.W; if (!w || w.endScreen || w.f.ph !== 'noon') break;"
        "  if (w.dlg || w.card || w.note) { await window.__auto([], 300); continue; }"
        "  if (!w.busy) D.SAPI.face('pl', 'beastP'); await sl(30); } })()")

NIGHT = ("(async () => { const D = window.__dbg, S = D.SAPI, sl = ms => new Promise(r => setTimeout(r, ms)), t0 = performance.now();"
         " if (D.W.timer) D.W.timer.left = Math.min(D.W.timer.left, 45);"
         " const F = [['fireW', 9, 19, 1], ['fireSW', 11, 23, 0]];"
         " while (performance.now() - t0 < 90000) { const w = D.W; if (!w || w.endScreen || w.f.ph !== 'night') break;"
         "  if (w.dlg || w.card || w.note) { await window.__auto([1], 300); continue; }"
         "  if (w.busy) { await sl(30); continue; }"
         "  const b = D.ent('beastV'), p = w.pl, bd = Math.hypot(b.px - p.px, b.py - p.py) / 16;"
         "  if (!b.hidden && bd < 4.6) { S.face('pl', 'beastV'); await sl(30); continue; }"
         "  const f = w.f, lo = f.fuel[0] <= f.fuel[1] ? 0 : 1;"
         "  if (f.logs > 0 && f.fuel[lo] <= 55) { S.pos(F[lo][1], F[lo][2], F[lo][3]); D.doAct('use'); await sl(80); continue; }"
         "  if (f.logs < 2 && f.wood > 0 && Math.min(...f.fuel) < 75) { S.pos(4, 14, 3); D.doAct('use'); await sl(80); continue; }"
         "  await sl(30); } })()")

SOL = [
    [],
    ['shot', 'house'],
    ['use', 'lamb'], ['use', 'stick'],
    ['expect', f"{D}.W.inv.includes('stick')"],
    ['step', 5, 8],
    ['expect', f"{D}.W.mapId === 'village'"],
    ['shot', 'village'],
    ['use', 'placard'], ['use', 'church'], ['use', 'cure'], ['use', 'madonna', [0]],
    ['expect', f"{D}.W.f.candle"],
    ['use', 'sgt'], ['use', 'oldw'],
    ['use', 'smith'],
    ['expect', f"{D}.W.inv.includes('pike')"],
    ['use', 'pgate'],
    ['expect', f"{D}.W.f.out && {D}.W.f.fol.length === 8"],
    ['wait', 600],
    ['step', 0, 9],
    ['expect', f"{D}.W.mapId === 'pasture' && {D}.W.f.ph === 'past'"],
    ['shot', 'pasture'],
    ['use', 'print'], ['use', 'gorse'],
    ['wait', 900],
    ['expect', f"{D}.W.f.ph === 'noon'"],
    ['shot', 'noon'],
    ['js', NOON],
    ['expect', f"{D}.W.f.ph === 'gather'"],
    ['use', 'wcross'],
    ['use', 'sh2'], ['use', 'sh6'], ['use', 'sh4'], ['use', 'sh5'], ['use', 'sh3'],
    ['expect', f"{D}.W.f.fol.filter(i => i.startsWith('sh')).length === 5"],
    ['shot', 'gathered'],
    ['step', 19, 3, [0]],
    ['expect', f"{D}.W.mapId === 'forest'"],
    ['use', 'boots'], ['use', 'chain'], ['use', 'charhut'],
    ['shot', 'forest'],
    ['use', 'sh1'],
    ['expect', f"{D}.W.f.foundW"],
    ['step', 12, 17],
    ['expect', f"{D}.W.mapId === 'pasture' && {D}.W.f.ph === 'home'"],
    ['wait', 400],
    ['step', 39, 9],
    ['expect', f"{D}.W.mapId === 'village' && {D}.W.f.ph === 'dusk'"],
    ['shot', 'dusk'],
    ['use', 'pgate', [3]],
    ['expect', f"{D}.W.f.ph === 'puzzle'"],
    ['use', 'swtrack'], ['use', 'church'],
    ['use', 'bapt', [0, ['西', '东']]],
    ['expect', f"{D}.W.f.wrongP === 1 && {D}.W.f.woodLost === 1 && {D}.W.f.ph === 'puzzle'"],
    ['use', 'bapt', [0, ['东北', '西南']]],
    ['expect', f"{D}.W.f.ph === 'night' && {D}.W.f.wood === 9"],
    ['shot', 'night'],
    ['js', NIGHT, [1]],
    ['js', 'void 0', [1]],
    ['expect', f"{D}.W.endScreen && {D}.W.endScreen.kind === 'end'"],
]
