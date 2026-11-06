# 第五夜 四谷怪谈 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    [0],                                        # 源叔：「源叔，你信这个？」
    ['shot', 'gakuya'],
    ['use', 'harigami'], ['use', 'kesho'],
    ['use', 'kyodai', [0]],                     # 镜中梳头 → 梳子被她拿走
    ['expect', "window.__dbg.W.f.mirror1 && !window.__dbg.W.inv.includes('kushi')"],
    ['use', 'jmaku', [0]],
    ['expect', "window.__dbg.W.mapId === 'taku'"],
    ['shot', 'taku'],
    ['use', 'kurogo'],                          # 黒衣第一级提示（翻开道具帳）
    # 行灯：从上手（右）数起应为 壱 弐 参 四。她那盏（f.h1，每局随机）写的是把上手当成左边时的号，
    # 与另一盏（3-h）重号；只有她那盏和位置对不上
    ['js', "window.__dbg.face('an' + (3 - window.__dbg.W.f.h1)); window.__dbg.doAct('use')", [1]],   # 认错一次：缠一缕
    ['expect', 'window.__dbg.W.f.tangle === 1'],
    ['js', "window.__dbg.face('an' + window.__dbg.W.f.h1); window.__dbg.doAct('use')", [1]],
    ['expect', 'window.__dbg.W.f.act1 && window.__dbg.W.f.tangle === 0'],
    ['use', 'okyo'],                            # 髪梳き：拿回梳子和手镜
    ['expect', "window.__dbg.W.inv.includes('kushi') && window.__dbg.W.inv.includes('kagami')"],
    ['shot', 'taku_done'],
    ['use', 'hdoor'],
    ['expect', "window.__dbg.W.mapId === 'hori'"],
    ['shot', 'hori'],
    # 门板：她那块随机（f.herP），边上的水结霜
    ['js', "window.__dbg.face('tp' + window.__dbg.W.f.herP); window.__dbg.doAct('use')", [1]],
    ['expect', 'window.__dbg.W.f.act2'],
    ['step', 33, 4],
    ['expect', "window.__dbg.W.mapId === 'inari'"],
    ['shot', 'inari'],
    ['use', 'ogami'],                           # 背对提灯举手镜：镜子里左数第 n 盏 = 转过身右数第 n 盏
    ['expect', 'window.__dbg.W.f.sawMirror'],
    ['js', "window.__dbg.face('ch' + window.__dbg.W.f.lanH); window.__dbg.doAct('use')", [1]],
    ['expect', 'window.__dbg.W.f.act3 && window.__dbg.W.f.genIn'],
    ['shot', 'inari_gen'],
    ['use', 'genO', [1]],                       # 「……源叔？」（0 = 拔刀 → 坏结局「成了伊右卫门」）
    ['expect', "window.__dbg.W.inv.includes('senko')"],
    ['use', 'yuisho'],                          # 读过由来木牌：好结局多一句
    ['use', 'yashiro', [0]],                    # 上香供梳子（1 → 再确认 0 = 留下梳子 → 坏结局）
    ['expect', "window.__dbg.store.get('ends', []).includes('yotsuya:inari')"],
]
