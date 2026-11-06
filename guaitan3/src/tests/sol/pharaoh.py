# 第二十九夜 法老的诅咒 · 自动通关步骤（格式见 tests/play.py 顶部）
# 主线：篝火边念报纸 → 记工簿 → 问老爹三件事 → 莫顿来了又走 → 墓门开 → 甬道灯灭、古代封墓人 → 墓门上的印（先错一次）
#       → 推补过的那块（先推左边） → 前室：莫顿交出护身符 → 黑暗里接三个接头 → 许愿杯 → 钻进墓室 → 速写本
#       → 壁画顺序（先错一次） → 放回神龛门前 → 天亮，对莫顿说实话（好结局「还给了他」）
D = 'window.__dbg'

SOL = [
    [],
    ['shot', 'valley'],
    ['expect', f"!{D}.ent('paper').hidden"],
    ['use', 'paper'],
    ['use', 'ledger'],
    ['use', 'reis', [0, 1, 2, 3]],
    ['wait', 600],                                   # 莫顿来了：选「不行」
    ['expect', f"{D}.W.f.gate && {D}.W.inv.includes('lamp')"],
    ['shot', 'gate'],
    ['use', 'tgate'],
    ['expect', f"{D}.W.mapId === 'corridor'"],
    ['use', 'draft'],
    ['step', 4, 7],                                  # 走到甬道中段：灯灭（tick 触发）
    ['wait', 500],
    ['expect', f"{D}.W.f.dream && {D}.ent('seal').s.st === 1"],
    ['shot', 'corridor'],
    ['use', 'seal', ['13']],                         # 选错：湿墨水的假印
    ['expect', f"{D}.W.f.sealTry === 1"],
    ['use', 'seal', ['24', 0]],                      # 选对；再推左边（错）
    ['use', 'seal', [1]],                            # 推中间那块补丁
    ['expect', f"{D}.ent('seal').s.st === 2"],
    ['use', 'seal', [0]],                            # 钻进前室；莫顿：「给我，我放回去」
    ['expect', f"{D}.W.mapId === 'ante' && {D}.W.f.ph === 'dark' && {D}.W.inv.includes('eye')"],
    ['shot', 'dark'],
    ['use', 'j1'],
    ['use', 'j3'],
    ['use', 'j2'],
    ['expect', f"{D}.W.f.ph === 'lit'"],
    ['shot', 'ante_lit'],
    ['use', 'cup'],
    ['use', 'block'],
    ['expect', f"{D}.W.mapId === 'burial'"],
    ['use', 'scaffold'],
    ['shot', 'burial'],
    ['use', 'pN1', [0]],                             # 顺序错：先摸了北墙
    ['expect', f"{D}.W.f.pwrong === 1"],
    ['use', 'pE', [0]],
    ['use', 'pN1'],
    ['use', 'pN2', [0]],
    ['use', 'pN3', [0]],
    ['use', 'pW', [0]],
    ['expect', f"{D}.W.f.panels"],
    ['shot', 'panels'],
    ['js', f"{D}.tp(11, 5, 1); {D}.doAct('use')", [0, 1]],   # 放回去；天亮后对莫顿说实话
    ['expect', f"{D}.store.get('ends', []).includes('pharaoh:return')"],
]
