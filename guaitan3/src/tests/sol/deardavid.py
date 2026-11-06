# 第一夜 亲爱的大卫 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    [],
    ['shot', 'hall'],
    ['use', 'door5c'],                           # 门垫下的钥匙 → 5C
    ['expect', "window.__dbg.W.f.act === 'eve'"],
    ['shot', 'apt_eve'],
    ['use', 'bowls'],                            # 喂猫
    ['use', 'desk'],                             # 推特串（二）→ 23:58 猫去门口
    ['expect', "window.__dbg.W.f.midnight"],
    ['use', 'door5'],                            # 猫眼
    ['use', 'sofa', [1, 1, 0]],                  # 第一夜：问「怎么死的」「想要什么」→ 闭嘴
    ['expect', "window.__dbg.W.f.act === 'day' && window.__dbg.W.f.kStool && window.__dbg.W.f.kWait"],
    ['shot', 'apt_day'],
    ['use', 'cam'],                              # 宠物摄像头回放
    ['use', 'door5'],                            # 去走廊
    ['use', 'beth', [0]],                        # 贝丝：露丝、暗号歌、睡前两个问题；放下箱子
    ['expect', "window.__dbg.W.f.kHum && window.__dbg.W.f.boxDown"],
    ['shot', 'hall_day'],
    ['use', 'rbox'],                             # 信 + 歌词纸 + 照片
    ['expect', "window.__dbg.W.f.kKey"],
    ['use', 'door5c'],
    ['use', 'rocker', [1]],                      # 把照片放在椅背上（隐藏细节）
    ['expect', "window.__dbg.W.f.photoOn"],
    ['use', 'sofa'],                             # 第二夜 → 仓库
    ['expect', "window.__dbg.W.mapId === 'ware' && window.__dbg.W.f.chase"],
    ['shot', 'ware'],
    ['step', 19, 2, [3, 4, 0]],                  # 出口 → 卧室：问「大卫的钥匙」「调子」（带「亲爱的大卫」）→ 闭嘴
    ['expect', "window.__dbg.W.f.act === 'rite'"],
    ['shot', 'rite'],
    ['use', 'd_rad'],                            # 暖气片后面的红绳钥匙
    ['use', 'd_door'],                           # 出门 → 梦里的走廊
    ['expect', "window.__dbg.W.pl.y > 20"],
    ['shot', 'dream_hall'],
    ['use', 'stairs', ['356531']],               # 哼暗号 → 开门 → 露丝回家
]
