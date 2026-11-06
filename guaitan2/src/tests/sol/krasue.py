# 第二十三夜 飞头 · 自动通关步骤（格式见 tests/play.py 顶部）
# 主线：黄昏铺刺枝、送药 -> 晚饭 -> 半夜看窗 -> 村里看衣服上的印子 -> 田里（拿槟榔盒、看稻草人） -> 谷仓 -> 盖白布、躲好不动 -> 好结局「回家的路」
# 夜里的飞头是 tick 驱动的：测试是传送过去的，先把它「停」在远处（e.s.park），真人要靠站住不动/站到刺枝上躲开
PARK_V = "(() => { const D = window.__dbg, e = D.ent('kv'); e.s.park = true; e.px = 24 * 16; e.py = 16 * 16; })()"
PARK_F = "(() => { const D = window.__dbg, e = D.ent('kf'); e.s.park = true; e.px = 31 * 16; e.py = 20 * 16; })()"
# 谷仓里的那一段是 tick 驱动的（真实时间），机器忙的时候会慢：轮询等它走完，而不是死等几秒
POLL = lambda cond: "new Promise(r => { const t0 = performance.now(); const f = () => { if (%s || performance.now() - t0 > 90000) r(); else setTimeout(f, 150); }; f(); })" % cond
SOL = [
    [],
    ['shot', 'dusk'],
    ['use', 'fon'],                   # 先碰见阿芬：外婆在通嫂家
    ['use', 'kham'],                  # 衣服的规矩、阿芬天天去谷仓
    ['use', 'ben', [0, 0]],           # 绿光、头回不去就死、蓝婆
    ['use', 'yai_d'],                 # 外婆：铺刺枝
    ['expect', "window.__dbg.W.f.ph === 'task' && window.__dbg.W.inv.includes('thornb')"],
    ['use', 'gap1'], ['use', 'gap2'], ['use', 'gap3'],
    ['expect', "window.__dbg.W.f.gaps === 3"],
    ['shot', 'thorns'],
    ['use', 'yai_d'],                 # 送药给阿芬
    ['use', 'tong'],
    ['use', 'fon', [1, 1]],
    ['expect', "window.__dbg.W.f.ph === 'home'"],
    ['use', 'ladY', [0, 0, 0, 0, 0]], # 回家吃晚饭，问完三件事
    ['expect', "window.__dbg.W.f.ph === 'sleep' && window.__dbg.W.mapId === 'yaihome'"],
    ['use', 'book'],
    ['shot', 'yaihome'],
    ['use', 'mat'],                   # 睡下 -> 半夜，绿光
    ['expect', "window.__dbg.W.f.ph === 'win'"],
    ['use', 'twin'],                  # 窗缝 -> 外婆交代、给刺枝和白布 -> 天亮倒计时
    ['expect', "window.__dbg.W.f.ph === 'night' && window.__dbg.W.timer && window.__dbg.W.cp.name === 'night' && window.__dbg.W.inv.includes('cloth')"],
    ['step', 6, 9],                   # 出门：绿光绕着通嫂家
    ['expect', "window.__dbg.W.mapId === 'village' && !window.__dbg.ent('kv').hidden"],
    ['js', PARK_V],
    ['shot', 'night_village'],
    ['use', 'LA'], ['use', 'LD'], ['use', 'LC'],
    ['use', 'fpV1'],
    ['use', 'yai_n'],                 # 外婆（刺篱笆里）给提示
    ['step', 8, 0],
    ['expect', "window.__dbg.W.mapId === 'field' && window.__dbg.W.cp.name === 'field'"],
    ['js', PARK_F],
    ['shot', 'field'],
    ['use', 'fpF5'],
    ['use', 'hut', [0]],              # 蓝婆的旧屋：炭字、拿上槟榔盒（好结局的隐藏细节）
    ['expect', "window.__dbg.W.inv.includes('betel')"],
    ['use', 'scare'],
    ['use', 'barn', [0]],             # 谷仓
    ['expect', "window.__dbg.W.mapId === 'granary' && !window.__dbg.W.timer"],
    ['use', 'fonbook'],
    ['use', 'body', [1]],             # 认出阿芬 -> 用白布盖好
    ['expect', "window.__dbg.W.f.ph === 'wait0' && window.__dbg.W.cp.name === 'body'"],
    ['use', 'rjar'],                  # 躲进米缸后面，不动
    ['expect', "window.__dbg.W.pl.hidden"],
    ['js', POLL("(() => { const e = window.__dbg.ent('kg'); return !e.hidden && e.alpha >= 1 && e.py <= 5 * 16; })()")],
    ['shot', 'granary_wait'],
    ['js', POLL("window.__dbg.W.f.ph === 'end'")],
    ['expect', "window.__dbg.store.get('ends', []).includes('krasue:home')"],
]
