"""Generate level maps (carve programs -> ASCII), validate connectivity, emit work/src/b_maps.js
Legend: # wall  . floor  _ pit  ~ lava  G gate  R rift  P player spawn  o pillar  b barrel  c crate  f brazier  k bones  t torch-wall"""
import json, os, collections
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

class Map:
    def __init__(s, w, h): s.w, s.h = w, h; s.g = [['#'] * w for _ in range(h)]
    def carve(s, x0, y0, x1, y1, ch='.'):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): s.g[y][x] = ch
        return s
    def put(s, x, y, ch): s.g[y][x] = ch; return s
    def torches(s, every=5):
        # torch on wall tiles that have floor directly below
        for y in range(s.h - 1):
            run = 0
            for x in range(s.w):
                if s.g[y][x] == '#' and s.g[y + 1][x] in '.k':
                    run += 1
                    if run % every == 3: s.g[y][x] = 't'
                else: run = 0
        return s
    def rows(s): return [''.join(r) for r in s.g]

def check(name, m):
    rows = m.rows(); W, H = m.w, m.h
    walk = lambda c: c in '.GRPk'
    gates = [(x, y) for y in range(H) for x in range(W) if rows[y][x] == 'G']
    rifts = [(x, y) for y in range(H) for x in range(W) if rows[y][x] == 'R']
    spawn = [(x, y) for y in range(H) for x in range(W) if rows[y][x] == 'P']
    assert rifts and gates and len(spawn) == 1, name
    for y in range(H):
        assert rows[y][0] in '#t' and rows[y][-1] in '#t', (name, 'edge', y)
    D = {r: 0 for r in rifts}; q = collections.deque(rifts)
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in D and walk(rows[ny][nx]):
                D[(nx, ny)] = D[(x, y)] + 1; q.append((nx, ny))
    for g in gates + spawn: assert g in D, (name, 'unreachable', g)
    print(f'{name}: {W}x{H} gates={[D[g] for g in gates]} spawn={D[spawn[0]]}')
    for r in rows: print('   ' + r)
    return rows

def m1():
    m = Map(36, 22)
    m.carve(2, 2, 7, 6).carve(3, 7, 6, 17).carve(3, 14, 22, 17)
    m.carve(9, 18, 17, 19, '_')
    m.carve(18, 8, 25, 17).carve(26, 8, 29, 11).carve(27, 2, 30, 7).carve(28, 2, 34, 7)
    m.put(3, 3, 'G').put(32, 4, 'R').put(30, 6, 'P')
    m.put(20, 11, 'o').put(23, 11, 'o').put(20, 14, 'o').put(23, 14, 'o')
    m.put(18, 8, 'f').put(25, 17, 'f').put(34, 2, 'f').put(34, 7, 'f')
    m.put(2, 6, 'b').put(7, 2, 'c').put(7, 6, 'b').put(22, 17, 'c')
    m.put(5, 10, 'k').put(13, 15, 'k').put(28, 9, 'k')
    return m.torches()

def m2():
    m = Map(40, 24)
    m.carve(1, 2, 6, 6).carve(1, 17, 6, 21)
    m.carve(7, 3, 14, 5).carve(12, 6, 14, 10)
    m.carve(7, 18, 14, 20).carve(12, 13, 14, 17)
    m.carve(9, 10, 17, 13)
    m.carve(18, 6, 29, 17, '~').carve(18, 10, 29, 12)
    m.carve(30, 9, 33, 13).carve(32, 5, 38, 17)
    m.put(2, 4, 'G').put(2, 19, 'G').put(36, 11, 'R').put(34, 8, 'P')
    m.put(9, 10, 'f').put(9, 13, 'f').put(38, 5, 'f').put(38, 17, 'f').put(32, 5, 'c').put(32, 17, 'b')
    m.put(1, 2, 'b').put(1, 21, 'c').put(16, 11, 'k').put(35, 15, 'k')
    m.put(34, 11, 'o').put(34, 13, 'o') if False else None
    return m.torches()

def m3():
    m = Map(40, 26)
    m.carve(1, 10, 4, 15).carve(2, 5, 4, 9).carve(2, 5, 12, 7).carve(10, 8, 12, 21).carve(10, 19, 17, 21)
    m.carve(17, 1, 23, 4).carve(19, 5, 21, 14)
    m.carve(15, 7, 18, 12, '_').carve(22, 7, 25, 12, '_')
    m.carve(35, 10, 38, 15).carve(35, 5, 37, 9).carve(27, 5, 37, 7).carve(27, 8, 29, 21).carve(23, 19, 29, 21)
    m.carve(15, 15, 25, 24)
    m.put(2, 12, 'G').put(20, 2, 'G').put(37, 12, 'G').put(20, 22, 'R').put(20, 18, 'P')
    m.put(17, 17, 'o').put(23, 17, 'o').put(17, 21, 'o').put(23, 21, 'o')
    m.put(15, 24, 'f').put(25, 24, 'f').put(17, 1, 'f').put(23, 1, 'f')
    m.put(1, 10, 'b').put(38, 15, 'c').put(11, 17, 'k').put(28, 16, 'k').put(20, 9, 'k')
    return m.torches()

def m4():
    m = Map(44, 28)
    m.carve(1, 1, 6, 5).carve(37, 1, 42, 5).carve(1, 22, 6, 26)
    m.carve(14, 9, 29, 18).carve(20, 12, 23, 15, '_')
    m.carve(7, 2, 12, 4).carve(10, 5, 12, 9).carve(10, 9, 13, 11)
    m.carve(30, 2, 36, 4).carve(30, 5, 32, 9).carve(30, 9, 31, 11)
    m.carve(7, 23, 12, 25).carve(10, 17, 12, 22).carve(12, 16, 13, 18)
    m.carve(30, 14, 35, 16).carve(33, 17, 35, 22).carve(36, 17, 39, 21, '~').carve(30, 22, 42, 26)
    m.carve(13, 23, 29, 25).carve(13, 23, 13, 25, 'D')
    m.put(3, 3, 'G').put(40, 3, 'G').put(3, 24, 'G').put(39, 24, 'R').put(35, 24, 'P')
    m.put(17, 11, 'o').put(26, 11, 'o').put(17, 16, 'o').put(26, 16, 'o')
    m.put(14, 9, 'f').put(29, 9, 'f').put(14, 18, 'f').put(29, 18, 'f').put(42, 22, 'f').put(42, 26, 'f')
    m.put(1, 1, 'b').put(42, 1, 'c').put(1, 26, 'b').put(30, 26, 'c').put(31, 26, 'b')
    m.put(21, 10, 'k').put(11, 20, 'k').put(34, 19, 'k')
    return m.torches()

maps = {'m1': check('m1', m1()), 'm2': check('m2', m2()), 'm3': check('m3', m3()), 'm4': check('m4', m4())}
os.makedirs(os.path.join(ROOT, 'work', 'src'), exist_ok=True)
open(os.path.join(ROOT, 'work', 'src', 'b_maps.js'), 'w').write('const MAPS=' + json.dumps(maps, separators=(',', ':')).replace('],"', '],\n"') + ';\n')
