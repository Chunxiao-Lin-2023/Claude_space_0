# 第三夜 猿梦 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    [],
    # 第一夜：梦中小站（看站名牌，或随便看三样东西，车就进站）
    ['use', 'spk'], ['use', 'pmir'],
    ['shot', 'station'],
    ['use', 'sign'],
    ['expect', 'window.__dbg.W.f.arrived'],
    ['use', 'mtrain', [0]],
    # 车厢：活造り之后开始倒计时，找两个证据
    ['expect', "window.__dbg.W.mapId === 'train' && window.__dbg.W.f.ph === 'exec'"],
    ['shot', 'train1'],
    ['use', 'paxD'],
    ['use', 'tw6'],          # 别的车窗：提示去看自己座位旁边那扇
    ['use', 'wme'],          # 车窗里没有脸的你（noface 大头像）
    ['use', 'tad'], ['use', 'tad', [0]],
    # 第二天：写帖子 -> 电话自己响 -> 书 -> 睡
    ['expect', "window.__dbg.W.mapId === 'room' && window.__dbg.W.f.day === 2"],
    ['use', 'pcdesk'], ['use', 'shelf'], ['use', 'phone'], ['use', 'rdiary'],
    ['shot', 'room'],
    ['use', 'bed', [0]],
    # 第二夜：站台上集齐两个证据再上车
    ['expect', "window.__dbg.W.mapId === 'station' && window.__dbg.W.f.n === 2"],
    ['use', 'sign'], ['use', 'sign'],
    ['use', 'sclock'], ['use', 'sclock'],
    ['shot', 'station2'],
    ['use', 'mtrain', [0]],
    ['expect', "window.__dbg.W.mapId === 'train' && window.__dbg.W.f.ph === 'exec'"],
    ['shot', 'train2'],
    ['js', "window.__dbg.tp(10, 2, 0); window.__dbg.doAct('use')", [0]],
    # 第三天
    ['expect', "window.__dbg.W.mapId === 'room' && window.__dbg.W.f.day === 3"],
    ['use', 'pcdesk'], ['use', 'phone'], ['use', 'bag'],
    ['use', 'bed', [0]],
    # 第三夜：带走女孩的领结（隐藏结局「两个人的站台」），去驾驶室报站
    ['expect', "window.__dbg.W.mapId === 'train' && window.__dbg.W.f.n === 3"],
    ['use', 'ribbon'],
    ['expect', "window.__dbg.W.inv.includes('ribbon')"],
    ['shot', 'train3'],
    ['use', 'cdoor'],
    ['use', 'route'],
    ['shot', 'cab'],
    ['use', 'mic', ['見月坂']],
    ['expect', "window.__dbg.W.mapId === 'edge'"],
    ['shot', 'edge'],
    ['step', 29, 3],
    ['expect', "window.__dbg.W.endScreen && /两个人的站台/.test(window.__dbg.W.endScreen.title)"],
]
