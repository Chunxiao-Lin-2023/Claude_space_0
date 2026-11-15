import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from _near import near
# 二楼没躲（脚步声的计时到了）→ 三楼屏住呼吸不动：门被拉开 → 冲出去
SOL = [['use', 'td1'], ['use', 't5'], ['use', 't5'], ['use', 't6'], ['use', 'o1'], ['step', 18, 2],
       ['use', 'td2'], ['use', 'u5'], ['wait', 12000], ['use', 'o2'], ['step', 18, 2],
       ['use', 'td3'], ['use', 's5'], ['use', 's6'], ['use', 's6', [1]], ['js', "(() => { const e = window.__dbg.W.maps.wc.ents.find(z => z.id === 'rs'); if (e.chase) e.chase.spd = .05; })()"], ['use', 'out']]
