# 第六夜 罗伯特娃娃 · 自动通关步骤（格式见 tests/play.py 顶部）
F = 'window.__dbg.W.f'
# 停电段：测试是瞬移着按闸刀的，先把追逐停掉（真人速度另用脚本测）
HOLD = "window.__dbg.SAPI.stop('robW')"
SOL = [
    [0],                                     # 黛布交接：「好，我记住了」
    ['shot', 'office'],
    ['use', 'clip'],
    ['expect', F + '.readList'],
    ['use', 'dphone'],                       # 答录机：宋晴的留言
    ['use', 'cctv'],
    ['use', 'mailb'],
    ['expect', "window.__dbg.W.inv.includes('mail')"],
    ['use', 'hdoor'],
    ['expect', "window.__dbg.W.mapId === 'hall'"],
    ['shot', 'hall'],
    ['use', 'rcase', [0, 0]],                # 打招呼「晚上好，罗伯特」→ 读今天的信
    ['expect', F + '.mailRead && !' + F + '.needGreet'],
    ['use', 'l1'], ['use', 'l2'], ['use', 'l3'], ['use', 'plaque'], ['use', 'ophoto'],
    # 第一次拍照：问 → 等 → 「不」（小狮子不在）→ 放下
    ['use', 'rcase', [0, 0, 1, 3]],
    ['expect', F + '.noCnt === 1 && !' + F + '.photoDone'],
    ['use', 'rcase', [1]],                   # 仔细看看他：发现卡片
    ['expect', F + '.lionKnown'],
    ['shot', 'card'],
    ['use', 'cdoor', [0]],                   # 说「一会儿回来」，去走廊
    ['expect', "window.__dbg.W.mapId === 'corridor'"],
    ['shot', 'corridor'],
    ['step', 18, 4],
    ['use', 'elabel'],
    ['use', 'wbench', [0]],                  # 拿到小狮子 → 停电 → 礼貌地说明来意
    ['expect', F + ".phase === 'dark' && " + F + '.darkTone === 0'],
    ['shot', 'dark'],
    ['js', HOLD],
    # 先按错一次（修复间），会跳闸
    ['use', 'lv0'], ['use', 'lv0'],
    ['expect', F + '.wrongLv === 1 && ' + F + '.lvN === 0'],
    ['use', 'lv1'], ['use', 'lv1'],          # 总闸
    ['use', 'lv2'], ['use', 'lv2'],          # 展厅
    ['use', 'lv3'], ['use', 'lv3'],          # 走廊
    ['use', 'lv0'], ['use', 'lv0'],          # 修复间
    ['expect', F + ".phase === 'lit' && window.__dbg.ent('robW').hidden"],
    ['shot', 'lit'],
    ['use', 'cdoorH'],
    ['expect', "window.__dbg.W.mapId === 'hall'"],
    ['use', 'rcase', [0, 0, 0, 0, 1, 2, 0]], # 打招呼 → 放回小狮子 → 现在拍：问 → 等（歪头）→ 拍 → 谢谢
    ['expect', F + '.lionBack'],
    ['expect', F + '.photoDone'],
    ['shot', 'photo'],
    ['step', 5, 9, [0]],                     # 回值班室（离开前说再见）
    ['expect', "window.__dbg.W.mapId === 'office'"],
    ['use', 'cctv'],                         # 存档 → 电话响
    ['expect', F + '.archived && ' + F + '.ringing'],
    ['use', 'dphone', [0, 0, 1, 0, 2]],      # 接电话，答应，逐句写信
    ['expect', F + '.called && window.__dbg.W.inv.includes(\'letter\') && ' + F + '.crossed === 0'],
    ['use', 'rack'],
    ['expect', "window.__dbg.W.inv.includes('stamp')"],
    ['step', 7, 8],
    ['expect', "window.__dbg.W.mapId === 'yard'"],
    ['shot', 'yard'],
    ['use', 'mailbox'],
    ['expect', F + '.posted'],
    ['use', 'gate'],
    ['use', 'hdoor'],
    ['use', 'rcase', [0, 0]],                # 打招呼 → 晚安
    ['expect', '!' + F + '.rude'],
]
