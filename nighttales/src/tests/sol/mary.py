# 第一夜 血腥玛丽 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    [0, 1],                      # 开场：「我敢」；版本之争选「女王」
    ['use', [7, 4]],             # 规则笔记
    ['use', 'vanity', [0]],      # 拿小手镜
    ['use', 'lily'], ['use', 'kathy'],
    ['shot', 'bedroom'],
    ['use', [10, 1]],
    ['step', 0, 3],
    ['use', 'fire'], ['use', 'drawer'], ['use', 'shelf'], ['use', [3, 4]], ['use', 'grandma'], ['use', 'bridgepic'],
    ['shot', 'down'],
    ['step', 0, 2],              # 回走廊 (1,3)，还没到午夜
    ['expect', '!window.__dbg.W.f.midnight'],
    ['step', 0, 2, [1]],         # 阁楼楼梯：倒退着上楼（隐藏占卜）
    ['expect', "window.__dbg.W.f.backDone && window.__dbg.W.mapId === 'attic'"],
    ['shot', 'attic'],
    ['use', 'trunk'], ['use', 'mbox'], ['use', 'mstack', [0]], ['use', 'shutter'], ['use', 'roundwin'],
    ['step', 5, 10],             # 下楼回走廊
    ['step', 6, 3],              # 往东走 → 钟敲十二下
    ['expect', 'window.__dbg.W.f.midnight'],
    # 审查 #1 回归：模拟标题界面「继续」读档后，门必须还能用（这里只能用 js 触发读档）
    ['js', "window.__dbg.startChapter('mary', true)"],
    ['use', [3, 1]],
    ['expect', "window.__dbg.W.mapId === 'bedroom'"],
    ['use', [10, 1]],
    ['use', [14, 1]],
    ['expect', "window.__dbg.W.mapId === 'bath'"],
    ['use', 'cab'],              # 仪式前：日记卡住了
    ['use', 'switch'],
    ['use', 'bmirror', [0]],     # 点蜡烛
    ['use', 'bmirror', [0, 1, 0]],   # 开始 / 不回头 / 念第三遍
    ['shot', 'ritual'],
    ['expect', "window.__dbg.W.f.phase === 'hunt'"],
    ['step', 5, 7],              # 逃出浴室
    ['use', 'linen'], ['use', 'hmirror'],
    ['shot', 'hall_hunt'],
    ['use', [3, 1]],
    ['use', 'bed'], ['use', 'vanity'], ['use', 'kbag'],
    ['shot', 'bed_covered'],
    ['expect', 'window.__dbg.W.f.final'],
    ['use', [10, 1]],
    ['step', 0, 3],
    ['use', 'grandma'],
    ['step', 0, 2],
    ['use', [14, 1]],
    ['use', 'cab'],              # 狩猎段：拿到日记
    ['expect', 'window.__dbg.W.f.gotDiary'],
    ['shot', 'final'],
    ['use', 'mary_b', [0, '血腥玛丽我相信你']],   # 第一次拼错：蜡烛熄灭一次
    ['expect', 'window.__dbg.W.f.wrong === 1'],
    ['use', 'mary_b', [0, '玛丽沃斯我相信你']],
]
