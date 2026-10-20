# 第九夜 鬼妻娜娜 · 自动通关步骤（格式见 tests/play.py 顶部）
SOL = [
    ['shot', 'pier'],
    ['step', 19, 10],                 # 宾婶关门
    ['step', 14, 10],                 # 阿添欲言又止
    ['shot', 'village'],
    ['step', 9, 6],                   # 重逢 -> 屋里
    ['expect', "window.__dbg.W.mapId === 'house' && window.__dbg.W.f.ph === 'home'"],
    ['use', 'hing'], ['use', 'cradle'],
    ['shot', 'house'],
    ['use', 'nak_h', [0]],            # 吃饭、夜里的歌 -> 第二天
    ['expect', "window.__dbg.W.f.ph === 'days'"],
    ['use', 'cradle'], ['use', 'mirror'], ['use', 'nak_h'], ['use', 'trunk'],
    ['expect', 'window.__dbg.W.f.cn === 3 && window.__dbg.W.f.letter'],
    ['shot', 'house_day'],
    ['step', 5, 8],
    ['use', [8, 3]],                  # 罗望子树（好结局的隐藏细节）
    ['use', 'naat'],                  # 艾纳香（伏笔）
    ['shot', 'canal_day'],
    ['use', 'puu'],
    ['use', [17, 4]],
    ['use', 'phin_n', [0]], ['use', 'tong_n'],
    ['shot', 'nbr'],
    ['step', 4, 6],
    ['use', 'tboat'],                 # 第五处违和，但还没在寺里亲眼看过 -> 先去寺里
    ['expect', "window.__dbg.W.f.ph === 'days' && window.__dbg.W.f.needWat"],
    ['step', 39, 9],
    ['use', 'abbot'], ['use', 'hotrai'],
    ['expect', "window.__dbg.ent('hotrai').read === true"],
    ['use', 'desk'],                  # 亡者簿 -> 天黑
    ['expect', "window.__dbg.W.f.ph === 'dusk'"],
    ['use', 'mound'],
    ['shot', 'wat'],
    ['step', 11, 17],                 # 回村：家家熄灯
    ['shot', 'dusk'],
    ['use', 'ladN'],                  # 回家 -> 舂辣椒，要青柠
    ['expect', "window.__dbg.W.f.ph === 'lime'"],
    ['shot', 'house_lime'],
    ['step', 5, 8],
    ['use', 'hNak'],
    ['use', 'basket'],                # 青柠掉到屋下，手臂伸长捡回去
    ['expect', "window.__dbg.W.f.ph === 'seen' && window.__dbg.W.mapId === 'under'"],
    ['js', "(() => { const a = window.__dbg.ent('arm'); a.hidden = false; a.s.v = 48; a.s.h = 52; const l = window.__dbg.ent('limeF'); l.hidden = false; l.px = 7 * 16; l.py = 3 * 16; window.__dbg.W.camFocus = [5, 3]; })()"],
    ['wait', 300],
    ['shot', 'arm'],
    ['js', "(() => { window.__dbg.ent('arm').hidden = true; window.__dbg.ent('limeF').hidden = true; window.__dbg.W.camFocus = null; })()"],
    ['use', 'ladU', [1, 2]],          # 晚饭：先问一句，再借口下楼解手
    ['expect', "window.__dbg.W.f.ph === 'flee' && window.__dbg.W.mapId === 'canal'"],
    ['step', 11, 10],
    ['wait', 2700],
    ['shot', 'flee'],
    ['step', 39, 9],
    ['expect', "window.__dbg.W.f.ph === 'thread' && window.__dbg.W.mapId === 'wat' && window.__dbg.W.timer"],
    ['use', 'p_ne'],                  # 错：绕成了自己的右手（经声乱，她往里挪一步）
    ['expect', 'window.__dbg.W.f.thr.length === 0 && window.__dbg.W.f.miss === 1'],
    ['use', 'p_nw'], ['use', 'p_ne'], ['use', 'p_se'], ['use', 'p_sw'],
    ['shot', 'thread'],
    ['use', 'buddha', [0, 0, 0]],     # 系上佛手；提起那封信；「让她安心地走」；来世之约
    ['expect', "window.__dbg.store.get('ends', []).includes('maenak:farewell')"],
]
