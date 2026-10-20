# 第八夜 恩菲尔德闹鬼案 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    [],
    ['shot', 'street'],
    ['use', 'neighbor'],
    ['use', 'kent_s', [0]],                     # 拿到录音机、相机，案件摘要
    ['expect', "window.__dbg.W.f.act === 'evening'"],
    ['use', 'fdoor'],                           # 进屋，一家人；孩子们上楼睡觉
    ['expect', "window.__dbg.W.f.act === 'bed'"],
    ['shot', 'living'],
    ['use', 'dents'],
    ['step', 16, 7],                            # 上楼
    ['use', 'bed_t'],
    ['use', 'kdress'],                          # 放录音机
    ['expect', "window.__dbg.W.f.act === 'placed'"],
    ['shot', 'kidsroom'],
    ['step', 1, 8],
    ['use', 'ktable'],                          # 厨房里等：楼上的敲击
    ['expect', "window.__dbg.W.f.act === 'knocks'"],
    ['step', 16, 7],
    ['use', 'bed_t'], ['use', 'b1'],
    ['use', 'kdress'],                          # 取回录音机
    ['expect', "window.__dbg.W.f.act === 'fetched'"],
    ['step', 1, 8],
    ['use', 'ktable'],                          # 回放：五组敲击 + 「箱子」
    ['expect', "window.__dbg.W.f.act === 'heard'"],
    ['use', 'cup_d', ['234']],                  # 把汤米敲的也算进去 → 打不开
    ['use', 'cup_d', ['999']],                  # 第二次错：肯特提示「划掉孩子们的」
    ['use', 'cup_d', ['111']],                  # 第三次错：肯特点出 031、066、088
    ['use', 'cup_d', ['371']],                  # 只算没人敲的那三组：3、7、1
    ['expect', "window.__dbg.W.f.act === 'chest'"],
    ['step', 16, 7],
    ['shot', 'bedjump'],
    ['use', 'camtri'],
    ['use', 'bed_l', [1]],                      # 连拍；露西用老人的嗓音说话 → 含水试验
    ['expect', "window.__dbg.W.f.act === 'develop'"],
    ['shot', 'after_lev'],
    ['use', 'trays', [0]],                      # 冲洗 → 走进第二张照片
    ['expect', "window.__dbg.W.mapId === 'photo'"],
    ['shot', 'photo'],
    ['use', 'lucy_p', [0]], ['use', 'bedP_l', [0]], ['use', 'curtP', [1]], ['use', 'wardP', [1]],
    ['use', 'edge'],                            # 出照片 → 停电
    ['expect', "window.__dbg.W.f.act === 'dark'"],
    ['shot', 'dark_up'],
    ['step', 1, 8],
    ['shot', 'dark_living'],
    ['use', 'kcount'],                          # 五十便士 → 电视自己亮了，椅子挪到了厨房门口
    ['expect', "window.__dbg.ent('gchair_l').px === 9 * 16 && window.__dbg.ent('telly').lit"],
    ['shot', 'dark_coin'],
    ['wait', 6000],                             # 拿了硬币站着不动 → 椅子追上来（死亡）
    ['retry'],                                  # 从「停电」检查点重来：回到楼上，没有硬币，椅子回墙角
    ['expect', "window.__dbg.W.f.act === 'dark' && window.__dbg.W.mapId === 'upstairs' && !window.__dbg.W.inv.includes('coin')"],
    ['step', 1, 8],
    ['expect', "window.__dbg.ent('gchair_l').px === 16 && !window.__dbg.ent('telly').lit"],
    ['use', 'kcount'],
    ['use', 'meter'],                           # 来电 → 第二天上午
    ['expect', "window.__dbg.W.f.act === 'morning'"],
    ['shot', 'morning'],
    ['use', 'tommy_l'],
    ['use', 'bdoor'],
    ['use', 'shed'],
    ['shot', 'garden_day'],
    ['use', [6, 1]],
    ['step', 16, 7],
    ['use', 'lucy_u'],
    ['use', 'bed_l'],                           # 露西的作文本
    ['step', 1, 8],
    ['use', 'morton_l', [1]],                   # 「全是真的」→ 被驳回
    ['use', 'morton_l', [2, 0, 1, 0, 1]],       # 有真有假，逐条答对
    ['expect', "window.__dbg.W.f.act === 'night'"],
    ['use', 'bdoor'],
    ['shot', 'garden_night'],
    ['use', 'gchair_g', [0, 0, 0, 0]],           # 三个问题 + 「珍妮在等你」→ 好结局
]
