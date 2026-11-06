# 第二十七夜 明天再来 · 自动通关步骤（格式见 tests/play.py 顶部）
D = 'window.__dbg.W'
K = ['ನಾ naa', 'ಳೆ le', 'ಬಾ baa']   # 照作业本写「ನಾಳೆ ಬಾ」
SOL = [
    [],
    ['shot', 'home_eve'],
    ['use', 'ajjiH'],                                   # 阿吉讲传说 → 作业本
    ['expect', D + ".f.ph === 'n1b'"],
    ['use', 'bag'],
    ['use', 'idoorIn'],
    ['expect', D + ".mapId === 'lane'"],
    ['shot', 'lane_eve'],
    ['use', 'dH', [0, K]],                              # 第一夜：只写自家门
    ['expect', D + ".f.ph === 'n1d'"],
    ['use', 'dH'],
    ['use', 'kmat', [0, 3]],                            # 睡下 → 敲门 → 一声不出
    ['expect', D + ".f.ph === 'd2' && " + D + ".cp.name === 'day2'"],
    ['shot', 'lane_day2'],
    ['use', 'dR', [1, K]],                              # 红漆 → 拉希姆的铁卷帘
    ['use', 'pil', [0, K]],                             # 粉笔 → 两扇门中间的柱子
    ['use', 'dH', [0, 0, K]],                           # 粉笔 → 自家门
    ['use', 'muniL', [0]],                              # 请穆尼大爷来家里睡（他不肯）
    ['use', 'ajjiL'],                                   # 阿吉去劝，穆尼锁门过来
    ['expect', D + ".f.muniAway && " + D + ".f.ph === 'd2'"],
    ['use', 'dH', [0]],                                 # 回屋 → 第二夜
    ['expect', D + ".f.ph === 'muni' && " + D + ".cp.name === 'muni'"],
    ['shot', 'home_muni'],
    ['use', 'muniH'],                                   # 拦住穆尼大爷
    ['expect', D + ".f.ph === 'd3'"],
    ['use', 'pco'],
    ['use', 'fgate'],
    ['expect', D + ".mapId === 'dorm'"],
    ['shot', 'dorm_dusk'],
    ['use', 'hearth'],                                  # 拿炭 → 停电，她来了
    ['expect', D + ".f.ph === 'dark' && " + D + ".cp.name === 'dark'"],
    ['use', 'r1', [K]], ['use', 'r2', [K]], ['use', 'r3', [K]],
    ['shot', 'dorm_dark'],
    ['use', 'r4', [K]], ['use', 'r5', [K]], ['use', 'r6', [K]],
    ['use', 'r6', [0]],                                 # 进六号房，拉住阿妈
    ['expect', D + ".f.ph === 'd4'"],
    ['use', 'muniL'], ['use', 'venkat'], ['use', 'rahim'],
    ['use', 'dM', [0, K]],                              # 白天：粉笔写穆尼大爷的门（留着招牌漆）
    ['use', 'dH', [0]],                                 # 回屋 → 雨夜
    ['expect', D + ".f.ph === 'rain' && " + D + ".cp.name === 'rain'"],
    ['use', 'stall'],                                   # 扯油布
    ['use', 'pil', [0]],                                # 油布遮住柱子
    ['use', 'dM', [1, K]],                              # 招牌漆重写穆尼大爷的门
    ['shot', 'lane_rain'],
    ['use', 'dH'],                                      # 进屋，从门缝看她走过去
    ['wait', 8000],
    ['expect', D + ".f.ph === 'd8' && " + D + ".cp.name === 'd8'"],
    ['shot', 'lane_d8'],
    ['use', 'venkat'],                                  # 报纸：风波渐息
    ['use', 'ammaL', [0]],                              # 「阿妈，留着吧。」
    ['expect', "window.__dbg.store.get('ends', []).includes('naleba:week')"],
]
