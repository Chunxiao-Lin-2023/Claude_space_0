# 第七夜 笔仙 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    [0],
    ['shot', 'cls'],
    ['use', [5, 1]], ['use', [12, 1]],          # 黑板（讲台后面，从 (6,2) 调查）、留缝的窗
    ['use', 'rulesP'],
    ['use', [12, 1]],                           # 读过规矩再看窗：「开一扇窗」的版本差异
    ['use', 'mydesk'], ['use', 'jt'],
    # 请笔仙：开始 → 问性别、年份 → 苏晴提示问名字 → 名字（选项都在第 0 个）
    ['use', 'rdesk', [0, 0, 0, 0]],
    ['expect', "window.__dbg.W.mapId === 'room' && window.__dbg.W.f.cut"],
    ['shot', 'room'],
    ['use', 'bunkB'], ['use', 'bunkA'], ['use', [4, 4]],
    ['use', 'th'],
    ['use', 'rdoor', [0]],                      # 门外有人：屏住呼吸
    ['expect', 'window.__dbg.W.f.knocked && !window.__dbg.W.f.answered'],
    ['use', [5, 7]],                            # 敲门后的拖鞋
    ['use', 'rdoor'],
    ['expect', "window.__dbg.W.mapId === 'dorm' && !window.__dbg.ent('fp0').hidden"],
    ['use', 'fp0'],
    ['use', 'dlog'], ['use', 'dtab'], ['use', [5, 1]],
    ['shot', 'dorm'],
    ['use', 'wmir'],
    ['use', 'boiler'],
    ['expect', "window.__dbg.W.f.phase === 'chase'"],
    ['shot', 'chase'],
    ['step', 6, 3, [0, 0]],
    ['expect', "window.__dbg.W.inv.includes('okey') && !window.__dbg.W.inv.includes('thermos') && window.__dbg.W.f.phase === 'old'"],
    ['shot', 'duty'],
    ['step', 7, 4],
    ['expect', "window.__dbg.W.mapId === 'old'"],
    ['shot', 'old'],
    ['use', 'daisy'],
    ['use', [17, 6]],                           # 光荣榜：林小满
    ['use', 'adoor'],
    ['use', [3, 1]],                            # 1994 年的挂历
    ['use', 'adesk'],
    ['use', 'cab', ['1994']],                   # 错一次：提示看门边纸条
    ['use', 'cab', ['1996', 0]],                # 届对了，卡抽错了
    ['use', 'cab', [1]],
    ['use', 'rshelf'],
    ['expect', 'window.__dbg.W.f.archDone && window.__dbg.W.f.cabWrong === 1 && window.__dbg.W.f.cardWrong === 1'],
    ['shot', 'archive'],
    ['js', "window.__dbg.tp(5, 5, 0); window.__dbg.doAct('use')", [0]],
    ['expect', 'window.__dbg.W.f.confess'],
    ['shot', 'confess'],
    ['use', 'clsDoor'],
    ['expect', "window.__dbg.W.mapId === 'oldcls'"],
    ['use', 'chart'], ['use', 'ojt'], ['use', 'obb'],
    ['use', 'mdesk'],
    ['expect', 'window.__dbg.W.f.zhouIn'],
    ['shot', 'oldcls'],
    # 送走：开始；怎么开始(错一次→蜡烛矮一截→对)；问冷→不问了；送走的话(对)；一起松手；烧纸折笔
    ['use', 'mdesk', [0, 1, 0, 0, 2, 2, 1, 1]],
]
