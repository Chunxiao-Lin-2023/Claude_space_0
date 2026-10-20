# 第八夜 贝尔女巫 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    [],
    ['shot', 'farm'],
    ['use', 'tom_f', [0]],
    ['use', 'cabdoor', [0]],                  # 玉米地里的怪兽 → 晚饭（它开口说话）
    ['expect', "window.__dbg.W.f.ph === 'evening'"],
    ['shot', 'supper'],
    ['use', 'desk'],
    ['use', 'doorB'], ['use', 'dresserB'],    # 安妮的日记
    ['shot', 'anneroom'],
    ['use', 'exitB'],
    ['use', 'doorA'], ['use', 'cupA'],        # 医生的便条
    ['use', 'exitA'],
    ['use', 'pallet', [0, 1, 1, 2]],          # 躺下；不看床底；松手；问它为什么恨老贝尔
    ['expect', "window.__dbg.W.f.ph === 'night1b'"],
    ['shot', 'night'],
    ['use', 'doorB', [0]],
    ['expect', "window.__dbg.W.f.ph === 'night1c'"],
    ['use', 'exitB'],
    ['use', 'doorA'],                         # 老贝尔的鞋 → 第二天早上
    ['expect', "window.__dbg.W.f.ph === 'day2'"],
    ['shot', 'morning'],
    ['step', 11, 11],
    ['shot', 'farmday'],
    ['step', 0, 7],
    ['use', 'sdesk'],                         # 斯通兄弟的记录
    ['use', 'stone_c'],                       # 问完四件事，拿到赞美诗抄本
    ['expect', "window.__dbg.W.f.ph === 'stone'"],
    ['shot', 'church'],
    ['step', 7, 10],                          # 回农场：安妮失踪
    ['expect', "window.__dbg.W.f.ph === 'missing'"],
    ['step', 5, 16],
    ['shot', 'cave'],
    ['use', 'dan_c'],
    ['step', 9, 9],                           # 马灯被吹灭，它唱两句
    ['expect', 'window.__dbg.W.f.asked'],
    ['use', 'echo', ['1234']],                # 答错一次
    ['use', 'echo', ['9174']],                # 91 千古保障 + 74 哀哉我主流血
    ['expect', "window.__dbg.W.f.ph === 'lit'"],
    ['step', 4, 4],
    ['shot', 'lit'],
    ['use', 'anne_c', [0]],
    ['expect', "window.__dbg.W.f.ph === 'flee'"],
    ['wait', 700],
    ['shot', 'flee'],
    ['step', 11, 16],                         # 逃出洞口
    ['expect', "window.__dbg.W.f.ph === 'collapse'"],
    ['shot', 'collapse'],
    ['use', 'doorA'],
    ['use', 'cupA', [1]],                     # 药瓶：扔进火里
    ['expect', "window.__dbg.W.mapId === 'grave'"],
    ['step', 8, 6],                           # 葬礼
    ['shot', 'funeral'],
    ['use', 'anne_g', [0]],
    ['step', 7, 11, [3]],                     # 春天：它告别，「七年后再见」
]
