import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from _near import near
# 屏住呼吸不动：门被拉开 → 冲出去
SOL = [['use', 's5'], ['use', 's6'], ['use', 's6', [1]], ['js', "(() => { const e = window.__dbg.W.maps.wc.ents.find(z => z.id === 'rs'); if (e.chase) e.chase.spd = .05; })()"], ['use', 'out']]
