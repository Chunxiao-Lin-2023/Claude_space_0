# 第三夜 厕所里的花子 · 自动通关步骤（格式见 tests/play.py 顶部）
D = "window.__dbg"
SOL = [
    [],
    ['shot', 'gate'],
    # 惊吓大头像截图（只看美术，不影响流程）
    ['js', D + ".SAPI.scare('face', {spr: '@jinbo', wait: false})"], ['shot', 'face_jinbo'],
    ['wait', 1200],
    ['js', D + ".SAPI.scare('face', {spr: '@hanakoF', wait: false})"], ['shot', 'face_hanako'],
    ['wait', 1200],
    ['use', 'pin'], ['use', 'kinjiro'], ['use', 'side'],
    ['shot', 'hall1'],
    ['use', 'gbM'], ['use', 'gbH'], ['use', 'staff'], ['use', 'rikaDoor'],
    ['use', 'fl2'], ['use', [4, 3]], ['use', 'jinboR', [0]],
    ['expect', D + ".W.inv.includes('mkey') && " + D + ".ent('kinjiro').s.st === 1"],
    ['shot', 'rika'],
    ['step', 6, 9],                      # 回走廊：尽头闪过模型的剪影
    ['expect', D + ".W.f._o_glimpse"],
    ['step', 27, 3],
    ['use', 'gate3'], ['use', 'musicDoor'],
    ['shot', 'music'],
    ['use', [7, 1]], ['use', 'gakki'], ['use', 'cp3'],
    ['use', 'drum'],                     # 解谜前拍鼓：只有一句呼应
    ['expect', "!" + D + ".W.inv.includes('skey')"],
    # 弹错三次：第 2 次给 think，第 3 次画像一起看黑板
    ['use', 'piano', [0, '111']], ['use', 'piano', [0, '123']], ['use', 'piano', [0, '555']],
    ['expect', D + ".ent('cp1').s.fix === 2 && " + D + ".W.f.pw === 3"],
    ['shot', 'music_hint'],
    ['use', 'piano', [0, '322']],
    ['expect', D + ".W.f.solved && " + D + ".ent('piano').s.shut && !" + D + ".ent('piano').power && typeof " + D + ".ent('piano').on === 'function'"],
    ['js', D + ".ent('piano').s.nt = [5, 9999]"], ['shot', 'music_solved'],
    ['use', 'piano'],                    # 解谜后钢琴仍能调查（琴盖合上）
    ['expect', D + ".ent('kinjiro').s.st === 2"],
    ['use', 'drum'],
    ['expect', D + ".W.inv.includes('skey')"],
    ['step', 6, 9],
    ['use', 'gate3'],
    ['use', 'shoe'],
    ['step', 8, 15],                     # 数台阶：第十三级显形（深色瓦片）
    ['expect', D + ".W.maps.stairs.mods[3 * 14 + 8] === 'Q'"],
    ['js', D + ".tp(8, 7, 3)"], ['shot', 'stairs13'],
    # 坏结局「另一边」抽测：读过报纸后第三次踩第十三级
    ['js', D + ".W.f.trapN = 2"],
    ['step', 8, 3],
    ['expect', D + ".W.endScreen && " + D + ".W.endScreen.kind === 'badend' && " + D + ".W.endScreen.title === '另一边'"],
    # 结局画面 0.8 秒内不接受「重来」（机器负载高时渲染时钟会变慢），所以轮询着按
    ['js', "(async () => { const D = window.__dbg; for (let i = 0; i < 150 && D.W.endScreen; i++) { D.doAct('retry'); await new Promise(r => setTimeout(r, 100)); } })()"],
    ['expect', D + ".W.mapId === 'stairs' && !" + D + ".W.endScreen && !" + D + ".W.f.trapN"],
    ['use', 'shoe'],
    ['step', 8, 15],
    ['step', 8, 4, [0]],                 # 第十二级：旁白 → 投票「闭上眼睛，跨过去」
    ['expect', D + ".W.mapId === 'hall3'"],
    ['shot', 'hall3'],
    ['use', 'bboard'],
    ['use', 'hdesk'],                    # 六个不可思议还差「第三间」：抽屉卡住
    ['expect', "!" + D + ".W.f.r_p5"],
    ['use', [8, 10]], ['use', [8, 10]], ['use', [8, 10]],   # 男厕所：第三次「我是太郎」
    ['expect', D + ".W.f.taro === 3"],
    ['use', 'wc'],
    ['use', 'st4', [0]],                 # 掀开马桶盖：白手
    ['expect', D + ".W.f.hand"],
    ['use', 'dareP'],
    ['shot', 'toilet'],
    # 敲三下（三次「咚」）→「花子同学，一起玩吧」→「把美咲还给我！」（强硬分支也会听到身世）
    ['use', 'st3', [0, 0, 0, 0, 2, 0]],
    ['expect', D + ".W.f.seek && " + D + ".W.timer && " + D + ".W.f.met"],
    ['shot', 'seek'],
    # 坏结局「留下来陪她玩」抽测：时间到 → 坏结局 → 从 seek 检查点重来
    ['js', "(async () => { const D = window.__dbg; D.W.timer.left = 0.05; for (let i = 0; i < 200 && !D.W.busy && !D.W.endScreen; i++) await new Promise(r => setTimeout(r, 50)); })()"],
    ['expect', D + ".W.endScreen && " + D + ".W.endScreen.kind === 'badend'"],
    # 结局画面 0.8 秒内不接受「重来」（机器负载高时渲染时钟会变慢），所以轮询着按
    ['js', "(async () => { const D = window.__dbg; for (let i = 0; i < 150 && D.W.endScreen; i++) { D.doAct('retry'); await new Promise(r => setTimeout(r, 100)); } })()"],
    ['expect', D + ".W.mapId === 'hall3' && " + D + ".W.f.seek && " + D + ".W.timer"],
    ['use', 'hdesk'],                    # 六个都见过了：抽屉里是被撕下的「其七」
    ['expect', D + ".W.f.r_p5"],
    # 花子换地方（剩 35 秒）
    ['js', "(async () => { const D = window.__dbg; D.W.timer.left = 34.5; for (let i = 0; i < 200 && !D.W.f._mv; i++) await new Promise(r => setTimeout(r, 50)); })()"],
    ['expect', D + ".W.f._mv"],
    ['shot', 'seek_moved'],
    ['js', D + ".face(" + D + ".W.f.hk) && " + D + ".doAct('use')", [0, 0]],
    ['expect', D + ".W.f.phase === 'chase' && " + D + ".ent('tie').hidden && " + D + ".ent('fp0').hidden"],
    ['shot', 'chase3'],
    ['step', 1, 12],
    ['shot', 'chase_stairs'],
    ['step', 1, 18],
    ['shot', 'chase_hall1'],
    ['js', D + ".tp(22, 5, 1)"], ['wait', 400], ['shot', 'chase_hall1_model'],   # 走近理科室门：模型破门而出拦路（只截图，马上离开）
    ['expect', "!" + D + ".ent('model1').hidden && " + D + ".ent('rikaDoor').open"],
    ['step', 0, 3],
    ['shot', 'chase_gate'],
    ['step', 3, 14],
    ['shot', 'shin'],
    ['use', 'n3'],
]
