# 第六夜 375路末班车 · 自动通关步骤（格式见 tests/play.py 顶部）
# 键盘模拟：派发 keydown/keyup，和真人按键走同一条路径（夜路追逐真的跑过去，不停鬼）
_KEYS = "const D = window.__dbg, kd = c => dispatchEvent(new KeyboardEvent('keydown', {code: c})), ku = c => dispatchEvent(new KeyboardEvent('keyup', {code: c})), sl = ms => new Promise(r => setTimeout(r, ms));"
SOL = [
    [],
    # 圆明园站
    ['use', 'sign'], ['use', 'poster'], ['use', 'arch'],
    # 老太太坐在长椅上也能找她说话（以前调查到的是长椅）
    ['js', "window.__dbg.face('granny_s')"],
    ['expect', "window.__dbg.facing() && window.__dbg.facing().id === 'granny_s'"],
    ['expect', "(() => { const D = window.__dbg; D.doAct('use'); return D.W.dlg && D.W.dlg.who === '老太太'; })()"],
    ['wait', 100],
    ['use', 'granny_s'],
    ['use', 'vendor', [0]],
    ['expect', 'window.__dbg.W.f.busHere'],
    ['shot', 'stop'],
    ['use', 'bus'],
    # 车厢
    ['use', 'granny', [0]],                       # 把烤白薯给老太太
    ['expect', 'window.__dbg.W.f.yamGiven'],
    ['step', 5, 2],
    ['expect', "window.__dbg.W.f.phase === 'ride'"],
    ['shot', 'ride'],
    # 盯视：第一次先给阻塞式警告并自动转身
    ['js', 'window.__dbg.tp(8, 3, 1)'],
    ['wait', 2600],
    ['expect', 'window.__dbg.W.f.stareWarned && window.__dbg.W.pl.dir === 2 && !window.__dbg.W.endScreen'],
    ['use', 'dust'],                              # 可选的第四条线索：浮土上没有他们的脚印
    ['expect', 'window.__dbg.W.f.c_dust'],
    ['use', 'w10'],
    ['use', 'conductor', [0]],                    # 大钱：留着
    ['expect', "window.__dbg.W.f.turning && window.__dbg.W.inv.includes('coin')"],
    # 从右往左走上座位：自动脸冲前头，不再被判「回头」
    ['js', 'window.__dbg.tp(11, 2, 1)'],
    ['step', 10, 2],
    ['expect', 'window.__dbg.W.f.seated && window.__dbg.W.pl.dir === 2'],
    ['wait', 3000],
    ['expect', "window.__dbg.ent('mid').spr === '@midHalf'"],
    ['shot', 'turning'],
    ['wait', 4500],
    ['expect', 'window.__dbg.W.f.turnDone'],
    ['use', 'pole', [0, 0]],
    # 夜路
    ['expect', "window.__dbg.W.mapId === 'road'"],
    ['shot', 'road'],
    ['step', 10, 4],
    ['expect', "window.__dbg.ent('l3').off && window.__dbg.ent('ghost2').chase"],
    ['shot', 'chase'],
    # 从 l2 的灯下按住 Shift 一路跑过十来格的黑路，到 l4 的灯下（路灯杆子立在第3行，走第4行）
    ['js', "(async () => { " + _KEYS + " D.tp(13, 4, 2); await sl(300); kd('ShiftLeft'); kd('ArrowRight'); while (D.W.pl.x < 27 && !D.W.endScreen) await sl(15); ku('ArrowRight'); ku('ShiftLeft'); await sl(400); })()"],
    ['expect', '!window.__dbg.W.endScreen && window.__dbg.W.pl.x >= 26'],
    ['shot', 'lamp4'],
    # 接着跑过最后一小段黑路，到派出所门口的红灯底下
    ['js', "(async () => { " + _KEYS + " kd('ShiftLeft'); kd('ArrowRight'); while (D.W.pl.x < 36 && !D.W.endScreen) await sl(15); ku('ArrowRight'); ku('ShiftLeft'); await sl(300); })()"],
    ['expect', '!window.__dbg.W.endScreen && window.__dbg.W.pl.x >= 35'],
    ['use', 'pdoor', [0]],
    # 派出所
    ['js', "window.__dbg.face('granny_p')"],
    ['expect', "window.__dbg.facing() && window.__dbg.facing().id === 'granny_p'"],
    ['use', 'ledger'],
    ['use', 'pdesk', [4]],                        # 「穿着清朝的衣裳」站不住脚
    ['expect', '!window.__dbg.W.f.q1'],
    ['use', 'pdesk', [1, 0, '4127', 1]],          # 大钱（交给民警）+ 哈气；车号；半道上来的
    ['expect', 'window.__dbg.W.f.statement && window.__dbg.W.f.coinGiven'],
    ['shot', 'police'],
    ['step', 6, 8],
    # 第二天
    ['use', 'radio'],
    ['js', "window.__dbg.tp(8, 3, 3); window.__dbg.doAct('use')"],
    ['shot', 'home'],
    ['use', 'bed'],
]
