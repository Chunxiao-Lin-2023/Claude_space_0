# 第二十二夜 蔷花红莲 · 自动通关步骤（格式见 tests/play.py 顶部）
D = 'window.__dbg.W'
SOL = [
    [],
    ['shot', 'arrive'],
    ['use', 'kim', [0]],                               # 前任们是怎么死的
    ['expect', D + ".f.ph === 'prep'"],
    ['use', 'storedoor'], ['use', 'clerkdoor'],        # 灯油、火镰
    ['use', 'dongdoor'],
    ['expect', D + ".mapId === 'dongheon'"],
    ['use', 'desk'], ['use', 'lamp'], ['use', 'rack'],  # 册子、添油、官服
    ['shot', 'dong_prep'],
    ['use', 'seat', [0]],
    ['expect', D + ".f.ns === 'dark' && " + D + ".cp.name === 'night'"],
    ['shot', 'dark'],
    ['use', 'win'], ['use', 'lamp'],                   # 先关窗，再点灯
    ['expect', D + ".f.ns === 'sit'"],
    ['use', 'seat'],
    ['expect', D + ".f.ns === 'still'"],
    ['shot', 'still'],
    ['wait', 7600],                                    # 端坐不动 → 她开口 → 天亮
    ['expect', D + ".f.ph === 'day' && " + D + ".cp.name === 'day'"],
    ['step', 6, 9],
    ['expect', D + ".mapId === 'gwana'"],
    ['use', 'gate', [0]],
    ['expect', D + ".mapId === 'bae'"],
    ['shot', 'bae'],
    ['use', 'heo'], ['use', 'yumo'], ['use', 'yumo'], ['use', 'yumo'],
    ['use', 'cage'], ['use', 'ash'], ['use', 'yo'], ['use', 'girlsdesk'],
    ['use', 'bae'], ['use', 'jang'],
    ['step', 12, 17],
    ['use', 'gate', [1]],
    ['expect', D + ".mapId === 'pond'"],
    ['shot', 'pond'],
    ['use', 'fisher'], ['use', 'bramble'],
    ['use', 'bird'], ['use', 'bird'], ['use', 'bird'],
    ['use', 'shoe'],
    ['step', 4, 17],
    ['use', 'gate', [0]],
    ['use', 'bae'], ['use', 'dchest'],                 # 给他看鞋 → 钥匙 → 嫁妆单
    ['expect', "['trap','fur','shoe','sleeve','dowry'].every(k => " + D + ".inv.includes(k))"],
    ['step', 12, 17, [1]],                             # 许家管事送银子：拒绝
    ['expect', D + ".f.ph === 'trialwait' && " + D + ".cp.name === 'trial'"],
    ['use', 'kim', [0, 0, 1, 0, 2, 3, 4, 0]],          # 升堂：鼠笼、毛皮、剖开、绣鞋、袖子、嫁妆单、从轻发落
    ['expect', D + ".f.ph === 'after' && " + D + ".f.mercy"],
    ['shot', 'after'],
    ['use', 'gate', [0]],
    ['expect', D + ".mapId === 'pond' && " + D + ".f.drained"],
    ['shot', 'drained'],
    ['use', 'stele'],
    ['expect', "window.__dbg.store.get('ends', []).includes('janghwa:twins')"],
]
