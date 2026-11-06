# 第十三夜 玛丽·赛勒斯特号 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    [],
    ['shot', 'dg'],
    ['use', 'helmsman'],
    ['use', 'mh'],                              # 望远镜 → 派人登船
    ['expect', "window.__dbg.W.f.act === 'dg2'"],
    ['use', 'dgbell'],
    ['use', 'dgboat'],                          # 划过去
    ['expect', "window.__dbg.W.mapId === 'deck' && window.__dbg.W.f.act === 'inv'"],
    ['shot', 'deck'],
    ['use', 'fhatch'],                          # 上面没查完：下不去
    ['expect', "window.__dbg.W.mapId === 'deck'"],
    ['use', 'bowcut'], ['use', 'galley'], ['use', 'fcsle'], ['use', 'mhatch'], ['use', 'railgap'],
    ['use', 'pumpB'], ['use', 'rod'],
    ['use', 'halyard', [0]],                    # 断缆：割下绳头（隐藏细节）
    ['expect', "window.__dbg.W.inv.includes('ropeend')"],
    ['use', 'wheel'],
    ['use', 'compan'],
    ['expect', "window.__dbg.W.mapId === 'cabin'"],
    ['use', 'cdesk'], ['use', 'cbed'],
    ['step', 10, 4],                            # 回到桌边：桌上多了一桌早饭
    ['expect', "!window.__dbg.ent('tea').hidden"],
    ['shot', 'tea'],
    ['use', 'table'],
    ['expect', "window.__dbg.W.f.teaSeen && window.__dbg.ent('tea').hidden"],
    ['use', 'sew'],
    ['step', 16, 5],                            # 大副舱：风琴自己响
    ['use', 'melo', [0]],
    ['shot', 'cabin'],
    ['step', 11, 7],
    ['expect', "window.__dbg.W.mapId === 'deck'"],
    ['use', 'fhatch'],                          # 上面查完 → 下货舱
    ['expect', "window.__dbg.W.mapId === 'hold'"],
    ['use', 'pwell'],
    ['step', 10, 5], ['step', 14, 5],           # 酒桶后面的人影
    ['shot', 'hold'],
    ['use', 'redoak', [0]],                     # 蓝火
    ['expect', "window.__dbg.W.f.ev[7] && window.__dbg.W.f.blue"],
    ['step', 2, 2],                             # 爬上去 → 飑
    ['expect', "window.__dbg.W.f.act === 'squall' && !!window.__dbg.W.timer"],
    ['shot', 'squall'],
    ['use', 'fhatch'],                          # 盖上前舱口
    ['expect', "!window.__dbg.ent('fhatch').open"],
    ['step', 29, 10],                           # 到船尾绳梯
    ['expect', "window.__dbg.W.mapId === 'dg' && window.__dbg.W.f.act === 'night'"],
    ['shot', 'dgnight'],
    ['use', 'mh', ['3', '2', '6', '9', '8', '0', '5', 0]],   # 海怪先答错一次；然后 2 6 9 8 0 5；最后照实说
]
