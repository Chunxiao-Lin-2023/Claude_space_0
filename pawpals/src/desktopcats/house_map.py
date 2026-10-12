"""The town map (小镇地图): home, the six places and the arena district, joined by roads. Click a spot to go
there; little portraits walk along the roads while someone is on the way."""
import heapq
import math
import random

from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import QColor, QFont, QFontMetricsF, QLinearGradient, QPainterPath, QPen, QPolygonF, QRadialGradient

from . import house_art as H
from . import house_places_art as PA
from . import house_arena_art as AA

MAP_F = 30
HOME = 2                                   # the house (any of its storeys) is the node of storey 2

NODES = {
    2: (590, 410), 3: (330, 300), 4: (560, 240), 5: (190, 160), 6: (800, 330), 7: (430, 78), 8: (120, 405),
    "j1": (700, 300), "j2": (260, 230), "j3": (900, 290),
    9: (1068, 262),
}
# (v24) the arena district: the 竞技场 square in the middle, every other arena on a ring round it (the gap on the
# left is where the road from town comes in)
for _i, _f in enumerate(range(10, 25)):
    _th = math.radians(205 + _i * 300 / 14)
    NODES[_f] = (round(1068 + 192 * math.cos(_th)), round(262 + 170 * math.sin(_th)))
ROADS = [
    (2, 4, [(575, 330)]), (4, 3, [(450, 280)]), (2, "j1", [(660, 370)]), ("j1", 6, []), ("j1", 4, [(640, 260)]),
    (3, "j2", [(290, 270)]), ("j2", 5, [(220, 200)]), ("j2", 8, [(170, 320)]), (4, 7, [(520, 160), (470, 110)]),
    (5, 7, [(280, 110), (360, 80)]), (6, "j3", [(860, 320)]), ("j3", 9, [(970, 270)]), (3, 8, [(220, 380)]),
]
for _f in AA.ARENA_IDS:
    if _f != 9:
        ROADS.append((9, _f, []))          # the 竞技场 is the square in the middle of the arena district
SPEED = 150.0                              # map pixels a second on the way


def _graph():
    g = {}
    for a, b, mids in ROADS:
        pts = [NODES[a]] + list(mids) + [NODES[b]]
        ln = sum(math.hypot(q[0] - p[0], q[1] - p[1]) for p, q in zip(pts, pts[1:]))
        g.setdefault(a, []).append((b, ln, pts))
        g.setdefault(b, []).append((a, ln, list(reversed(pts))))
    return g


GRAPH = _graph()


def node_of(f):
    return HOME if f not in PA.PLACES else f


def route(fa, fb):
    """Polyline (list of points) along the roads from storey fa's spot to storey fb's."""
    a, b = node_of(fa), node_of(fb)
    if a == b:
        return [NODES[a], NODES[b]]
    dist = {a: 0.0}
    prev = {}
    q = [(0.0, 0, a)]
    k = 1
    while q:
        d, _, n = heapq.heappop(q)
        if n == b:
            break
        if d > dist.get(n, 1e18):
            continue
        for m, ln, pts in GRAPH.get(n, []):
            nd = d + ln
            if nd < dist.get(m, 1e18):
                dist[m] = nd
                prev[m] = (n, pts)
                heapq.heappush(q, (nd, k, m))
                k += 1
    if b not in prev:
        return [NODES[a], NODES[b]]
    segs = []
    n = b
    while n != a:
        pn, pts = prev[n]
        segs.append(pts)
        n = pn
    out = []
    for pts in reversed(segs):
        out += pts if not out else pts[1:]
    return out


def route_len(pts):
    return sum(math.hypot(q[0] - p[0], q[1] - p[1]) for p, q in zip(pts, pts[1:]))


def travel_time(fa, fb):
    return max(3.0, min(10.0, route_len(route(fa, fb)) / SPEED))


def along(pts, k):
    total = route_len(pts)
    want = total * max(0.0, min(1.0, k))
    for p, q in zip(pts, pts[1:]):
        ln = math.hypot(q[0] - p[0], q[1] - p[1])
        if want <= ln and ln > 0:
            u = want / ln
            return p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u
        want -= ln
    return pts[-1]


def node_name(n):
    if n == HOME:
        return "家"
    if n in PA.PLACES:
        return PA.PLACES[n]["name"]
    return ""


def node_at(x, y):
    best = None
    for n, (nx, ny) in NODES.items():
        if isinstance(n, str):
            continue
        r = 34 if n in (2, 3, 4, 5, 6, 7, 8) else 26
        d = math.hypot(x - nx, y - ny)
        if d < r and (best is None or d < best[0]):
            best = (d, n)
    return best[1] if best else None


# ---------------------------------------------------------------------------------------------- drawing
def draw_map(p, w, h, hour, season):
    """The static map (cached by the window)."""
    r = QRectF(0, 0, w, h)
    g = QLinearGradient(0, 0, 0, h)
    base = {"winter": ("#e8eef2", "#d6e0e6"), "autumn": ("#e3dca8", "#d2c88f")}.get(season, ("#cfe5a8", "#b9d891"))
    g.setColorAt(0, QColor(base[0]))
    g.setColorAt(1, QColor(base[1]))
    p.setPen(QPen(QColor("#8a6a4a"), 3))
    p.setBrush(g)
    p.drawRoundedRect(r.adjusted(6, 6, -6, -6), 18, 18)
    p.save()
    clip = QPainterPath()
    clip.addRoundedRect(r.adjusted(8, 8, -8, -8), 16, 16)
    p.setClipPath(clip)
    rnd = random.Random(5)
    # meadow speckles
    p.setPen(Qt.NoPen)
    for _ in range(260):
        p.setBrush(QColor(255, 255, 255, 40) if rnd.random() < 0.5 else QColor(60, 110, 40, 26))
        p.drawEllipse(QPointF(rnd.uniform(0, w), rnd.uniform(0, h)), rnd.uniform(6, 20), rnd.uniform(3, 8))
    # river feeding the lake
    river = QPainterPath(QPointF(300, -10))
    river.cubicTo(QPointF(280, 60), QPointF(250, 90), QPointF(205, 140))
    river.moveTo(QPointF(150, 190))
    river.cubicTo(QPointF(90, 240), QPointF(60, 260), QPointF(-10, 280))
    p.setPen(QPen(QColor("#7fbfe6") if season != "winter" else QColor("#cfe6f2"), 14, Qt.SolidLine, Qt.RoundCap))
    p.setBrush(Qt.NoBrush)
    p.drawPath(river)
    # the lake
    lake = QPainterPath()
    lake.addEllipse(QPointF(185, 160), 95, 48)
    p.setPen(QPen(QColor("#5a9cc8"), 2))
    p.setBrush(QColor("#8ccbea") if season != "winter" else QColor("#dcecf4"))
    p.drawPath(lake)
    # mountains
    for x, y, s in ((380, 70, 1.0), (470, 60, 1.25), (560, 78, 0.9), (330, 90, 0.7)):
        p.setPen(QPen(QColor("#6f7f8f"), 1.4))
        p.setBrush(QColor("#9fb0c0"))
        p.drawPolygon(QPolygonF([QPointF(x - 50 * s, y + 30 * s), QPointF(x, y - 45 * s), QPointF(x + 50 * s, y + 30 * s)]))
        p.setBrush(QColor("#ffffff"))
        p.setPen(Qt.NoPen)
        p.drawPolygon(QPolygonF([QPointF(x - 16 * s, y - 20 * s), QPointF(x, y - 45 * s), QPointF(x + 16 * s, y - 20 * s),
                                 QPointF(x + 6 * s, y - 14 * s), QPointF(x - 4 * s, y - 18 * s)]))
    # forests
    for cx, cy, n in ((110, 330, 9), (90, 450, 6), (680, 90, 8), (40, 70, 6), (760, 450, 5)):
        for _ in range(n):
            x, y = cx + rnd.uniform(-60, 60), cy + rnd.uniform(-30, 30)
            _tree(p, x, y, rnd.uniform(0.8, 1.2), season)
    # arena district: paved
    pl = QPainterPath()
    pl.addRoundedRect(QRectF(845, 36, 470, 448), 60, 60)
    p.setPen(QPen(QColor("#b5aa98"), 2, Qt.DashLine))
    p.setBrush(QColor(230, 220, 200, 160))
    p.drawPath(pl)
    # roads
    for a, b, mids in ROADS:
        pts = [NODES[a]] + list(mids) + [NODES[b]]
        path = QPainterPath(QPointF(*pts[0]))
        if len(pts) == 2:
            path.lineTo(QPointF(*pts[1]))
        else:
            for i in range(1, len(pts) - 1):
                m1 = QPointF(*pts[i])
                end = QPointF((pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2) if i < len(pts) - 2 \
                    else QPointF(*pts[i + 1])
                path.quadTo(m1, end)
        p.setPen(QPen(QColor("#a8906a"), 13, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin))
        p.drawPath(path)
        p.setPen(QPen(QColor("#efe2c2"), 9, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin))
        p.drawPath(path)
    # bridges where roads cross the river
    for x, y in ((236, 205),):
        p.setPen(QPen(QColor("#8a5c3d"), 2))
        p.setBrush(QColor("#c08a5c"))
        p.drawRoundedRect(QRectF(x - 14, y - 8, 28, 16), 3, 3)
    p.restore()
    # spots
    for n, (x, y) in NODES.items():
        if isinstance(n, str):
            continue
        draw_node_icon(p, n, x, y, season)
    # compass and title
    tr = QRectF(18, 16, 180, 34)
    p.setPen(QPen(QColor("#8a6a4a"), 1.4))
    p.setBrush(QColor(255, 248, 230, 235))
    p.drawRoundedRect(tr, 10, 10)
    p.setPen(QColor("#6b4a35"))
    p.setFont(QFont("sans", 13, QFont.Bold))
    p.drawText(tr, Qt.AlignCenter, "🗺 猫猫咕咕小镇")
    cx, cy = w - 50, h - 50
    p.setPen(QPen(QColor("#8a6a4a"), 1.2))
    p.setBrush(QColor(255, 248, 230, 200))
    p.drawEllipse(QPointF(cx, cy), 22, 22)
    p.setBrush(QColor("#c9443a"))
    p.drawPolygon(QPolygonF([QPointF(cx, cy - 18), QPointF(cx - 6, cy), QPointF(cx + 6, cy)]))
    p.setBrush(QColor("#ffffff"))
    p.drawPolygon(QPolygonF([QPointF(cx, cy + 18), QPointF(cx - 6, cy), QPointF(cx + 6, cy)]))
    p.setPen(QColor("#6b4a35"))
    p.setFont(QFont("sans", 7, QFont.Bold))
    p.drawText(QRectF(cx - 6, cy - 34, 12, 12), Qt.AlignCenter, "北")
    # district title
    p.setFont(QFont("sans", 11, QFont.Bold))
    p.setPen(QColor("#8a5c3d"))
    p.drawText(QRectF(988, 318, 160, 24), Qt.AlignCenter, "⚔ 对战区")


def _tree(p, x, y, s, season):
    col = {"autumn": "#d9883a", "winter": "#9aa59a", "spring": "#7cc26a"}.get(season, "#5f9f55")
    p.setPen(QPen(QColor(col).darker(140), 1))
    p.setBrush(QColor(col))
    p.drawEllipse(QPointF(x, y - 10 * s), 10 * s, 11 * s)
    p.setPen(QPen(QColor("#7a5a3e"), 2))
    p.drawLine(QPointF(x, y - 1), QPointF(x, y + 4 * s))


def _label(p, x, y, text, bold=True, size=9):
    f = QFont("sans", size, QFont.Bold if bold else QFont.Normal)
    p.setFont(f)
    fm = QFontMetricsF(f)
    wdt = fm.horizontalAdvance(text) + 14
    r = QRectF(x - wdt / 2, y, wdt, fm.height() + 4)
    p.setPen(QPen(QColor("#8a6a4a"), 1))
    p.setBrush(QColor(255, 250, 238, 235))
    p.drawRoundedRect(r, r.height() / 2, r.height() / 2)
    p.setPen(QColor("#5e4436"))
    p.drawText(r, Qt.AlignCenter, text)


def draw_node_icon(p, n, x, y, season):
    if n == HOME:
        p.setPen(QPen(QColor("#7a3326"), 1.4))
        p.setBrush(QColor("#f3e2c4"))
        p.drawRect(QRectF(x - 26, y - 22, 52, 30))
        p.setBrush(QColor("#c9604a"))
        p.drawPolygon(QPolygonF([QPointF(x - 32, y - 20), QPointF(x + 32, y - 20), QPointF(x, y - 44)]))
        p.setBrush(QColor("#8d5a3a"))
        p.drawRect(QRectF(x - 6, y - 8, 12, 16))
        p.setBrush(QColor("#bfe0f2"))
        p.drawRect(QRectF(x - 20, y - 16, 10, 9))
        p.drawRect(QRectF(x + 10, y - 16, 10, 9))
        _label(p, x, y + 12, "🏠 家")
        return
    if n in AA.ARENAS:
        d = AA.ARENAS[n]
        big = n == 9
        r = 30 if big else 22
        g = QRadialGradient(QPointF(x - r * 0.3, y - r * 0.3), r * 1.4)
        g.setColorAt(0, QColor("#fff6dc"))
        g.setColorAt(1, QColor("#e0c890"))
        p.setPen(QPen(QColor("#8a5c3d"), 2))
        p.setBrush(g)
        p.drawEllipse(QPointF(x, y), r, r)
        f = QFont()
        f.setPixelSize(int(r * 1.15))
        p.setFont(f)
        p.setPen(QColor("#3a2a22"))
        icon = {"☃": "⛄"}.get(d["icon"], d["icon"])
        if not icon.endswith("\ufe0f") and len(icon) == 1:
            icon += "\ufe0f"                   # colour (emoji) presentation, not the thin text glyph
        p.drawText(QRectF(x - r * 1.5, y - r * 1.5 + 1, 3 * r, 3 * r), Qt.AlignCenter, icon)
        _label(p, x, y + r + 2, d["name"], size=8)
        return
    d = PA.PLACES[n]
    key = d["key"]
    if key == "school":
        p.setPen(QPen(QColor("#9a7b5c"), 1.4))
        p.setBrush(QColor("#f3e3c8"))
        p.drawRect(QRectF(x - 30, y - 30, 60, 34))
        p.setBrush(QColor("#c9604a"))
        p.drawRect(QRectF(x - 34, y - 34, 68, 6))
        p.setBrush(QColor("#bfe0f2"))
        for i in range(4):
            p.drawRect(QRectF(x - 26 + i * 14, y - 22, 9, 8))
        p.setPen(QPen(QColor("#9aa2ac"), 1.4))
        p.drawLine(QPointF(x + 36, y + 4), QPointF(x + 36, y - 44))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#d9572f"))
        p.drawRect(QRectF(x + 36, y - 44, 14, 9))
    elif key == "park":
        p.setPen(QPen(QColor("#9a8a76"), 1.2))
        p.setBrush(QColor("#d9d3c8"))
        p.drawEllipse(QPointF(x, y - 6), 18, 10)
        p.setBrush(QColor("#79bde3"))
        p.drawEllipse(QPointF(x, y - 7), 12, 6)
        for dx in (-30, 30):
            _tree(p, x + dx, y, 1.4, season)
        p.setPen(QPen(QColor("#ffffff"), 1.5))
        p.drawLine(QPointF(x, y - 8), QPointF(x, y - 20))
    elif key == "lake":
        p.setPen(QPen(QColor("#8a3a2e"), 1))
        p.setBrush(QColor("#e46f5b"))
        p.drawPolygon(QPolygonF([QPointF(x - 14, y - 4), QPointF(x + 14, y - 4), QPointF(x + 9, y + 3), QPointF(x - 9, y + 3)]))
        p.setPen(QPen(QColor("#8a5c3d"), 3))
        p.drawLine(QPointF(x + 40, y + 10), QPointF(x + 40, y - 20))
    elif key == "street":
        for i, col in enumerate(("#3b8bd0", "#f29a3e", "#6b4a35")):
            rx = x - 42 + i * 28
            p.setPen(QPen(QColor("#9a8a76"), 1.2))
            p.setBrush(QColor("#f3ece0"))
            p.drawRect(QRectF(rx, y - 30, 26, 32))
            p.setBrush(QColor(col))
            p.drawRect(QRectF(rx - 1, y - 32, 28, 7))
            p.setBrush(QColor("#bfe0f2"))
            p.drawRect(QRectF(rx + 5, y - 20, 16, 10))
    elif key == "mountain":
        p.setPen(QPen(QColor("#2f3a44"), 1.2))
        p.setBrush(QColor("#c9443a"))
        p.drawRect(QRectF(x - 12, y - 6, 3, 12))
        p.drawRect(QRectF(x + 9, y - 6, 3, 12))
        p.setBrush(QColor("#3f5a6a"))
        p.drawPolygon(QPolygonF([QPointF(x - 20, y - 6), QPointF(x + 20, y - 6), QPointF(x, y - 20)]))
    elif key == "camp":
        p.setPen(QPen(QColor("#9c5a1a"), 1.2))
        p.setBrush(QColor("#f29a3e"))
        p.drawPolygon(QPolygonF([QPointF(x - 22, y + 2), QPointF(x + 4, y + 2), QPointF(x - 9, y - 22)]))
        p.setBrush(QColor("#3a2a22"))
        p.drawPolygon(QPolygonF([QPointF(x - 14, y + 2), QPointF(x - 4, y + 2), QPointF(x - 9, y - 10)]))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#f6d35b"))
        p.drawEllipse(QPointF(x + 20, y - 2), 5, 7)
        p.setBrush(QColor("#e8473f"))
        p.drawEllipse(QPointF(x + 20, y), 4, 4)
    _label(p, x, y + 12, "%s %s" % (d["icon"], d["name"]))


def portrait(a, size=26):
    """A small round portrait of a cat / family member (cached on the agent)."""
    pm = getattr(a, "_map_pm", None)
    if pm is not None and pm.width() == size:
        return pm
    from PySide6.QtGui import QPainter, QPixmap
    pm = QPixmap(size, size)
    pm.fill(Qt.transparent)
    q = QPainter(pm)
    q.setRenderHint(QPainter.Antialiasing)
    q.setPen(QPen(QColor("#8a6a4a"), 1.4))
    q.setBrush(QColor("#fffaf0"))
    q.drawEllipse(QRectF(1, 1, size - 2, size - 2))
    path = QPainterPath()
    path.addEllipse(QRectF(2, 2, size - 4, size - 4))
    q.setClipPath(path)
    if a.is_cat:
        from . import house_cats as HC
        src = HC.cat_pixmap(getattr(a.src, "kind", "calico"), int(size * 1.6))
        q.drawPixmap(int(-size * 0.25), int(-size * 0.1), src)
    else:
        src = H.person_preview(a.P, int(size * 2.2))
        q.drawPixmap(int(-size * 0.6), int(-size * 0.05), src)
    q.end()
    a._map_pm = pm
    return pm


def draw_map_live(p, world, t, hover, font):
    """Who is where, who is on the way, where a fight is on, and the hovered spot."""
    groups = {}
    for a in world.people + world.cats:
        if a.traveling is not None or a.away:
            continue
        groups.setdefault(node_of(a.f), []).append(a)
    for n, ags in groups.items():
        x, y = NODES[n]
        size = 24
        k = len(ags)
        x0 = x - (k * (size - 6)) / 2
        for i, a in enumerate(ags[:8]):
            p.drawPixmap(QPointF(x0 + i * (size - 6), y - 64 - (8 if n in AA.ARENAS else 0)), portrait(a, size))
    for a in world.people + world.cats:
        if a.traveling is None:
            continue
        if a.path and a.path[0].get("t") == "travel":
            k = a.path[0].get("k", 0.0)
        elif getattr(a, "trip_k", None) is not None:
            k = a.trip_k
        else:
            continue
        pts = route(a.f, a.traveling)
        x, y = along(pts, k)
        bob = 2 * math.sin(t * 9 + hash(a.uid) % 7)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(0, 0, 0, 50))
        p.drawEllipse(QPointF(x, y + 12), 9, 3)
        p.drawPixmap(QPointF(x - 13, y - 14 + bob), portrait(a, 26))
    b = getattr(world, "battle", None)
    if b is not None and b.f in NODES:
        x, y = NODES[b.f]
        s = 1 + 0.12 * math.sin(t * 6)
        p.setPen(QColor("#c9443a"))
        f2 = QFont(font)
        f2.setPixelSize(int(20 * s))
        f2.setBold(True)
        p.setFont(f2)
        p.drawText(QRectF(x - 20, y - 52, 40, 30), Qt.AlignCenter, "⚔")
    if hover is not None and hover in NODES:
        x, y = NODES[hover]
        r = 40 if hover in (2, 3, 4, 5, 6, 7, 8) else 30
        p.setPen(QPen(QColor(255, 220, 120, 230), 3))
        p.setBrush(QColor(255, 240, 190, 50))
        p.drawEllipse(QPointF(x, y - 6), r, r)
        if hover in AA.ARENAS:
            text = AA.ARENAS[hover]["desc"]
        elif hover in PA.PLACES:
            text = "点一下：去看看 / 让家人去"
        else:
            text = "点一下：回家看看 / 叫大家回家"
        f2 = QFont(font)
        f2.setPixelSize(13)
        p.setFont(f2)
        fm = QFontMetricsF(f2)
        wdt = fm.horizontalAdvance(text) + 20
        tx = min(max(x - wdt / 2, 12), H.PANEL_W - wdt - 12)
        tr = QRectF(tx, y - r - 34, wdt, 22)
        p.setPen(QPen(QColor("#d9b99b"), 1))
        p.setBrush(QColor(255, 250, 240, 240))
        p.drawRoundedRect(tr, 11, 11)
        p.setPen(QColor("#6b4a3a"))
        p.drawText(tr, Qt.AlignCenter, text)
