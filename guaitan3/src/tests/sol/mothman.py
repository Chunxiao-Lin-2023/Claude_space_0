# 第九夜 天蛾人 · 自动通关步骤（格式见 tests/play.py 顶部）
# 桥上的倒计时按真实时间走（during：对话里也走），桥上的步骤要连着做
SOL = [
    [],
    ['shot', 'tnt'],
    # 序章：TNT 废弃区，看看水泥包和巴德，去发电厂门口 → 它出来了 → 跑回车上
    ['use', 'igloo1'], ['use', 'bud'], ['use', 'prints'],
    ['use', 'pdoor'],
    ['expect', "window.__dbg.W.f.phase === 'run'"],
    ['shot', 'chase'],
    ['step', 13, 9], ['step', 5, 9], ['step', 5, 12],
    ['expect', "window.__dbg.W.mapId === 'office'"],
    ['shot', 'office'],
    # 报社：剪报，出门
    ['use', 'files'], ['use', 'hal'],
    ['use', 'door_o'],
    ['expect', "window.__dbg.W.mapId === 'town'"],
    ['shot', 'town'],
    # 主街：五个当事人
    ['use', 'bud_t'],
    ['use', 'doris_t'],
    ['use', 'payph'],
    ['use', 'mae'],
    ['expect', 'window.__dbg.W.f.mibShown'],
    ['use', 'mib'],
    ['use', 'carl_t', [0]],
    ['expect', "window.__dbg.W.inv.includes('drawing')"],
    ['use', 'rview'],
    ['expect', "['v1','v2','v4','v5','v6'].every(k => window.__dbg.W.f[k])"],
    ['use', 'door_paper'],
    # 软木板：先排错一次（传言的顺序），再排对 → 螺旋 → 预言指的是桥
    ['use', 'board', [0, '325461']],
    ['expect', 'window.__dbg.W.f.bw === 1'],
    ['use', 'board', [0, '352614', 1]],
    ['expect', 'window.__dbg.W.f.deduced'],
    ['shot', 'board'],
    ['use', 'door_o'],
    ['step', 37, 3],
    ['expect', "window.__dbg.W.mapId === 'bridge' && window.__dbg.W.f.phase === 'bridge'"],
    ['shot', 'bridge'],
    # 银桥：劝错一次，再劝对三个人，回到桥头，留在桥头
    ['use', 'doris_b', [0]],
    ['use', 'doris_b', [0]],
    ['use', 'carl_b', [2]],
    ['use', 'bud_b', [0]],
    ['expect', "window.__dbg.W.f.pd_doris && window.__dbg.W.f.pd_carl && window.__dbg.W.f.pd_bud"],
    ['shot', 'rally'],
    ['step', 4, 3, [1]],
]
