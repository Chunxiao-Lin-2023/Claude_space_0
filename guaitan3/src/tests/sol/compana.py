# 第二十四夜 圣伴 · 自动通关步骤（格式见 tests/play.py 顶部）
# 主线：序章（接过十字架）→ 早上：床、靴子、镜子、乌希亚（作业）、奶奶（菊花）→ 村子：神父、栗子、曼努埃尔、谷仓、亡灵龛、
#       给爷爷献花、安塞尔莫（信）→ 回家：奶奶讲 1949 年（本子）→ 谷仓取拐杖 → 白天走老路到十字路口、读刻字 → 傍晚
#       → 夜里：真人速度举着十字架走老路（开栅门、叫曼努埃尔趴下）→ 十字路口：站进圈痕、画星 1-3-5-2-4-1、不给安塞尔莫
#       → 拐杖在手：爷爷停下来道别（结局「窗台上的栗子」）
import json
D = 'window.__dbg'


def follow(path, stop, picks=None, ms=60000):
    """真人速度沿拐点走：按住方向键，每到一个拐点换方向；遇到对话就翻页，遇到选项按 picks 依次选"""
    return ("(async () => { const D = window.__dbg, sl = ms => new Promise(r => setTimeout(r, ms)), t0 = performance.now();"
            f" const P = {json.dumps(path)}, PK = {json.dumps(picks or [])}; let i = 0; IN.run = false;"
            f" while (performance.now() - t0 < {ms}) {{ const w = D.W; if (!w || w.endScreen || ({stop})) break;"
            "  if (w.dlg || w.card || w.note || w.keypad) { IN.stack = []; await window.__auto(PK, 300); continue; }"
            "  const p = w.pl, cx = p.mv ? p.mv.tx : p.x, cy = p.mv ? p.mv.ty : p.y; while (i < P.length && cx === P[i][0] && cy === P[i][1]) i++;"
            "  if (i >= P.length) { IN.stack = []; if (!w.busy && !p.mv) break; await sl(30); continue; }"
            "  const dx = P[i][0] - cx, dy = P[i][1] - cy; IN.stack = [dx > 0 ? 2 : dx < 0 ? 1 : dy > 0 ? 0 : 3];"
            "  await sl(8); }"
            " IN.stack = []; })()")


LANE = [[3, 4], [10, 4], [10, 9], [17, 9], [17, 14], [24, 14], [24, 18], [20, 18], [20, 21], [28, 21], [28, 23]]
CROSS = [[9, 7], [8, 7], [8, 9], [9, 9]]

SOL = [
    [],
    ['shot', 'casa'],
    ['use', 'cama'], ['use', 'botas'], ['use', 'palangana'], ['use', 'uxia'],
    ['use', 'avoa'],
    ['expect', f"{D}.W.f.ph === 'village' && {D}.W.inv.includes('flores')"],
    ['step', 6, 8],
    ['expect', f"{D}.W.mapId === 'aldea'"],
    ['shot', 'aldea'],
    ['use', 'cura', [0]], ['use', 'carmina'], ['use', 'carmina'], ['use', 'manuel'], ['use', 'horreo'], ['use', 'p_aldea'],
    ['use', 'tumba_avo'],
    ['expect', f"{D}.W.f.flores && !{D}.W.inv.includes('flores')"],
    ['use', 'anselmo'],
    ['expect', f"{D}.W.f.ph === 'knows'"],
    ['use', 'd_casa'],
    ['use', 'avoa'],
    ['expect', f"{D}.W.f.ph === 'cruz' && {D}.W.f.toldStory"],
    ['step', 6, 8],
    ['use', 'horreo', [0]],
    ['expect', f"{D}.W.inv.includes('baston')"],
    ['step', 22, 17],
    ['expect', f"{D}.W.mapId === 'corredoira'"],
    ['use', 'p1'], ['use', 'cancela'],
    ['shot', 'corr_day'],
    ['step', 28, 23],
    ['expect', f"{D}.W.mapId === 'encrucillada'"],
    ['shot', 'cruz_day'],
    ['use', 'circulo'],
    ['use', 'cruceiro'],
    ['expect', f"{D}.W.mapId === 'casa' && {D}.W.f.ph === 'dusk'"],
    ['shot', 'dusk'],
    ['use', 'uxia'],
    ['use', 'avoa', [0]],
    ['expect', f"{D}.W.mapId === 'corredoira' && {D}.W.f.ph === 'lane' && {D}.W.f.procOn && {D}.W.cp.name === 'night'"],
    ['js', follow(LANE, "w.mapId !== 'corredoira'", [1])],
    ['expect', f"{D}.W.mapId === 'encrucillada' && {D}.W.f.metManuel"],
    ['js', follow(CROSS, "w.pl.x === 9 && w.pl.y === 9 && !w.pl.mv && !w.busy")],
    ['expect', f"{D}.W.f.pray && {D}.W.cp.name === 'cross'"],
    ['shot', 'cross_pray'],
    ['use', 'circulo', ['135241', 1]],
    ['expect', f"{D}.store.get('ends', []).includes('compana:farewell')"],
]
