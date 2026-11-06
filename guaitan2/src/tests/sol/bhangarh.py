# 第二十八夜 巴恩加尔古堡 · 自动通关步骤（格式见 tests/play.py 顶部）
# 主线：城门口（苏雷什、告示牌、神龛）-> 集市（守门人、画门楣、苦行僧小屋）-> 宫殿找周屿 -> 日落前回到城门（提前一步：红线）
#      -> 夜里的集市 -> 宫殿（采买单、壁龛的瓶底印）-> 香油巷认错一家、放对一家 -> 公主泼油 -> 天亮前跑到汉努曼门的灯下 -> 好结局
# 夜里城里的人是 tick 驱动的：测试是传送过去的，先把他们「停」住（e.s.park），真人要靠月光和灯躲开
PARK = "['r1','r2','r3','r4','r5','r6'].forEach(id => { const e = window.__dbg.ent(id); if (e) e.s.park = true; })"
SOL = [
    [],
    ['shot', 'gate'],
    ['use', 'suresh'],
    ['use', 'suresh', [0]],           # 公主与巫师的传说
    ['use', 'asi'],
    ['use', 'hanu', [0]],
    ['step', 12, 3],
    ['expect', "window.__dbg.W.mapId === 'bazaar' && window.__dbg.W.f.ph === 'day'"],
    ['shot', 'bazaar_day'],
    ['use', 'guard'],
    ['use', 's1', [0]],               # 把五个门楣画进速写本
    ['use', 'samadhi'],
    ['use', 'chab'],                  # 量太阳
    ['step', 0, 9],
    ['expect', "window.__dbg.W.mapId === 'palace'"],
    ['use', 'yu', [1]],
    ['expect', "window.__dbg.W.f.foundYu && window.__dbg.ent('yu').follow"],
    ['use', 'nicheC'],
    ['use', [23, 2]],
    ['shot', 'palace_day'],
    ['step', 14, 19],
    ['step', 45, 9, [0]],             # 日落前回到城门：苏雷什、红线、捡起小陶瓶（收好）
    ['expect', "window.__dbg.W.f.ph === 'night' && window.__dbg.W.f.early && window.__dbg.W.inv.includes('thread') && window.__dbg.W.inv.includes('oil')"],
    ['shot', 'gate_dusk'],
    ['step', 12, 3],
    ['expect', "window.__dbg.W.mapId === 'bazaar' && window.__dbg.W.cp.name === 'night'"],
    ['js', PARK],
    ['shot', 'bazaar_night'],
    ['use', 'samadhi', [0]],
    ['step', 0, 9],
    ['expect', "window.__dbg.W.mapId === 'palace'"],
    ['use', 'palmL'],
    ['use', 'nicheC'],
    ['use', 'yu'],
    ['use', [25, 2]],
    ['shot', 'palace_night'],
    ['step', 14, 19],
    ['js', PARK],
    ['use', 's5', [0]],               # 认错：新月
    ['expect', "window.__dbg.W.f.wrong === 1 && window.__dbg.W.inv.includes('oil')"],
    ['js', PARK],
    ['use', 's4', [0]],               # 大象
    ['expect', "window.__dbg.W.f.ph === 'given' && !window.__dbg.W.inv.includes('oil')"],
    ['shot', 'given'],
    ['step', 0, 9],                   # 公主泼油 -> 开始跑
    ['expect', "window.__dbg.W.f.ph === 'run' && window.__dbg.W.timer && window.__dbg.W.cp.name === 'run'"],
    ['shot', 'run_palace'],
    ['step', 14, 19],
    ['expect', "window.__dbg.W.mapId === 'bazaar' && window.__dbg.W.cp.name === 'run2'"],
    ['shot', 'run_bazaar'],
    ['step', 43, 9],
    ['js', "window.__dbg.W.timer.left = 0.4"],
    ['wait', 1500],
    ['expect', "window.__dbg.store.get('ends', []).includes('bhangarh:dawn')"],
]
