# 第六夜 番町皿屋敷 · 自动通关步骤（格式见 tests/play.py 顶部）
# 数盘子是按真人时间走的（tick），这里用 js 步骤等到「安静」的空当再传送去捡碎片。
QUIET = ("new Promise(r => { const t0 = performance.now(); const i = setInterval(() => { const c = window.__dbg.W.f.cnt;"
         " if ((c && c.ph === 'quiet' && c.t > 2.5) || performance.now() - t0 > 40000) { clearInterval(i); r(1); } }, 40); })")
UNTIL = lambda cond: ("new Promise(r => { const t0 = performance.now(); const i = setInterval(() => { const W = window.__dbg.W;"
                      " if ((" + cond + ") || performance.now() - t0 > 40000) { clearInterval(i); r(1); } }, 40); })")
SOL = [
    [],
    ['shot', 'yashiki'],
    ['use', 'kawaraban'],
    ['use', 'closet'],
    ['expect', "window.__dbg.W.f.readLetter && window.__dbg.W.inv.includes('kagi')"],
    ['use', 'yahei'],                              # 还没干完活：提醒
    ['use', 'door_oku'],
    ['expect', "window.__dbg.W.mapId === 'oku'"],
    ['use', 'toko'],
    ['use', 'andon'],                              # 点灯 → 障子上的影子
    ['expect', "window.__dbg.W.f.lit"],
    ['shot', 'oku'],
    ['step', 6, 9],
    ['use', 'door_niwa'],
    ['expect', "window.__dbg.W.mapId === 'niwa'"],
    ['use', 'hokora'],
    ['use', 'well'],
    ['shot', 'niwa_day'],
    ['use', 'kuradoor'],
    ['expect', "window.__dbg.W.mapId === 'kura'"],
    ['use', 'sarabako'],                           # 点数：九枚
    ['use', 'ledger'],
    ['expect', "window.__dbg.W.f.counted && window.__dbg.W.f.readCho"],
    ['shot', 'kura'],
    ['step', 5, 9],
    ['use', 'door_house'],
    ['use', 'yahei'],                              # → 夜半
    ['expect', "window.__dbg.W.f.ph === 'n1'"],
    ['use', 'door_niwa'],                          # 户袋后面看她数一轮
    ['expect', "window.__dbg.W.f.ph === 'n1b' && window.__dbg.W.mapId === 'yashiki'"],
    ['use', 'yuka'],                               # 地板底下：碎片乙 + 手巾
    ['expect', "window.__dbg.W.f.ph === 'n2' && window.__dbg.W.inv.includes('otsu') && window.__dbg.W.inv.includes('tenugui')"],
    ['use', 'door_niwa'],
    ['expect', "window.__dbg.W.f.cnt && window.__dbg.W.f.cnt.ph === 'quiet'"],
    ['shot', 'n2'],
    ['step', 10, 3],                               # 甲（廊下）
    ['step', 3, 3],                                # 户袋后的暗处
    ['js', QUIET],
    ['step', 11, 8],                               # 丁（井边）
    ['step', 11, 11],                              # 丙（池边）
    ['step', 19, 10],                              # 松树背后的暗处
    ['expect', "window.__dbg.W.f.sh === 3"],
    ['js', UNTIL("W.f.cnt && W.f.cnt.ph === 'count' && W.f.cnt.n === 8")],
    ['shot', 'n2_eight'],
    ['js', UNTIL("W.busy || W.f.ph === 'd2'")],    # 数完一轮 → 晨钟 → 第二天
    ['expect', "window.__dbg.W.f.ph === 'd2' && window.__dbg.W.mapId === 'yashiki'"],
    ['use', 'yahei'],
    ['use', 'kamado'],
    ['expect', "window.__dbg.W.inv.includes('sokui')"],
    ['use', 'door_niwa'],
    ['use', 'kuradoor'],
    ['use', 'daiba', ['甲乙丙丁']],                # 摆错一次：续饭作废
    ['expect', "window.__dbg.W.f.pz === 1 && !window.__dbg.W.inv.includes('sokui')"],
    ['step', 5, 9],
    ['use', 'door_house'],
    ['use', 'kamado'],
    ['use', 'door_niwa'],
    ['use', 'kuradoor'],
    ['use', 'daiba', ['乙甲丁丙']],
    ['expect', "window.__dbg.W.inv.includes('sara')"],
    ['step', 5, 9],
    ['use', 'door_house'],
    ['use', 'yahei', [0]],                         # 拿出手巾 → 弥平坦白 → 终夜
    ['expect', "window.__dbg.W.f.ph === 'fin' && window.__dbg.W.f.confess && window.__dbg.W.mapId === 'niwa'"],
    ['shot', 'fin'],
    ['use', 'well'],                               # 放上盘子，她开始数
    ['expect', "window.__dbg.W.f.cnt.ph === 'count'"],
    ['step', 11, 10],                              # 离开井边
    ['js', UNTIL("W.dlg && W.dlg.choices"), [0]],  # 数到九：「十枚！」
    ['expect', "window.__dbg.store.get('ends', []).includes('sarayashiki:kotoba')"],
]
