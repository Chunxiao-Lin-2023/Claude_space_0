# 第九夜 画皮 · 自动通关步骤（格式见 tests/play.py 顶部）

# 测试用的小工具：wait 期间自动翻对话、遇到「死亡」页就点重来（只用来验证失败分支能正常重来）
POLLER_ON = ("window.__hpDied = false; clearInterval(window.__hpIv); window.__hpIv = setInterval(() => {"
             " const D = window.__dbg, W = D.W; if (!W) return;"
             " if (W.endScreen) { if (W.endScreen.kind === 'die') { window.__hpDied = true; D.doAct('retry'); } return; }"
             " if (W.dlg && !W.dlg.choices) { W.dlg.full = true; D.doAct('adv'); } }, 300);")
POLLER_OFF = "clearInterval(window.__hpIv)"

# 潜行：真的走机制——等影子低头（沙沙声还在、离抬头至少 1.2 秒）再从一处暗处冲到下一处暗处
SNEAK_ROUTE = """(async () => {
  const D = window.__dbg, S = D.SAPI, sl = ms => new Promise(r => setTimeout(r, ms));
  const low = async () => { for (let i = 0; i < 600; i++) { const f = D.W.f; if (f.gz === 'p' && f.gzT > 1.2 && !D.W.busy) return; await sl(20); } throw new Error('gaze never lowered'); };
  D.step(24, 7); await window.__auto([], 4000);
  await S.walk('pl', [24, 6], 4.2);
  await low(); await S.walk('pl', [[23, 6], [22, 6], [21, 6]], 4.2);
  await low(); await S.walk('pl', [[20, 6], [20, 5], [19, 5]], 4.2);
  await low(); await S.walk('pl', [[18, 5], [18, 4], [18, 3], [18, 2]], 4.2);
  S.turn(3);
})()"""

WAIT_GAZE = """(async () => { const D = window.__dbg; for (let i = 0; i < 600 && D.W.f.gz !== '%s'; i++) await new Promise(r => setTimeout(r, 20)); await new Promise(r => setTimeout(r, %d)); })()"""

# 挨打时按三次方向键（真实键盘事件）：每次都算「缩了一下」，三次就失败
FLINCH = """(async () => { const sl = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 3; i++) { dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', key: 'ArrowDown' })); await sl(350);
    dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowDown', key: 'ArrowDown' })); await sl(550); }
  for (let i = 0; i < 60 && !(window.__hpDied && !window.__dbg.W.endScreen); i++) await sl(200); await sl(300); })()"""   # 等 POLLER 点完「重来」

RETRY = "(async () => { const D = window.__dbg; for (let i = 0; i < 40 && D.W.endScreen; i++) { await new Promise(r => setTimeout(r, 200)); D.doAct('retry'); } await new Promise(r => setTimeout(r, 400)); })()"

W = "window.__dbg.W"

SOL = [
    ['shot', 'road'],
    ['step', 10, 4],
    ['use', 'nv_r', [0, 0]],
    ['expect', W + ".f.ph === 'bring'"],
    ['step', 25, 4],
    ['shot', 'home_day'],
    ['use', 'sdoor', [1]],                       # 「我内人那里，总得说一声」
    ['shot', 'study'],
    ['expect', W + ".f.ph === 'wife' && !" + W + ".inv.includes('bao') && " + W + ".f.toldWife"],
    ['step', 5, 6],
    ['use', [10, 1]],
    ['use', 'chen_b', [1]],                      # 「你别多心」
    ['shot', 'bedroom'],
    ['expect', W + ".f.ph === 'market1' && " + W + ".f.dismiss"],
    ['step', 5, 8],
    ['step', 8, 14],
    ['use', 'yz', [0]], ['use', [3, 1]], ['use', [19, 2]], ['use', 'tu'], ['use', 'suan'],
    ['shot', 'market'],
    ['use', 'dao_m', [0]],
    ['expect', W + ".f.ph === 'back'"],
    ['use', 'feng'],
    ['step', 10, 12],
    ['expect', W + ".f.ph === 'sneak' && window.__dbg.ent('mgate').solid"],
    # —— 潜行 1：站在灯光里，影子抬头就被看见 → 死亡 → 从检查点重来
    ['js', POLLER_ON],
    ['step', 24, 7],
    ['step', 20, 4],
    ['js', "(async () => { for (let i = 0; i < 80 && !(window.__hpDied && !window.__dbg.W.endScreen); i++) await new Promise(r => setTimeout(r, 200)); await new Promise(r => setTimeout(r, 300)); })()"],
    ['expect', "window.__hpDied && " + W + ".f.ph === 'sneak' && !" + W + ".endScreen && !" + W + ".f.caught"],
    ['js', POLLER_OFF],
    # —— 潜行 2：看看三种状态（站在塌墙口的暗处，不会被看见）
    ['js', "window.__dbg.tp(24, 6, 3)"],
    ['js', WAIT_GAZE % ('p', 300)], ['shot', 'sneak_p'],
    ['js', WAIT_GAZE % ('w', 750)], ['shot', 'sneak_w'],
    ['js', WAIT_GAZE % ('l', 300)], ['shot', 'sneak_l'],
    ['expect', "!" + W + ".f.caught"],
    # —— 潜行 3：真的躲着灯光摸到窗下
    ['js', SNEAK_ROUTE],
    ['expect', W + ".pl.x === 18 && " + W + ".pl.y === 2 && !" + W + ".f.caught && " + W + ".f.ph === 'sneak'"],
    ['use', 'win'],
    ['expect', W + ".f.ph === 'seek' && " + W + ".f.rougeLost && !window.__dbg.ent('mgate').solid"],
    ['step', 8, 14],
    ['use', 'suan'],
    ['use', 'egate'],                            # 集市东城门直接出城
    ['expect', W + ".mapId === 'road'"],
    ['shot', 'road_night'],
    ['step', 12, 5],
    ['expect', W + ".f.nvGone"],
    ['use', 'dao_r'],
    ['expect', W + ".f.ph === 'hang'"],
    ['step', 25, 5],
    ['use', [10, 1]],
    ['shot', 'bedroom_hang'],
    ['use', 'doorS'],                            # 站在门口朝门：挂拂尘 → 一更，换成陈氏
    ['expect', W + ".f.ph === 'night' && " + W + ".pl.spr === '@chen' && !" + W + ".pl.hidden"],
    ['shot', 'night'],
    ['use', 'doorS'],                            # 陈氏自己去门缝看
    ['expect', W + ".f.ph === 'chen' && window.__dbg.ent('doorS').open"],
    ['shot', 'chen'],
    ['use', 'vanity'],
    ['step', 5, 8],
    ['use', 'bj1'],                              # 芭蕉丛里那盒胭脂
    ['expect', W + ".f.rougeFound"],
    ['step', 22, 14],
    ['use', 'er_n'],
    ['expect', W + ".f.ph === 'erlang'"],
    ['js', W + ".f.gw = 'sun'"],                 # 固定这一局的画皮是孙婆子（本来是随机的）
    ['step', 0, 8],
    ['expect', W + ".f.ph === 'ident' && " + W + ".f.gw === 'sun'"],
    ['wait', 300],
    ['shot', 'nanyuan'],
    ['expect', "window.__dbg.ent('sh_sun').hidden && !window.__dbg.ent('sh_liu').hidden && !window.__dbg.ent('sh_bai').hidden && window.__dbg.ent('bowls').s.fb === 2"],
    ['use', 'sun'], ['use', 'liu'], ['use', 'bai'], ['use', 'vat2'], ['use', 'dog'], ['use', 'sao'], ['use', 'bowls'],
    # —— 指认错了：真正的坏结局「它走了」，检查点保留，重来
    ['use', 'dao_n', [0]],
    ['expect', W + ".endScreen && " + W + ".endScreen.kind === 'badend' && window.__dbg.store.get('cp.huapi')"],
    ['js', RETRY],
    ['expect', W + ".f.ph === 'ident' && !" + W + ".endScreen"],
    ['js', W + ".f.gw = 'sun'"],                 # 重来会重新随机；测试里固定回孙婆子
    ['use', 'dao_n', [3]],
    ['use', 'dao_n', [1]],
    ['expect', W + ".f.ph === 'beg'"],
    ['step', 0, 8],
    ['step', 8, 14],
    # —— 挨打时乱动三次 → 「你躲了」→ 重来
    ['use', 'feng', [0]],
    ['expect', W + ".f.endure && " + W + ".timer"],
    ['js', POLLER_ON],
    ['js', FLINCH],
    ['expect', "window.__hpDied && " + W + ".f.ph === 'beg' && !" + W + ".f.endure && !" + W + ".endScreen"],
    ['js', POLLER_OFF],
    # —— 这次换一句「他不是贪色的人」，然后一动不动挨完六秒
    ['use', 'feng', [1]],
    ['shot', 'feng_crowd'],
    ['wait', 7000],
    ['expect', W + ".f.ph === 'heart' && " + W + ".pl.spr === '@chen'"],
    ['step', 10, 12],
    ['use', [10, 1]],
    ['use', 'bed2'],
    ['wait', 1500],
    ['shot', 'heart'],
    ['use', 'chest'],
    ['use', 'bed2'],
]
