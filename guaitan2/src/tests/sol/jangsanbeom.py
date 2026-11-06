# 第二十夜 长山虎 · 自动通关步骤（格式见 tests/play.py 顶部）
D = 'window.__dbg.W'
SOL = [
    [],
    ['shot', 'house_dusk'],
    ['use', 'suah'],                                   # 「哥！你看，我画的外婆！」
    ['expect', D + ".f.ph === 'food'"],
    ['use', 'fridge'], ['use', 'stove'],              # 吃饭 → 秀雅去倒厨余，被关在后门外
    ['expect', D + ".f.ph === 'trash'"],
    ['use', 'bdoor'],                                  # 给她开门：「哥，外面好像有流水声。」
    ['expect', D + ".f.ph === 'learn'"],
    ['use', 'pc'], ['use', 'dresser'],
    ['expect', D + ".f.ph === 'ango'"],
    ['shot', 'house_eve'],
    ['use', 'suah', [1]],                              # 约暗号：第二个问题
    ['expect', D + ".f.ph === 'tobed' && " + D + ".f.ango === 1 && " + D + ".f.cut"],
    ['use', 'kit'],
    ['use', 'suah'],                                   # 贴创可贴、哄睡
    ['expect', D + ".f.ph === 'sleep' && " + D + ".f.bandage"],
    ['use', 'kwin'],
    ['use', 'sofa', [0]],
    ['expect', D + ".f.ph === 'door' && " + D + ".cp.name === 'night'"],
    ['shot', 'house_night'],
    ['use', 'fdoor'],                                  # 还没看过秀雅：停手
    ['use', 'kbed'],
    ['expect', D + '.f.checked'],
    ['use', 'fdoor', [0, 1, 2, 3, 4]],                 # 猫眼、问是谁、问暗号、开门（门链警告）、不出声
    ['expect', D + ".f.ph === 'call2' && " + D + '.f.doorTry === 1'],
    ['use', 'phone', [0]],
    ['expect', D + ".f.ph === 'gone'"],
    ['use', 'kbed'], ['use', 'shoes'],
    ['use', 'bdoor', [0]],
    ['expect', D + ".mapId === 'alley' && " + D + ".cp.name === 'out'"],
    ['shot', 'alley'],
    ['use', 'slipper'], ['use', 'dog'], ['use', 'board'],
    ['step', 21, 0, [0]],
    ['expect', D + ".mapId === 'trail' && " + D + ".cp.name === 'trail'"],
    ['step', 15, 20],                                  # 岔路：两个秀雅
    ['shot', 'trail_f1'],
    ['step', 22, 16],                                  # 走错一次：警告
    ['expect', D + '.f.wrongT === 1'],
    ['use', 'tie'],
    ['step', 8, 15],
    ['expect', D + ".f.f1ok && " + D + ".cp.name === 'f2'"],
    ['step', 15, 12],                                  # 手机里的妈妈 / 林子里的妈妈
    ['step', 20, 11, [1]],                             # 站住
    ['expect', D + '.f.f2 && !' + D + '.endScreen'],
    ['step', 15, 9],                                   # 它追上来了
    ['expect', D + ".f.chaseOn && " + D + ".cp.name === 'chase'"],
    ['wait', 300],
    ['shot', 'trail_chase'],
    ['step', 23, 0],
    ['expect', D + ".mapId === 'falls' && " + D + ".cp.name === 'falls'"],
    ['shot', 'falls'],
    ['use', 'sEcho', [0]], ['use', 'sCopy', [0]], ['use', 'sReal', [0]], ['use', 'sCopy', [0]],
    ['use', 'sReal', [1]], ['use', 'sReal', [2]],
    ['use', 'sReal', [3, 0]],
    ['expect', "window.__dbg.store.get('ends', []).includes('jangsanbeom:home')"],
]
