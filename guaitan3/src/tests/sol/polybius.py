# 第二夜 波利比乌斯 · 自动通关步骤（格式见 tests/play.py 顶部）
# 吃光点：先把多边形定住，再传送到 d1 上触发拾取（真人速度的危险段另用脚本测）
EAT = ("(() => { const D = window.__dbg; for (const id of ['e1','e2','e3']) D.SAPI.freeze(id);"
       " const d = D.ent('d1'); D.step(Math.round(d.px/16), Math.round(d.py/16)); })()")
SOL = [
    [0],
    ['shot', 'night'],
    ['use', 'ricky'],
    ['use', 'bag'],
    ['use', 'svc', [1]],
    ['use', 'clk'],
    # 后屋：协议、电闸、电话
    ['use', 'odoor'],
    ['use', 'desk'],
    ['use', 'phone', [1]],
    ['shot', 'office'],
    ['step', 4, 7],
    # 停车场：雨里的卡片
    ['step', 9, 11],
    ['use', 'card'],
    ['shot', 'lot'],
    ['use', 'adoor'],
    # 第一局：吃三颗就主动离开（看到 31）
    ['use', 'poly', [0]],
    ['expect', "window.__dbg.W.mapId === 'game'"],
    ['shot', 'game'],
    ['js', EAT], ['js', EAT], ['js', EAT],
    ['expect', 'window.__dbg.W.f.frags === 1'],
    ['shot', 'frag1'],
    ['step', 10, 10, [1]],
    ['expect', "window.__dbg.W.mapId === 'arcade' && window.__dbg.W.f.clock === 55"],
    ['use', 'svc', [0, 'ABCDE']],
    ['expect', 'window.__dbg.W.f.clock === 65'],
    # 第二局：把剩下四个数字看完，然后在分数冲破 9990 前跑进出口
    ['use', 'poly', [0]],
] + [['js', EAT]] * 12 + [
    ['expect', 'window.__dbg.W.f.frags === 5'],
    ['expect', "window.__pb.G && window.__pb.G.ph === 'spin'"],
    ['shot', 'spin'],
    ['step', 10, 10],
    ['expect', "window.__dbg.W.f.phase === 'climax'"],
    ['shot', 'climax'],
    ['use', 'svc', ['LETHE', 0, 1]],
]
