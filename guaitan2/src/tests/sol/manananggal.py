# 第二十四夜 分身女 · 自动通关步骤（格式见 tests/play.py 顶部）
# 主线走真结局「教母」：傍晚替罗莎说话、帮她提水；屋顶塞满五道缝；口诀先错一次再调对；
# 夜里敲罗莎的门请她来接生；竹林里撒上盐蒜灰；天亮前不开天窗（拿湿毛巾捂一捂）。


def until(cond, ms=12000):
    """等到 cond（JS 表达式，可用 D=__dbg、W=D.W）为真；期间自动翻过无选项的对话/笔记。只等待，不改状态。"""
    return ['js', (
        "new Promise(r => { const D = window.__dbg, t0 = performance.now(); const f = () => { const W = D.W;"
        " if ((%s) || performance.now() - t0 > %d) return r();"
        " if (W.dlg && !W.dlg.choices) { W.dlg.full = true; D.doAct('adv'); } else if (W.note || W.card) D.doAct('adv');"
        " setTimeout(f, 100); }; f(); })") % (cond, ms)]


GAPS = "['g1','g2','g3','g4','g5','g6']"
SEAL = ['js', "(() => { const D = window.__dbg; const id = %s.find(i => D.ent(i).s.st); if (id) { D.face(id); D.doAct('use'); } })()" % GAPS]


def probe():
    return [until("%s.some(i => D.ent(i).s.st) && !W.busy" % GAPS, 15000), SEAL]


SOL = [
    [],
    ['shot', 'house'],
    ['use', 'lola', [0]],
    ['expect', "window.__dbg.W.f.ph === 'eve'"],
    ['use', 'table'],
    ['use', 'deck'],
    ['use', 'bed'],
    ['use', 'santo'],
    ['step', 3, 8],
    ['expect', "window.__dbg.W.mapId === 'baryo'"],
    ['shot', 'dusk'],
    ['use', 'paz', [0]],
    ['expect', "window.__dbg.W.f.ph === 'eve2' && window.__dbg.W.inv.includes('asin') && window.__dbg.W.f.rosaKind"],
    ['use', 'rosa', [0]],
    ['use', 'selaV'],
    ['use', 'aviso'],
    ['use', 'kalabaw'],
    ['use', 'hdoor'],
    # 赛拉来送甜汤 → 问外婆 → 草席上躺下 → 屋顶
    ['expect', "window.__dbg.W.f.ph === 'visit2'"],
    ['use', 'lola'],
    ['expect', "window.__dbg.W.f.ph === 'visit3'"],
    ['use', 'mat'],
    ['expect', "window.__dbg.W.f.ph === 'guard' && window.__dbg.W.inv.includes('ahos')"],
    ['shot', 'guard'],
    *probe(),
    ['shot', 'tongue'],
    *probe(), *probe(), *probe(), *probe(),
    until("W.f.ph === 'prep' && !W.busy", 20000),
    ['expect', "window.__dbg.W.f.ph === 'prep'"],
    ['shot', 'prep'],
    # 口诀：先错一次
    ['use', 'lusong', [['糖', '蒜', '灰']]],
    ['expect', "window.__dbg.W.f.mix === 1 && !window.__dbg.W.inv.includes('halo')"],
    ['use', 'lusong', [['盐', '蒜', '灰']]],
    ['expect', "window.__dbg.W.inv.includes('halo')"],
    ['step', 3, 8],
    ['expect', "window.__dbg.W.mapId === 'baryo' && window.__dbg.W.f.ph === 'hunt'"],
    ['shot', 'night'],
    ['use', 'oil0'],
    ['use', 'rdoor'],
    ['expect', 'window.__dbg.W.f.rosaHelp'],
    ['use', 'sdoor'],
    ['expect', "window.__dbg.W.mapId === 'sela'"],
    ['shot', 'selahouse'],
    ['use', 'smirror'],
    ['use', 'bdoor'],
    ['expect', "window.__dbg.W.mapId === 'kawayan' && window.__dbg.W.f.ph === 'grove'"],
    ['shot', 'grove'],
    ['use', 'tiil', [0]],
    ['expect', "window.__dbg.W.mapId === 'bahay' && window.__dbg.W.f.ph === 'siege'"],
    ['shot', 'siege'],
    ['use', 'bed'],
    ['expect', "window.__dbg.W.f.ph === 'dawnwait'"],
    ['use', 'hatch', [1]],
    ['expect', 'window.__dbg.W.f.towel'],
    # 天亮前蒜被抠松两次：跑过去塞回去
    until("W.endScreen || (%s.some(i => D.ent(i).s.st) && !W.busy)" % GAPS, 40000), SEAL,
    until("W.endScreen || (%s.some(i => D.ent(i).s.st) && !W.busy)" % GAPS, 40000), SEAL,
    until("W.endScreen", 60000),
]
