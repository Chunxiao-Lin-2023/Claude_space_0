# 第二十六夜 水妖奈克 · 自动通关步骤（格式见 tests/play.py 顶部）
# 主线：外婆交代规矩 → 琴、琴谱、圣经、半瓶酒、地窖整瓶酒 → 草场（红头绳、水塘的眼睛）→ 磨坊（E弦、水尺、佩尔的信）
#       → 溪边：回《摇篮曲》（先错两次）、回《奈克调》（先错一次）→ 递整瓶酒学琴 → 追溪马（传送到它身后）→ 叫他的名字（好结局「叫出他的名字」）
D = 'window.__dbg'
# 把溪马停住，把玩家放到它身后一格（环路上），等 tick 判定「追上了」
BEHIND = ("(async () => { const D = window.__dbg, N = window.__nokken; const H = N.HS; H.pause = 2;"
          " const p = N.loopPos(H.s - H.dir * .6); D.tp(Math.round(p.x), Math.round(p.y));"
          " for (let i = 0; i < 40 && !D.W.busy; i++) await new Promise(r => setTimeout(r, 50)); })()")

SOL = [
    [],
    ['shot', 'house'],
    ['expect', f"{D}.W.f.ph === 'night' && {D}.W.inv.includes('needle')"],
    ['step', 8, 12],                                # 空手出门：外婆拦住
    ['expect', f"{D}.W.mapId === 'house'"],
    ['use', 'wallfid'],
    ['use', 'kista'],                               # 外公的琴谱
    ['use', 'tbl'],                                 # 圣经扉页
    ['use', 'shelfH'],                              # 半瓶白兰地
    ['use', 'mor'],                                 # 外婆说地窖里的酒
    ['use', 'lucka', [0]],
    ['shot', 'cellar'],
    ['use', 'bin3'],                                # 整瓶白兰地
    ['use', 'ladder'],
    ['expect', f"{D}.W.inv.includes('brandyF') && {D}.W.inv.includes('brandyH')"],
    ['step', 8, 12],
    ['expect', f"{D}.W.mapId === 'meadow'"],
    ['shot', 'meadow'],
    ['use', 'ribbon'],
    ['use', 'eyes', [0]],                           # 水塘里的眼睛
    ['js', f"{D}.tp(15, 11, 0); {D}.doAct('use')"],   # 从北边调查木栅门：没有E弦，过不去
    ['expect', f"!{D}.ent('gate').open"],
    ['use', 'millDoor'],
    ['expect', f"{D}.W.mapId === 'mill'"],
    ['use', 'tin'],
    ['use', 'gauge'],
    ['use', 'mbox'],                                # 佩尔的信
    ['shot', 'mill'],
    ['step', 5, 10],                                # 回草场：雾里的白马
    ['expect', f"{D}.W.f.glimpse"],
    ['use', 'gate'],
    ['expect', f"{D}.ent('gate').open"],
    ['step', 15, 21],
    ['expect', f"{D}.W.mapId === 'brook' && {D}.W.f.round === 1"],
    ['shot', 'brook'],
    ['use', 'astone', [1]],                         # 再拉一遍
    ['use', 'astone', [0, '5321']],                 # 学舌
    ['use', 'astone', [0, '1235']],                 # 岸上的答法
    ['expect', f"{D}.W.f.wrong[1] === 2"],
    ['use', 'astone', [0, '3567']],                 # 照影子回：5321 → 3567
    ['expect', f"{D}.W.f.round === 2"],
    ['use', 'astone', [0, '3657']],                 # 前后倒过来：错
    ['use', 'astone', [0, '1325']],                 # 7563 → 1325
    ['expect', f"{D}.W.f.round === 3"],
    ['use', 'nrock', [2]],                          # 「三滴……」：他不收
    ['use', 'nrock', [0]],                          # 整瓶白兰地
    ['expect', f"{D}.W.f.ph === 'horse' && {D}.W.f.learned === 'full'"],
    ['wait', 600],
    ['shot', 'horse'],
    ['js', BEHIND, [1, 0]],                         # 追上：叫他的名字；圣经故事里的问题答「能」
    ['expect', f"{D}.store.get('ends', []).includes('nokken:name')"],
]
