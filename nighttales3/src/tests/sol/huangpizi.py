# 第四夜 黄皮子讨封 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    ['shot', 'tun'],
    ['step', 17, 10, [0]],                      # 二丫：「你奶奶撞客了」
    ['expect', 'window.__dbg.W.f._o_meetErya'],
    ['use', 'sun'],
    ['use', 'ldoor', [0]],                      # 到家，吃饭，奶奶开口
    ['expect', "window.__dbg.W.f.ph === 'invest'"],
    ['shot', 'house'],
    ['use', 'nai'], ['use', 'ma'], ['use', 'die'], [ 'use', [17, 1]],
    ['step', 3, 9],
    # 马老太
    ['use', [24, 3]],
    ['use', 'mlt', [0, 0]],
    ['expect', 'window.__dbg.W.f.mlt'],
    ['use', [2, 1]],                            # 堂单（牌位排法）
    ['use', 'gu'],
    ['shot', 'mama'],
    ['step', 6, 8],
    # 三样
    ['use', 'sun', [0]],
    ['expect', 'window.__dbg.W.f.sunTold'],
    ['use', 'jiwo'],
    ['use', 'chaiduo'],
    ['expect', "window.__dbg.W.inv.includes('hat') && window.__dbg.W.inv.includes('paiwei')"],
    ['use', [13, 3]],
    ['use', 'muxiang'], ['use', 'baomi_c'],
    ['use', 'tangzi', ['胡白黄柳灰']],            # 先摆错一次
    ['use', 'tangzi', ['胡黄白柳灰']],
    ['expect', 'window.__dbg.W.f.tangOK'],
    ['shot', 'cang'],
    ['step', 5, 7],
    # 请仙
    ['use', [24, 3]],
    ['use', 'mlt', [0, 1, 0, 2, 0]],            # 二神接词：先错一次，再 1/0/2；「是」
    ['expect', "window.__dbg.W.f.ph === 'night'"],
    ['shot', 'ritual'],
    # 夜路
    ['step', 3, 9],
    ['shot', 'night'],
    ['step', 17, 6, [1]],                       # 有人喊名字：不答应
    ['step', 33, 6],
    ['expect', "window.__dbg.W.mapId === 'fen'"],
    ['shot', 'fen'],
    ['step', 9, 7, [3]],                        # 第三种回答
]
