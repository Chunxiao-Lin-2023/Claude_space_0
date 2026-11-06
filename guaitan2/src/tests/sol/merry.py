# 第一夜 玛丽的电话 · 自动通关步骤（格式见 tests/play.py 顶部）
# 电话报位：每通电话之后用「坐在电话旁边等」把倒计时跳到 0，再去接
WAITCALL = [['use', 'phone', [1]], ['wait', 500], ['use', 'phone']]
SOL = [
    [],
    ['shot', 'town'],
    # 搬家那天：纸箱里的玛丽 → 垃圾站（让她坐好、说再见）→ 烟草店婆婆讲传说 → 踏切
    ['use', 'tbox', [0]],
    ['use', 'gomi', [0]],
    ['expect', 'window.__dbg.W.f.dropped && window.__dbg.W.f.bye'],
    ['use', 'tabako', [0]],
    ['expect', 'window.__dbg.W.f.rumor'],
    ['use', 'vend'],
    ['step', 20, 3],
    ['expect', 'window.__dbg.W.f.trainDone'],
    ['shot', 'cross'],
    ['step', 35, 3],
    ['expect', "window.__dbg.W.mapId === 'court'"],
    ['shot', 'court_dusk'],
    ['use', 'entr'],
    ['expect', "window.__dbg.W.mapId === 'apt'"],
    # 新家：三个纸箱 → 睡觉 → 第一通（垃圾站）
    ['use', 'boxA'], ['use', 'boxB'], ['use', 'boxC'],
    ['use', 'futon'],
    ['wait', 300],
    ['shot', 'ring1'],
    ['use', 'phone'],
    ['expect', 'window.__dbg.W.f.call === 1'],
    # 笔记：外婆的信、转入届、便条；宝物盒（先错一次）
    ['use', 'gbox'], ['use', 'table'], ['use', 'fridge'],
    ['use', 'tin', ['1968']],
    ['use', 'tin', ['0512']],
    ['expect', "window.__dbg.W.inv.includes('eye') && window.__dbg.W.f.card"],
    ['use', 'phone', [0, '234510', 0]],
    ['expect', 'window.__dbg.W.f.calledMom'],
    *WAITCALL,                       # 第二通：烟草店的拐角
    ['expect', 'window.__dbg.W.f.call === 2'],
    ['use', 'jack', [0]],
    ['use', 'v2'],
    *WAITCALL,                       # 第三通：踏切（线拔了也打进来）
    ['expect', 'window.__dbg.W.f.call === 3'],
    *WAITCALL,                       # 第四通：公园 → 下楼拿藤篮（限时）
    ['expect', 'window.__dbg.W.f.call === 4'],
    ['shot', 'run_start'],
    ['use', 'fdoor'],
    ['step', 1, 14],
    ['expect', "window.__dbg.W.mapId === 'court'"],
    ['shot', 'run_court'],
    ['use', 'cage1'],
    ['use', 'cage3'],
    ['expect', 'window.__dbg.W.f.gotBasket'],
    ['use', 'entr'],
    ['use', 'fdoorO'],
    ['expect', "window.__dbg.W.mapId === 'apt' && window.__dbg.W.pl.y === 12"],
    ['use', 'bspot'],
    ['expect', 'window.__dbg.W.f.basketSet'],
    *WAITCALL,                       # 回到家里，第五通（楼下）
    ['expect', 'window.__dbg.W.f.call === 5'],
    ['use', 'v1'],
    *WAITCALL,                       # 第六通：门口 → 敲门、灭灯
    ['expect', 'window.__dbg.W.f.call === 6'],
    ['shot', 'door'],
    ['use', 'fdoor', [0]],           # 猫眼
    ['use', 'phone', [1]], ['wait', 500],
    ['shot', 'final_ring'],
    ['use', 'phone', [2, 1]],        # 最后一通：不回头，把玻璃眼珠递到身后 →「欢迎回家」
]
