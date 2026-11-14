SOL = [
    ['use', 'drawer'], ['use', 'sw'], ['use', 'sink'], ['use', 'bed'],
    ['use', 'mir', [0]],
    ['shot', 'eyes'],
    *[['wait', 2500]] * 18,
    ['expect', "!window.__dbg.W.f.k_fail"],
]
