# 第八夜 猴爪 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    [0, 0],                                   # 开场棋局的两个选择
    ['shot', 'chess'],
    ['use', 'desk'],                          # 还款单
    ['use', 'pdoor'],
    ['use', 'htable'],                        # 莫里斯的明信片
    ['use', 'fdoor'],                         # 莫里斯到访
    ['use', 'cab'],
    ['use', 'morris'],                        # 讲猴爪的来历，扔进火里
    ['expect', "window.__dbg.W.f.act === 'fire'"],
    ['shot', 'fire'],
    ['use', 'irons', [0]],                    # 火钳把猴爪夹出来
    ['expect', "window.__dbg.W.f.act === 'wish1'"],
    ['step', 2, 6],
    ['use', 'herb', [1]],                     # 第一个愿望：两百英镑
    ['expect', "window.__dbg.W.f.act === 'bed1'"],
    ['use', 'pdoor'],
    ['step', 0, 3],                           # 赫伯特看见炉火里的猴脸 → 第二天早上
    ['expect', "window.__dbg.W.f.act === 'morning'"],
    ['shot', 'morning'],
    ['use', 'herb_h'],
    ['use', 'herb_h', [0]],                   # 送赫伯特出门
    ['expect', "window.__dbg.W.f.act === 'stranger'"],
    ['use', 'pwin'],
    ['use', 'pdoor'],
    ['use', 'fdoor'],
    ['shot', 'stranger'],
    ['use', 'stranger_g'],                    # 噩耗与两百英镑 → 葬礼
    ['expect', "window.__dbg.W.mapId === 'cem'"],
    ['use', 'hgrave'],
    ['use', 'wife_c'],
    ['shot', 'cem'],
    ['step', 5, 7],                           # 一周后的深夜
    ['expect', "window.__dbg.W.f.act === 'fetch'"],
    ['shot', 'night'],
    ['step', 4, 6],
    ['step', 2, 6],
    ['use', 'desk'],                          # 公司来信
    ['use', 'piano'],                         # 赫伯特的漫画
    ['use', 'fire'],                          # 拿到猴爪
    ['shot', 'fetch'],
    ['use', 'pdoor'],
    ['step', 0, 3],                           # 第二个愿望
    ['expect', "window.__dbg.W.f.act === 'wait'"],
    ['use', 'bed'],
    ['use', 'bdresser'],
    ['step', 4, 6],                           # 楼梯脚下，敲门声
    ['expect', "window.__dbg.W.f.act === 'flee'"],
    ['step', 0, 3],                           # 逃回卧室，她冲下楼
    ['expect', "window.__dbg.W.f.act === 'door'"],
    ['shot', 'door'],
    ['use', 'g0'],
    # 猴爪被踢到随机位置：走到它上面摸到它，许第三个愿望
    ['js', "(() => { const e = window.__dbg.ent('paw2'); window.__dbg.step(Math.round(e.px / 16), Math.round(e.py / 16)); })()", [0]],
    ['expect', "window.__dbg.W.f.act === 'after'"],
    ['step', 4, 6],
    ['use', 'fdoor'],
    ['shot', 'road'],
    ['step', 6, 6],
]
