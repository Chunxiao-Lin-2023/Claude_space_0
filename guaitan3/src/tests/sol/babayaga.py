# 第十八夜 芭芭雅嘎 · 自动通关步骤（格式见 tests/play.py 顶部）
W = "window.__dbg.W"
F = "window.__dbg.W.f"
E = "window.__dbg.ent"
SPELL = [['背', '树林', '面', '我']]
SOL = [
    [],
    ['expect', f"{F}.act === 'home'"],
    ['shot', 'home'],
    ['use', 'hdoor'],                          # 没拿面包皮：被拦下
    ['expect', f"{W}.mapId === 'home'"],
    ['use', 'table'],
    ['use', 'chest'],                          # 妈妈临终的话
    ['use', 'wheel'],                          # 摇篮曲（咒语线索）
    ['use', 'hdoor'],                          # 没问娃娃：被拦下
    ['expect', f"{W}.mapId === 'home'"],
    ['use', 'pallet'],                         # 第一次问娃娃
    ['use', 'hdoor'],
    ['expect', f"{W}.mapId === 'forest' && {F}.act === 'forest' && {F}.fl === 1"],
    ['shot', 'forest_dawn'],
    ['step', 22, 11], ['wait', 300],           # 红骑士
    ['expect', f"{F}.fl === 2"],
    ['use', 'stump'],
    ['use', 'mskull'],
    ['step', 42, 3], ['wait', 300],            # 黑骑士
    ['expect', f"{F}.fl === 3"],
    ['shot', 'forest_night'],
    ['step', 47, 2],
    ['expect', f"{W}.mapId === 'yard' && {F}.act === 'arrive'"],
    ['shot', 'arrive'],
    ['use', 'gate'],                           # 她骑着石臼回来了
    ['expect', f"{W}.mapId === 'hut' && {F}.act === 'n1in'"],
    ['use', 'pech'],                           # 端饭 → 吩咐
    ['expect', f"{F}.act === 'n1'"],
    ['shot', 'night1'],
    ['use', 'scr'],                            # 草垫边的刻字
    ['use', 'hpal', [0]],                      # 问娃娃
    ['use', 'hpal', [1]],                      # 睡下 → 第一天
    ['expect', f"{F}.act === 'd1' && {W}.mapId === 'yard' && !{E}('hut').s.front"],
    ['shot', 'day1'],
    ['use', 'hut', [['面', '树林', '背', '我']]],   # 念成了它现在的样子
    ['expect', f"{F}.spBad === 1 && !{E}('hut').s.front"],
    ['use', 'hut', SPELL],
    ['expect', f"{E}('hut').s.front"],
    ['use', 'well'],
    ['use', 'hut'],
    ['expect', f"{W}.mapId === 'hut'"],
    ['use', 'pech'],                           # 锅坐上
    ['use', 'heap'],                           # 猫在看着
    ['expect', f"{F}.tk.so === 0"],
    ['js', f"{F}.cookT = 99"], ['wait', 200],
    ['use', 'pech'],                           # 捞骨头
    ['use', 'hcat'],                           # 猫走了
    ['use', 'jar'],
    ['use', 'heap'],                           # 娃娃放在麦堆上
    ['expect', f"{F}.tk.so === 1 && !{W}.inv.includes('doll')"],
    ['use', 'broom'],
    ['shot', 'hut_day'],
    ['step', 6, 8],
    ['expect', f"{W}.mapId === 'yard'"],
    ['js', f"{F}.dollT = 99"],
    ['step', 5, 7], ['step', 14, 5], ['step', 12, 9], ['step', 4, 9], ['step', 18, 6],
    ['expect', f"{F}.tk.sw === 5"],
    ['use', 'well'], ['use', 'trough'], ['use', 'line'],
    ['use', 'dog', [0]], ['use', 'birch', [0]], ['use', 'gate'],
    ['expect', f"{E}('dog').s.fed && {E}('birch').s.ribbon && {E}('gate').s.oiled"],
    ['use', 'woodpile'],
    ['shot', 'yard_day'],
    ['use', 'hut'],                            # 回屋收娃娃 → 黄昏
    ['wait', 400],
    ['expect', f"{F}.act === 'n1b' && {W}.inv.includes('doll')"],
    ['use', 'hpal', [1]],                      # 第二天
    ['expect', f"{F}.act === 'd2' && {W}.timer && {W}.timer.label === '日落'"],
    ['use', 'hut', SPELL],
    ['use', 'well'], ['use', 'hut'], ['use', 'pech'], ['use', 'heap'],
    ['step', 6, 8],
    ['js', f"{F}.dollT = 99; {F}.cookT = 99"],
    ['step', 6, 6], ['step', 13, 7], ['step', 17, 10], ['step', 3, 4], ['step', 11, 9],
    ['use', 'well'], ['use', 'trough'], ['use', 'line'],
    ['use', 'hut'],                            # → 第二个黄昏，黑猫给毛巾和梳子
    ['wait', 400],
    ['expect', f"{F}.act === 'n2' && {W}.inv.includes('towel') && {W}.inv.includes('comb') && !{W}.timer"],
    ['shot', 'night2'],
    ['use', 'yaga', [0, 0, 0, 0, 0]],          # 白、红、黑三个骑士 → 没有了 → 妈妈的祝福
    ['expect', f"{F}.act === 'chase' && {W}.mapId === 'yard'"],
    ['shot', 'chase_yard'],
    ['step', 10, 15],
    ['expect', f"{W}.mapId === 'forest'"],
    ['step', 1, 7], ['wait', 300],
    ['expect', f"{W}.mapId === 'home' && {F}.act === 'home2'"],
    ['shot', 'home2'],
    ['use', 'table'],
]
