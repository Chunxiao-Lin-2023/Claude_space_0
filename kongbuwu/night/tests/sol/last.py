# 最后一间教室（慢热版）：走到走廊后半段响上课铃 → 撕封条 → 刻字 → 数桌子 → 椅子 → 退出去 → 姑姑 → 引到门口
SOL = [['step', 14, 3], ['use', 'cls'], ['use', 'cls'], ['use', 'dk'], ['use', 'cnt'], ['use', 'ch'], ['use', 'out'], ['step', 12, 3], ['shot', 'aunt'],
       ['js', "(() => { const W = window.__dbg.W, a = W.maps.cr.ents.find(z => z.id === 'aunt'); a.mv = null; if (a.chase) a.chase.spd = .05; a.x = 17; a.y = 3; a.px = 17 * 16; a.py = 48; W.pl.x = 19; W.pl.px = 19 * 16; })()"],
       ['wait', 600]]
