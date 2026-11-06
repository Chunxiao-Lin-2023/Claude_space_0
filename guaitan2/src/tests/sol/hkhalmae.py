# 第二十一夜 香港奶奶 · 自动通关步骤（格式见 tests/play.py 顶部）
# 主线走真结局「回家的路」：喂娜比让它跟着，问答全对，最后一题抱起娜比。


def until(cond, ms=12000):
    """等到 cond（JS 表达式，可用 D=__dbg、W=D.W）为真；期间自动翻过无选项的对话/笔记。只等待，不改状态。"""
    return ['js', (
        "new Promise(r => { const D = window.__dbg, t0 = performance.now(); const f = () => { const W = D.W;"
        " if ((%s) || performance.now() - t0 > %d) return r();"
        " if (W.dlg && !W.dlg.choices) { W.dlg.full = true; D.doAct('adv'); } else if (W.note) D.doAct('adv');"
        " setTimeout(f, 100); }; f(); })") % (cond, ms)]


QA_TRUE = [1, 2, ['西', '南', '香港'], ['1', '6', '5', '0', '香港'], ['2', '1', '0', '0', '香港'], 2]

SOL = [
    [],
    ['shot', 'class'],
    # 只和三个同学聊；惠珍会在走廊里丢下一句
    ['use', 'minho'], ['use', 'eunju'], ['use', 'jihun'],
    ['use', 'kyR'],
    ['use', 'mydesk'],
    ['expect', "window.__dbg.W.inv.includes('atlas') && window.__dbg.W.inv.includes('milk')"],
    ['use', 'board'], ['use', 'win1'], ['use', 'win2'],
    ['expect', 'window.__dbg.W.f.kidsGone'],
    ['expect', "window.__dbg.W.f.k_hyejin === 'late'"],
    ['use', 'kyL'],
    ['shot', 'class_done'],
    ['use', 'cdoor'],
    ['expect', "window.__dbg.W.mapId === 'hall'"],
    ['shot', 'hall'],
    ['use', 'odoor'],
    ['expect', "window.__dbg.W.mapId === 'office'"],
    ['use', 'kdesk'],
    ['expect', "window.__dbg.W.f.tt && window.__dbg.W.f.ringing"],
    ['shot', 'office'],
    # 先抢在第四声之前接一次：警告，铃声重来
    until("W.f.rn >= 1"),
    ['use', 'phone'],
    ['expect', 'window.__dbg.W.f.early === 1 && !window.__dbg.W.f.called'],
    # 等满四声再接
    until("W.f.rn >= 4 && !W.busy", 20000),
    ['use', 'phone'],
    ['expect', 'window.__dbg.W.f.called && window.__dbg.W.f.dusk'],
    ['step', 7, 9],
    ['expect', "window.__dbg.W.mapId === 'hall'"],
    # 窗外的奶奶：先想开窗（警告），再往后退；然后她从楼梯上来
    ['step', 18, 3, [0, 1]],
    ['expect', 'window.__dbg.W.f.hunt && window.__dbg.W.f.winWarn'],
    ['shot', 'hunt'],
    # 躲进第二间，屏住呼吸
    ['use', 'st2', [0]],
    ['expect', 'window.__dbg.W.f.hid && !window.__dbg.W.pl.hidden'],
    ['step', 26, 3],
    ['expect', "window.__dbg.W.mapId === 'street'"],
    ['shot', 'street'],
    ['use', 'cart'],
    ['use', 'nabi'],
    ['expect', "window.__dbg.W.f.cat && window.__dbg.ent('nabi').follow"],
    ['step', 22, 3],
    ['step', 27, 3],
    ['shot', 'street_far'],
    ['step', 31, 3, QA_TRUE],
    ['expect', "window.__dbg.W.f.done === 'home'"],
    ['shot', 'after'],
    ['use', 'hgate'],
]
