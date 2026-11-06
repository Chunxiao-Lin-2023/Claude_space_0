# 第十一夜 聂小倩 · 自动通关步骤（格式见 tests/play.py 顶部）
W = "window.__dbg.W"
D = "window.__dbg"

# 寺北荒坟：三棵白杨（B/D/E）的窝每局随机，f.qy 是乌巢那棵的序号
DIG_RIGHT = "window.__dbg.face('m' + ['B','D','E'][window.__dbg.W.f.qy]); window.__dbg.doAct('use')"

SOL = [
    ['shot', 'arrive'],
    ['use', 'bei'], ['use', 'chi'], ['use', 'ta'],          # 看够三处 → 日暮，燕生回来
    ['wait', 1500],
    ['expect', W + ".f.ph === 'a1y'"],
    ['use', 'yan', [1]],
    ['expect', W + ".f.ph === 'a2' && !window.__dbg.ent('ydoor').locked"],
    ['shot', 'dusk'],
    ['use', 'ndoor'],
    ['expect', W + ".mapId === 'fang' && " + W + ".f.ph === 'n1'"],
    ['use', 'swin'],                                        # 窥北院
    ['expect', W + ".f.peeked"],
    ['use', 'bed', [0, 0]],                                 # 小倩来：正色拒绝 → 「快走！」
    ['expect', W + ".f.ph === 'n1g' && window.__dbg.ent('bed').s.gold"],
    ['shot', 'gold'],
    ['use', 'bed', [0]],                                    # 掷金
    ['expect', W + ".f.threw && !window.__dbg.ent('bed').s.gold && !" + W + ".inv.includes('jin')"],
    ['use', 'bed'],                                         # 睡 → 第二天
    ['expect', W + ".mapId === 'si' && " + W + ".f.ph === 'd2'"],
    ['use', 'shi'],
    ['expect', W + ".f.feet"],
    ['shot', 'day2'],
    ['use', 'pu', [2]],                                     # 只是安慰两句（仆人会死）
    ['wait', 800],
    ['expect', W + ".f.ph === 'd2b'"],
    ['use', 'yan'],                                         # → 第二夜
    ['expect', W + ".f.ph === 'n2' && !window.__dbg.ent('g1').hidden"],
    ['shot', 'night2'],
    ['use', 'g1', [0]],                                     # 不理金子
    ['use', 'dx', [0]],                                     # 拍门
    ['expect', W + ".f.dxDone"],
    ['use', 'ndoor'],                                       # 回屋：小倩自白 → 第三天
    ['expect', W + ".f.ph === 'd3' && " + W + ".mapId === 'si'"],
    ['use', 'yan', [0]],
    ['expect', W + ".f.ph === 'd3b'"],
    ['use', 'ndoor'],
    ['use', 'bed'],
    ['expect', W + ".inv.includes('puga')"],
    ['use', 'wdoor'],
    ['use', 'ydoor'],
    ['expect', W + ".mapId === 'fang' && " + W + ".pl.x > 11"],
    ['use', 'nta'],
    ['expect', W + ".f.ph === 'n3'"],
    ['shot', 'night3'],
    ['use', 'ewin'],                                        # 看一眼箱子（第一次只描写）
    ['use', 'nta', [2, 0]],                                 # 躺下 → 夜叉窥窗 → 装睡 → 剑光
    ['expect', W + ".f.ph === 'd4' && " + W + ".mapId === 'si'"],
    ['use', 'yan', [0]],
    ['expect', W + ".f.gotNang && " + W + ".inv.includes('nang')"],
    ['use', 'xs1'],
    ['expect', W + ".inv.includes('chu')"],
    ['use', 'jiao'],
    ['expect', W + ".mapId === 'fen' && " + W + ".f.ph === 'dig'"],
    ['shot', 'fen'],
    ['use', 'mA', [0]],                                     # 挖错一次（柳树）
    ['expect', W + ".f.wrong === 1"],
    ['js', DIG_RIGHT, [0]],
    ['expect', W + ".inv.includes('gu') && " + W + ".f.ph === 'run0'"],
    ['step', 12, 15],
    ['expect', W + ".mapId === 'si' && " + W + ".f.ph === 'run' && " + W + ".f.bag === 3"],
    ['shot', 'chase'],
    ['step', 16, 23],                                       # （真人速度的追逐在 scratchpad 变体里测）
    ['expect', W + ".mapId === 'jia'"],
    ['shot', 'jia'],
    ['use', 'pit'],
    ['use', 'vat2'],
    ['use', 'pit'],
    ['expect', W + ".f.prayed"],
    ['step', 9, 8],
    ['shot', 'qian'],
]
