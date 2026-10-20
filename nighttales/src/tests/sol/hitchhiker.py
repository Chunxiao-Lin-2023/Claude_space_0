# 第七夜 消失的搭车客 · 自动通关步骤（格式见 tests/play.py 顶部）
# A 线：两次开过去 → 第三回她已坐在副驾驶上 → 不给外套 → 坏结局抽测并重来 → 白影抽测 → 温和变体结局
# B 线：正常路线（停车、借夹克、问舞会、上楼看房间）→ 完整好结局
D = 'window.__dbg'

# 车内戏按「往前开的秒数」触发，所以真的按住 → 开过去（IN.stack 是引擎的方向键栈），边开边自动翻对话
def DRIVE(picks):
    return ("(async () => { const D = window.__dbg, pk = %s, t0 = performance.now(); IN.stack = [2];"
            " while (D.W.f.phase === 'ride' && performance.now() - t0 < 60000) await window.__auto(pk, 400);"
            " IN.stack = []; })()" % picks)

# 白影抽测：先面朝它站 1.5 秒（应当不动），再背过身（应当一格一格挪过来并抓住你），然后从检查点重来。
# 为了让结果不受随机游走的磷火干扰，这里用 js 把磷火藏起来、跳过白影的出场演出——只测白影规则本身。
SHADE = ("(async () => { const D = window.__dbg, W = D.W, sl = ms => new Promise(r => setTimeout(r, ms));"
         " for (const id of ['wisp1','wisp2','wisp3']) { const e = D.ent(id); e.hidden = true; e.chase = null; }"
         " W.f.shadeSeen = true; D.tp(20, 14, 0); const s = D.ent('shade'); s.mv = null; s.px = 20*16; s.py = 17*16;"
         " await sl(1500); window.__shadeStill = Math.round(s.py/16) === 17;"
         " D.tp(20, 14, 3); const t0 = performance.now();"
         " while (performance.now() - t0 < 15000) { const r = await window.__auto([], 500); if (r === 'end:die') break; }"
         " window.__shadeDied = !!(D.W.endScreen && D.W.endScreen.kind === 'die');"
         " for (let i = 0; i < 60 && D.W.endScreen; i++) { D.doAct('retry'); await sl(100); } })()")
# 死亡/坏结局画面出现 0.8 秒后才接受「重来」
RETRY = ("(async () => { const D = window.__dbg; for (let i = 0; i < 60 && D.W.endScreen; i++) { D.doAct('retry'); await new Promise(r => setTimeout(r, 100)); } })()")

SOL = [
    [0],
    # ---------------- A 线 ----------------
    ['step', 6, 8],
    ['use', 'mycar'],
    ['expect', f"{D}.W.pl.spr === 'autoR' && {D}.W.pl.x === 8 && {D}.W.pl.y === 5 && {D}.W.noRun"],
    ['step', 26, 7],
    ['expect', f"!{D}.ent('hh').hidden && {D}.ent('hh').alpha < 1"],
    ['step', 31, 7, [1]],
    ['expect', f"{D}.W.f.pass === 1 && {D}.W.f.hx === 36"],
    ['step', 34, 7, [1]],
    ['expect', f"{D}.W.f.pass === 2 && {D}.W.f.hx === 40"],
    ['step', 38, 7],
    ['expect', f"{D}.W.f.phase === 'ride' && {D}.W.pl.spr === 'autopR'"],
    ['js', DRIVE('[1, 1]')],
    ['expect', f"{D}.W.f.phase === 'toaddr' && {D}.W.f.ev === 4 && !{D}.W.f.coat && {D}.W.pl.x >= 55 && {D}.W.pl.spr === 'autoR'"],
    ['step', 69, 7, [0]],
    ['expect', f"{D}.W.mapId === 'house'"],
    ['use', 'lphoto'], ['use', 'harper', [0, 0]], ['use', 'ktable'],
    ['step', 7, 8],
    ['expect', f"{D}.W.f.phase === 'tocem' && !{D}.ent('fp0').hidden && {D}.ent('lamp71').off"],
    # 坏结局抽测：无视她的警告继续往西
    ['step', 51, 7],
    ['expect', f"{D}.W.f.warned"],
    ['step', 46, 7],
    ['expect', f"{D}.W.endScreen && {D}.W.endScreen.kind === 'badend'"],
    ['js', RETRY],
    ['expect', f"{D}.W.mapId === 'road' && {D}.W.f.phase === 'tocem' && !{D}.W.f.warned"],
    ['step', 56, 7, [0]],
    ['expect', f"{D}.W.mapId === 'cem'"],
    ['use', 'lanternp'],
    ['step', 15, 15],
    ['js', SHADE],
    ['expect', 'window.__shadeStill === true && window.__shadeDied === true'],
    ['expect', f"{D}.W.mapId === 'cem' && {D}.W.inv.includes('lantern') && !{D}.W.f.wispsOn"],
    ['step', 15, 15],
    ['use', 'g_lill', [0]],
    ['expect', f"{D}.W.f.rest && {D}.W.f.variant"],
    ['use', 'cgate'],
    ['expect', f"{D}.W.endScreen && {D}.W.endScreen.kind === 'end'"],
    # ---------------- B 线 ----------------
    ['js', f"{D}.store.del('cp.hitchhiker'); {D}.startChapter('hitchhiker', false)", [0]],
    ['use', 'bigphoto'], ['use', 'ledger'], ['use', 'walt'],
    ['shot', 'store'],
    ['step', 6, 8],
    ['use', 'mycar'],
    ['step', 26, 7],
    ['shot', 'drive'],
    ['step', 31, 7, [0, 0]],
    ['expect', f"{D}.W.f.phase === 'ride' && {D}.W.pl.spr === 'autopR' && !{D}.W.f.pass"],
    ['js', DRIVE('[]')],
    ['expect', f"{D}.W.f.phase === 'toaddr' && {D}.W.f.named && {D}.W.f.coat && {D}.W.f.askedSat && {D}.W.pl.spr === 'autoR'"],
    ['shot', 'cemroad'],
    ['step', 69, 7, [0]],
    ['expect', f"{D}.W.mapId === 'house'"],
    ['shot', 'house'],
    ['use', 'lphoto'], ['use', 'harper', [0, 0]], ['use', 'fire'], ['use', 'letters'], ['use', 'umbrella'], ['use', 'sofa'], ['use', 'ktable'],
    ['expect', f"{D}.W.inv.includes('gardenia')"],
    ['step', 1, 2],
    ['use', 'mbox'], ['use', [8, 2]], ['use', 'lwin'], ['use', [5, 5]],
    ['shot', 'lroom'],
    ['step', 1, 6],
    ['step', 7, 8],
    ['expect', f"{D}.W.f.phase === 'tocem' && {D}.W.f.roomSeen && {D}.W.pl.spr === 'autoL'"],
    ['use', 'rshoe'],
    ['shot', 'tocem'],
    ['step', 56, 7, [0]],
    ['expect', f"{D}.W.mapId === 'cem'"],
    ['use', 'shed'], ['use', 'lanternp'],
    ['step', 15, 15],
    ['shot', 'cem'],
    ['use', 'g_bell', [0]],
    ['use', 'g_lill', [0, 0, 0]],
    ['expect', f"{D}.W.f.rest && !{D}.W.f.variant"],
    ['shot', 'grave'],
    ['use', 'cgate'],
]
