# 第十夜 杉泽村 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    [],
    ['shot', 'mori0'],
    # 2001 年冬：车（笔记本、收音机、甲）→ 地藏（乙）→ 雪里的钥匙 → 闸门（丙）→ 山神祠（丁）
    ['use', 'car'],
    ['use', 'jizo'],
    ['use', 'kkey'],
    ['expect', "window.__dbg.W.inv.includes('key')"],
    ['use', 'gboard'],
    ['use', 'hokora'],
    # 车前盖上拼地图：先错一次，再拼对（从西到东：丙甲丁乙）
    ['use', 'car', [1, '甲乙丙丁']],
    ['expect', 'window.__dbg.W.f.mapWrong === 1'],
    ['use', 'car', [0, '丙甲丁乙']],
    ['expect', 'window.__dbg.W.f.mapDone'],
    # 挖雪堆：先挖错一处，再看三角点，挖二本杉正北、三角点正西的那堆
    ['use', 'lp2', [0]],
    ['expect', 'window.__dbg.W.f.digWrong === 1'],
    ['use', 'sankaku'],
    ['shot', 'snowdig'],
    ['use', 'lp3', [0, 0]],
    # 昭和四十五年 秋：烧炭老人帮忙扶起追分的石头（先朝南看一次，再朝西）
    ['expect', "window.__dbg.W.mapId === 'mori1'"],
    ['shot', 'mori1'],
    ['use', 'st2_1'],
    ['use', 'sumi', [0, 3]],
    ['expect', 'window.__dbg.W.f.st2Wrong === 1'],
    ['use', 'st2_1', [2]],
    # 昭和某年 夏夜：鸟居
    ['expect', "window.__dbg.W.mapId === 'mori2'"],
    ['use', 'hollow'],
    ['use', 'sign2'],
    ['shot', 'mori2'],
    ['step', 11, 2, [0]],
    # 杉泽村：拒绝留宿 → 回覧板 → 庄屋
    ['expect', "window.__dbg.W.mapId === 'mura'"],
    ['shot', 'mura'],
    ['use', 'kairan'],
    ['use', 'doorA'],
    ['expect', "window.__dbg.W.mapId === 'ie'"],
    ['use', 'zen', [1]],
    ['use', 'futon', [1]],
    ['use', 'naoto', [0]],
    ['expect', 'window.__dbg.W.f.woke'],
    ['shot', 'ie'],
    ['use', 'bundle'],
    ['expect', 'window.__dbg.W.f.hasStone'],
    ['step', 6, 9],
    # 逃出村子（追逐在 scratchpad 的真人速度脚本里另测；这里先把他藏起来）
    ['expect', "window.__dbg.W.mapId === 'mura' && window.__dbg.W.f.ph === 'chase'"],
    ['js', "window.__dbg.ent('ono').hidden = true"],
    ['shot', 'chase'],
    # 冲出村口 → 鸟居：让石头的眼睛朝着村子（选项 0）→ 天亮
    ['step', 16, 23, [0]],
    ['expect', 'window.__dbg.W.f.sealed && window.__dbg.W.f.woke'],
]
