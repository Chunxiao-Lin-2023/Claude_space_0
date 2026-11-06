# 第二十八夜 敏敏光 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    [],
    ['shot', 'home'],
    ['use', 'jack'],                       # 对讲机呼叫 + 规矩 + 找南方法
    ['expect', "window.__dbg.W.f.phase === 'prep'"],
    ['use', 'board'], ['use', 'frame'], ['use', 'dog'],
    ['use', 'ute_h'],                      # 缺手电和水袋：提示
    ['expect', "window.__dbg.W.mapId === 'home'"],
    ['use', 'torch_h'], ['use', 'water_h'],
    ['use', 'jack'],
    ['use', 'ute_h'],                      # 十点熄灯，开车出发
    ['expect', "window.__dbg.W.mapId === 'ruins'"],
    ['shot', 'ruins'],
    ['use', 'plaque'], ['use', 'grave1'],
    ['use', 'ute_l'],
    ['expect', 'window.__dbg.W.f.readLena'],
    ['step', 12, 6, [0]],                  # 坟地里升起的光：站着别动
    ['expect', 'window.__dbg.W.f.sawLight && !window.__dbg.W.f.ruinRun'],
    ['step', 15, 0],
    ['expect', "window.__dbg.W.mapId === 'plain'"],
    ['shot', 'plain'],
    ['step', 13, 29, [0]],                 # 袋鼠眼睛：关手电辨反光
    ['expect', 'window.__dbg.W.f.reflect'],
    ['use', 'skull'],
    ['step', 16, 6, [0]],                  # 桉树下的莉娜
    ['expect', "window.__dbg.W.mapId === 'back' && window.__dbg.W.f.phase === 'back'"],
    ['shot', 'back'],
    ['step', 0, 13],                       # 没看星星：走不出去
    ['expect', "window.__dbg.W.mapId === 'back' && window.__dbg.W.pl.x === 1"],
    ['use', 'rise1', ['3']],               # 答错：逐级提示
    ['expect', 'window.__dbg.W.f.skyMiss === 1'],
    ['use', 'rise1', ['6']],               # 假十字：针对性提示
    ['use', 'rise1', ['4']],
    ['expect', "window.__dbg.W.f.south && window.__dbg.W.cp.name === 'south'"],
    ['use', 'mark4'],
    ['step', 0, 13],
    ['expect', "window.__dbg.W.mapId === 'ruins' && window.__dbg.W.f.phase === 'home'"],
    ['step', 15, 4, [0]],                  # 光最后一次凑近：站住
    ['expect', 'window.__dbg.W.f.final1'],
    ['shot', 'home_ruins'],
    ['use', 'ute_me'],
    ['expect', "(window.__dbg.store.get('ends', []) || []).includes('minmin:stars')"],
]
