# 第二夜 裂口女 · 自动通关步骤（格式见 tests/play.py 顶部）
# 追逐段不改游戏状态：只用 step 移动，并用下面的 until() 等她真的走到某处（等待期间顺手翻掉弹出的内心独白）。


def until(cond, ms=9000):
    """等到 cond（JS 表达式，可用 D=__dbg、W=D.W、O=她的实体）为真；期间自动翻过无选项的对话/笔记。只等待，不改状态。"""
    return ['js', (
        "new Promise(r => { const D = window.__dbg, t0 = performance.now(); const f = () => { const W = D.W, O = D.ent('onna');"
        " if ((%s) || performance.now() - t0 > %d) return r();"
        " if (W.dlg && !W.dlg.choices) { W.dlg.full = true; D.doAct('adv'); } else if (W.note) D.doAct('adv');"
        " setTimeout(f, 120); }; f(); })") % (cond, ms)]


ONNA_X = "Math.round(window.__dbg.ent('onna').px / 16)"
ONNA_Y = "Math.round(window.__dbg.ent('onna').py / 16)"

SOL = [
    [],
    ['shot', 'class'],
    # 只需和 3 个同学聊；没聊过的早苗会在走廊里丢下一句
    ['use', 'miho'], ['use', 'kenta'], ['use', 'koba'],
    ['expect', 'window.__dbg.W.f.kidsGone'],
    ['expect', "window.__dbg.W.f.k_sanae === 'late'"],
    ['step', 10, 8], ['use', 'renraku'], ['use', 'kyR'],
    ['use', 'board'], ['use', 'win1'], ['use', 'win2'],
    ['use', 'locker'], ['use', 'locker'],
    ['use', 'kyL', [0]],
    ['expect', 'window.__dbg.W.f.duty'],
    ['expect', "window.__dbg.ent('board').s.ghost && !window.__dbg.ent('board').text"],
    ['shot', 'class_dusk'],
    ['use', 'cdoor'],
    ['use', 'hphone'], ['use', 'notice'], ['use', 'mybox'],
    ['shot', 'hall'],
    ['step', 10, 9],
    ['use', 'pole'], ['use', 'mag'], ['use', 'clip'],
    # 先拨联络网上划掉的旧号码：硬币被吞，再摸一次退币口才吐出来；然后拨新号码
    ['use', 'booth', [0, '63958']],
    ['expect', 'window.__dbg.W.f.eaten && !window.__dbg.W.f.called'],
    ['use', 'booth'],
    ['expect', "!window.__dbg.W.f.eaten && window.__dbg.W.inv.includes('yen1')"],
    ['use', 'booth', [0, '64172']],
    ['expect', 'window.__dbg.W.f.called'],
    ['use', 'counter', [0]],
    ['expect', "window.__dbg.W.inv.includes('candy') && window.__dbg.W.f._o_obaaLore"],
    ['shot', 'street'],
    ['step', 29, 5],
    ['step', 12, 7, [2]],
    ['expect', "window.__dbg.W.f.phase === 'chase'"],
    ['shot', 'chase'],
    # 往前跑：前面隔着 26 号胡同口的路灯先闪，她再出现在灯下（第一次闪现）
    ['step', 22, 7],
    until("W.f.tpN >= 1 && !W.busy"),
    ['expect', "window.__dbg.W.f.tpN === 1 && %s === 30" % ONNA_X],
    ['shot', 'lamp_appear'],
    # 拐进 18 号胡同口（后巷中段，两个口子）
    ['step', 18, 6], ['step', 18, 5], ['step', 18, 4], ['step', 18, 3],
    ['use', 'sisters'],
    until("%s <= 18 && %s === 6" % (ONNA_X, ONNA_Y)),   # 她沿大路走回来，守住离你最近的 18 号口
    ['expect', "%s === 18" % ONNA_X],
    ['shot', 'alley_guard'],
    # 绕过箱子跑到 26 号口出去——她还守在 18 号口
    ['step', 20, 3], ['step', 20, 2], ['step', 23, 2], ['step', 23, 3], ['step', 26, 3],
    ['step', 26, 5], ['step', 26, 6],
    ['expect', "window.__dbg.W.f.phase === 'chase' && %s <= 22" % ONNA_X],
    # 钻进 34 号口后面的死路：她守口、探身（剪刀声）、待满 10 秒伸手进来 → 扔糖
    ['step', 34, 6], ['step', 34, 5], ['step', 34, 4], ['step', 34, 3],
    until("%s === 34 && %s === 5" % (ONNA_X, ONNA_Y), 12000),
    ['expect', "%s === 5" % ONNA_Y],
    ['shot', 'lean'],
    until("W.f.threw && !W.busy", 12000),
    ['expect', "window.__dbg.W.f.threw && !window.__dbg.W.inv.includes('candy')"],
    ['step', 34, 6], ['step', 37, 6],
    ['expect', "window.__dbg.W.mapId === 'koban'"],
    ['shot', 'koban'],
    # 发蜡味要自己找：衣帽架上的警帽
    ['use', 'cop', [1]],
    ['expect', '!window.__dbg.W.f.smell'],
    ['use', [8, 3]],
    ['expect', 'window.__dbg.W.f.smell'],
    ['use', 'cop', [0]],
    ['expect', "window.__dbg.W.mapId === 'homest'"],
    ['shot', 'homest'],
    # 坏结局抽测：光喊两次发蜡 → 「和她一样漂亮」；坏结局保留检查点，从家门口重来
    ['step', 10, 4, [2, 2]],
    ['expect', "window.__dbg.W.endScreen && window.__dbg.W.endScreen.kind === 'badend'"],
    ['expect', "window.__dbg.store.get('cp.kuchisake', null) && window.__dbg.store.get('cp.kuchisake').name === 'final'"],
    # 点「从检查点重来」（结局页 0.8 秒后才接受按键；慢机器上反复按直到生效）
    ['js', "new Promise(r => { const f = () => { window.__dbg.doAct('retry'); if (!window.__dbg.W.endScreen) r(); else setTimeout(f, 150); }; f(); })"],
    ['expect', "window.__dbg.W.mapId === 'homest' && !window.__dbg.W.f.met"],
    # 正解：喊一次发蜡（不灵）→ 回头喊巡查先生，让真的发蜡味赶走她
    ['step', 10, 4, [2, 3]],
    ['expect', 'window.__dbg.W.f.won'],
    ['use', 'hdoor'],
    ['use', 'tv'],
    ['expect', '!window.__dbg.W.f.call2'],
    ['use', 'hphone2'],
    ['expect', "window.__dbg.W.f.call2 && !window.__dbg.W.inv.includes('yen2')"],
    ['shot', 'house'],
    ['use', 'gdoor'],
]
