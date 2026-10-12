# 第六夜 375路末班车 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    [],
    # 圆明园站
    ['use', 'sign'], ['use', 'poster'], ['use', 'granny_s'], ['use', 'granny_s'],
    ['use', 'vendor', [0]],
    ['expect', 'window.__dbg.W.f.busHere'],
    ['shot', 'stop'],
    ['use', 'bus'],
    # 车厢
    ['use', 'granny', [0]],
    ['step', 5, 2],
    ['expect', "window.__dbg.W.f.phase === 'ride'"],
    ['shot', 'ride'],
    ['use', 'w10'],
    ['use', 'conductor'],
    ['expect', 'window.__dbg.W.f.turning'],
    ['js', 'window.__dbg.tp(15, 2, 2)'],
    ['wait', 7000],
    ['expect', 'window.__dbg.W.f.turnDone'],
    ['use', 'pole', [0, 0]],
    # 夜路
    ['expect', "window.__dbg.W.mapId === 'road'"],
    ['shot', 'road'],
    ['step', 10, 4],
    ['shot', 'chase'],
    ['use', 'pdoor', [0]],
    # 派出所
    ['use', 'ledger'],
    ['use', 'pdesk', [1, '4127', 1]],
    ['expect', 'window.__dbg.W.f.statement'],
    ['shot', 'police'],
    ['step', 6, 8],
    # 第二天
    ['use', 'radio'],
    ['js', "window.__dbg.tp(8, 3, 3); window.__dbg.doAct('use')"],
    ['shot', 'home'],
    ['use', 'bed'],
]
