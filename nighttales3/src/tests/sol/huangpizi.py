# 第四夜 黄皮子讨封 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    ['shot', 'tun'],
    ['step', 17, 10, [0]],                      # 二丫：「你奶奶撞客了」
    ['expect', 'window.__dbg.W.f._o_meetErya'],
    ['use', 'sun'],
    ['use', 'ldoor', [0]],                      # 到家，吃饭，奶奶开口
    ['expect', "window.__dbg.W.f.ph === 'invest'"],
    ['shot', 'house'],
    ['use', 'nai'], ['use', 'ma'], ['use', 'die'], ['use', [17, 1]],
    ['step', 3, 9],                             # 出门：里屋窗户上的小脸
    ['expect', 'window.__dbg.W.f._o_peek'],
    # 马老太（叫了一声「黄鼠狼」，被纠正）
    ['use', [24, 3]],
    ['use', 'mlt', [0, 0, 0]],
    ['expect', 'window.__dbg.W.f.mlt && window.__dbg.W.f.saidName'],
    ['use', [2, 1]],                            # 堂单（牌位摆法）
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
    ['use', 'tangzi', ['胡黄白柳灰']],            # 按口诀一溜摆：错
    ['use', 'tangzi', ['柳黄胡白灰']],            # 左右反了：错
    ['expect', 'window.__dbg.W.f.tangErr === 2 && !window.__dbg.W.f.tangOK'],
    ['use', 'tangzi', ['灰白胡黄柳']],
    ['expect', 'window.__dbg.W.f.tangOK'],
    ['shot', 'cang'],
    ['step', 5, 7],
    # 拿唱本，先回家
    ['use', [24, 3]],
    ['use', 'mlt'],
    ['expect', "window.__dbg.W.f.ph === 'ritual' && window.__dbg.W.f.chang"],
    ['step', 6, 8],
    # 请仙：二神接词先错一次，再 1/0/2；「是」
    ['use', 'ldoor', [0, 1, 0, 2, 0]],
    ['expect', "window.__dbg.W.f.ph === 'night'"],
    ['shot', 'ritual'],
    # 夜路
    ['step', 3, 9],
    ['shot', 'night'],
    ['step', 16, 12, [1]],                      # 有人喊名字（离开大道也躲不开）：不答应
    ['expect', "window.__dbg.W.f._o_callName && window.__dbg.W.cp.name === 'night'"],
    ['step', 33, 6],
    ['expect', "window.__dbg.W.mapId === 'fen'"],
    ['shot', 'fen'],
    ['use', [8, 3]],                            # 林家的碑：碑前的鸡蛋
    ['step', 9, 7, [3, 4, 1]],                  # 先不吭声一次，再自己把唱本最后那句接上
    ['expect', "window.__dbg.store.get('ends', []).includes('huangpizi:shan')"],
]
