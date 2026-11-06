# 第二十一夜 布拉格的魔像 · 自动通关步骤（格式见 tests/play.py 顶部）
# 主线：广场 → 莉芙卡（石子）→ 拉比家：看约瑟勒额头、字母板、字条、面包、杯子 → 日落、漫水 → 约瑟勒失控、闩门
#       → 书箱（先错 440，再 441）→ 真人速度钻小巷逃到会堂 → 拉比停下诗篇 → 广场：爬铁梯磴，拉比叫它回头时抹去 א
#       → 抬上阁楼 → 放石子、盖经页 → 阁楼上的安息
import json
D = 'window.__dbg'


def follow(path, run=True, ms=30000, stop="w.mapId !== 'lanes' || w.f.stage !== 'chase'"):
    """真人速度沿拐点走：按住方向键（和奔跑键），每到一个拐点换方向；遇到对话就翻页"""
    return ("(async () => { const D = window.__dbg, sl = ms => new Promise(r => setTimeout(r, ms)), t0 = performance.now();"
            f" const P = {json.dumps(path)}; let i = 0; IN.run = {'true' if run else 'false'};"
            f" while (performance.now() - t0 < {ms}) {{ const w = D.W; if (!w || w.endScreen || {stop}) break;"
            "  if (w.dlg || w.card || w.note) { IN.stack = []; await window.__auto([], 300); continue; }"
            "  const p = w.pl, cx = p.mv ? p.mv.tx : p.x, cy = p.mv ? p.mv.ty : p.y; while (i < P.length && cx === P[i][0] && cy === P[i][1]) i++;"
            "  if (i >= P.length) { IN.stack = []; await sl(30); continue; }"
            "  const dx = P[i][0] - cx, dy = P[i][1] - cy; IN.stack = [dx > 0 ? 2 : dx < 0 ? 1 : dy > 0 ? 0 : 3];"
            "  await sl(8); }"
            " IN.stack = []; IN.run = false; })()")


ALLEY = [[7, 11], [10, 11], [10, 14], [13, 14], [13, 11], [16, 11], [16, 14], [19, 14], [19, 10], [22, 10], [22, 13], [32, 13], [32, 10]]

# 爬上梯子后等：它走到梯子底下、拉比一叫它回头（frozen）就伸手
CLIMB = ("(async () => { const D = window.__dbg, sl = ms => new Promise(r => setTimeout(r, ms)), t0 = performance.now();"
         " while (performance.now() - t0 < 30000) { const w = D.W; if (!w || w.endScreen || w.f.stage !== 'rungs') break;"
         "  const g = D.ent('golem'), p = w.pl, gx = Math.round(g.px / 16), gy = Math.round(g.py / 16);"
         "  if (!w.busy && w.f.climb && g.frozen && Math.abs(gx - p.x) + Math.abs(gy - p.y) === 1) { D.doAct('use'); break; }"
         "  await sl(30); } })()")

SOL = [
    [],
    ['shot', 'square'],
    ['use', 'sdoor'], ['use', 'rungs'], ['use', 'well'],
    ['use', 'rivka'],
    ['expect', f"{D}.W.inv.includes('pebble')"],
    ['use', 'cw1'], ['use', 'cw2'], ['use', 'nwin'],
    ['shot', 'alley'],
    ['use', 'hdoor'],
    ['expect', f"{D}.W.mapId === 'house' && {D}.W.f.stage === 'home'"],
    ['shot', 'house'],
    ['use', 'hgolem'],
    ['use', 'alefbet'], ['use', 'desk'], ['use', 'mezuzah'], ['use', 'stove'],
    ['use', 'table'], ['use', 'table'],
    ['expect', f"{D}.W.f.challah && {D}.W.f.stage === 'home'"],
    ['use', 'table'],
    ['expect', f"!{D}.W.f.cup && {D}.W.f.stage === 'home'"],
    ['use', 'pots'],
    ['expect', f"{D}.W.inv.includes('cloth')"],
    ['use', 'table'],
    ['expect', f"{D}.W.f.stage === 'flood'"],
    ['wait', 1500],
    ['shot', 'flood'],
    ['use', 'hgolem'],
    ['expect', f"{D}.W.f.stage === 'barred' && {D}.ent('kdoor').solid && !{D}.ent('kdoor').hidden"],
    ['use', 'kdoor'],
    ['shot', 'barred'],
    ['use', 'rchest', ['440']],
    ['expect', f"{D}.W.f.wrong === 1 && !{D}.W.f.book"],
    ['use', 'rchest', ['441']],
    ['expect', f"{D}.W.mapId === 'lanes' && {D}.W.f.stage === 'chase' && !!{D}.ent('golem').chase"],
    ['js', follow(ALLEY)],
    ['expect', f"{D}.W.mapId === 'shul' && ({D}.W.f.hits || 0) === 0"],
    ['shot', 'shul'],
    ['use', 'ark'], ['use', 'pil1'], ['use', 'amud'], ['use', 'cg0'],
    ['use', 'rabbi', [1]],
    ['expect', f"{D}.W.f.stage === 'shulgo' && !{D}.W.f.sing"],
    ['step', 9, 12],
    ['expect', f"{D}.W.mapId === 'lanes' && {D}.W.f.stage === 'rungs'"],
    ['shot', 'rungs'],
    ['use', 'rungs'],
    ['expect', f"{D}.W.f.climb && {D}.W.pl.spr === 'climb'"],
    ['js', CLIMB, ['א', 0]],
    ['expect', f"{D}.W.mapId === 'attic'"],
    ['shot', 'attic'],
    ['use', 'clay', [0]], ['use', 'pg1', [0]], ['use', 'roundwin'],
    ['expect', f"{D}.W.f.stone && {D}.W.f.cover"],
    ['use', 'rabbi'],
]
