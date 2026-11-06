# 第二十三夜 布朗夫人 · 自动通关步骤（格式见 tests/play.py 顶部）
# 主线：窗光四秒（先按错一次）→ 冲出平台上的一小团白 → 入夜；灯挂第五级开四秒（曝光刚好但太短，错一次）
#       → 灯挂第十级开十五秒 → 冲出「楼梯上的女人」→ 她的房间：月光三十秒 → 冲出旧日的房间、画像现身
#       → 抱着画像追逐（暗房 → 仆人楼梯 → 走廊 → 房间）→ 地板下的戒指 → 先挂错一次 → 挂回床头
#       → 把戒指还给她 → 最后一张长曝光（真结局「她的戒指」）
D = 'window.__dbg'
SOL = [
    [],
    ['shot', 'hall_dusk'],
    ['use', 'pell'],
    ['use', 'hale'],
    ['expect', f"{D}.W.f.act === 'tut'"],
    ['use', 'tripod', ['8']],                      # 不听话：八秒 → 黑尔先生纠正
    ['expect', f"{D}.W.f.act === 'tut' && !{D}.W.f.expo"],
    ['use', 'tripod', ['4']],                      # 窗光四秒
    ['wait', 900],
    ['expect', f"{D}.W.f.act === 'tut2'"],
    ['use', 'h_dkdoor'],
    ['shot', 'darkroom'],
    ['use', 'd_tray'],                             # 平台上一小团白
    ['expect', f"{D}.W.f.act === 'tut3'"],
    ['step', 2, 8],
    ['use', 'hale'],                               # 曝光笔记、油灯 → 夜里十一点
    ['expect', f"{D}.W.f.act === 'night' && {D}.W.inv.includes('lamp')"],
    ['shot', 'hall_night'],
    ['use', 'pell'], ['use', 'pell'], ['use', 'h_lect'],
    ['use', 'hk_5'],
    ['expect', f"{D}.W.f.lamp === '5'"],
    ['use', 'tripod', [0, ['4']]],                 # 第五级 + 四秒：曝光刚好，可是太短
    ['wait', 900],
    ['expect', f"{D}.W.f.plate === 'empty'"],
    ['use', 'h_dkdoor'], ['use', 'd_tray'],
    ['expect', f"{D}.W.f.fails === 1"],
    ['step', 2, 8],
    ['use', 'hk_5'],                               # 摘灯
    ['use', 'hk_10'],                              # 挂第十级
    ['use', 'tripod', [0, ['15']]],
    ['wait', 1000],
    ['shot', 'exposing'],
    ['wait', 1600],
    ['expect', f"{D}.W.f.plate === 'lady10' && {D}.W.f.sawLady"],
    ['use', 'h_dkdoor'],
    ['use', 'd_tray', [0]],                        # 楼梯上的女人
    ['expect', f"{D}.W.f.act === 'seen' && {D}.ent('cdoor').open"],
    ['step', 2, 8],
    ['use', 'h_arch'],
    ['use', 'cdoor'],
    ['expect', f"{D}.W.f.act === 'room' && {D}.W.mapId === 'chamber'"],
    ['shot', 'chamber'],
    ['use', 'c_win'],
    ['use', 'c_board'],                            # 还没看底片：只是一块会响的地板
    ['use', 'c_chest', [1, ['30']]],               # 吹灭油灯，月光三十秒
    ['wait', 2000],
    ['shot', 'room_expo'],
    ['wait', 2800],
    ['expect', f"{D}.W.f.plate === 'room'"],
    ['step', 6, 8],
    ['step', 20, 3],                               # 仆人楼梯 → 暗房
    ['use', 'd_tray'],                             # 旧日的房间；画框上的床单滑下来
    ['expect', f"{D}.W.f.act === 'found' && {D}.W.f.plate2"],
    ['use', 'wrapped'],
    ['expect', f"{D}.W.f.act === 'chase' && {D}.W.inv.includes('portrait') && {D}.W.cp.name === 'chase'"],
    ['wait', 2000],
    ['expect', f"!{D}.ent('lady').hidden && {D}.W.mapId === 'darkroom'"],
    ['shot', 'chase_dark'],
    ['step', 12, 2],                               # 仆人楼梯上楼
    ['expect', f"{D}.W.mapId === 'upper'"],
    ['use', 'cdoor'],
    ['expect', f"{D}.W.mapId === 'chamber'"],
    ['use', 'c_board'],                            # 戒指和信
    ['expect', f"{D}.W.inv.includes('ring')"],
    ['use', 'mkA'],                                # 挂错一次（警告）
    ['expect', f"{D}.W.f.wrong === 1 && {D}.W.f.chase"],
    ['use', 'mkB'],                                # 床头
    ['expect', f"{D}.W.f.act === 'final' && !{D}.W.f.chase"],
    ['shot', 'final'],
    ['use', 'lady', [0]],                          # 把戒指还给她
    ['expect', f"{D}.W.f.ringGiven"],
    ['use', 'c_chest', [0]],                       # 吹灭油灯，长曝光
]
