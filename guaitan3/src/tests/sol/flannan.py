# 第三十夜 灯塔 · 自动通关步骤（格式见 tests/play.py 顶部）
W = "window.__dbg.W"


def until(cond, ms=30000):
    """等到条件成立（风暴夜按真实时间推进）"""
    return ['js', "new Promise(r => { const t0 = Date.now(), t = setInterval(() => { let ok = false; try { ok = (%s); } catch (e) {} if (ok || Date.now() - t0 > %d) { clearInterval(t); r(); } }, 50); })" % (cond, ms)]


TEND = [['use', 'pump'], ['use', 'clock']]          # 灯室里补满压力和发条
STOP_RORY = [['step', 1, 7], ['use', 'rory_h'], ['step', 16, 2]] + TEND

SOL = [
    ['expect', f"{W}.f.ph === 'arrive' && {W}.f.rWait"],
    ['shot', 'arrive'],
    ['step', 16, 15, [0]],                    # 走近罗里：小礼拜堂和老规矩（摘帽、顺着太阳转一圈）
    ['expect', f"{W}.f.chapel && {W}.f.custom"],
    ['step', 15, 11],                         # 回头一瞥：西码头小路上的雨衣人
    ['expect', f"{W}.f.glimpse"],
    ['use', 'hdoor'],                         # 安格斯：三条规矩
    ['expect', f"{W}.f.ph === 'tour'"],
    ['shot', 'kitchen'],
    ['use', 'rory_h'],
    ['use', 'cab'],                           # 1900 年的调查报告
    ['expect', f"{W}.f.rep"],
    ['step', 16, 2],                          # 上灯室：灯廊远景，开始点灯
    ['expect', f"{W}.f.ph === 'lamp' && {W}.mapId === 'tower'"],
    ['shot', 'tower'],
    ['use', 'lens'],                          # 没预热就开阀：窜火
    ['use', 'blinds'],
    ['use', 'spirit'],
    ['wait', 8600],
    ['use', 'pump'], ['use', 'pump'], ['use', 'pump'],
    ['use', 'lens'],
    ['expect', f"{W}.f.lit"],
    ['use', 'clock', ['30']],                 # 转速错了
    ['expect', f"!{W}.f.rot && {W}.f.gErr === 1"],
    ['use', 'clock', ['60']],                 # 转一圈 60 秒
    ['expect', f"{W}.f.ph === 'night1' && {W}.mapId === 'house'"],
    ['use', 'desk', [0, 0, 0]],               # 写日志 → 那页纸（一）
    ['expect', f"{W}.f.f1"],
    ['use', 'hooks'],
    ['shot', 'night1'],
    ['use', 'bunk_me', [0]],                  # 第二天 → 风暴夜
    ['expect', f"{W}.f.ph === 'storm' && {W}.mapId === 'tower' && {W}.timer"],
    ['shot', 'storm'],
] + TEND + [
    until(f"{W}.f.rory === 1"),
] + STOP_RORY + [
    ['wait', 7000],
] + TEND + [
    until(f"{W}.f.ev >= 2"),                  # 灯廊的门被撞开
    ['use', 'gdoor'],
    ['expect', f"!{W}.f.gd"],
] + TEND + [
    ['wait', 7000],
] + TEND + [
    until(f"{W}.f.rory === 1 && {W}.f.ev >= 3"),
] + STOP_RORY + [
    ['wait', 9000],
] + TEND + [
    ['wait', 9000],
] + TEND + [
    until(f"{W}.f.ph !== 'storm'", 40000),
    ['expect', f"{W}.f.ph === 'day3' && {W}.mapId === 'house'"],
    ['use', 'cab'],                           # 那页纸（三）：下午一点
    ['expect', f"{W}.f.f3"],
    ['use', 'meal'],                          # 午饭 → 风停了
    ['expect', f"{W}.f.ph === 'calm' && {W}.timer"],
    ['shot', 'calm'],
    ['use', 'hooks'],                         # 钩子上只剩一件雨衣
    ['step', 16, 2],
    ['use', 'gdoor'],                         # 灯廊：西边的白线
    ['expect', f"{W}.f.saw"],
    ['step', 1, 7],
    ['use', 'angus_h', [2, 3, 4]],            # 报告 / 海 / 雨衣
    ['expect', f"{W}.f.ph === 'dusk' && {W}.mapId === 'tower'"],
    ['use', 'lens'],                          # 三个人一起点灯；浪
    ['expect', f"{W}.f.ph === 'morning' && {W}.mapId === 'isle'"],
    ['shot', 'morning'],
    ['use', 'rbox'], ['use', 'rails'], ['use', 'bigstone'], ['use', 'turf'],
    ['use', 'angus_i'],
    ['expect', f"{W}.f.ph === 'log'"],
    ['use', 'hdoor'],
    ['use', 'desk', [0, 0, 0, 0]],            # 写下真的日志 → 卷三终 / 全书终
]
