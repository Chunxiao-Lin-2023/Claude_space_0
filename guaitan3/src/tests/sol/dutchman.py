# 第十二夜 飞翔的荷兰人 · 自动通关步骤（格式见 tests/play.py 顶部）
# 主线：老奈德 → 舱下（船规、旧杂志、写家书、晴雨表、日志）→ 报给大副，拦住船长的誓言
#       → 掌舵穿过礁石口（按真人反应速度：看到白浪 0.35 秒后松舵，风过 0.3 秒后再走）
#       → 雾里备沉信袋 → 小艇靠上来，张开袋口 → 先敲错一次（七响），再敲八响 → 好结局
D = 'window.__dbg'

# 真人速度掌舵：沿最短路往西；阵风警告（g>=2）出现 react 毫秒后才松手，风过去 resume 毫秒后再走；
# pause=[x, 毫秒] 表示走到 x 时愣住一会儿；ignore=True 表示完全不理阵风
def DRIVE(react=350, resume=300, pause=None, ignore=False, until=-1):
    return ("(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)), D = window.__dbg;"
             " window.__gap = 99; const t0 = performance.now(); let tS = 0, tG = 0, stopped = false, paused = false;"
            " const PZ = %s, IG = %s;"
            " while (performance.now() - t0 < 150000) {"
            "  const W = D.W; if (!W || W.endScreen || W.mapId !== 'sea' || W.pl.x <= %d) break;"
            "  if (W.dlg || W.card) { IN.stack = []; W.dlg && (W.dlg.full = true); await sl(220); D.doAct('adv'); continue; }"
            "  if (W.busy) { IN.stack = []; await sl(40); continue; }"
            "  const wd = W.maps.sea.ents.find(e => e.id === 'wind'), g = wd.s.g || 0, n = performance.now();"
            "  if (g >= 2 && !IG) { if (!tS) tS = n + %d; if (n >= tS) stopped = true; tG = 0; }"
            "  else { tS = 0; if (stopped) { if (!tG) tG = n + %d; if (n >= tG) { stopped = false; tG = 0; } } }"
            "  if (PZ && !paused && W.pl.x <= PZ[0]) { paused = true; IN.stack = []; await sl(PZ[1]); }"
            "  const gq = W.maps.sea.ents.find(e => e.id === 'gship'); if (gq && gq.chase) window.__gap = Math.min(window.__gap ?? 99, Math.round((Math.abs(gq.px - W.pl.px) + Math.abs(gq.py - W.pl.py)) / 16));"
            "  const d = bfsStep(W.maps.sea, W.pl.x, W.pl.y, 2, 8, W.pl);"
            "  IN.stack = (stopped || d < 0) ? [] : [d]; await sl(30); }"
            " IN.stack = []; })()"
            % ('[%d,%d]' % tuple(pause) if pause else 'null', 'true' if ignore else 'false', until, react, resume))

SOL = [
    [],
    ['use', 'ned', [0]],
    ['use', 'nbag'],
    ['shot', 'dusk'],
    ['use', 'hatch'],
    ['expect', f"{D}.W.mapId === 'below'"],
    ['use', 'orders'], ['use', 'nchest'], ['use', 'mychest', [0]], ['use', 'baro'], ['use', 'log'], ['use', 'chart'], ['use', 'bunk'],
    ['shot', 'below'],
    ['step', 11, 2],
    ['expect', f"{D}.W.mapId === 'deck' && {D}.W.f.baro"],
    ['use', 'mate', [0]],
    ['expect', f"{D}.W.mapId === 'sea' && {D}.W.f.phase === 'storm' && {D}.W.f.oath === 'stopped' && {D}.W.pl.spr === 'ship'"],
    ['shot', 'sea'],
    ['js', DRIVE()],
    ['expect', f"{D}.W.mapId === 'deck' && {D}.W.f.phase === 'fog' && {D}.W.timer"],
    ['shot', 'fog'],
    ['use', 'ned', [0]],
    ['expect', f"{D}.W.f.method"],
    ['use', 'lline'],
    ['use', 'hatch'], ['use', 'sroll'], ['step', 11, 2],
    ['use', 'ned'],
    ['expect', f"{D}.W.inv.includes('bag') && {D}.W.timer && {D}.W.timer.left <= 8"],
    ['js', f"(async () => {{ {D}.W.timer.left = .05; await new Promise(r => setTimeout(r, 700)); }})()", [2]],
    ['expect', f"{D}.W.f.phase === 'aboard' && {D}.W.f.belling"],
    ['shot', 'aboard'],
    ['use', 'bell', ['2', '2', '2', '1', ['停手']]],
    ['expect', f"{D}.W.f.bw === 1 && {D}.W.f.phase === 'aboard'"],
    ['use', 'bell', ['2', '2', '2', '2', ['停手']]],
]
