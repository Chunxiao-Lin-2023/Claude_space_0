# 第七夜 雪女 · 自动通关步骤（格式见 tests/play.py 顶部）
# 主线走「不说出口的话」（真结局）：天窗、凉水、埋火三件事都做了，最后选第三个选项
D = 'window.__dbg'
SOL = [
    [],
    ['shot', 'ferry'],
    ['step', 18, 7],                                   # 渡口：船拴在对岸
    ['expect', f"{D}.W.f.dock"],
    ['use', 'itagi'],
    ['use', 'door'],                                   # 锁着：读留守书
    ['expect', f"{D}.W.f.readRusu"],
    # 六地藏：钥匙在「没戴斗笠、下巴底下打结」的那尊（f.tj，每局随机）；先拂错风刮掉斗笠的那尊（f.bj）
    ['js', f"{D}.face('jz' + {D}.W.f.bj); {D}.doAct('use')", [0]],
    ['expect', f"{D}.W.f.jzMiss === 1"],
    ['js', f"{D}.face('jz' + {D}.W.f.bj); {D}.doAct('use')", [0]],   # 把斗笠给它戴回去
    ['expect', f"{D}.ent('jz' + {D}.W.f.bj).s.fix"],
    ['js', f"{D}.face('jz' + {D}.W.f.tj); {D}.doAct('use')", [0]],
    ['expect', f"{D}.W.inv.includes('key')"],
    ['shot', 'jizo'],
    ['use', 'door'],
    ['step', 20, 13],                                  # 进屋
    ['expect', f"{D}.W.f.ph === 'hut'"],
    ['use', 'tana'], ['use', 'minoW'],
    ['expect', f"{D}.W.inv.includes('hiuchi') && {D}.W.inv.includes('mino')"],
    ['use', 'makiA'],
    ['use', 'irori'],                                  # 点火 → 茂作的规矩 → 前半夜
    ['expect', f"{D}.W.f.ph === 'night' && {D}.W.timer && {D}.W.f.fire > 0"],
    ['js', f"{D}.W.f.gT = 999; {D}.W.f.T = 100"],      # 主线不测随机白风（变体里单独测）
    ['shot', 'night'],
    ['use', 'goya'],                                   # 稻草 + 一捆柴
    ['use', 'gap0'], ['use', 'gap1'], ['use', 'gap2'],
    ['expect', f"{D}.W.f.plug === 3"],
    ['use', 'makiA'],
    ['use', 'irori'],
    ['expect', f"{D}.W.f.fire > 60 && !{D}.W.f.wood"],
    ['use', 'mosaku'],
    ['shot', 'hut_fire'],
    ['js', f"{D}.W.f.T = 100; {D}.W.timer.left = .3"],   # 跳过前半夜
    ['wait', 800],
    ['expect', f"{D}.W.f.ph === 'hold' && {D}.W.timer"],
    ['shot', 'yuki'],
    ['js', f"{D}.W.timer.left = .2"],                  # 屏住气熬过去
    ['wait', 800],
    ['expect', f"{D}.W.mapId === 'road' && {D}.W.f.ph === 'road'"],
    ['use', 'baba'],
    ['use', 'nyobo'],
    ['use', 'kichi'],
    ['use', 'daruma'],
    ['shot', 'road'],
    ['use', 'hHome', [1]],                             # 回家；讲「笠地藏」
    ['expect', f"{D}.W.mapId === 'home' && {D}.W.f.story === 1"],
    ['shot', 'home'],
    ['use', 'butsudan'], ['use', 'tsukue'],
    ['use', 'kemuri', [0]],
    ['use', 'kame2', [0]],
    ['use', 'chawan'],
    ['use', 'irori2', [1]],
    ['expect', f"{D}.W.f.aK && {D}.W.f.aM && {D}.W.f.aU"],
    ['use', 'minoH'],
    ['shot', 'home_acc'],
    ['use', 'oyuki', [0, 2]],                          # 「阿雪……」→「今年的雪，下得真好。」
    ['expect', f"{D}.store.get('ends', []).includes('yukionna:unspoken')"],
]
