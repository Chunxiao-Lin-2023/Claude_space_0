# 第二十九夜 托克洛希 · 自动通关步骤（格式见 tests/play.py 顶部）
# 扑住它：等它处在「走向床 / 偷砖 / 抱砖」状态，把玩家传送到它所在的格子（真人是看水迹和西菲的喊声扑过去）
CATCH = """(async () => { const D = window.__dbg, c0 = D.W.f.catches || 0, sl = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 300; i++) { const W = D.W, T = W.f.tk, t = D.ent('tok'); W.f.dz = 0;
    if ((W.f.catches || 0) > c0 || W.f.act !== 'hunt') return;
    if (T && W.f.hunt && !W.busy && ['go','steal','carry'].includes(T.st) && !t.hidden) { D.tp(Math.round(t.px / 16), Math.round(t.py / 16)); await sl(60); continue; }
    await sl(100); } })()"""
SOL = [
    [],
    ['shot', 'road'],
    ['use', 'mazulu'],
    ['use', 'spaza'],
    ['use', 'mhut'],
    ['step', 23, 6, [0]],                       # 回奶奶家：规矩
    ['expect', "window.__dbg.W.f.act === 'bricks'"],
    ['shot', 'yard'],
    ['use', 'bpile'], ['use', 'hdoor'],
    ['use', 'bed_s'],                           # 西菲的床 4/4
    ['use', 'kdrum'],                           # 盖好水缸
    ['step', 6, 9],
    ['use', 'bpile'], ['use', 'hdoor'], ['use', 'bed_m'],
    ['step', 6, 9],
    ['use', 'bpile'], ['use', 'hdoor'], ['use', 'bed_m'],
    ['expect', "window.__dbg.W.f.act === 'sleep1'"],
    ['shot', 'house'],
    ['use', 'bed_m', [0]],                      # 第一夜：它喝水、隐身、偷砖
    ['expect', "window.__dbg.W.f.act === 'night1' && window.__dbg.ent('bed_s').s.br === 3"],
    ['shot', 'night1'],
    ['step', 6, 9],
    ['shot', 'trail'],
    ['use', 'kbrick'],                          # 白沙
    ['expect', "window.__dbg.W.f.clueSand && window.__dbg.W.f.carry === 1"],
    ['use', 'hdoor'],
    ['use', 'bed_s'],                           # 第二天
    ['expect', "window.__dbg.W.f.act === 'day2' && window.__dbg.W.f.clueTree"],
    ['step', 6, 9],                             # 没看水缸，奶奶叫住
    ['expect', "window.__dbg.W.mapId === 'house'"],
    ['use', 'kdrum'],                           # 锯齿叶
    ['expect', "window.__dbg.W.f.clueLeaf"],
    ['shot', 'day_house'],
    ['step', 6, 9],
    ['step', 0, 6, [2]],                        # 村会：没有证据，别乱说
    ['expect', "window.__dbg.W.f.defend && window.__dbg.W.f.met"],
    ['shot', 'meeting'],
    ['use', 'mazulu'], ['use', 'mazulu'],       # 隐藏细节
    ['expect', "window.__dbg.W.f.mzKind"],
    ['use', 'spaza'],
    ['use', 'madla', [1]],                      # 治疗师：问是谁叫的 → 她不说
    ['expect', "window.__dbg.W.f.act === 'river'"],
    ['step', 7, 13],                            # 河湾：六口水
    ['expect', "window.__dbg.W.f.act === 'dusk2'"],
    ['shot', 'river_day'],
    ['use', 'pA'], ['use', 'pD'], ['use', 'pB'], ['use', 'pE'], ['use', 'pC'], ['use', 'pF'],
    ['step', 10, 12],
    ['step', 23, 6],
    ['use', 'hdoor'],                           # 第二夜：扑它
    ['expect', "window.__dbg.W.f.act === 'hunt' && window.__dbg.W.f.hunt"],
    ['wait', 1500],
    ['shot', 'hunt'],
    ['js', CATCH],
    ['expect', "window.__dbg.W.f.catches === 1"],
    ['js', CATCH],
    ['expect', "window.__dbg.W.f.catches === 2"],
    ['js', CATCH],                              # 第三回：吐出石子 → 河边
    ['expect', "window.__dbg.W.mapId === 'river' && window.__dbg.W.f.act === 'final' && window.__dbg.W.inv.includes('stone')"],
    ['shot', 'river_dawn'],
    ['use', 'pD', [0]],                         # 牛饮水处：没有螺 → 浮上来
    ['expect', "window.__dbg.W.f.wrong === 1 && window.__dbg.W.inv.includes('stone')"],
    ['use', 'pE', [0]],                         # 回水湾 → 好结局
]
