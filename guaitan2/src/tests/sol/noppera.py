# 第八夜 无脸人 · 自动通关步骤（格式见 tests/play.py 顶部）
# 坂上四个人里谁是真人（f.real）每局随机，用 js 步骤按 f.real 去找他。

D = "window.__dbg"

SOL = [
    [],
    ['shot', 'mitsuke'],
    ['use', 'kawaraban'],
    # 番太让你说「もしもし」：先说错一次（只说一声），再说对
    ['use', 'genroku', [0, 1]],
    ['expect', "window.__dbg.W.inv.includes('chochin') && window.__dbg.W.inv.includes('hiuchi')"],
    ['use', 'hibachi'],
    ['expect', 'window.__dbg.W.f.lit'],
    # 放走芦苇里的小貉，并分它半个饭团（隐藏结局「貉的谢礼」的条件）
    ['use', 'wana', [0, 0]],
    ['expect', "window.__dbg.W.f.cub && !window.__dbg.W.inv.includes('onigiri')"],
    ['shot', 'mitsuke_lit'],
    ['step', 25, 4],
    ['expect', "window.__dbg.W.mapId === 'zaka'"],
    ['use', 'jizo2'],
    ['step', 12, 6],
    ['shot', 'zaka'],
    ['use', 'onna', [0]],
    ['expect', "window.__dbg.W.f.phase === 'chase' && window.__dbg.W.f.faces === 1"],
    ['shot', 'chase'],
    ['step', 36, 3],
    ['wait', 300],
    ['expect', "window.__dbg.W.f.phase === 'soba' && window.__dbg.ent('onna').hidden"],
    ['shot', 'soba'],
    # 先看影子（拖着尾巴），再对卖面的说「你的影子」：名场面照样出现，但不算被骗
    ['use', 'sh_soba'],
    ['expect', 'window.__dbg.W.f.sobaSeen'],
    ['use', 'soba', [2]],
    ['expect', 'window.__dbg.W.f.relit && window.__dbg.W.f.faces === 1'],
    ['shot', 'relit'],
    ['step', 45, 4],
    ['expect', "window.__dbg.W.mapId === 'sakaue'"],
    ['use', 'zuihitsu'],
    ['shot', 'sakaue'],
    # 眉唾：第一级提示
    ['use', 'michi', [0]],
    ['expect', 'window.__dbg.W.f.hintN === 1'],
    # 找到真人，求助（菜单第 4 项）
    ['js', "window.__dbg.face('f_' + window.__dbg.W.f.real); window.__dbg.doAct('use')", [3]],
    ['expect', 'window.__dbg.W.f.helped'],
    ['shot', 'helped'],
    ['step', 31, 5],
    ['expect', "window.__dbg.W.mapId === 'yotsuya'"],
    ['shot', 'yotsuya'],
    ['use', 'tanu'],
    ['use', 'ishamon'],
]
