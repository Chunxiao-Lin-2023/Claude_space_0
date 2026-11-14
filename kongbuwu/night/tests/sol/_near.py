# 测试工具：把追逐者挪到玩家旁边、放慢（测试 fast=8 时追逐者也快 8 倍）
def near(eid, mp):
    return ['js', "(() => { const W = window.__dbg.W, m = W.maps['%s'], e = m.ents.find(z => z.id === '%s'), p = W.pl; e.mv = null; if (e.chase) e.chase.spd = .05;"
            " for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const x = p.x + dx, y = p.y + dy; if (passable(m, x, y, e)) { e.x = x; e.y = y; e.px = x * 16; e.py = y * 16; break; } } })()" % (mp, eid)]
