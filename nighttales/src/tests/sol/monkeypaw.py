# 第八夜 猴爪 · 自动通关步骤（格式见 tests/play.py 顶部）
W = "window.__dbg.W"
SOL = [
    [0, 0],                                   # 开场棋局的两个选择
    ['shot', 'chess'],
    ['use', 'desk'],                          # 还款单（第一个愿望时会用到这个数字）
    ['use', 'pdoor'],
    ['use', 'htable'],                        # 莫里斯的明信片
    ['use', 'fdoor'],                         # 莫里斯到访
    ['use', 'cab'],
    ['use', 'morris'],                        # 追问猴爪的来历（四个问题），扔进火里
    ['expect', f"{W}.f.act === 'fire'"],
    ['shot', 'fire'],
    # 隐藏结局：犹豫 → 把它扔回火里
    ['use', 'irons', [1, 1]],
    ['expect', f"{W}.endScreen && {W}.endScreen.kind === 'end' && {W}.endScreen.title === '像个明白人那样'"],
    ['shot', 'wise'],
    ['js', "window.__dbg.retryFromCP()"],     # 回到莫里斯进门后的检查点，走正常流程
    ['expect', f"{W}.f.act === 'morris' && !{W}.endScreen"],
    ['use', 'cab'],
    ['use', 'morris'],
    ['use', 'irons', [0]],                    # 火钳把猴爪夹出来
    ['expect', f"{W}.f.act === 'wish1'"],
    ['step', 2, 6],
    ['use', 'herb', [1]],                     # 第一个愿望：两百英镑
    ['expect', f"{W}.f.act === 'bed1'"],
    ['use', 'pdoor'],
    ['step', 0, 3],                           # 赫伯特看见炉火里的猴脸 → 第二天早上
    ['expect', f"{W}.f.act === 'morning'"],
    ['shot', 'morning'],
    ['use', 'herb_h'],                        # 铜扣子
    ['shot', 'button'],
    ['use', 'herb_h', [0]],                   # 送赫伯特出门
    ['expect', f"{W}.f.act === 'stranger'"],
    # 没看窗外就去开门：会被叫回去
    ['use', 'pdoor'],
    ['use', 'fdoor'],
    ['expect', f"{W}.mapId === 'hall' && !{W}.f.saw"],
    ['step', 2, 6],
    ['use', 'pwin'],
    ['use', 'pdoor'],
    ['use', 'fdoor'],
    ['shot', 'stranger'],
    ['use', 'stranger_g'],                    # 噩耗与两百英镑 → 葬礼
    ['expect', f"{W}.mapId === 'cem'"],
    ['shot', 'cem'],
    ['use', 'digger'],
    ['use', 'milepost'],
    ['use', 'hgrave'],
    ['use', 'wife_c'],
    ['step', 9, 12],                          # 一周后的深夜
    ['expect', f"{W}.f.act === 'fetch'"],
    ['shot', 'night'],
    ['step', 4, 6],                           # 下楼
    ['use', 'hooks'],                         # 毛与梅金斯寄回的包裹 → 铜扣子
    ['step', 2, 6],
    ['use', 'desk'],                          # 公司来信
    ['use', 'piano'],                         # 赫伯特的漫画
    ['use', 'fire'],                          # 拿到猴爪，找不着门了
    ['expect', f"{W}.f.act === 'fetch' && {W}.inv.includes('paw') && {W}.mapDark.parlor > .99"],
    ['shot', 'fetch'],
    # 黑暗里撞到钢琴（bump 只能由真实键盘触发，这里直接调用处理函数做冒烟测试）
    ['js', "void window.__dbg.ent('piano').bump(window.__dbg.SAPI)"],
    ['step', 7, 4],                           # 地毯
    ['step', 4, 3],
    ['step', 2, 2],                           # 冷风
    ['step', 1, 2],
    ['use', 'pdoor'],                         # 摸到门框
    ['expect', f"{W}.mapId === 'hall'"],
    ['step', 0, 3],                           # 第二个愿望
    ['expect', f"{W}.f.act === 'wait'"],
    ['use', 'bed'],                           # 座钟敲了一刻、两刻
    ['use', 'bdresser'],
    ['step', 4, 6],                           # 楼梯脚下：两点差一刻，钟停，敲门声
    ['expect', f"{W}.f.act === 'flee' && {W}.f.clockStop"],
    # 第三个坏结局：自己拔开门闩
    ['use', 'fdoor', [1]],
    ['expect', f"{W}.endScreen && {W}.endScreen.kind === 'badend' && {W}.endScreen.title === '你开了门'"],
    ['wait', 1000],
    ['js', "window.__dbg.doAct('retry')"],    # 从「逃回卧室」检查点重来
    ['expect', f"{W}.f.act === 'flee' && {W}.mapId === 'hall'"],
    ['use', 'fdoor', [0]],                    # 缩回手，逃上楼；抓住她不放
    ['expect', f"{W}.f.act === 'door' && {W}.f.doorT === 40 && {W}.pl.speed === .5 && {W}.noRun"],
    ['shot', 'door'],
    ['use', 'g0'],                            # 拖鞋 + 划痕指向
    # 「门开了」坏结局：倒计时 40 秒是纯时序，这里直接拨快（只改剩余时间）
    ['js', f"{W}.timer.left = 0.05"],
    ['expect', f"{W}.endScreen && {W}.endScreen.title === '门开了' && {W}.pl.speed === 1"],
    ['js', f"window.__spot = {W}.f.pawSpot"],
    ['wait', 1000],
    ['js', "window.__dbg.doAct('retry')"],    # 重来：猴爪换了地方
    ['expect', f"{W}.f.act === 'door' && {W}.f.pawSpot !== window.__spot && {W}.pl.speed === .5"],
    # 摸到猴爪：「让她别打开那扇门」→ 坏结局「敲到天亮」
    ['js', "(() => { const e = window.__dbg.ent('paw2'); window.__dbg.step(Math.round(e.px / 16), Math.round(e.py / 16)); })()", [2]],
    ['expect', f"{W}.endScreen && {W}.endScreen.title === '敲到天亮'"],
    ['wait', 1000],
    ['js', "window.__dbg.doAct('retry')"],
    ['expect', f"{W}.f.act === 'door'"],
    # 再摸到它，许下「安息」
    ['js', "(() => { const e = window.__dbg.ent('paw2'); window.__dbg.step(Math.round(e.px / 16), Math.round(e.py / 16)); })()", [0]],
    ['expect', f"{W}.f.act === 'after' && !{W}.noRun"],
    ['step', 4, 6],
    ['use', 'fdoor'],
    ['shot', 'road'],
    ['step', 6, 6],
]
