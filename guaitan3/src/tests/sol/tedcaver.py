# 第四夜 泰德的洞穴 · 自动通关步骤（格式见 tests/play.py 顶部）
# 凿缝：每一下前把体力/空气补满（真人速度的节奏另用脚本测）
FILL = "(() => { const f = window.__dbg.W.f; f.sta = 5; f.air = 5; })()"
def hits(seg, n):
    out = []
    for _ in range(n):
        out += [['js', FILL], ['use', seg]]
    return out

SOL = [
    [],
    ['shot', 'hill'],
    ['use', 'reg', [0]],
    ['use', 'gear'],
    ['use', 'gate'],
    ['expect', "window.__dbg.W.mapId === 'cave'"],
    # 第一次下洞：教学，凿开 1、2 段
    ['step', 16, 6],
    ['expect', 'window.__dbg.W.f.tut1'],
    ['shot', 'cave1'],
] + hits('seg1', 3) + [
    ['expect', "window.__dbg.W.inv.includes('st_hand')"],
    ['use', 'seg1'],
    ['expect', "window.__dbg.ent('seg1').hidden"],
] + hits('seg2', 3) + [
    # 回家：写日志、睡觉、第一个梦
    ['expect', "window.__dbg.W.mapId === 'home'"],
    ['shot', 'home1'],
    ['use', 'pc'],
    ['use', 'bed'],
    # 第二次下洞：狗、会呼吸的风、叉、眼、尖叫、B 退出
    ['expect', "window.__dbg.W.mapId === 'hill' && window.__dbg.W.f.trip === 2"],
    ['step', 17, 5],
    ['expect', 'window.__dbg.W.f.dogEv'],
    ['use', 'gate'],
    ['step', 16, 6],
    ['expect', 'window.__dbg.W.f.tut2'],
] + hits('seg3', 4) + [
    ['expect', "!window.__dbg.ent('mk3').hidden"],
    ['shot', 'cross'],
] + hits('seg4', 4) + [
    ['expect', "window.__dbg.W.mapId === 'home' && window.__dbg.W.f.home === 2"],
    ['use', 'pc', [0]],
    ['use', 'bed'],
    ['expect', 'window.__dbg.W.f.dream'],
    ['shot', 'dream'],
    ['use', 'closet'],
    ['use', 'ropeD'],
    ['use', 'door', [0]],
    # 第三次下洞：一个人，空气
    ['expect', "window.__dbg.W.mapId === 'cave' && window.__dbg.W.f.trip === 3"],
    ['step', 16, 6],
] + hits('seg5', 4) + [
    ['js', FILL], ['use', 'seg5'],
] + hits('seg6', 5) + [
    ['expect', "window.__dbg.W.f.phase === 'through'"],
    ['shot', 'through'],
    ['step', 27, 6],
    # 缝那头
    ['expect', "window.__dbg.W.mapId === 'deep'"],
    ['use', 'mural'],
    ['use', 'xstone', [1]],
    ['shot', 'deep'],
    ['use', 'rrock', [1]],
    ['expect', "window.__dbg.W.f.phase === 'flee'"],
    ['shot', 'flee'],
    ['step', 4, 6, [0]],
    # 封缝：先塞错一次看提示，再按「最后拆的最先装」
    ['expect', "window.__dbg.W.mapId === 'cave' && window.__dbg.W.f.phase === 'seal'"],
    ['shot', 'seal'],
    ['step', 20, 6, [['手', '螺旋', '眼', '弯月'], ['弯月', '眼', '螺旋', '手']]],
]
