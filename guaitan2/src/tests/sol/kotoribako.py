# 第二夜 子取箱 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    ['shot', 'kura'],
    ['use', 'mio', [0]],                          # 看箱子：小翔跑来 → 挡住他；奶奶认出子取箱
    ['expect', "window.__dbg.W.f.phase === 'call'"],
    ['use', 'kiri'], ['use', 'ledger'], ['use', 'straw'],   # 桐木外箱上的字、《箱守帐》、木栓
    ['step', 6, 9],
    ['shot', 'yard'],
    ['use', 'housedoor'],                         # 进主屋自动接电话
    ['expect', "window.__dbg.W.f.phase === 'prep'"],
    ['shot', 'house'],
    ['use', 'miodoor'], ['use', 'butsu'], ['use', 'keyhook'], ['use', 'saltshelf'],
    ['use', 'baba'], ['use', 'futon'],
    ['step', 10, 11],
    ['use', 'haidoor'], ['use', 'sign'],
    ['use', 'kuradoor'],
    # 封箱：动手 → 左板往下、顶盖往左、右板往上、插木栓
    ['use', 'hako', [0, ['左↓'], ['顶←'], ['右↑'], ['栓']]],
    ['expect', "window.__dbg.ent('hako').s.st === 0 && window.__dbg.ent('hako').s.peg"],
    ['use', 'hako', [0]],                         # 抱起箱子
    ['expect', "window.__dbg.W.f.phase === 'night' && window.__dbg.W.inv.includes('hako')"],
    ['step', 6, 9],
    ['shot', 'night'],
    ['use', 'hondoor'],
    ['expect', "window.__dbg.W.mapId === 'honden'"],
    ['use', 'kara', [0]], ['use', 'kara', [0]], ['use', 'sanbo'],
    ['shot', 'honden'],
    # 行礼 → 守夜：不看、不开门 → 天亮问「当返」
    ['use', 'altar', ['礼礼拍拍礼', 1, 1, 1]],
]
