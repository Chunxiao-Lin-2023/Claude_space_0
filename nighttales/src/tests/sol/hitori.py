# 第四夜 一个人的捉迷藏 · 自动通关步骤（格式见 tests/play.py 顶部）
F = 'window.__dbg.W.f'
# 让玩家原地转向布偶（toward=True）或背对它——等同于按一下方向键转身，不改任何状态
TURN = ("(() => {{ const D = window.__dbg, p = D.W.pl, d = D.ent('dollR'), dx = d.px - p.px, dy = d.py - p.py;"
        " const t = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0);"
        " D.tp(p.x, p.y, {0}); window.__d0 = [d.px, d.py]; }})()")
SPOT = ("(async () => {{ const D = window.__dbg; D.face(['bed', 'dresser', 'kotatsu', 'pc'][({0}) % 4]);"
        " D.doAct('use'); await window.__auto([]); }})()")
# 等 S.after 排队的剧本全部开始，再把对话翻完（帧率低时 W.t 走得比真实时间慢）
DRAIN = ("(async () => { const D = window.__dbg; for (let i = 0; i < 200 && D.W.queue.length; i++)"
         " await new Promise(r => setTimeout(r, 50)); await window.__auto([]); })()")
SOL = [
    [],
    ['shot', 'room'],
    ['use', 'pc'],
    ['expect', F + '.readRules'],
    ['use', 'bed'],
    ['use', 'kotatsu'],                      # 第一次去暖桌：一次列出所有缺的东西 + 准备清单
    ['expect', "!window.__dbg.ent('dollK').hidden && !" + F + ".opened"],
    ['use', 'shelf'],
    ['use', 'oshiire'],
    # 走廊兼厨房
    ['step', 10, 9],
    ['use', 'ricebin'], ['use', 'drawer'], ['use', 'saltC'],
    ['expect', "window.__dbg.W.inv.includes('saltcup')"],
    ['shot', 'hall'],
    # 浴室：指甲、放水
    ['use', [6, 1]],
    ['use', 'bmirror'], ['use', 'tub'],
    ['shot', 'bath'],
    ['step', 3, 5],
    ['use', [10, 1]],
    ['js', DRAIN],                           # 放完水约 9 秒后浴室会「滴答」一声：等排队的小事件放完
    ['use', 'pc'],                           # 准备过半，手机震过——帖子长出了新回复
    ['expect', F + '.t1read'],
    # 阳台看一眼
    ['use', 'garasu'],
    ['shot', 'balcony'],
    ['use', 'garasuB'],
    # 做布偶：剪开、米、指甲、红线、起名「小熊」
    ['use', 'kotatsu', [2, 0]],
    ['expect', F + ".sewn && " + F + ".named && " + F + ".thread === 'red' && !" + F + ".selfName"],
    ['use', 'oshiire'],
    ['expect', F + '.saltPlaced'],
    ['shot', 'prepped'],
    ['use', 'clock', [0]],
    ['expect', F + ".phase === 'ritual'"],
    ['use', 'kotatsu', [0, 0, 0]],
    ['expect', F + '.said && !' + F + '.wrongFirst'],
    ['step', 10, 9],
    ['use', [6, 1]],
    ['use', 'tub'],
    ['shot', 'tubdoll'],
    ['step', 3, 5],
    ['use', 'swH'], ['use', 'swB'],
    ['use', [10, 1]],
    ['use', 'swR'],
    ['use', 'tv', [0]],
    ['shot', 'tv'],
    ['expect', F + '.counted'],
    ['step', 10, 9],
    ['use', [6, 1]],
    # 抽测：「找到你了，浩」——喊错名字会死，并从「数完十」的检查点重来
    ['js', "(async () => { const D = window.__dbg; D.face('tub'); D.doAct('use'); const r = await window.__auto([0, 1]);"
           " if (r !== 'end:die') throw new Error('expected death, got ' + r);"
           " for (let i = 0; i < 40 && D.W.endScreen; i++) { await new Promise(r => setTimeout(r, 150)); D.doAct('retry'); }"
           " await window.__auto([]); })()"],
    ['expect', F + ".counted && !" + F + ".stabbed && window.__dbg.W.mapId === 'room'"],
    ['step', 10, 9],
    ['use', [6, 1]],
    ['use', 'tub', [0, 0]],
    ['expect', F + ".stabbed && " + F + ".ver === 'knife'"],
    ['shot', 'stab'],
    ['step', 3, 5],
    ['use', [10, 1]],
    ['use', 'oshiire'],
    ['expect', "window.__dbg.W.mapId === 'oshiire' && window.__dbg.W.pl.spr === 'crouch'"],
    ['use', 'crack'],
    ['use', 'cup'],
    ['expect', F + '.mouth && ' + F + '.hs === 1'],
    ['shot', 'hide'],
    ['use', 'phone'],
    # 躲藏按真实时间推进（fast=8 下 15 秒≈1.9 秒）：换台 → 脚步与门缝里的腿 → 敲门（默认选「一声不出」）
    ['wait', 2600],
    ['expect', F + '.hs === 2'],
    ['use', 'phone'],
    ['wait', 3200],
    ['expect', F + '.hs >= 3'],
    ['shot', 'legs'],
    ['wait', 2200],
    ['expect', F + '.knocked && ' + F + '.mouth && ' + F + '.hs === 4'],
    ['use', 'phone'],
    ['wait', 2400],
    ['expect', F + '.hs === 5'],
    ['use', 'phone'],
    ['expect', F + '.canExit'],
    ['use', 'crack', [0]],
    ['expect', F + ".phase === 'seek' && window.__dbg.W.mapId === 'room' && window.__dbg.W.pl.spr === '@me'"],
    ['shot', 'seek'],
    ['step', 10, 9],
    ['use', [6, 1]],
    ['use', 'tub'],
    ['step', 3, 5],
    ['shot', 'puddles'],
    ['step', 3, 3, [0]],
    ['expect', F + '.momDone && ' + F + '.mouth'],
    ['use', [10, 1]],                        # 电视前的背影 → 不见了，只剩湿脚印和米粒
    ['expect', F + ".ss === 'find' && " + F + '.trailOn'],
    ['shot', 'trail'],
    ['js', SPOT.format('window.__dbg.W.f.spot + 1')],   # 找错地方：只有笑声
    ['expect', F + ".ss === 'find'"],
    ['js', SPOT.format('window.__dbg.W.f.spot')],       # 找对了：它窜到房间另一头
    ['expect', F + ".ss === 'stand' && !window.__dbg.ent('dollR').hidden"],
    # 注视机制：背对它 → 它会动；转身看着它 → 定住不动
    ['js', TURN.format('[3, 2, 1, 0][t]')],
    ['wait', 300],
    ['expect', "(() => { const d = window.__dbg.ent('dollR'); return !window.__dbg.SAPI.isFrozen('dollR') && (d.px !== window.__d0[0] || d.py !== window.__d0[1]); })()"],
    ['js', TURN.format('t')],
    ['wait', 300],
    ['expect', "window.__dbg.SAPI.isFrozen('dollR')"],
    ['js', "window.__d0 = [window.__dbg.ent('dollR').px, window.__dbg.ent('dollR').py]"],
    ['wait', 600],
    ['expect', "(() => { const d = window.__dbg.ent('dollR'); return window.__dbg.SAPI.isFrozen('dollR') && d.px === window.__d0[0] && d.py === window.__d0[1]; })()"],
    ['shot', 'gaze'],
    ['expect', "window.__dbg.SAPI.isFrozen('dollR')"],
    ['use', 'dollR', [2, 1, 0, 0, 2]],
    ['expect', F + '.won'],
    ['step', 10, 9],
    ['use', 'basket'],
    ['use', [10, 1]],
    ['use', 'dollR'],
    ['use', 'garasu'],
    ['use', 'ash'],
    ['shot', 'burn'],
    ['use', 'can'],
]
