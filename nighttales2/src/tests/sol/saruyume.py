# 第三夜 猿梦 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    [],
    # 第一夜：梦中小站
    ['use', 'spk'], ['use', 'pmir'],
    ['shot', 'station'],
    ['use', 'sign'],
    ['expect', 'window.__dbg.W.f.arrived'],
    ['use', 'mtrain', [0]],
    # 车厢：活造り之后开始倒计时，找两个证据
    ['expect', "window.__dbg.W.mapId === 'train' && window.__dbg.W.f.ph === 'exec'"],
    ['shot', 'train1'],
    ['use', 'paxD'],
    ['use', 'wme'],
    ['use', 'tad'], ['use', 'tad', [0]],
    # 第二天
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
    # 第三夜：去驾驶室报站
    ['expect', "window.__dbg.W.mapId === 'train' && window.__dbg.W.f.n === 3"],
    ['use', 'ribbon'],
    ['shot', 'train3'],
    ['use', 'cdoor'],
    ['use', 'route'],
    ['shot', 'cab'],
    ['use', 'mic', ['見月坂']],
    ['expect', "window.__dbg.W.mapId === 'edge'"],
    ['shot', 'edge'],
    ['step', 29, 3],
]
