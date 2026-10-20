# 第四夜 湘西赶尸 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    [],
    ['shot', 'shanlu'],
    ['use', [9, 5]],
    ['use', [17, 5]],
    ['use', [12, 1]],              # 石窝
    ['step', 17, 4],               # 走过 x=17 才响锣
    ['expect', "window.__dbg.W.f.ph === 'gong'"],
    ['shot', 'gong'],
    ['step', 13, 2, [1]],          # 躲进石窝，不回头
    ['expect', "window.__dbg.W.f.ph === 'follow' && !window.__dbg.W.f.looked"],
    ['shot', 'pass'],
    ['step', 29, 4],
    ['expect', "window.__dbg.W.mapId === 'kedian' && window.__dbg.W.f.ph === 'inn'"],
    ['shot', 'inn'],
    ['use', 'book'], ['use', 'salt'], ['use', 'salt'], ['use', 'yan'], ['use', 'deng'], ['use', 'xs3_k'], ['use', 'tengbed'],
    ['step', 25, 9],
    ['use', 'yao_h'], ['use', 'yao_h'],
    ['expect', "window.__dbg.W.f._o_yaoInn2"],
    ['shot', 'houyuan'],
    ['step', 0, 5],
    ['use', 'mybed', [0]],
    ['expect', "window.__dbg.W.f.ph === 'stalk'"],
    ['shot', 'stalk'],
    ['use', 'baofu'],
    ['expect', "window.__dbg.W.inv.includes('lingluo')"],
    ['use', 'xs3_k', ['铃锣铃铃']],
    ['expect', "window.__dbg.W.f.ph === 'fu' && window.__dbg.W.timer && window.__dbg.W.f._inc === 300"],
    ['shot', 'fu'],
    ['use', 'fu_d'],
    ['use', 'tengbed'],
    ['step', 25, 9],
    ['use', 'well', [0]],          # 先舀了井水（陷阱）
    ['use', 'yangang', [0]],       # 在瓦缸边倒掉井水、重接檐水
    ['expect', "window.__dbg.W.f.water === 'rain'"],
    ['use', 'yao_h'],
    ['expect', "window.__dbg.W.inv.includes('yinsuo') && window.__dbg.W.inv.includes('yudie')"],
    ['step', 0, 5],
    ['expect', "window.__dbg.ent('xs2_k').dir === 2"],   # 回店惊吓：第二位喜神转了过来
    ['step', 12, 13],
    ['expect', "window.__dbg.W.mapId === 'yizhuang'"],
    ['step', 16, 5, [2]],          # 棺材里喊名字：不出声
    ['use', 'tian'], ['use', 'paper'], ['use', 'xiangan'],
    ['expect', "window.__dbg.W.inv.includes('zhusha') && typeof window.__dbg.W.f._inc === 'number'"],
    ['shot', 'yizhuang'],
    ['step', 9, 11],
    ['use', 'xs3_k', ['吴秀姑']],  # 写错：扣香
    ['expect', "window.__dbg.W.f.ph === 'fu' && window.__dbg.W.timer.left < 275"],
    ['use', 'xs3_k', ['滕秀姑']],  # 符头写「滕秀姑」；天亮后答应送她
    ['expect', "window.__dbg.W.mapId === 'zhaikou'"],
    ['shot', 'zhaikou'],
    ['use', 'xs3_z', ['铃锣']],    # 起身敲错一次
    ['use', 'xs3_z', ['锣铃', '铃铃锣']],
    ['expect', "window.__dbg.W.f.ph === 'walk'"],
    ['step', 9, 4],
    ['expect', "window.__dbg.ent('dog').s.bark"],
    ['step', 14, 4],
    ['step', 20, 4],
    ['expect', "window.__dbg.ent('dog').s.cower"],
    ['shot', 'walk'],
    ['step', 23, 4, [0]],
    ['expect', "window.__dbg.store.get('ends', []).includes('ganshi:home')"],
]
