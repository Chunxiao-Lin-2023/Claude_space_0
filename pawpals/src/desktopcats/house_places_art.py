"""Places outside the house (学校, 公园, 湖边, 商店街, 山上, 营地): ground, backdrops, scenery and props.

Each place is one more "storey" of the house world (f = 3 .. 8): the same straight-on 2.5D projection, the
same walkable-floor / furniture / spot system, so the family and the cats live there exactly as at home.
Geometry is in house units (the house plan after scaling: PW x PD = 1260 x 480).
"""
import math
import random

from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import QColor, QFont, QLinearGradient, QPainterPath, QPen, QPolygonF, QRadialGradient

from . import house_art as H
from .house_art import B, C, E, Fn, Fr, S, Tl, box, cyl, disc, frect, ipt, iso, pen, poly, srect, vgrad

OUT = H.OUT

# ---------------------------------------------------------------------------------------------- the places
# rooms: key -> (label, x0, y0, x1, y1, ground style); open: rooms where a cat goes on the leash.
PLACES = {
    3: dict(key="school", name="学校", icon="🏫",
            rooms={"front": ("校门口", 0, 0, 700, 200, "asphalt"), "class": ("教室", 0, 200, 700, 480, "oak"),
                   "yard": ("操场", 700, 0, 1260, 480, "track")},
            walls=[(0, 200, 700, 200, [(520, 600)]), (700, 200, 700, 480, [(300, 372)])],
            open=("front", "yard"), gate=(290, 410), lit=("class",), hours=(7.5, 17.5)),
    4: dict(key="park", name="公园", icon="🌳",
            rooms={"park": ("公园", 0, 0, 1260, 480, "lawn")}, walls=[], open=("park",), gate=(570, 690),
            lit=(), hours=(6.0, 21.5)),
    5: dict(key="lake", name="湖边", icon="🛶",
            rooms={"shore": ("湖岸", 0, 0, 1260, 190, "lawn"), "pier": ("栈桥", 780, 190, 880, 440, "deck")},
            walls=[], open=("shore", "pier"), gate=(200, 320), lit=(), hours=(6.0, 21.0),
            water=(0, 190, 1260, 480)),
    6: dict(key="street", name="商店街", icon="🛒",
            rooms={"walk": ("人行道", 0, 0, 1260, 150, "stone"), "market": ("超市", 0, 150, 500, 480, "tile"),
                   "pet": ("宠物店", 500, 150, 860, 480, "wood"), "cafe": ("咖啡馆", 860, 150, 1260, 480, "oak")},
            walls=[(0, 150, 500, 150, [(200, 290)]), (500, 150, 860, 150, [(636, 724)]),
                   (860, 150, 1260, 150, [(1006, 1094)]), (500, 150, 500, 480, []), (860, 150, 860, 480, [])],
            open=("walk",), gate=(560, 700), lit=("market", "pet", "cafe"), hours=(8.0, 21.5)),
    7: dict(key="mountain", name="山上", icon="⛰",
            rooms={"trail": ("山路", 0, 0, 560, 480, "dirt"), "bridge": ("小木桥", 560, 214, 680, 314, "deck"),
                   "peak": ("观景台", 680, 0, 1260, 480, "rock")},
            walls=[], open=("trail", "bridge", "peak"), gate=(160, 280), lit=(), hours=(6.0, 18.5),
            stream=(560, 680)),
    8: dict(key="camp", name="营地", icon="⛺",
            rooms={"camp": ("营地", 0, 0, 1260, 480, "lawn")}, walls=[], open=("camp",), gate=(560, 700),
            lit=(), hours=(0.0, 24.0)),
}
PLACE_IDS = tuple(sorted(PLACES))
PLACE_BY_KEY = {v["key"]: f for f, v in PLACES.items()}


def is_place(f):
    return f in PLACES


def gate(f):
    return PLACES[f]["gate"]


def entry_in(f):
    g = PLACES[f]["gate"]
    return (g[0] + g[1]) / 2, 24.0


def entry_out(f):
    g = PLACES[f]["gate"]
    return (g[0] + g[1]) / 2, -H.ENTRY_D * 0.6


def room_open(f, x, y):
    """Is the point in an open-air part of a place (a cat there has to be on the leash)?"""
    if f not in PLACES:
        return False
    r = H.room_at(f, x, y)
    if r is None:
        return y < 0
    return r in PLACES[f]["open"]


def install():
    """Add the places to the house plan (called after every H.configure: the plan is rebuilt there)."""
    for f, d in PLACES.items():
        H.FLOORS[f] = dict(rooms=dict(d["rooms"]), walls=[(a, b, c, e, list(g)) for a, b, c, e, g in d["walls"]],
                           windows=[], labels=not d.get("arena"))
        H.FLOOR_NAMES[f] = d["name"]


_inside = H.inside


def _inside_places(f, x, y, margin=0.0):
    if f in PLACES:
        if H.room_at(f, x, y) is not None:
            return True
        g = PLACES[f]["gate"]
        return g[0] <= x <= g[1] and -H.ENTRY_D <= y < 0
    return _inside(f, x, y, margin)


H.inside = _inside_places
_configure = H.configure


def _configure_places(mirror=False):
    _configure(mirror)
    install()


H.configure = _configure_places
install()

H.STYLES.update({"lawn": ("#b9d98e", "#a3c879"), "track": ("#d9785a", "#c4664a"), "asphalt": ("#b9b7b2", "#a6a49f"),
                 "dirt": ("#d8bd8c", "#c6a774"), "rock": ("#cfc6b6", "#bab09e"), "sand": ("#efdcae", "#e2cb96")})
H.WALLPAPER.update({"class": "#eef1e4", "market": "#eaf3f6", "pet": "#fdeedd", "cafe": "#f2e2cc"})


# ---------------------------------------------------------------------------------------------- sky
def _sky_rect():
    top = 0.0
    bot = iso(0, H.PD_PLACE, 0)[1]
    return QRectF(H.OX - H.SIDE_T - 2, top, H.PW + 2 * H.SIDE_T + 4, bot - top)


def draw_sky(p, hour, weather, rect=None, seed=3):
    r = rect or _sky_rect()
    top, bot = H.sky_colors(hour)
    if weather in ("rain", "snow"):
        top, bot = H.overcast(top), H.overcast(bot)
    g = QLinearGradient(0, r.top(), 0, r.bottom())
    g.setColorAt(0, top)
    g.setColorAt(1, bot)
    p.setPen(Qt.NoPen)
    p.setBrush(g)
    p.drawRect(r)
    rnd = random.Random(seed)
    dark = H.is_dark(hour)
    if dark:
        for _ in range(70):
            x = rnd.uniform(r.left(), r.right())
            y = rnd.uniform(r.top(), r.top() + r.height() * 0.75)
            a = rnd.randint(120, 240)
            p.setBrush(QColor(255, 255, 240, a))
            s = rnd.choice((0.8, 1.0, 1.3, 1.8))
            p.drawEllipse(QPointF(x, y), s, s)
        mx = r.left() + r.width() * 0.82
        p.setBrush(QColor("#fff6d8"))
        p.drawEllipse(QPointF(mx, r.top() + 34), 13, 13)
        p.setBrush(top)
        p.drawEllipse(QPointF(mx + 6, r.top() + 30), 11, 11)
    elif weather not in ("rain", "snow"):
        k = max(0.0, min(1.0, (hour - 6.5) / 12.0))
        sx = r.left() + r.width() * (0.1 + 0.8 * k)
        sy = r.top() + 30 + 26 * (2 * k - 1) ** 2
        gl = QRadialGradient(QPointF(sx, sy), 40)
        gl.setColorAt(0, QColor(255, 244, 200, 160))
        gl.setColorAt(1, QColor(255, 244, 200, 0))
        p.setBrush(gl)
        p.drawEllipse(QPointF(sx, sy), 40, 40)
        p.setBrush(QColor("#fff2c0"))
        p.drawEllipse(QPointF(sx, sy), 12, 12)
    # clouds
    n = 7 if weather in ("rain", "snow") else 4
    for i in range(n):
        cx = r.left() + rnd.uniform(0.05, 0.95) * r.width()
        cy = r.top() + rnd.uniform(14, r.height() * 0.45)
        s = rnd.uniform(0.7, 1.3)
        col = QColor(236, 240, 246, 230) if not dark else QColor(90, 100, 140, 120)
        if weather in ("rain", "snow"):
            col = QColor(170, 178, 192, 230)
        _cloud(p, cx, cy, s, col)


def _cloud(p, cx, cy, s, col):
    p.setPen(Qt.NoPen)
    p.setBrush(col)
    for dx, dy, rr in ((-22, 2, 12), (-8, -6, 16), (10, -4, 14), (24, 3, 10), (0, 5, 14)):
        p.drawEllipse(QPointF(cx + dx * s, cy + dy * s), rr * s * 1.3, rr * s)


def _ridge(p, base_y, amp, period, phase, color, x0=None, x1=None, step=8.0, peaks=None):
    """A mountain / hill silhouette standing on screen y base_y."""
    x0 = H.OX - H.SIDE_T - 2 if x0 is None else x0
    x1 = H.OX + H.PW + H.SIDE_T + 2 if x1 is None else x1
    path = QPainterPath(QPointF(x0, base_y + 2))
    x = x0
    while x <= x1 + step:
        u = x / period + phase
        h = amp * (0.55 + 0.3 * math.sin(u) + 0.15 * math.sin(u * 2.7 + 1.3))
        if peaks:
            for px, pw, ph in peaks:
                d = abs(x - px) / pw
                if d < 1:
                    h = max(h, ph * (1 - d))
        path.lineTo(QPointF(x, base_y - h))
        x += step
    path.lineTo(QPointF(x1, base_y + 2))
    path.closeSubpath()
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(color))
    p.drawPath(path)


def _tree_row(p, base_y, x0, x1, gap, color, dark, seed=5, scale=1.0, pine=False):
    rnd = random.Random(seed)
    x = x0
    while x < x1:
        s = scale * rnd.uniform(0.75, 1.25)
        c = QColor(color).darker(rnd.randint(95, 118))
        if dark:
            c = c.darker(170)
        p.setPen(Qt.NoPen)
        p.setBrush(c)
        if pine:
            for k in range(3):
                w = (16 - k * 4) * s
                y = base_y - k * 11 * s
                p.drawPolygon(poly((x - w, y), (x + w, y), (x, y - 20 * s)))
        else:
            p.drawEllipse(QPointF(x, base_y - 14 * s), 16 * s, 16 * s)
            p.drawEllipse(QPointF(x + 10 * s, base_y - 6 * s), 12 * s, 11 * s)
        x += gap * rnd.uniform(0.7, 1.3)


def season_green(se, base="#6fae5a"):
    return {"spring": "#7cc26a", "summer": base, "autumn": "#c99a48", "winter": "#9aa59a"}.get(se, base)


# ---------------------------------------------------------------------------------------------- ground
def _ground(p, f, st, x0, y0, x1, y1, se, snow):
    c0, c1 = H.STYLES[st]
    if st in ("lawn",):
        c0 = {"autumn": "#c8d58a", "winter": "#c3cdb4", "spring": "#b5de8c"}.get(se, c0)
        c1 = {"autumn": "#b5c477", "winter": "#aebba0", "spring": "#9fcd75"}.get(se, c1)
    r = frect(x0, y0, x1, y1)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(c0))
    p.drawRect(r)
    p.save()
    p.setClipRect(r)
    if st == "lawn":
        H.floor_texture(p, "grass", x0, y0, x1, y1, c0, c1)
    elif st == "track":
        _track(p, x0, y0, x1, y1)
    elif st == "asphalt":
        rnd = random.Random(int(x0 + y0))
        for _ in range(int((x1 - x0) * (y1 - y0) / 900)):
            sx, sy = iso(rnd.uniform(x0, x1), rnd.uniform(y0, y1))
            p.setBrush(QColor(255, 255, 255, 30) if rnd.random() < 0.5 else QColor(0, 0, 0, 22))
            p.drawEllipse(QPointF(sx, sy), 1.4, 1.0)
    elif st in ("dirt", "rock", "sand"):
        rnd = random.Random(int(x0 * 3 + y0))
        for _ in range(int((x1 - x0) * (y1 - y0) / 1500)):
            sx, sy = iso(rnd.uniform(x0, x1), rnd.uniform(y0, y1))
            rr = rnd.uniform(2, 6) if st != "sand" else 1.2
            p.setBrush(QColor(c1).darker(rnd.randint(100, 125)))
            p.drawEllipse(QPointF(sx, sy), rr, rr * 0.55)
        if st == "rock":
            p.setPen(QPen(QColor(c1).darker(115), 1.0))
            for _ in range(18):
                x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
                a = ipt(x, y)
                b = ipt(x + rnd.uniform(-40, 40), y + rnd.uniform(-20, 20))
                p.drawLine(a, b)
    else:
        H.floor_texture(p, st, x0, y0, x1, y1, c0, c1)
    p.restore()
    # ambient occlusion along the back of indoor rooms
    if f in PLACES and y1 >= H.PD_PLACE - 1 and st in ("oak", "tile", "wood"):
        band = frect(x0, max(y0, y1 - 40), x1, y1)
        g = QLinearGradient(0, band.top(), 0, band.bottom())
        g.setColorAt(0, QColor(70, 40, 20, 40))
        g.setColorAt(1, QColor(70, 40, 20, 0))
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        p.drawRect(band)


def _track(p, x0, y0, x1, y1):
    """A red running track round a green football pitch."""
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    rx, ry = (x1 - x0) / 2 - 16, (y1 - y0) / 2 - 16
    for k, col in ((0, "#d9785a"), (1, "#7fbf63")):
        ins = 46 * k
        path = QPainterPath()
        path.addRoundedRect(frect(cx - rx + ins, cy - ry + ins, cx + rx - ins, cy + ry - ins), (ry - ins) * H.KY * 0.9,
                            (ry - ins) * H.KY * 0.9)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(col))
        p.drawPath(path)
    p.setPen(QPen(QColor(255, 255, 255, 170), 1.2))
    p.setBrush(Qt.NoBrush)
    for k in (12, 23, 34):
        p.drawRoundedRect(frect(cx - rx + k, cy - ry + k, cx + rx - k, cy + ry - k), (ry - k) * H.KY * 0.9,
                          (ry - k) * H.KY * 0.9)
    # stripes on the pitch
    p.setPen(Qt.NoPen)
    x = cx - rx + 52
    i = 0
    while x < cx + rx - 52:
        if i % 2:
            p.setBrush(QColor(255, 255, 255, 26))
            p.drawRect(frect(x, cy - ry + 50, min(x + 30, cx + rx - 52), cy + ry - 50))
        x += 30
        i += 1
    p.setPen(QPen(QColor(255, 255, 255, 190), 1.4))
    p.drawLine(ipt(cx, cy - ry + 50), ipt(cx, cy + ry - 50))
    p.setBrush(Qt.NoBrush)
    sx, sy = iso(cx, cy)
    p.drawEllipse(QPointF(sx, sy), 30, 30 * H.KY)


def _slab(p, x0, x1, col0="#a98a5e", col1="#86683f", grass=False):
    sr = srect(x0, x1, 0, -16, 0)
    p.setPen(pen(OUT, 1.2, 170))
    p.setBrush(vgrad(sr, col0, col1))
    p.drawRect(sr)
    if grass:
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#8fbd66"))
        p.drawRect(QRectF(sr.left(), sr.top(), sr.width(), 3))


def _gate_step(p, f):
    g0, g1 = PLACES[f]["gate"]
    e = -H.ENTRY_D
    sr = srect(g0, g1, e, -16, 0)
    p.setPen(pen(OUT, 1.1, 180))
    p.setBrush(vgrad(sr, "#a69d90", "#8a8276"))
    p.drawRect(sr)
    H.fill_rect(p, frect(g0, e, g1, 0), QColor("#cdc5b8"), OUT, 1.0)


def _water_poly(x0, y0, x1, y1, holes=()):
    path = QPainterPath()
    path.addPolygon(QPolygonF([ipt(x0, y0), ipt(x1, y0), ipt(x1, y1), ipt(x0, y1)]))
    path.closeSubpath()
    for hx0, hy0, hx1, hy1 in holes:
        hp = QPainterPath()
        hp.addPolygon(QPolygonF([ipt(hx0, hy0), ipt(hx1, hy0), ipt(hx1, hy1), ipt(hx0, hy1)]))
        hp.closeSubpath()
        path = path.subtracted(hp)
    return path


def draw_water(p, path, hour, frozen=False, seed=2):
    r = path.boundingRect()
    g = QLinearGradient(0, r.top(), 0, r.bottom())
    if frozen:
        g.setColorAt(0, QColor("#d9e9f2"))
        g.setColorAt(1, QColor("#c3dbe8"))
    else:
        top, bot = H.sky_colors(hour)
        g.setColorAt(0, H.mix(top, "#4d93c2", 0.55))
        g.setColorAt(1, H.mix(bot, "#3f86b8", 0.7))
    p.setPen(Qt.NoPen)
    p.setBrush(g)
    p.drawPath(path)
    p.save()
    p.setClipPath(path)
    rnd = random.Random(seed)
    if frozen:
        p.setPen(QPen(QColor(255, 255, 255, 150), 1.2))
        for _ in range(26):
            x, y = rnd.uniform(r.left(), r.right()), rnd.uniform(r.top(), r.bottom())
            p.drawLine(QPointF(x, y), QPointF(x + rnd.uniform(-30, 30), y + rnd.uniform(-6, 6)))
    else:
        p.setPen(QPen(QColor(255, 255, 255, 70), 1.2))
        for _ in range(int(r.width() * r.height() / 2600)):
            x, y = rnd.uniform(r.left(), r.right()), rnd.uniform(r.top(), r.bottom())
            w = rnd.uniform(8, 22)
            p.drawLine(QPointF(x - w, y), QPointF(x + w, y))
    p.restore()


def _lily(p, x, y, r=9.0, flower=False):
    sx, sy = iso(x, y, 0.5)
    p.setPen(pen("#3f7a3a", 0.9))
    p.setBrush(QColor("#5fa851"))
    path = QPainterPath()
    path.moveTo(sx, sy)
    path.arcTo(QRectF(sx - r, sy - r * 0.5, 2 * r, r), 20, 320)
    path.closeSubpath()
    p.drawPath(path)
    if flower:
        p.setPen(Qt.NoPen)
        for k in range(6):
            a = k * math.pi / 3
            p.setBrush(QColor("#f7b8cf"))
            p.drawEllipse(QPointF(sx + math.cos(a) * 3, sy - 3 + math.sin(a) * 1.6), 2.6, 1.8)
        p.setBrush(QColor("#f6d35b"))
        p.drawEllipse(QPointF(sx, sy - 3), 1.4, 1.2)


def draw_place_base(p, f, hour, se, snow, frozen=False):
    """The diorama block of a place: slab, ground per area, water, paths."""
    d = PLACES[f]
    key = d["key"]
    soil = ("#a98a5e", "#86683f")
    if key == "street":
        # the road in front of the pavement
        rr = srect(-H.SIDE_T, H.PW + H.SIDE_T, 0, -34, 0)
        p.setPen(Qt.NoPen)
        p.setBrush(vgrad(rr, "#6f6e6b", "#5a5956"))
        p.drawRect(rr)
        p.setPen(QPen(QColor("#f2efe6"), 2.4, Qt.DashLine))
        p.drawLine(QPointF(rr.left(), rr.center().y() + 4), QPointF(rr.right(), rr.center().y() + 4))
        _slab(p, 0, H.PW, "#c9c4bb", "#a9a49b")
    else:
        _slab(p, 0, H.PW, *soil, grass=key in ("park", "camp", "lake"))
    base = frect(0, 0, H.PW, H.PD_PLACE)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#cfa77c"))
    p.drawRect(base)
    for rk, (label, x0, y0, x1, y1, st) in d["rooms"].items():
        _ground(p, f, st, x0, y0, x1, y1, se if rk in d["open"] else None, snow)
    _gate_step(p, f)
    if key == "park":
        _park_paths(p)
    elif key == "school":
        _school_ground(p)
    elif key == "lake":
        wx0, wy0, wx1, wy1 = d["water"]
        pier = d["rooms"]["pier"][1:5]
        path = _water_poly(wx0, wy0, wx1, wy1, [pier])
        draw_water(p, path, hour, frozen)
        # the bank
        p.setPen(Qt.NoPen)
        rnd = random.Random(9)
        x = 0.0
        while x < H.PW:
            if not (pier[0] - 6 < x < pier[2] + 6):
                sx, sy = iso(x, wy0 + 2, 0)
                p.setBrush(QColor("#8c7a5e"))
                p.drawEllipse(QPointF(sx, sy + 1), rnd.uniform(6, 11), 3)
            x += 9
        if not frozen:
            for x, y, fl in ((140, 300, False), (170, 280, True), (420, 420, False), (440, 405, False), (980, 300, True),
                             (1010, 320, False), (1120, 260, False), (600, 250, False), (630, 236, True)):
                _lily(p, x, y, 9, fl)
        # pier posts in the water
        for x in (pier[0] + 4, pier[2] - 4):
            for y in (230, 300, 370, 432):
                box(p, x - 3, y - 3, -14, x + 3, y + 3, 0, "#7a5a3e", top="#8f6a4a")
    elif key == "mountain":
        x0, x1 = d["stream"]
        path = _water_poly(x0, 0, x1, H.PD_PLACE, [(x0, 214, x1, 314)])
        draw_water(p, path, hour, frozen)
        rnd = random.Random(4)
        for _ in range(30):
            x, y = rnd.uniform(x0 - 8, x1 + 8), rnd.uniform(0, H.PD_PLACE)
            if 205 < y < 322:
                continue
            sx, sy = iso(x, y)
            p.setPen(pen("#8b8378", 0.8))
            p.setBrush(QColor("#b9b1a3"))
            p.drawEllipse(QPointF(sx, sy), rnd.uniform(4, 9), rnd.uniform(2.5, 4))
        # the bridge deck edges
        box(p, x0 - 6, 214, -4, x1 + 6, 314, 0, "#9b6f4c", top="#c39168")
        p.setPen(QPen(QColor("#8a5f3e"), 1.0))
        x = x0
        while x < x1:
            p.drawLine(ipt(x, 214), ipt(x, 314))
            x += 12
    elif key == "camp":
        _camp_ground(p)
    elif key == "street":
        # kerb and pavement edge
        p.setPen(QPen(QColor("#9d988f"), 2.0))
        p.drawLine(ipt(0, 2), ipt(H.PW, 2))
    if snow > 0.02:
        _snow_on(p, f, snow)


def _park_paths(p):
    p.setPen(pen("#c9b996", 1.0, 160))
    p.setBrush(QColor("#e8dcc0"))
    path = QPainterPath()
    cx, cy = 630, 260
    path.addEllipse(QPointF(*iso(cx, cy)), 190, 190 * H.KY * 0.95)
    inner = QPainterPath()
    inner.addEllipse(QPointF(*iso(cx, cy)), 150, 150 * H.KY * 0.95)
    ring = path.subtracted(inner)
    p.drawPath(ring)
    # from the gate to the ring, and off to the left and right
    for pts in (((630, 0), (630, 165)), ((0, 260), (440, 260)), ((820, 260), (1260, 260))):
        (ax, ay), (bx, by) = pts
        if ax == bx:
            poly_ = poly(ipt(ax - 34, ay), ipt(ax + 34, ay), ipt(bx + 34, by), ipt(bx - 34, by))
        else:
            poly_ = poly(ipt(ax, ay - 30), ipt(bx, by - 30), ipt(bx, by + 30), ipt(ax, ay + 30))
        p.drawPolygon(poly_)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 255, 255, 50))
    rnd = random.Random(2)
    for _ in range(60):
        a = rnd.uniform(0, math.tau)
        rr = rnd.uniform(152, 188)
        sx, sy = iso(cx + math.cos(a) * rr, cy + math.sin(a) * rr / 0.95)
        p.drawEllipse(QPointF(sx, sy), 3, 1.5)


def _school_ground(p):
    # zebra crossing / painted lines by the gate, hopscotch in the yard corner
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 255, 255, 150))
    for k in range(5):
        p.drawPolygon(poly(ipt(300 + k * 24, 6), ipt(314 + k * 24, 6), ipt(314 + k * 24, 46), ipt(300 + k * 24, 46)))
    p.setPen(QPen(QColor(255, 255, 255, 200), 1.6))
    p.setBrush(Qt.NoBrush)
    x, y = 90, 110
    for i, (dx, dy) in enumerate(((0, 0), (0, 22), (-14, 44), (14, 44), (0, 66), (-14, 88), (14, 88))):
        p.drawPolygon(poly(ipt(x + dx - 13, y + dy), ipt(x + dx + 13, y + dy), ipt(x + dx + 13, y + dy + 20),
                           ipt(x + dx - 13, y + dy + 20)))
    p.setPen(QColor("#ffffff"))
    p.setFont(QFont("sans", 7))
    for i, (dx, dy) in enumerate(((0, 0), (0, 22), (-14, 44), (14, 44), (0, 66), (-14, 88), (14, 88))):
        sx, sy = iso(x + dx, y + dy + 10)
        p.drawText(QRectF(sx - 6, sy - 5, 12, 10), Qt.AlignCenter, str(i + 1))


def _camp_ground(p):
    rnd = random.Random(12)
    p.setPen(Qt.NoPen)
    # a worn patch round the fire and a trail from the gate
    sx, sy = iso(600, 230)
    g = QRadialGradient(QPointF(sx, sy), 170)
    g.setColorAt(0, QColor("#cdb48a"))
    g.setColorAt(0.7, QColor(205, 180, 138, 160))
    g.setColorAt(1, QColor(205, 180, 138, 0))
    p.setBrush(g)
    p.drawEllipse(QPointF(sx, sy), 170, 170 * H.KY)
    p.setBrush(QColor(205, 180, 138, 150))
    p.drawPolygon(poly(ipt(600, 0), ipt(660, 0), ipt(640, 140), ipt(600, 140)))
    for _ in range(40):
        x, y = rnd.uniform(20, H.PW - 20), rnd.uniform(10, H.PD_PLACE - 10)
        sx, sy = iso(x, y)
        col = rnd.choice(("#f6f1e6", "#f3d26b", "#d98bb0", "#ffffff"))
        p.setBrush(QColor(col))
        p.drawEllipse(QPointF(sx, sy), 1.6, 1.2)


def _snow_on(p, f, level):
    d = PLACES[f]
    a = int(220 * min(1.0, level * 1.4))
    path = QPainterPath()
    for rk in d["open"]:
        label, x0, y0, x1, y1, st = d["rooms"][rk]
        rp = QPainterPath()
        rp.addPolygon(QPolygonF([ipt(x0, y0), ipt(x1, y0), ipt(x1, y1), ipt(x0, y1)]))
        rp.closeSubpath()
        path = path.united(rp)
    p.save()
    p.setClipPath(path)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(250, 252, 255, int(a * 0.7)))
    p.drawPath(path)
    rnd = random.Random(f)
    for _ in range(70):
        sx, sy = iso(rnd.uniform(0, H.PW), rnd.uniform(0, H.PD_PLACE))
        r = rnd.uniform(10, 30) * (0.5 + level)
        p.setBrush(QColor(255, 255, 255, int(a * rnd.uniform(0.3, 0.7))))
        p.drawEllipse(QPointF(sx, sy), r, r * 0.42)
    p.restore()


# ---------------------------------------------------------------------------------------------- backdrops
def _backband(x0, x1, z1=None):
    z1 = H.WALL_H + 20 if z1 is None else z1
    return srect(x0, x1, H.PD_PLACE, 0, z1)


def draw_place_back(p, f, hour, weather, se):
    key = PLACES[f]["key"]
    dark = H.is_dark(hour)
    if key in ("park", "lake", "mountain", "camp"):
        draw_sky(p, hour, weather, seed=f)
    yb = iso(0, H.PD_PLACE, 0)[1]
    if key == "park":
        _ridge(p, yb - 40, 26, 90, 0.3, H.mix("#9fb8c9", "#2a3350", 0.8 if dark else 0.0).name())
        _skyline(p, yb - 30, dark)
        _tree_row(p, yb - 2, H.OX - 10, H.OX + H.PW + 10, 30, season_green(se, "#5f9f55"), dark, seed=7, scale=1.4)
        _hedge(p, yb, se, dark)
    elif key == "lake":
        _ridge(p, yb - 44, 50, 140, 1.1, H.mix("#a6b9d0", "#26304e", 0.8 if dark else 0.0).name(),
               peaks=[(H.OX + 300, 160, 92), (H.OX + 980, 200, 74)])
        _ridge(p, yb - 30, 22, 70, 0.4, H.mix(season_green(se, "#7ea76a"), "#1e2a3a", 0.8 if dark else 0.1).name())
        _tree_row(p, yb - 26, H.OX - 10, H.OX + H.PW + 10, 26, season_green(se, "#4f8a4a"), dark, seed=3, scale=0.9)
        # the far water reaching to the horizon
        far = QRectF(H.OX - H.SIDE_T - 2, yb - 28, H.PW + 2 * H.SIDE_T + 4, 28)
        frozen = se == "winter"
        g = QLinearGradient(0, far.top(), 0, far.bottom())
        top, bot = H.sky_colors(hour)
        g.setColorAt(0, H.mix(bot, "#7fb3d6", 0.5) if not frozen else QColor("#dfeef6"))
        g.setColorAt(1, H.mix(top, "#4d93c2", 0.55) if not frozen else QColor("#d4e6f0"))
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        p.drawRect(far)
        p.setPen(QPen(QColor(255, 255, 255, 80), 1))
        for k in range(6):
            y = far.top() + 4 + k * 4
            p.drawLine(QPointF(far.left() + 40 + k * 90, y), QPointF(far.left() + 90 + k * 90, y))
    elif key == "mountain":
        far = H.mix("#b7c6dc", "#29324f", 0.8 if dark else 0.0).name()
        mid = H.mix("#8fa6c2", "#222a44", 0.8 if dark else 0.0).name()
        _ridge(p, yb - 10, 110, 160, 0.8, far, peaks=[(H.OX + 900, 220, 150), (H.OX + 600, 160, 118)])
        if se == "winter" or True:
            _snowcaps(p, yb - 10, dark)
        _ridge(p, yb - 6, 64, 110, 2.0, mid)
        _tree_row(p, yb - 4, H.OX - 10, H.OX + 560, 18, season_green(se, "#3f7a46"), dark, seed=11, scale=1.1,
                  pine=True)
        # a guard rail along the edge of the lookout
        x0, x1 = 690, H.PW
        p.setPen(pen("#6b4a35", 1.4))
        for x in range(int(x0), int(x1), 40):
            p.drawLine(ipt(x, H.PD_PLACE, 0), ipt(x, H.PD_PLACE, 34))
        p.setPen(pen("#8a5f3e", 3.0))
        p.drawLine(ipt(x0, H.PD_PLACE, 34), ipt(x1, H.PD_PLACE, 34))
        p.drawLine(ipt(x0, H.PD_PLACE, 18), ipt(x1, H.PD_PLACE, 18))
    elif key == "camp":
        _ridge(p, yb - 30, 60, 150, 0.2, H.mix("#9fb0c8", "#1b2440", 0.85 if dark else 0.0).name(),
               peaks=[(H.OX + 200, 180, 90)])
        _tree_row(p, yb - 2, H.OX - 10, H.OX + H.PW + 10, 16, season_green(se, "#2f6a3e"), dark, seed=5, scale=1.6,
                  pine=True)
        if dark:
            # the milky way
            p.setPen(Qt.NoPen)
            rnd = random.Random(1)
            for _ in range(160):
                u = rnd.uniform(0, 1)
                x = H.OX + u * H.PW
                y = 20 + 80 * u + rnd.gauss(0, 12)
                p.setBrush(QColor(255, 255, 255, rnd.randint(40, 140)))
                p.drawEllipse(QPointF(x, y), 0.9, 0.9)
    elif key == "school":
        draw_sky(p, hour, weather, seed=f)
        _school_back(p, hour, dark)
    elif key == "street":
        draw_sky(p, hour, weather, seed=f)
        _street_back(p, hour, dark)
    draw_side_frames(p, key, dark)


def draw_side_frames(p, key, dark):
    """A thin strip at the two ends of the diorama (like the house's side walls)."""
    col = {"school": ("#e9dcc6", "#d7c3a2"), "street": ("#d9d2c6", "#bfb6a7")}.get(key)
    if col is None:
        return
    for x0, x1 in ((-H.SIDE_T, 0.0), (H.PW, H.PW + H.SIDE_T)):
        top = iso(0, H.PD_PLACE + 8, H.WALL_H)[1]
        bot = iso(0, 0, 0)[1]
        r = QRectF(H.OX + x0, top, x1 - x0, bot - top)
        p.setPen(pen(OUT, 1.1, 170))
        p.setBrush(vgrad(r, *col))
        p.drawRect(r)


def _skyline(p, base_y, dark):
    rnd = random.Random(21)
    x = H.OX - 10
    while x < H.OX + H.PW:
        w = rnd.uniform(34, 70)
        h = rnd.uniform(40, 110)
        col = QColor("#b9c4d2") if not dark else QColor("#2c3550")
        col = col.darker(rnd.randint(95, 112))
        r = QRectF(x, base_y - h, w, h)
        p.setPen(Qt.NoPen)
        p.setBrush(col)
        p.drawRect(r)
        p.setBrush(QColor(255, 235, 170, 200) if dark else QColor(255, 255, 255, 90))
        for yy in range(int(r.top()) + 6, int(r.bottom()) - 6, 10):
            for xx in range(int(r.left()) + 5, int(r.right()) - 5, 9):
                if rnd.random() < (0.35 if dark else 0.6):
                    p.drawRect(QRectF(xx, yy, 4, 5))
        x += w + rnd.uniform(4, 20)


def _hedge(p, base_y, se, dark):
    col = QColor(season_green(se, "#5f9f55"))
    if dark:
        col = col.darker(160)
    r = QRectF(H.OX - H.SIDE_T, base_y - 26, H.PW + 2 * H.SIDE_T, 26)
    p.setPen(pen("#3f6e3c", 1.0, 160))
    p.setBrush(vgrad(r, col.lighter(108).name(), col.darker(115).name()))
    p.drawRoundedRect(r, 8, 8)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 255, 255, 30))
    x = r.left() + 10
    while x < r.right():
        p.drawEllipse(QPointF(x, r.top() + 7), 9, 4)
        x += 22


def _snowcaps(p, base_y, dark):
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 255, 255, 200 if not dark else 90))
    for px, pw, ph in ((H.OX + 900, 220, 150), (H.OX + 600, 160, 118)):
        top = base_y - ph
        p.drawPolygon(poly((px, top), (px - pw * 0.22, top + ph * 0.22), (px - pw * 0.1, top + ph * 0.18),
                           (px, top + ph * 0.26), (px + pw * 0.12, top + ph * 0.17), (px + pw * 0.22, top + ph * 0.22)))


def _windows_grid(p, r, cols, rows, lit, dark, col="#bfe0f2", frame="#ffffff"):
    gw = r.width() / cols
    gh = r.height() / rows
    rnd = random.Random(int(r.left() + r.top()))
    for i in range(cols):
        for j in range(rows):
            wr = QRectF(r.left() + i * gw + gw * 0.18, r.top() + j * gh + gh * 0.2, gw * 0.64, gh * 0.58)
            if dark:
                c = QColor("#ffd88a") if (lit and rnd.random() < 0.7) else QColor("#2b3358")
            else:
                c = QColor(col)
            p.setPen(QPen(QColor(frame), 1.6))
            p.setBrush(vgrad(wr, c.lighter(108).name(), c.darker(106).name()))
            p.drawRect(wr)


def _school_back(p, hour, dark):
    # classroom: its back wall, green blackboard is an item; windows high on the wall
    x0, x1 = 0, 700
    r = _backband(x0, x1, H.WALL_H)
    col = QColor(H.WALLPAPER["class"])
    p.setPen(Qt.NoPen)
    p.setBrush(vgrad(r, col.darker(105).name(), col.lighter(103).name()))
    p.drawRect(r)
    wain = srect(x0, x1, H.PD_PLACE, 0, 46)
    p.setBrush(vgrad(wain, "#c9d7b9", "#b4c6a2"))
    p.drawRect(wain)
    p.setPen(QPen(QColor(255, 255, 255, 140), 1))
    p.drawLine(QPointF(wain.left(), wain.top()), QPointF(wain.right(), wain.top()))
    # a clock, a banner with characters, and children's drawings
    cx, cy = iso(560, H.PD_PLACE, 116)
    p.setPen(pen("#6b4a35", 1.4))
    p.setBrush(QColor("#fffdf6"))
    p.drawEllipse(QPointF(cx, cy), 13, 13)
    h = H.now_hour()
    for ang, ln in ((h / 12 * 360, 7), ((h % 1) * 360, 10)):
        a = math.radians(ang - 90)
        p.drawLine(QPointF(cx, cy), QPointF(cx + math.cos(a) * ln, cy + math.sin(a) * ln))
    br = srect(170, 520, H.PD_PLACE, 124, 138)
    p.setPen(pen("#b23a2e", 1.0))
    p.setBrush(QColor("#e05a48"))
    p.drawRect(br)
    p.setPen(QColor("#fff2c4"))
    p.setFont(QFont("sans", 8, QFont.Bold))
    p.drawText(br, Qt.AlignCenter, "好好学习　天天向上")
    rnd = random.Random(5)
    for i, x in enumerate((40, 92, 610, 650)):
        pr = srect(x, x + 36, H.PD_PLACE, 66, 96)
        p.setPen(pen("#9a8a76", 0.8))
        p.setBrush(QColor("#fffdf4"))
        p.drawRect(pr)
        p.setPen(QPen(QColor(rnd.choice(("#e46f5b", "#5e9bd6", "#7bbf6a", "#f2c94c"))), 2))
        c = pr.center()
        p.drawEllipse(c, 7, 6)
        p.drawLine(QPointF(c.x() - 10, pr.bottom() - 4), QPointF(c.x() + 10, pr.bottom() - 4))
    cap = H.frect(-H.SIDE_T, H.PD_PLACE, x1, H.PD_PLACE + 8, H.WALL_H)
    H.fill_rect(p, cap, QColor("#ead2b0"), OUT, 1.2)
    # the school building behind the playground
    yb = iso(0, H.PD_PLACE, 0)[1]
    bx0, bx1 = H.OX + 700, H.OX + H.PW + H.SIDE_T
    bld = QRectF(bx0 + 20, yb - 150, bx1 - bx0 - 30, 150)
    p.setPen(pen("#9a7b5c", 1.2))
    p.setBrush(vgrad(bld, "#f3e3c8", "#e6cfac"))
    p.drawRect(bld)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#c9604a"))
    p.drawRect(QRectF(bld.left() - 6, bld.top() - 8, bld.width() + 12, 10))
    _windows_grid(p, QRectF(bld.left() + 8, bld.top() + 10, bld.width() - 16, bld.height() - 34), 7, 3, True, dark)
    # clock tower
    tw = QRectF(bld.center().x() - 26, bld.top() - 52, 52, 52)
    p.setPen(pen("#9a7b5c", 1.2))
    p.setBrush(vgrad(tw, "#f6e8cf", "#e9d4b2"))
    p.drawRect(tw)
    p.setBrush(QColor("#c9604a"))
    p.drawPolygon(poly((tw.left() - 6, tw.top()), (tw.right() + 6, tw.top()), (tw.center().x(), tw.top() - 22)))
    p.setBrush(QColor("#fffdf6"))
    p.drawEllipse(tw.center(), 14, 14)
    p.setPen(pen("#6b4a35", 1.2))
    for ang, ln in ((h / 12 * 360, 7), ((h % 1) * 360, 10)):
        a = math.radians(ang - 90)
        p.drawLine(tw.center(), QPointF(tw.center().x() + math.cos(a) * ln, tw.center().y() + math.sin(a) * ln))
    door = QRectF(bld.center().x() - 18, bld.bottom() - 24, 36, 24)
    p.setBrush(QColor("#8d5a3a"))
    p.drawRect(door)
    sign = QRectF(bld.center().x() - 50, bld.bottom() - 40, 100, 13)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#fffaf0"))
    p.drawRoundedRect(sign, 3, 3)
    p.setPen(QColor("#b23a2e"))
    p.setFont(QFont("sans", 7, QFont.Bold))
    p.drawText(sign, Qt.AlignCenter, "阳光小学")


def _street_back(p, hour, dark):
    shops = (("market", 0, 500, "超市", "#3b8bd0", "#ffffff"), ("pet", 500, 860, "宠物店", "#f29a3e", "#ffffff"),
             ("cafe", 860, 1260, "咖啡馆", "#6b4a35", "#ffe9c4"))
    for key, x0, x1, name, sign_c, text_c in shops:
        r = _backband(x0, x1, H.WALL_H)
        col = QColor(H.WALLPAPER[key])
        p.setPen(Qt.NoPen)
        p.setBrush(vgrad(r, col.darker(104).name(), col.lighter(103).name()))
        p.drawRect(r)
        if key == "cafe":
            # brick wall and a chalk menu
            p.setPen(QPen(QColor(150, 90, 60, 50), 1))
            z = 8
            row = 0
            while z < H.WALL_H:
                p.drawLine(ipt(x0, H.PD_PLACE, z), ipt(x1, H.PD_PLACE, z))
                xx = x0 + (0 if row % 2 else 14)
                while xx < x1:
                    p.drawLine(ipt(xx, H.PD_PLACE, z - 8), ipt(xx, H.PD_PLACE, z))
                    xx += 28
                z += 8
                row += 1
            menu = srect(900, 990, H.PD_PLACE, 64, 112)
            p.setPen(pen("#6b4a35", 1.4))
            p.setBrush(QColor("#2f3a33"))
            p.drawRect(menu)
            p.setPen(QColor("#f2efe6"))
            p.setFont(QFont("sans", 6))
            p.drawText(menu.adjusted(4, 2, -2, -2), Qt.AlignLeft | Qt.AlignTop, "MENU\n拿铁  18\n摩卡  20\n蛋糕  22")
        elif key == "pet":
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(242, 154, 62, 40))
            rnd = random.Random(3)
            for _ in range(22):
                sx, sy = iso(rnd.uniform(x0 + 10, x1 - 10), H.PD_PLACE, rnd.uniform(60, 130))
                _paw(p, sx, sy, 4)
        elif key == "market":
            p.setPen(QPen(QColor("#ffffff"), 1))
            for z in (20, 40, 60, 80, 100, 120):
                p.drawLine(ipt(x0, H.PD_PLACE, z), ipt(x1, H.PD_PLACE, z))
        # the shop sign along the top
        sr = srect(x0 + 30, x1 - 30, H.PD_PLACE, H.WALL_H - 20, H.WALL_H - 2)
        p.setPen(pen(QColor(sign_c).darker(130).name(), 1.2))
        p.setBrush(vgrad(sr, QColor(sign_c).lighter(112).name(), sign_c))
        p.drawRoundedRect(sr, 4, 4)
        p.setPen(QColor(text_c))
        p.setFont(QFont("sans", 10, QFont.Bold))
        p.drawText(sr, Qt.AlignCenter, name)
    cap = H.frect(-H.SIDE_T, H.PD_PLACE, H.PW + H.SIDE_T, H.PD_PLACE + 8, H.WALL_H)
    H.fill_rect(p, cap, QColor("#d9d2c6"), OUT, 1.2)
    # upper storeys of the shop building
    yb = iso(0, H.PD_PLACE, H.WALL_H)[1] - 4
    up = QRectF(H.OX - H.SIDE_T, yb - 70, H.PW + 2 * H.SIDE_T, 70)
    p.setPen(pen("#9a8a76", 1.0))
    p.setBrush(vgrad(up, "#ece3d6", "#ddd2c1"))
    p.drawRect(up)
    _windows_grid(p, up.adjusted(10, 6, -10, -4), 14, 2, True, dark)


def _paw(p, x, y, s):
    p.drawEllipse(QPointF(x, y), s, s * 0.85)
    for dx, dy in ((-1.1, -1.2), (-0.4, -1.7), (0.4, -1.7), (1.1, -1.2)):
        p.drawEllipse(QPointF(x + dx * s, y + dy * s), s * 0.35, s * 0.4)


# ---------------------------------------------------------------------------------------------- front edges
def draw_place_front(p, f):
    d = PLACES[f]
    key = d["key"]
    g0, g1 = d["gate"]
    if key in ("park", "school", "camp", "lake", "mountain"):
        style = {"park": "rail", "school": "school", "camp": "logs", "lake": "rail", "mountain": "stones"}[key]
        x0 = 0.0
        for a, b in ((0.0, g0 - 4), (g1 + 4, H.PW)):
            _edge(p, a, b, style)
        if key == "school":
            for x in (g0 - 4, g1 + 4):
                box(p, x - 7, -7, 0, x + 7, 7, 62, "#d9c3a2", top="#ead8bb")
            sign = srect(g0 - 4, g1 + 4, 0, 62, 78)
            p.setPen(pen("#9a7b5c", 1.0))
            p.setBrush(QColor("#fffaf0"))
            p.drawRect(sign)
            p.setPen(QColor("#b23a2e"))
            p.setFont(QFont("sans", 7, QFont.Bold))
            p.drawText(sign, Qt.AlignCenter, "阳光小学")
        elif key in ("park", "lake"):
            for x in (g0 - 4, g1 + 4):
                box(p, x - 5, -5, 0, x + 5, 5, 40, "#6b7f5c", top="#7f9670")
                disc(p, x, 0, 40.5, 5, 4, "#8fa77e")
    elif key == "street":
        # bollards along the kerb
        x = 40.0
        while x < H.PW:
            if not (g0 - 10 < x < g1 + 10):
                cyl(p, x, -6, 0, 4, 22, "#6f7378", "#8a8f95")
            x += 90


def _edge(p, a, b, style):
    if b - a < 4:
        return
    if style in ("rail", "school"):
        h = 26 if style == "rail" else 30
        col = "#6b7f5c" if style == "rail" else "#9aa2ac"
        p.setPen(pen(col, 2.4))
        p.drawLine(ipt(a, 0, h), ipt(b, 0, h))
        p.drawLine(ipt(a, 0, h * 0.45), ipt(b, 0, h * 0.45))
        x = a + 6
        p.setPen(pen(col, 1.4))
        while x < b - 2:
            p.drawLine(ipt(x, 0, 0), ipt(x, 0, h))
            x += 12 if style == "school" else 30
    elif style == "logs":
        x = a
        while x < b:
            cyl(p, x + 6, -3, 0, 5, 12 + 4 * math.sin(x), "#8a5c3d", "#c99a6a")
            x += 12
    elif style == "stones":
        rnd = random.Random(int(a))
        x = a
        while x < b:
            r = rnd.uniform(5, 9)
            sx, sy = iso(x + r, -3, 0)
            p.setPen(pen("#7d766b", 0.9))
            p.setBrush(QColor("#b8b0a3"))
            p.drawEllipse(QPointF(sx, sy - r * 0.5), r, r * 0.65)
            x += r * 1.8


# ---------------------------------------------------------------------------------------------- scenery items
def _pt(sx, sy, u, v=0.0, z=0.0):
    """Screen point at offset (u, v, z) from the screen point (sx, sy) of an item part (rot 0)."""
    return QPointF(sx + u, sy - v * H.KY - z)


def _txt(p, r, text, col, size=7, bold=True):
    p.setPen(QColor(col))
    p.setFont(QFont("sans", size, QFont.Bold if bold else QFont.Normal))
    p.drawText(r, Qt.AlignCenter, text)


# school -----------------------------------------------------------------
def p_school_desk(it):
    frame = "#7d8a96"
    return [B(-26, 2, 0, -24, 4, 27, frame), B(24, 2, 0, 26, 4, 27, frame), B(-26, 16, 0, -24, 18, 27, frame),
            B(24, 16, 0, 26, 18, 27, frame), B(-27, 0, 27, 27, 20, 31, "#d9b48a", "#ead0a8", r=1.5),
            B(-24, 2, 20, 24, 18, 23, "#c9a273"),
            B(-11, -22, 0, -10, -21, 16, frame), B(10, -22, 0, 11, -21, 16, frame),
            B(-11, -8, 0, -10, -7, 16, frame), B(10, -8, 0, 11, -7, 16, frame),
            B(-13, -23, 16, 13, -6, 19, "#5e9bd6", "#7cb2e6", r=1.5), B(-12, -24, 19, 12, -22, 34, "#5e9bd6", r=1.5),
            Fn(_desk_book, 6, 10, 31.5)]


def _desk_book(p, sx, sy, it, t):
    rnd = random.Random(it.id)
    c = rnd.choice(("#e46f5b", "#5e9bd6", "#7bbf6a", "#f2c94c"))
    p.setPen(pen(QColor(c).darker(140).name(), 0.8))
    p.setBrush(QColor(c))
    p.drawPolygon(poly(_pt(sx, sy, -8, -5), _pt(sx, sy, 8, -5), _pt(sx, sy, 8, 5), _pt(sx, sy, -8, 5)))
    p.setPen(pen("#3a3a44", 1.0))
    p.drawLine(_pt(sx, sy, -14, 2), _pt(sx, sy, -6, 6))


def p_blackboard(it):
    return [B(-104, -4, 34, 104, 4, 124, "#9a6c4e", "#b98a62", r=1.5), Fr(-98, 40, 98, 118, "#355e45"),
            B(-92, -9, 36, 92, -4, 39, "#b98a62", "#d4a77a"), Fn(_chalk, 0, -4.5, 79, True)]


LESSONS = ["1 + 2 = 3\n5 - 4 = 1", "春 夏 秋 冬\nspring summer", "小猫 xiǎo māo\n🐱 = cat", "3 × 4 = 12\n6 × 7 = 42",
           "天 地 人\n日 月 星", "ABC\napple ball cat"]


def _chalk(p, sx, sy, it, t):
    k = int(t / 90) % len(LESSONS)
    text = it.state.get("lesson") or LESSONS[k]
    p.setPen(QColor(240, 244, 236, 230))
    p.setFont(QFont("sans", 8, QFont.Bold))
    p.drawText(QRectF(sx - 92, sy - 34, 184, 68), Qt.AlignCenter, text)
    p.setPen(Qt.NoPen)
    for i, c in enumerate(("#ffffff", "#f6d35b", "#f2a0b3")):
        p.setBrush(QColor(c))
        p.drawRoundedRect(QRectF(sx + 60 + i * 9, sy + 37, 7, 2.6), 1, 1)


def p_lectern(it):
    return [B(-20, -12, 0, 20, 12, 40, "#b98a62", "#d4a77a", r=1.5), B(-23, -14, 40, 23, 14, 46, "#9a6c4e", "#c39168"),
            Fr(-14, 8, 14, 32, "#d4a77a"), Fn(_globe, 12, 4, 46)]


def _globe(p, sx, sy, it, t):
    p.setPen(pen("#6b4a35", 1.0))
    p.drawLine(QPointF(sx, sy), QPointF(sx, sy - 6))
    p.setBrush(QColor("#5e9bd6"))
    p.drawEllipse(QPointF(sx, sy - 13), 7, 7)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#7bbf6a"))
    p.drawEllipse(QPointF(sx - 2, sy - 15), 3, 2)
    p.drawEllipse(QPointF(sx + 3, sy - 11), 2, 2.5)


def p_hoop(it):
    return [C(0, 14, 0, 3.2, 138, "#6f7378", "#8a8f95"), B(-3, 4, 120, 3, 14, 124, "#6f7378"),
            B(-26, 0, 112, 26, 4, 150, "#ffffff", "#f2f2f2"), Fr(-10, 118, 10, 132, "#e46f5b", v=-0.2),
            Fr(-8, 120, 8, 130, "#ffffff", v=-0.3), Fn(_hoop_ring, 0, -9, 116)]


def _hoop_ring(p, sx, sy, it, t):
    p.setPen(QPen(QColor("#e8673f"), 2.0))
    p.setBrush(Qt.NoBrush)
    p.drawEllipse(QPointF(sx, sy), 9, 3.6)
    p.setPen(QPen(QColor(255, 255, 255, 200), 0.9))
    for k in range(-3, 4):
        p.drawLine(QPointF(sx + k * 2.6, sy + 2), QPointF(sx + k * 1.6, sy + 13))
    p.drawLine(QPointF(sx - 7, sy + 7), QPointF(sx + 7, sy + 7))


def p_bars(it):
    return [C(-42, 0, 0, 2.6, 76, "#c9604a", "#e07a5f"), C(42, 0, 0, 2.6, 76, "#c9604a", "#e07a5f"),
            C(0, 0, 0, 2.6, 56, "#5e9bd6", "#7cb2e6"),
            B(-42, -1.4, 73, 0, 1.4, 76, "#f2c94c", "#f6d878"), B(0, -1.4, 53, 42, 1.4, 56, "#7bbf6a", "#9ad48a"),
            B(-48, -6, 0, -36, 6, 3, "#8a8276"), B(36, -6, 0, 48, 6, 3, "#8a8276")]


def p_flagpole(it):
    return [B(-12, -12, 0, 12, 12, 6, "#c9c4bb", "#ddd8cf"), C(0, 0, 6, 2.2, 184, "#c9ccd6", "#e6e8ee"),
            Fn(_flag, 0, 0, 186, True)]


def _flag(p, sx, sy, it, t):
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#d9572f"))
    path = QPainterPath(QPointF(sx + 2, sy + 2))
    for k in range(9):
        x = sx + 2 + k * 5
        path.lineTo(QPointF(x, sy + 2 + 2.4 * math.sin(t * 4 + k * 0.7)))
    for k in range(8, -1, -1):
        x = sx + 2 + k * 5
        path.lineTo(QPointF(x, sy + 26 + 2.4 * math.sin(t * 4 + k * 0.7)))
    path.closeSubpath()
    p.drawPath(path)
    p.setBrush(QColor("#f6d35b"))
    p.drawEllipse(QPointF(sx + 10, sy + 9 + 2 * math.sin(t * 4 + 1)), 3, 3)
    p.setBrush(QColor("#e6e8ee"))
    p.drawEllipse(QPointF(sx, sy), 2.6, 2.6)


def p_bike_rack(it):
    return [B(-44, -2, 0, 44, 2, 3, "#8a8f95"), Fn(_bikes, 0, 0, 0)]


def _bikes(p, sx, sy, it, t):
    for i, (dx, col) in enumerate(((-24, "#e46f5b"), (8, "#5e9bd6"), (34, "#7bbf6a"))):
        x = sx + dx
        p.setPen(QPen(QColor("#3a3a44"), 1.6))
        p.setBrush(Qt.NoBrush)
        p.drawEllipse(QPointF(x - 9, sy - 9), 8, 8)
        p.drawEllipse(QPointF(x + 9, sy - 9), 8, 8)
        p.setPen(QPen(QColor(col), 2.2))
        p.drawPolyline(poly((x - 9, sy - 9), (x - 2, sy - 20), (x + 6, sy - 20), (x + 9, sy - 9), (x, sy - 9),
                            (x - 2, sy - 20)))
        p.drawLine(QPointF(x + 6, sy - 20), QPointF(x + 7, sy - 25))
        p.setPen(QPen(QColor("#3a3a44"), 2.2))
        p.drawLine(QPointF(x + 4, sy - 25), QPointF(x + 10, sy - 25))
        p.drawLine(QPointF(x - 5, sy - 22), QPointF(x + 1, sy - 22))


# park --------------------------------------------------------------------
def p_slide(it):
    y = "#f2c94c"
    return [C(-62, -12, 0, 2.4, 64, "#e46f5b"), C(-62, 12, 0, 2.4, 64, "#e46f5b"), C(-34, -12, 0, 2.4, 84, "#e46f5b"),
            C(-34, 12, 0, 2.4, 84, "#e46f5b"), B(-64, -14, 60, -32, 14, 64, y, "#f6d878"),
            Fn(_slide_ladder, -74, 0, 0), Fn(_chute, -32, 0, 0), Fn(_slide_roof, -48, 0, 84)]


def _slide_ladder(p, sx, sy, it, t):
    p.setPen(QPen(QColor("#5e9bd6"), 2.4, Qt.SolidLine, Qt.RoundCap))
    for dv in (-12, 12):
        p.drawLine(_pt(sx, sy, -10, dv, 0), _pt(sx, sy, 10, dv, 62))
    p.setPen(QPen(QColor("#5e9bd6"), 1.8))
    for k in range(1, 7):
        z = k * 9
        u = -10 + 20 * z / 62
        p.drawLine(_pt(sx, sy, u, -12, z), _pt(sx, sy, u, 12, z))


def _chute(p, sx, sy, it, t):
    def P_(u, v, z):
        return _pt(sx, sy, u, v, z)
    pts = [(0, 62), (40, 40), (78, 10), (98, 4)]
    p.setPen(pen("#2f7a9a", 1.2))
    for (u0, z0), (u1, z1) in zip(pts, pts[1:]):
        g = QLinearGradient(P_(u0, 0, z0), P_(u1, 0, z1))
        g.setColorAt(0, QColor("#5fc3e4"))
        g.setColorAt(1, QColor("#3fa7cc"))
        p.setBrush(g)
        p.drawPolygon(poly(P_(u0, -14, z0), P_(u1, -14, z1), P_(u1, 14, z1), P_(u0, 14, z0)))
    p.setPen(QPen(QColor("#2f7a9a"), 3.0, Qt.SolidLine, Qt.RoundCap))
    for v in (-14, 14):
        path = QPainterPath(P_(0, v, 68))
        for u, z in pts[1:]:
            path.lineTo(P_(u, v, z + 6))
        p.setBrush(Qt.NoBrush)
        p.drawPath(path)
    p.setPen(QPen(QColor(255, 255, 255, 120), 2))
    p.drawLine(P_(6, -4, 60), P_(76, -4, 11))


def _slide_roof(p, sx, sy, it, t):
    p.setPen(pen("#b23a2e", 1.2))
    p.setBrush(QColor("#e46f5b"))
    p.drawPolygon(poly((sx - 22, sy), (sx + 22, sy), (sx, sy - 22)))
    p.setBrush(QColor(255, 255, 255, 70))
    p.drawPolygon(poly((sx - 9, sy), (sx, sy), (sx - 3, sy - 14)))


def p_seesaw(it):
    return [B(-7, -7, 0, 7, 7, 13, "#c9604a", "#e07a5f"), Fn(_plank, 0, 0, 14, True)]


def seesaw_tilt(it, t):
    a = it.state.get("tilt_amp", 0.0)
    return a * math.sin(t * 1.7)


def _plank(p, sx, sy, it, t):
    a = seesaw_tilt(it, t)
    dz = 12 * a
    l0, l1 = QPointF(sx - 70, sy + dz), QPointF(sx + 70, sy - dz)
    p.setPen(QPen(QColor("#7a4f30"), 1.2))
    p.setBrush(QColor("#5e9bd6"))
    path = QPainterPath(l0 + QPointF(0, -3))
    path.lineTo(l1 + QPointF(0, -3))
    path.lineTo(l1 + QPointF(0, 3))
    path.lineTo(l0 + QPointF(0, 3))
    path.closeSubpath()
    p.drawPath(path)
    for e in (l0, l1):
        k = 1 if e is l1 else -1
        h = e + QPointF(-k * 8, 0)
        p.setPen(QPen(QColor("#e46f5b"), 2.4))
        p.drawLine(h, h + QPointF(0, -12))
        p.drawLine(h + QPointF(-4, -12), h + QPointF(4, -12))


def p_fountain(it):
    return [C(0, 0, 0, 58, 14, "#c9c4bb", "#ddd8cf"), E(0, 0, 14.3, 52, 50, "#79bde3", None),
            Fn(_fountain_water, 0, 0, 14.4, True), C(0, 0, 14, 7, 26, "#d9d3c8", "#e9e4da"),
            C(0, 0, 38, 20, 5, "#c9c4bb", "#ddd8cf"), Fn(_jets, 0, 0, 44, True)]


def _fountain_water(p, sx, sy, it, t):
    p.setPen(QPen(QColor(255, 255, 255, 120), 1.2))
    p.setBrush(Qt.NoBrush)
    for k in range(3):
        r = ((t * 14 + k * 16) % 48) + 4
        p.drawEllipse(QPointF(sx, sy), r, r * H.KY * 0.95)


def _jets(p, sx, sy, it, t):
    p.setPen(QPen(QColor(200, 236, 255, 210), 2.0))
    for k in range(8):
        a = k * math.pi / 4 + 0.1 * math.sin(t * 3)
        ex, ey = sx + math.cos(a) * 30, sy + math.sin(a) * 30 * H.KY * 0.95 + 30
        path = QPainterPath(QPointF(sx, sy))
        path.quadTo(QPointF((sx + ex) / 2, sy - 26 - 3 * math.sin(t * 6 + k)), QPointF(ex, ey))
        p.drawPath(path)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(230, 248, 255, 200))
    h = 22 + 4 * math.sin(t * 5)
    p.drawEllipse(QPointF(sx, sy - h * 0.5), 3, h * 0.5)


def p_icecream(it):
    return [B(-34, -14, 12, 34, 14, 48, "#fbf3e6", "#ffffff", r=2), Fr(-30, 18, 30, 42, "#f7b8cf"),
            Fn(_cart_bits, 0, -14, 0), C(26, 8, 48, 1.6, 50, "#a8a8b0"), Fn(_parasol, 26, 8, 100)]


def _cart_bits(p, sx, sy, it, t):
    for dx in (-22, 22):
        p.setPen(pen("#3a3a44", 1.2))
        p.setBrush(QColor("#55555f"))
        p.drawEllipse(QPointF(sx + dx, sy - 8), 8, 8)
        p.setBrush(QColor("#c9ccd6"))
        p.drawEllipse(QPointF(sx + dx, sy - 8), 3, 3)
    _txt(p, QRectF(sx - 30, sy - 46, 60, 16), "冰淇淋", "#b23a5e", 7)
    for i, c in enumerate(("#f7b8cf", "#fbe7a6", "#a8dcc9")):
        x = sx - 16 + i * 16
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#e0b070"))
        p.drawPolygon(poly((x - 4, sy - 50), (x + 4, sy - 50), (x, sy - 40)))
        p.setBrush(QColor(c))
        p.drawEllipse(QPointF(x, sy - 52), 5, 4.5)


def _parasol(p, sx, sy, it, t):
    r = 38
    for k in range(8):
        a0 = math.pi + k * math.pi / 8
        a1 = a0 + math.pi / 8
        p.setPen(pen("#9c3a2e", 0.8))
        p.setBrush(QColor("#e46f5b" if k % 2 else "#ffffff"))
        p.drawPolygon(poly((sx, sy - 16), (sx + math.cos(a0) * r, sy - 2 + math.sin(a0 + math.pi) * -2),
                           (sx + math.cos(a1) * r, sy - 2 + math.sin(a1 + math.pi) * -2)))


def p_bin(it):
    return [C(0, 0, 0, 9, 30, "#5f8f5a", "#6fa66a"), E(0, 0, 30.2, 8, 8, "#3a4a3a", None)]


# lake --------------------------------------------------------------------
def p_fish_stool(it):
    return [B(-9, -7, 0, -7, 7, 14, "#6f7378"), B(7, -7, 0, 9, 7, 14, "#6f7378"),
            B(-11, -8, 14, 11, 8, 17, "#4f7f9f", "#6b9ab9"), Fn(H._bucket, 18, -6, 0)]


def p_reeds(it):
    return [Fn(_reeds, 0, 0, 0, True)]


def _reeds(p, sx, sy, it, t):
    rnd = random.Random(it.id)
    for i in range(14):
        x = sx + rnd.uniform(-28, 28)
        y = sy + rnd.uniform(-4, 6)
        h = rnd.uniform(34, 62)
        sw = 3 * math.sin(t * 1.3 + i)
        p.setPen(QPen(QColor(rnd.choice(("#6f9a4a", "#5d8a3c", "#88a85a"))), 1.6))
        path = QPainterPath(QPointF(x, y))
        path.quadTo(QPointF(x + sw * 0.4, y - h * 0.6), QPointF(x + sw, y - h))
        p.drawPath(path)
        if i % 3 == 0:
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#7a4f30"))
            p.drawRoundedRect(QRectF(x + sw - 2, y - h - 2, 4, 11), 2, 2)


def p_willow(it):
    return [C(0, 0, 0, 10, 92, "#7a5a3e", "#6b4e35"), Fn(_willow, 0, 0, 96, True)]


def _willow(p, sx, sy, it, t):
    se = H.season()
    if se == "winter":
        p.setPen(QPen(QColor("#7a5035"), 1.2))
        for k in range(-5, 6):
            x = sx + k * 8
            path = QPainterPath(QPointF(sx, sy))
            path.quadTo(QPointF(x, sy - 20), QPointF(x + k * 2, sy + 40))
            p.drawPath(path)
        return
    hi, lo, ol = H.CANOPY[se]
    if se == "autumn":
        hi, lo, ol = "#e8c35a", "#c99a3a", "#8a6a2a"
    p.setPen(pen(ol, 1.0, 200))
    g = QRadialGradient(QPointF(sx - 10, sy - 26), 60)
    g.setColorAt(0, QColor(hi))
    g.setColorAt(1, QColor(lo))
    p.setBrush(g)
    p.drawEllipse(QPointF(sx, sy - 14), 46, 30)
    p.setPen(QPen(QColor(lo), 1.6))
    for k in range(-9, 10):
        x = sx + k * 5
        sw = 2.5 * math.sin(t * 1.1 + k * 0.6)
        path = QPainterPath(QPointF(x, sy - 6))
        path.quadTo(QPointF(x + sw, sy + 30), QPointF(x + sw * 1.6, sy + 58 - abs(k) * 3))
        p.drawPath(path)
    p.setPen(QPen(QColor(hi), 1.2))
    for k in range(-8, 9, 2):
        x = sx + k * 5 + 2
        sw = 2.5 * math.sin(t * 1.1 + k)
        p.drawLine(QPointF(x, sy), QPointF(x + sw, sy + 44 - abs(k) * 3))


def p_rock(it):
    return [Fn(_boulder, 0, 0, 0)]


def _boulder(p, sx, sy, it, t):
    w = H.CATALOG[it.type]["w"]
    h = H.CATALOG[it.type]["h"]
    rnd = random.Random(it.id)
    pts = []
    for k in range(9):
        a = math.pi + k * math.pi / 8
        r = w / 2 * rnd.uniform(0.85, 1.05)
        pts.append(QPointF(sx + math.cos(a) * r, sy - 4 + math.sin(a) * (h + rnd.uniform(-4, 4))))
    pts.append(QPointF(sx + w / 2, sy + 4))
    pts.append(QPointF(sx - w / 2, sy + 4))
    p.setPen(pen("#6f685d", 1.2))
    g = QLinearGradient(sx, sy - h, sx, sy)
    g.setColorAt(0, QColor("#cbc3b5"))
    g.setColorAt(1, QColor("#9d9587"))
    p.setBrush(g)
    p.drawPolygon(QPolygonF(pts))
    p.setPen(QPen(QColor(255, 255, 255, 70), 2))
    p.drawLine(QPointF(sx - w * 0.25, sy - h * 0.75), QPointF(sx + w * 0.05, sy - h * 0.9))
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(110, 150, 80, 90))
    p.drawEllipse(QPointF(sx - w * 0.2, sy - 2), w * 0.18, 4)


# street ------------------------------------------------------------------
GOODS = ("#e46f5b", "#f2c94c", "#5e9bd6", "#7bbf6a", "#f7b8cf", "#b8a3ea", "#f29a3e", "#ffffff")


def p_shelf(it):
    return [B(-60, -6, 0, 60, 14, 72, "#dfe4ea", "#eef1f4"), Fr(-58, 0, 58, 70, "#f5f7f9"),
            Fn(_goods, 0, -6.4, 0)]


def _goods(p, sx, sy, it, t):
    rnd = random.Random(it.id * 3 + 1)
    for z in (8, 30, 52):
        p.setPen(QPen(QColor("#b9c2cc"), 1.6))
        p.drawLine(QPointF(sx - 56, sy - z), QPointF(sx + 56, sy - z))
        x = sx - 54
        while x < sx + 50:
            w = rnd.uniform(6, 12)
            h = rnd.uniform(10, 18)
            c = QColor(rnd.choice(GOODS))
            p.setPen(pen(c.darker(150).name(), 0.6))
            p.setBrush(c)
            if rnd.random() < 0.3:
                p.drawRoundedRect(QRectF(x, sy - z - h, w * 0.8, h), 2.5, 2.5)
            else:
                p.drawRect(QRectF(x, sy - z - h, w, h))
            x += w + 1.5


def p_drink_fridge(it):
    return [B(-34, -16, 0, 34, 16, 110, "#e9eef2", "#f4f7f9", r=2), Fn(_fridge_glass, 0, -16.4, 0)]


def _fridge_glass(p, sx, sy, it, t):
    r = QRectF(sx - 30, sy - 104, 60, 92)
    p.setPen(pen("#9aa2ac", 1.2))
    p.setBrush(QColor(200, 232, 248, 200))
    p.drawRect(r)
    rnd = random.Random(it.id)
    for z in (20, 44, 68):
        p.setPen(QPen(QColor("#ffffff"), 1.2))
        p.drawLine(QPointF(r.left(), sy - z), QPointF(r.right(), sy - z))
        for k in range(6):
            c = QColor(rnd.choice(GOODS))
            p.setPen(Qt.NoPen)
            p.setBrush(c)
            x = r.left() + 4 + k * 9.5
            p.drawRoundedRect(QRectF(x, sy - z - 15, 6, 15), 2, 2)
    p.setPen(QPen(QColor(255, 255, 255, 160), 3))
    p.drawLine(QPointF(r.left() + 6, r.bottom() - 6), QPointF(r.left() + 18, r.top() + 6))
    _txt(p, QRectF(sx - 30, sy - 112, 60, 9), "COLD", "#3b8bd0", 6)


def p_checkout(it):
    return [B(-44, -16, 0, 44, 16, 42, "#4f7f9f", "#6b9ab9", r=1.5), Fr(-40, 6, 40, 36, "#e7eef3"),
            Tl([(-40, -6), (20, -6)], 42.2, "#2f3a44", 5), Fn(_register, 30, 6, 42)]


def _register(p, sx, sy, it, t):
    p.setPen(pen("#3a3a44", 1.0))
    p.setBrush(QColor("#55555f"))
    p.drawRect(QRectF(sx - 10, sy - 12, 20, 12))
    p.setBrush(QColor("#9fe0b0"))
    p.drawRect(QRectF(sx - 8, sy - 22, 16, 9))
    p.setPen(QColor("#2f5f3f"))
    p.setFont(QFont("sans", 5))
    p.drawText(QRectF(sx - 8, sy - 22, 16, 9), Qt.AlignCenter, "¥%d" % (int(t * 3) % 90 + 10))


def p_cart(it):
    return [Fn(_cart, 0, 0, 0)]


def _cart(p, sx, sy, it, t):
    p.setPen(pen("#6f7378", 1.2))
    p.setBrush(QColor(200, 210, 220, 90))
    body = poly((sx - 18, sy - 40), (sx + 20, sy - 40), (sx + 15, sy - 16), (sx - 14, sy - 16))
    p.drawPolygon(body)
    p.setPen(QPen(QColor("#8a8f95"), 0.8))
    for k in range(1, 6):
        x = sx - 18 + k * 6.4
        p.drawLine(QPointF(x, sy - 40), QPointF(x - 0.8, sy - 16))
    p.setPen(QPen(QColor("#e46f5b"), 2.4))
    p.drawLine(QPointF(sx - 18, sy - 40), QPointF(sx - 26, sy - 48))
    p.setPen(pen("#3a3a44", 1.0))
    p.setBrush(QColor("#3a3a44"))
    for dx in (-12, 12):
        p.drawEllipse(QPointF(sx + dx, sy - 3), 3, 3)
    p.setPen(QPen(QColor("#6f7378"), 1.4))
    p.drawLine(QPointF(sx - 14, sy - 16), QPointF(sx - 12, sy - 4))
    p.drawLine(QPointF(sx + 15, sy - 16), QPointF(sx + 12, sy - 4))


def p_fruit_stand(it):
    return [B(-44, -18, 0, 44, 18, 26, "#c99a6a", "#d9ad80"), Fn(_fruits, 0, 0, 26)]


def _fruits(p, sx, sy, it, t):
    rnd = random.Random(it.id)
    for i, (c, n) in enumerate((("#e8473f", 7), ("#f29a3e", 7), ("#f2d04c", 6), ("#7bbf6a", 6))):
        x0 = sx - 40 + i * 21
        p.setPen(pen("#8a5c3d", 0.8))
        p.setBrush(QColor("#b07a50"))
        p.drawRect(QRectF(x0, sy - 6, 19, 8))
        for k in range(n):
            p.setPen(pen(QColor(c).darker(140).name(), 0.6))
            p.setBrush(QColor(c))
            p.drawEllipse(QPointF(x0 + 3 + (k % 4) * 4.4, sy - 6 - (k // 4) * 3.5 + rnd.uniform(-1, 1)), 3, 2.8)


def p_pet_cages(it):
    return [B(-110, -10, 0, 110, 14, 108, "#e9e2d6", "#f4efe6"), Fn(_cages, 0, -10.4, 0, True)]


def _cages(p, sx, sy, it, t):
    rnd = random.Random(7)
    cols = 4
    for row in range(2):
        for i in range(cols):
            x0 = sx - 104 + i * 52
            z0 = 6 + row * 50
            r = QRectF(x0, sy - z0 - 44, 48, 44)
            p.setPen(pen("#9a8a76", 1.0))
            p.setBrush(QColor("#fff7ea"))
            p.drawRect(r)
            kind = (row * cols + i) % 3
            if (row * cols + i) in (2, 7):
                pass
            else:
                col = rnd.choice(("#f2a65a", "#8a8a94", "#f6f1e6", "#3a3a44", "#c99b6a"))
                _baby(p, r.center().x(), r.bottom() - 4, t + i * 1.7 + row, col, kind == 1)
            p.setPen(QPen(QColor("#b5aa98"), 1.0))
            x = r.left() + 6
            while x < r.right():
                p.drawLine(QPointF(x, r.top()), QPointF(x, r.bottom()))
                x += 6


def _baby(p, x, y, t, col, puppy=False):
    """A kitten (or puppy) in a cage: a little round body and a head that looks about."""
    c = QColor(col)
    p.setPen(pen(c.darker(160).name(), 0.8))
    p.setBrush(c)
    p.drawEllipse(QPointF(x, y - 7), 11, 7)
    look = 2.5 * math.sin(t * 0.9)
    hx, hy = x - 6 + look, y - 17 - abs(math.sin(t * 2.2)) * 1.2
    p.drawEllipse(QPointF(hx, hy), 7, 6.2)
    if puppy:
        p.drawEllipse(QPointF(hx - 6, hy + 1), 2.6, 4.5)
        p.drawEllipse(QPointF(hx + 6, hy + 1), 2.6, 4.5)
    else:
        p.drawPolygon(poly((hx - 6, hy - 3), (hx - 4, hy - 9), (hx - 1, hy - 5)))
        p.drawPolygon(poly((hx + 6, hy - 3), (hx + 4, hy - 9), (hx + 1, hy - 5)))
    tail = QPainterPath(QPointF(x + 10, y - 8))
    sw = 5 * math.sin(t * 3.0)
    tail.quadTo(QPointF(x + 16, y - 12 + sw * 0.3), QPointF(x + 15 + sw * 0.3, y - 18 - sw * 0.3))
    p.setBrush(Qt.NoBrush)
    p.setPen(QPen(c.darker(120), 2.2, Qt.SolidLine, Qt.RoundCap))
    p.drawPath(tail)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#2b211c"))
    p.drawEllipse(QPointF(hx - 2.4, hy - 0.6), 1, 1.2)
    p.drawEllipse(QPointF(hx + 2.4, hy - 0.6), 1, 1.2)
    p.setBrush(QColor("#f08a9a"))
    p.drawEllipse(QPointF(hx, hy + 1.6), 1, 0.8)


def p_pet_shelf(it):
    return [B(-50, -6, 0, 50, 14, 72, "#d9ad80", "#e8c49c"), Fr(-48, 0, 48, 70, "#f3e3cc"), Fn(_pet_goods, 0, -6.4, 0)]


def _pet_goods(p, sx, sy, it, t):
    for z in (8, 30, 52):
        p.setPen(QPen(QColor("#b98a62"), 1.6))
        p.drawLine(QPointF(sx - 46, sy - z), QPointF(sx + 46, sy - z))
    # balls of yarn, a fish toy, cans, a bag of food
    for i, c in enumerate(("#e46f5b", "#5e9bd6", "#f2c94c", "#b8a3ea")):
        p.setPen(pen(QColor(c).darker(140).name(), 0.7))
        p.setBrush(QColor(c))
        p.drawEllipse(QPointF(sx - 36 + i * 22, sy - 14), 6, 6)
    for i in range(6):
        p.setBrush(QColor("#c9ccd6"))
        p.drawRoundedRect(QRectF(sx - 40 + i * 13, sy - 46, 10, 14), 2, 2)
        p.setBrush(QColor("#f29a3e"))
        p.drawRect(QRectF(sx - 40 + i * 13, sy - 42, 10, 5))
    p.setBrush(QColor("#7bbf6a"))
    p.drawRoundedRect(QRectF(sx - 30, sy - 70, 22, 18), 3, 3)
    p.setBrush(QColor("#f7b8cf"))
    p.drawRoundedRect(QRectF(sx + 4, sy - 70, 26, 18), 3, 3)
    _txt(p, QRectF(sx + 4, sy - 70, 26, 18), "猫粮", "#9c3a5e", 5)


def p_grooming(it):
    return [B(-30, -14, 0, -27, 14, 30, "#9aa2ac"), B(27, -14, 0, 30, 14, 30, "#9aa2ac"),
            B(-34, -16, 30, 34, 16, 35, "#5fc3e4", "#9fdcef", r=2), C(24, 6, 35, 1.4, 34, "#9aa2ac"),
            Fn(_dryer, 24, 6, 69)]


def _dryer(p, sx, sy, it, t):
    p.setPen(pen("#6f7378", 1.0))
    p.setBrush(QColor("#f2f2f2"))
    p.drawEllipse(QPointF(sx - 6, sy + 2), 8, 6)


def p_cafe_counter(it):
    return [B(-75, -16, 0, 75, 16, 48, "#8a5c3d", "#b98a62", r=1.5), Fr(-70, 6, 70, 42, "#a8714b"),
            B(-78, -18, 48, 78, 18, 52, "#d9b48a", "#ead0a8"), Fn(_coffee_machine, 40, 6, 52),
            Fn(_cake_case, -40, 0, 52)]


def _coffee_machine(p, sx, sy, it, t):
    p.setPen(pen("#3a3a44", 1.0))
    p.setBrush(QColor("#c9ccd6"))
    p.drawRoundedRect(QRectF(sx - 16, sy - 34, 32, 34), 3, 3)
    p.setBrush(QColor("#55555f"))
    p.drawRect(QRectF(sx - 10, sy - 22, 20, 8))
    p.setBrush(QColor("#ffffff"))
    p.drawRect(QRectF(sx - 5, sy - 10, 10, 9))
    p.setPen(Qt.NoPen)
    for k in range(3):
        ph = (t * 0.8 + k * 0.33) % 1.0
        p.setBrush(QColor(255, 255, 255, int(150 * (1 - ph))))
        p.drawEllipse(QPointF(sx + 3 * math.sin(t * 2 + k), sy - 36 - ph * 18), 3 + ph * 3, 3 + ph * 3)


def _cake_case(p, sx, sy, it, t):
    r = QRectF(sx - 30, sy - 26, 60, 26)
    p.setPen(pen("#9aa2ac", 1.0))
    p.setBrush(QColor(220, 240, 250, 150))
    p.drawRoundedRect(r, 3, 3)
    for i, (c, top) in enumerate((("#f6e3b5", "#f7b8cf"), ("#6b4a35", "#f2efe6"), ("#fbe7a6", "#e8473f"))):
        x = r.left() + 8 + i * 18
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(c))
        p.drawRect(QRectF(x, r.bottom() - 11, 13, 9))
        p.setBrush(QColor(top))
        p.drawRect(QRectF(x, r.bottom() - 13, 13, 3))
        p.drawEllipse(QPointF(x + 6.5, r.bottom() - 15), 2, 2)


def p_cafe_table(it):
    chair = "#6b4a35"
    out = [C(0, 0, 0, 3, 36, "#4f4a46"), C(0, 0, 0, 12, 2, "#4f4a46"), C(0, 0, 36, 22, 3, "#f2efe6", "#ffffff"),
           Fn(_cup_on_table, 0, 0, 39)]
    for sgn in (-1, 1):
        x = 36 * sgn
        out += [B(x - 8, -8, 0, x - 7, -7, 20, chair), B(x + 7, -8, 0, x + 8, -7, 20, chair),
                B(x - 8, 7, 0, x - 7, 8, 20, chair), B(x + 7, 7, 0, x + 8, 8, 20, chair),
                B(x - 10, -10, 20, x + 10, 10, 23, "#c9604a", "#e07a5f", r=1.5),
                B(x + 8 * sgn, -10, 23, x + 10 * sgn, 10, 42, chair) if sgn > 0 else
                B(x - 10, -10, 23, x - 8, 10, 42, chair)]
    return out


def _cup_on_table(p, sx, sy, it, t):
    if not it.state.get("cups"):
        return
    for dx in (-8, 8):
        p.setPen(pen("#9a8a76", 0.8))
        p.setBrush(QColor("#ffffff"))
        p.drawRect(QRectF(sx + dx - 3, sy - 7, 6, 6))
        p.setBrush(QColor("#8a5c3d"))
        p.drawEllipse(QPointF(sx + dx, sy - 7), 3, 1)


def p_vending(it):
    return [B(-24, -14, 0, 24, 14, 108, "#e8473f", "#f06a5c", r=2), Fn(_vending_front, 0, -14.4, 0)]


def _vending_front(p, sx, sy, it, t):
    r = QRectF(sx - 20, sy - 100, 30, 64)
    p.setPen(pen("#9a2e24", 1.0))
    p.setBrush(QColor("#f6f1e6"))
    p.drawRect(r)
    rnd = random.Random(2)
    for row in range(4):
        for k in range(3):
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(rnd.choice(GOODS)))
            p.drawRoundedRect(QRectF(r.left() + 3 + k * 9, r.top() + 4 + row * 15, 6, 11), 2, 2)
    p.setBrush(QColor("#2f2f36"))
    p.drawRect(QRectF(sx - 18, sy - 26, 36, 10))
    p.setBrush(QColor("#9fe0b0"))
    p.drawRect(QRectF(sx + 13, sy - 92, 6, 8))
    p.setBrush(QColor("#f2c94c"))
    for k in range(3):
        p.drawEllipse(QPointF(sx + 16, sy - 76 + k * 8), 2, 2)


def p_mailbox(it):
    return [B(-3, -3, 0, 3, 3, 30, "#2f6a3e"), B(-11, -9, 30, 11, 9, 58, "#3f8a4e", "#4f9a5e", r=3),
            Fr(-7, 48, 7, 51, "#1f3a26"), Fn(_mail_text, 0, -9.5, 38)]


def _mail_text(p, sx, sy, it, t):
    _txt(p, QRectF(sx - 10, sy - 6, 20, 10), "邮政", "#f6f1e6", 5)


def p_street_tree(it):
    return [B(-22, -22, 0, 22, 22, 12, "#b9b1a3", "#cbc3b5"), E(0, 0, 12.2, 18, 18, "#7a5a3e", None),
            C(0, 0, 12, 7, 84, "#7a5a3e", "#6b4e35"), Fn(H._canopy, 0, 0, 96, True)]


# mountain ----------------------------------------------------------------
def p_pine(it):
    return [C(0, 0, 0, 6, 40, "#7a5a3e", "#6b4e35"), Fn(_pine, 0, 0, 34, True)]


def _pine(p, sx, sy, it, t):
    se = H.season()
    sw = 1.2 * math.sin(t * 0.8 + it.x)
    layers = ((38, 40), (31, 38), (24, 36), (16, 32))
    y = sy
    rnd = random.Random(it.id)
    dark = QColor("#2f6a3e").darker(rnd.randint(95, 112))
    for i, (w, h) in enumerate(layers):
        top = y - h
        p.setPen(pen("#1f4a2a", 1.0, 200))
        g = QLinearGradient(sx - w, top, sx + w, y)
        g.setColorAt(0, dark.lighter(125))
        g.setColorAt(1, dark)
        p.setBrush(g)
        p.drawPolygon(poly((sx - w + sw * i * 0.2, y), (sx + w + sw * i * 0.2, y), (sx + sw * (i + 1) * 0.3, top)))
        if se == "winter":
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(255, 255, 255, 230))
            p.drawPolygon(poly((sx - w * 0.5 + sw * i * 0.2, y - h * 0.45), (sx + w * 0.5 + sw * i * 0.2, y - h * 0.45),
                               (sx + sw * (i + 1) * 0.3, top)))
        y = y - h * 0.62


def p_pavilion(it):
    red = "#c9443a"
    out = []
    for u, v in ((-64, -40), (64, -40), (-64, 40), (64, 40)):
        out.append(C(u, v, 0, 4, 112, red, "#d9574c"))
    out += [B(-72, -48, 0, 72, 48, 4, "#c9c4bb", "#ddd8cf"),
            B(-56, 18, 0, -50, 26, 20, "#7a4f30"), B(50, 18, 0, 56, 26, 20, "#7a4f30"),
            B(-58, 16, 20, 58, 30, 24, "#a8714b", "#c08a5c", r=1.5), Fn(_pav_roof, 0, 0, 112)]
    return out


def _pav_roof(p, sx, sy, it, t):
    w, d = 92, 62
    l, r = sx - w, sx + w
    fy = sy + d * H.KY * 0.5
    by = sy - d * H.KY * 0.5
    path = QPainterPath(QPointF(l - 10, fy - 2))
    path.quadTo(QPointF(sx, fy + 6), QPointF(r + 10, fy - 2))
    path.lineTo(QPointF(sx + 30, by - 36))
    path.quadTo(QPointF(sx, by - 30), QPointF(sx - 30, by - 36))
    path.closeSubpath()
    p.setPen(pen("#2f3a44", 1.3))
    g = QLinearGradient(sx, by - 36, sx, fy)
    g.setColorAt(0, QColor("#4f6b7a"))
    g.setColorAt(1, QColor("#2f4a5a"))
    p.setBrush(g)
    p.drawPath(path)
    p.setPen(QPen(QColor(255, 255, 255, 50), 1))
    for k in range(-6, 7):
        p.drawLine(QPointF(sx + k * 14, fy + 2 - abs(k) * 0.3), QPointF(sx + k * 4.5, by - 32))
    p.setPen(pen("#b23a2e", 1.0))
    p.setBrush(QColor("#d9a03a"))
    p.drawEllipse(QPointF(sx, by - 40), 4, 5)
    # under the eaves, a little name board
    br = QRectF(sx - 22, fy + 2, 44, 11)
    p.setPen(pen("#6b4a35", 0.8))
    p.setBrush(QColor("#3a2a22"))
    p.drawRect(br)
    _txt(p, br, "望云亭", "#f2d06b", 6)


def p_telescope(it):
    return [B(-10, -10, 0, 10, 10, 4, "#8a8f95"), C(0, 0, 4, 2.6, 46, "#6f7378", "#8a8f95"), Fn(_scope, 0, 0, 52)]


def _scope(p, sx, sy, it, t):
    p.setPen(pen("#2f3a44", 1.0))
    p.setBrush(QColor("#3b8bd0"))
    p.drawRoundedRect(QRectF(sx - 14, sy - 10, 28, 12), 4, 4)
    p.setBrush(QColor("#2f3a44"))
    p.drawEllipse(QPointF(sx - 8, sy - 4), 3, 3)
    p.drawEllipse(QPointF(sx + 8, sy - 4), 3, 3)


def p_summit(it):
    return [B(-30, -10, 0, 30, 10, 6, "#9d9587", "#b9b1a3"), B(-22, -6, 6, 22, 6, 66, "#b9b1a3", "#cbc3b5", r=3),
            Fn(_summit_text, 0, -6.4, 36)]


def _summit_text(p, sx, sy, it, t):
    _txt(p, QRectF(sx - 20, sy - 26, 40, 18), "山顶", "#b23a2e", 10)
    _txt(p, QRectF(sx - 22, sy - 6, 44, 12), "海拔1024米", "#5a4a40", 5, False)


def p_signpost(it):
    return [C(0, 0, 0, 3, 88, "#8a5c3d", "#a8714b"), Fn(_sign_boards, 0, 0, 80)]


def _sign_boards(p, sx, sy, it, t):
    for i, (txt, d) in enumerate((("山顶 →", 1), ("← 营地", -1), ("湖边 →", 1))):
        y = sy + i * 13
        x0 = sx + (2 if d > 0 else -38)
        pts = [(x0, y - 5), (x0 + 30, y - 5), (x0 + 36, y), (x0 + 30, y + 5), (x0, y + 5)] if d > 0 else \
            [(x0 + 6, y - 5), (x0 + 36, y - 5), (x0 + 36, y + 5), (x0 + 6, y + 5), (x0, y)]
        p.setPen(pen("#6b4a35", 0.8))
        p.setBrush(QColor("#d9b48a"))
        p.drawPolygon(poly(*pts))
        _txt(p, QRectF(x0 + 2, y - 5, 32, 10), txt, "#5a3a2a", 5)


# camp --------------------------------------------------------------------
def p_tent(it):
    return [Fn(_tent, 0, 0, 0, True)]


def _tent(p, sx, sy, it, t):
    w, d, h = 80, 50, 84
    col = QColor(it.state.get("color", "#f29a3e"))
    back = _pt(sx, sy, 0, d * 0.6, 0)
    l, r = _pt(sx, sy, -w, -d * 0.3, 0), _pt(sx, sy, w, -d * 0.3, 0)
    bl, br_ = _pt(sx, sy, -w * 0.8, d, 0), _pt(sx, sy, w * 0.8, d, 0)
    top = _pt(sx, sy, 0, d * 0.25, h)
    p.setPen(pen(col.darker(160).name(), 1.2))
    p.setBrush(col.darker(115))
    p.drawPolygon(poly(bl, br_, top))
    g = QLinearGradient(l, r)
    g.setColorAt(0, col.lighter(108))
    g.setColorAt(1, col.darker(108))
    p.setBrush(g)
    p.drawPolygon(poly(l, top, bl))
    p.drawPolygon(poly(r, top, br_))
    front = poly(l, r, top)
    p.drawPolygon(front)
    # the door
    closed = bool(it.state.get("closed"))
    d0, d1 = _pt(sx, sy, -26, -d * 0.3, 0), _pt(sx, sy, 26, -d * 0.3, 0)
    dt_ = _pt(sx, sy, 0, -d * 0.3, h * 0.62)
    if closed:
        p.setBrush(col.darker(130))
        p.drawPolygon(poly(d0, d1, dt_))
        p.setPen(QPen(col.darker(170), 1.2))
        p.drawLine(dt_, QPointF((d0.x() + d1.x()) / 2, d0.y()))
        if it.state.get("glow"):
            p.setPen(Qt.NoPen)
            gl = QRadialGradient(QPointF(dt_.x(), d0.y() - 14), 34)
            gl.setColorAt(0, QColor(255, 220, 140, 120))
            gl.setColorAt(1, QColor(255, 220, 140, 0))
            p.setBrush(gl)
            p.drawEllipse(QPointF(dt_.x(), d0.y() - 14), 34, 26)
        if it.state.get("zz"):
            p.setPen(QColor(255, 255, 255, 200))
            p.setFont(QFont("sans", 8, QFont.Bold))
            k = (t * 0.6) % 1.0
            p.drawText(QPointF(top.x() + 8 + k * 10, top.y() - 4 - k * 18), "z")
            p.drawText(QPointF(top.x() + 18 + k * 8, top.y() - 14 - k * 18), "Z")
    else:
        p.setBrush(QColor("#3a2a22"))
        p.drawPolygon(poly(d0, d1, dt_))
        p.setBrush(col.lighter(110))
        p.drawPolygon(poly(d0, dt_, _pt(sx, sy, -40, -d * 0.3 - 6, 6)))
        p.drawPolygon(poly(d1, dt_, _pt(sx, sy, 40, -d * 0.3 - 6, 6)))
    # guy ropes and pegs
    p.setPen(QPen(QColor(255, 255, 255, 170), 0.9))
    for a, b in ((top, _pt(sx, sy, -w - 20, -d * 0.6, 0)), (top, _pt(sx, sy, w + 20, -d * 0.6, 0))):
        p.drawLine(a, b)


def p_campfire(it):
    return [Fn(_fire_ring, 0, 0, 0), Fn(_flames, 0, 0, 4, True)]


def _fire_ring(p, sx, sy, it, t):
    rnd = random.Random(1)
    for k in range(12):
        a = k * math.tau / 12
        x, y = sx + math.cos(a) * 30, sy + math.sin(a) * 30 * H.KY
        p.setPen(pen("#6f685d", 0.9))
        p.setBrush(QColor("#a8a093").darker(rnd.randint(95, 115)))
        p.drawEllipse(QPointF(x, y - 3), 8, 5.5)
    p.setPen(pen("#5a3a22", 1.0))
    p.setBrush(QColor("#7a4f30"))
    for a in (0.3, 1.9, 3.5):
        x, y = math.cos(a) * 20, math.sin(a) * 9
        p.save()
        p.translate(sx, sy - 6)
        p.rotate(math.degrees(math.atan2(y, x)))
        p.drawRoundedRect(QRectF(-20, -3, 40, 6), 3, 3)
        p.restore()


def _flames(p, sx, sy, it, t):
    if not it.state.get("on"):
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(80, 80, 80, 90))
        for k in range(2):
            ph = (t * 0.3 + k * 0.5) % 1.0
            p.drawEllipse(QPointF(sx + 4 * math.sin(t + k), sy - 6 - ph * 30), 4 + ph * 6, 3 + ph * 4)
        return
    for k, (col, s) in enumerate((("#e8473f", 1.0), ("#f29a3e", 0.75), ("#f6d35b", 0.5))):
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(col))
        path = QPainterPath(QPointF(sx - 16 * s, sy - 4))
        for j in range(5):
            x = sx - 16 * s + j * 8 * s
            hgt = (30 + 8 * math.sin(t * 9 + j * 1.7 + k)) * s
            path.quadTo(QPointF(x + 2 * s, sy - hgt * 0.6), QPointF(x + 4 * s, sy - hgt))
            path.quadTo(QPointF(x + 6 * s, sy - hgt * 0.5), QPointF(x + 8 * s, sy - 6))
        path.closeSubpath()
        p.drawPath(path)
    for k in range(5):
        ph = (t * 0.7 + k * 0.21) % 1.0
        p.setBrush(QColor(255, 200, 90, int(220 * (1 - ph))))
        p.drawEllipse(QPointF(sx + 10 * math.sin(t * 2 + k * 2), sy - 30 - ph * 40), 1.4, 1.4)


def p_log_seat(it):
    return [B(-38, -9, 0, 38, 9, 16, "#8a5c3d", "#a8714b", r=6), Fn(_log_ends, 0, 0, 8)]


def _log_ends(p, sx, sy, it, t):
    for dx in (-38, 38):
        p.setPen(pen("#6b4a35", 0.8))
        p.setBrush(QColor("#d9b48a"))
        p.drawEllipse(QPointF(sx + dx, sy), 4.5, 8)
        p.setBrush(Qt.NoBrush)
        p.drawEllipse(QPointF(sx + dx, sy), 2.2, 4)


def p_camp_chair(it):
    c = "#3b8bd0"
    return [B(-12, -12, 0, -11, -11, 18, "#55555f"), B(11, -12, 0, 12, -11, 18, "#55555f"),
            B(-12, 11, 0, -11, 12, 18, "#55555f"), B(11, 11, 0, 12, 12, 18, "#55555f"),
            B(-13, -13, 16, 13, 13, 19, c, "#5e9bd6"), B(-13, 10, 19, 13, 13, 42, c),
            B(-15, -10, 26, -13, 10, 28, "#55555f"), B(13, -10, 26, 15, 10, 28, "#55555f")]


def p_camp_table(it):
    w = "#a8714b"
    return [B(-40, -8, 0, -36, 8, 32, "#7a4f30"), B(36, -8, 0, 40, 8, 32, "#7a4f30"),
            B(-46, -14, 32, 46, 14, 36, w, "#c08a5c", r=1.5),
            B(-44, -30, 0, -42, -24, 16, "#7a4f30"), B(42, -30, 0, 44, -24, 16, "#7a4f30"),
            B(-46, -32, 16, 46, -22, 19, w, "#c08a5c", r=1.5),
            B(-44, 24, 0, -42, 30, 16, "#7a4f30"), B(42, 24, 0, 44, 30, 16, "#7a4f30"),
            B(-46, 22, 16, 46, 32, 19, w, "#c08a5c", r=1.5), Fn(_table_things, 0, 0, 36)]


def _table_things(p, sx, sy, it, t):
    p.setPen(pen("#2f3a44", 0.8))
    p.setBrush(QColor("#e8473f"))
    p.drawRoundedRect(QRectF(sx - 30, sy - 10, 14, 10), 2, 2)
    p.setBrush(QColor("#f6f1e6"))
    p.drawRect(QRectF(sx + 8, sy - 7, 8, 7))
    p.drawRect(QRectF(sx + 20, sy - 7, 8, 7))


def p_lantern_pole(it):
    return [C(0, 0, 0, 2.2, 104, "#6b4a35", "#8a5c3d"), B(-1, -1, 100, 20, 1, 103, "#6b4a35"),
            Fn(_lantern_hang, 18, 0, 100, True)]


def _lantern_hang(p, sx, sy, it, t):
    on = bool(it.state.get("on"))
    p.setPen(pen("#3a2a22", 1.0))
    p.drawLine(QPointF(sx, sy), QPointF(sx, sy + 8))
    r = QRectF(sx - 6, sy + 8, 12, 15)
    p.setBrush(QColor("#ffd27a") if on else QColor("#d9d2c4"))
    p.drawRoundedRect(r, 3, 3)
    if on:
        p.setPen(Qt.NoPen)
        g = QRadialGradient(r.center(), 26)
        g.setColorAt(0, QColor(255, 220, 140, 150))
        g.setColorAt(1, QColor(255, 220, 140, 0))
        p.setBrush(g)
        p.drawEllipse(r.center(), 26, 26)


def p_cooler(it):
    return [B(-20, -12, 0, 20, 12, 24, "#3b8bd0", "#5e9bd6", r=2), B(-21, -13, 24, 21, 13, 29, "#f2f2f2", "#ffffff", r=2)]


def p_firewood(it):
    return [Fn(_woodpile, 0, 0, 0)]


def _woodpile(p, sx, sy, it, t):
    for row in range(3):
        for k in range(4 - row):
            x = sx - 18 + k * 12 + row * 6
            y = sy - 6 - row * 9
            p.setPen(pen("#6b4a35", 0.8))
            p.setBrush(QColor("#a8714b"))
            p.drawEllipse(QPointF(x, y), 6, 5)
            p.setBrush(QColor("#e2c08f"))
            p.drawEllipse(QPointF(x, y), 3.6, 3)


def p_hammock(it):
    return [B(-70, -4, 0, -64, 4, 70, "#8a5c3d", "#a8714b"), B(64, -4, 0, 70, 4, 70, "#8a5c3d", "#a8714b"),
            Fn(_hammock_net, 0, 0, 30, True)]


def _hammock_net(p, sx, sy, it, t):
    sw = 3 * math.sin(t * 1.2) * (1.0 if it.state.get("busy") else 0.3)
    a, b = QPointF(sx - 64, sy - 36), QPointF(sx + 64, sy - 36)
    path = QPainterPath(a)
    path.quadTo(QPointF(sx + sw, sy + 22), b)
    path.quadTo(QPointF(sx + sw, sy + 8), a)
    p.setPen(pen("#9c3a2e", 1.0))
    p.setBrush(QColor("#f2a65a"))
    p.drawPath(path)
    p.setPen(QPen(QColor(255, 255, 255, 120), 1))
    for k in range(-4, 5):
        p.drawLine(QPointF(sx + k * 12, sy + 6 - (16 - abs(k) * 4) * 0.4), QPointF(sx + k * 11 + sw, sy + 14 - abs(k) * 2))


PLACE_CATALOG = {
    # school
    "school_desk": dict(name="课桌", w=56, d=48, h=34, parts=p_school_desk,
                        spots=[S("work", 0, -12, 17, "person", face=(0, 1), kid=True), S("perch", 12, 10, 31)]),
    "blackboard": dict(name="黑板", w=210, d=12, h=124, parts=p_blackboard,
                       spots=[S("teach", 0, -42, 0, "person", face=(0, 1))]),
    "lectern": dict(name="讲台", w=48, d=30, h=50, parts=p_lectern,
                    spots=[S("teach", 0, 30, 0, "person", face=(0, -1)), S("perch", -10, 0, 46)]),
    "hoop": dict(name="篮球架", w=56, d=30, h=150, parts=p_hoop, block=(12, 12),
                 spots=[S("hoop", 0, -66, 0, "person", face=(0, 1))]),
    "bars": dict(name="单杠", w=96, d=14, h=76, parts=p_bars, block=(96, 8),
                 spots=[S("bars", -20, -12, 0, "person", face=(0, -1), kid=True), S("perch", 20, 0, 56)]),
    "flagpole": dict(name="旗杆", w=26, d=26, h=190, parts=p_flagpole, spots=[S("scratch", 0, -18, 0, face=(0, 1))]),
    "bike_rack": dict(name="自行车", w=96, d=20, h=30, parts=p_bike_rack, spots=[]),
    # park
    "slide": dict(name="滑梯", w=150, d=36, h=106, parts=p_slide, block=(150, 30),
                  spots=[S("slide", -92, 0, 0, "person", face=(1, 0), kid=True), S("hide", -48, -26, 0)]),
    "seesaw": dict(name="跷跷板", w=150, d=16, h=30, parts=p_seesaw, block=(150, 12),
                   spots=[S("seesaw", -60, -14, 0, "person", face=(1, 0)), S("seesaw", 60, -14, 0, "person", face=(-1, 0))]),
    "fountain": dict(name="喷泉", w=120, d=112, h=60, parts=p_fountain, block=(118, 108),
                     spots=[S("watch_pond", 0, -66, 0, face=(0, 1)), S("sit", -30, -50, 14, "person", face=(0, -1)),
                            S("sit", 34, -50, 14, "person", face=(0, -1))]),
    "icecream": dict(name="冰淇淋车", w=80, d=34, h=100, parts=p_icecream, block=(76, 30),
                     spots=[S("buy", 0, -40, 0, "person", face=(0, 1)), S("vendor", 0, 34, 0, "person", face=(0, -1)),
                            S("beg", 30, -36, 0)]),
    "bin": dict(name="垃圾桶", w=20, d=20, h=30, parts=p_bin, spots=[]),
    # lake
    "fish_stool": dict(name="钓鱼凳", w=30, d=20, h=17, parts=p_fish_stool,
                       spots=[S("fish", 0, 0, 16, "person", face=(1, 0)), S("watch_pond", -24, -6, 0, face=(0, 1))]),
    "reeds": dict(name="芦苇", w=64, d=20, h=60, parts=p_reeds, block=(56, 14), spots=[S("hide", 0, -16, 0)]),
    "willow": dict(name="柳树", w=100, d=100, h=170, parts=p_willow, block=(26, 26), sig=lambda it: H.season(),
                   spots=[S("scratch", 0, -20, 0, face=(0, 1))]),
    "rock": dict(name="石头", w=60, d=40, h=30, parts=p_rock, spots=[S("perch", 0, 0, 30),
                                                                    S("sit", 0, -6, 24, "person", face=(0, -1))]),
    "big_rock": dict(name="大石头", w=96, d=60, h=50, parts=p_rock, spots=[S("perch", 10, 4, 50), S("sleep", -16, 6, 48)]),
    # street
    "shelf": dict(name="货架", w=120, d=20, h=72, parts=p_shelf,
                  spots=[S("shop", -20, -30, 0, "person", face=(0, 1)), S("shop", 30, -30, 0, "person", face=(0, 1)),
                         S("perch", 30, 4, 72)]),
    "drink_fridge": dict(name="饮料柜", w=68, d=32, h=110, parts=p_drink_fridge,
                         spots=[S("shop", 0, -38, 0, "person", face=(0, 1))]),
    "checkout": dict(name="收银台", w=88, d=32, h=42, parts=p_checkout,
                     spots=[S("cashier", -10, 32, 0, "person", face=(0, -1)), S("pay", 0, -36, 0, "person", face=(0, 1))]),
    "cart": dict(name="购物车", w=44, d=40, h=44, parts=p_cart, spots=[S("hide", 0, 0, 18)]),
    "fruit_stand": dict(name="水果架", w=88, d=36, h=36, parts=p_fruit_stand,
                        spots=[S("shop", 0, -36, 0, "person", face=(0, 1))]),
    "pet_cages": dict(name="小猫小狗", w=220, d=24, h=108, parts=p_pet_cages,
                      spots=[S("look", -50, -34, 0, "person", face=(0, 1)), S("look", 50, -34, 0, "person", face=(0, 1)),
                             S("watch_tank", 0, -40, 0, face=(0, 1))]),
    "pet_shelf": dict(name="宠物用品架", w=100, d=20, h=72, parts=p_pet_shelf,
                      spots=[S("shop", 0, -30, 0, "person", face=(0, 1))]),
    "grooming": dict(name="美容台", w=68, d=32, h=36, parts=p_grooming,
                     spots=[S("groom", 0, 30, 0, "person", face=(0, -1)), S("perch", -6, 0, 35)]),
    "pet_counter": dict(name="宠物店柜台", w=88, d=32, h=42, parts=p_checkout,
                        spots=[S("cashier", -10, 32, 0, "person", face=(0, -1)), S("pay", 0, -36, 0, "person", face=(0, 1)),
                               S("perch", 20, 0, 42)]),
    "cafe_counter": dict(name="咖啡吧台", w=156, d=36, h=52, parts=p_cafe_counter,
                         spots=[S("barista", 20, 36, 0, "person", face=(0, -1)),
                                S("order", -10, -40, 0, "person", face=(0, 1)), S("beg", 50, -38, 0)]),
    "cafe_table": dict(name="咖啡桌", w=96, d=24, h=42, parts=p_cafe_table,
                       spots=[S("cafe", -36, 0, 21, "person", face=(1, 0)), S("cafe", 36, 0, 21, "person", face=(-1, 0)),
                              S("perch", 0, 0, 39)]),
    "vending": dict(name="自动售货机", w=48, d=28, h=108, parts=p_vending,
                    spots=[S("buy", 0, -34, 0, "person", face=(0, 1))]),
    "mailbox": dict(name="邮筒", w=22, d=18, h=58, parts=p_mailbox, spots=[]),
    "street_tree": dict(name="行道树", w=60, d=60, h=170, parts=p_street_tree, block=(44, 44), sig=lambda it: H.season(),
                        spots=[S("scratch", 0, -30, 0, face=(0, 1))]),
    # mountain
    "pine": dict(name="松树", w=70, d=70, h=170, parts=p_pine, block=(20, 20), sig=lambda it: H.season(),
                 spots=[S("scratch", 0, -14, 0, face=(0, 1))]),
    "pavilion": dict(name="凉亭", w=150, d=100, h=150, parts=p_pavilion, walk=True,
                     spots=[S("sit", -26, 18, 24, "person", face=(0, -1)), S("sit", 26, 18, 24, "person", face=(0, -1)),
                            S("perch", 46, 22, 24), S("sleep", -48, 22, 24)]),
    "telescope": dict(name="望远镜", w=24, d=24, h=64, parts=p_telescope,
                      spots=[S("view", 0, -22, 0, "person", face=(0, 1))]),
    "summit": dict(name="山顶石碑", w=64, d=22, h=66, parts=p_summit,
                   spots=[S("photo", 0, -48, 0, "person", face=(0, -1)), S("perch", 0, 0, 66)]),
    "signpost": dict(name="路标", w=20, d=20, h=90, parts=p_signpost, spots=[]),
    # camp
    "tent": dict(name="帐篷", w=170, d=100, h=86, parts=p_tent, block=(150, 70),
                 sig=lambda it: (bool(it.state.get("closed")), it.state.get("color")),
                 spots=[S("tent", -30, -60, 0, "person", face=(0, 1)), S("tent", 0, -62, 0, "person", face=(0, 1)),
                        S("tent", 30, -60, 0, "person", face=(0, 1)), S("tent_cat", 54, -58, 0, face=(0, 1))]),
    "campfire": dict(name="篝火", w=74, d=40, h=20, parts=p_campfire, block=(66, 36), spots=[S("watch_pond", 0, -36, 0)]),
    "log_seat": dict(name="木头凳", w=80, d=18, h=16, parts=p_log_seat,
                     spots=[S("sit", -20, -2, 16, "person", face=(0, -1)), S("sit", 20, -2, 16, "person", face=(0, -1)),
                            S("perch", 0, 0, 16)]),
    "camp_chair": dict(name="折叠椅", w=30, d=30, h=42, parts=p_camp_chair,
                       spots=[S("sit", 0, -2, 18, "person", face=(0, -1)), S("perch", 0, 0, 19)]),
    "camp_table": dict(name="野餐桌", w=96, d=64, h=36, parts=p_camp_table,
                       spots=[S("eat", -22, -27, 17, "person", face=(0, 1)), S("eat", 22, -27, 17, "person", face=(0, 1)),
                              S("perch", 30, 0, 36)]),
    "lantern_pole": dict(name="营灯", w=20, d=16, h=124, parts=p_lantern_pole, spots=[],
                         sig=lambda it: bool(it.state.get("on"))),
    "cooler": dict(name="保温箱", w=42, d=26, h=30, parts=p_cooler, spots=[S("perch", 0, 0, 29)]),
    "firewood": dict(name="柴堆", w=50, d=24, h=30, parts=p_firewood, spots=[]),
    "hammock": dict(name="吊床", w=140, d=20, h=70, parts=p_hammock, block=(140, 8),
                    spots=[S("hammock", 0, -2, 30, "person", face=(0, -1)), S("sleep", 30, 0, 30)]),
}
for _k, _v in PLACE_CATALOG.items():
    _v.setdefault("group", "地点")
    _v["place"] = True
    H.CATALOG[_k] = _v


# ---------------------------------------------------------------------------------------------- props
H.BUSY_PROPS.extend(["cup", "icecream", "marsh", "camera", "map", "bread"])
_draw_prop = H.draw_prop


def draw_prop(p, prop, x, y, t, front=False):
    if prop == "cup":
        p.setPen(pen("#9a8a76", 0.9))
        p.setBrush(QColor("#ffffff"))
        p.drawRoundedRect(QRectF(x - 4, y - 9, 8, 9), 1.5, 1.5)
        p.setBrush(QColor("#a8714b"))
        p.drawRect(QRectF(x - 4, y - 6, 8, 3))
        p.setPen(Qt.NoPen)
        ph = (t * 0.7) % 1.0
        p.setBrush(QColor(255, 255, 255, int(120 * (1 - ph))))
        p.drawEllipse(QPointF(x + math.sin(t * 2), y - 12 - ph * 10), 2 + ph * 2, 2 + ph * 2)
    elif prop == "icecream":
        p.setPen(pen("#b07a40", 0.8))
        p.setBrush(QColor("#e0b070"))
        p.drawPolygon(poly((x - 4, y - 6), (x + 4, y - 6), (x, y + 4)))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#f7b8cf"))
        p.drawEllipse(QPointF(x, y - 9), 5, 4.5)
        p.setBrush(QColor("#fbe7a6"))
        p.drawEllipse(QPointF(x + 1, y - 13), 3.6, 3.2)
    elif prop == "bag":
        p.setPen(pen("#9a8a76", 1.0))
        p.setBrush(QColor("#f6f1e6"))
        p.drawRoundedRect(QRectF(x - 7, y + 2, 14, 15), 2, 2)
        p.setBrush(Qt.NoBrush)
        p.drawArc(QRectF(x - 4, y - 3, 8, 9), 0, 180 * 16)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#7bbf6a"))
        p.drawEllipse(QPointF(x - 2, y + 2), 3, 2.4)
        p.setBrush(QColor("#e8473f"))
        p.drawEllipse(QPointF(x + 3, y + 1), 2.6, 2.6)
    elif prop == "rod":
        p.setPen(QPen(QColor("#5a3a22"), 1.8, Qt.SolidLine, Qt.RoundCap))
        tip = QPointF(x + 34, y - 46)
        p.drawLine(QPointF(x - 4, y + 4), tip)
        p.setPen(QPen(QColor(255, 255, 255, 170), 0.7))
        bob = 2 * math.sin(t * 2.3)
        end = QPointF(tip.x() + 10, tip.y() + 70 + bob)
        path = QPainterPath(tip)
        path.quadTo(QPointF(tip.x() + 12, tip.y() + 20), end)
        p.drawPath(path)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#e8473f"))
        p.drawEllipse(end, 2.2, 2.6)
    elif prop == "fish":
        p.setPen(pen("#4f7f9f", 0.8))
        p.setBrush(QColor("#9fc3dc"))
        wig = 4 * math.sin(t * 10)
        p.drawEllipse(QPointF(x + 2, y + 6), 4, 9)
        p.drawPolygon(poly((x + 2, y + 14), (x - 3 + wig, y + 20), (x + 7 + wig, y + 20)))
    elif prop == "bread":
        p.setPen(pen("#b07a40", 0.8))
        p.setBrush(QColor("#e6b877"))
        p.drawRoundedRect(QRectF(x - 6, y - 5, 12, 8), 3, 3)
    elif prop == "kite":
        sw = 6 * math.sin(t * 1.1)
        k = QPointF(x + 40 + sw, y - 130 + 4 * math.sin(t * 1.7))
        p.setPen(QPen(QColor(255, 255, 255, 190), 0.8))
        path = QPainterPath(QPointF(x, y))
        path.quadTo(QPointF(x + 30, y - 40), k + QPointF(0, 12))
        p.drawPath(path)
        p.setPen(pen("#9c3a2e", 1.0))
        p.setBrush(QColor("#e46f5b"))
        p.drawPolygon(poly(k + QPointF(0, -12), k + QPointF(10, 0), k + QPointF(0, 12), k + QPointF(-10, 0)))
        p.setPen(QPen(QColor("#f2c94c"), 1.2))
        p.drawLine(k + QPointF(0, -12), k + QPointF(0, 12))
        tail = QPainterPath(k + QPointF(0, 12))
        tail.quadTo(k + QPointF(-8 + sw, 24), k + QPointF(-2, 36))
        p.setPen(QPen(QColor("#5e9bd6"), 1.2))
        p.drawPath(tail)
    elif prop == "marsh":
        p.setPen(QPen(QColor("#8a5c3d"), 1.4))
        p.drawLine(QPointF(x, y), QPointF(x + 22, y - 18))
        p.setPen(pen("#c9a27a", 0.8))
        p.setBrush(QColor("#f6e9d2"))
        p.drawRoundedRect(QRectF(x + 18, y - 24, 8, 7), 2, 2)
    elif prop == "camera":
        p.setPen(pen("#1f1f24", 0.9))
        p.setBrush(QColor("#2d2d36"))
        p.drawRoundedRect(QRectF(x - 8, y - 9, 16, 11), 2, 2)
        p.setBrush(QColor("#5e9bd6"))
        p.drawEllipse(QPointF(x, y - 3.5), 3.4, 3.4)
    elif prop == "map":
        p.setPen(pen("#9a8a76", 0.9))
        p.setBrush(QColor("#f6eccf"))
        p.drawRect(QRectF(x - 10, y - 9, 20, 13))
        p.setPen(QPen(QColor("#e8473f"), 1))
        p.drawPolyline(poly((x - 7, y + 1), (x - 2, y - 4), (x + 3, y - 1), (x + 7, y - 6)))
    elif prop == "chalk":
        p.setPen(QPen(QColor("#8a5c3d"), 1.6, Qt.SolidLine, Qt.RoundCap))
        p.drawLine(QPointF(x, y), QPointF(x + 18, y - 20))
    elif prop == "basket":
        p.setPen(pen("#8a5c3d", 1.0))
        p.setBrush(QColor("#c99a6a"))
        p.drawRoundedRect(QRectF(x - 9, y, 18, 11), 3, 3)
        p.setBrush(Qt.NoBrush)
        p.drawArc(QRectF(x - 7, y - 7, 14, 14), 0, 180 * 16)
    else:
        _draw_prop(p, prop, x, y, t, front)


H.draw_prop = draw_prop


# ---------------------------------------------------------------------------------------------- critters
def draw_critter(p, c, t):
    k = c["k"]
    sx, sy = iso(c["x"], c["y"], c.get("z", 0.0))
    face = 1 if c.get("vx", 0) >= 0 else -1
    if c.get("face"):
        face = c["face"]
    ph = t * 3 + c.get("ph", 0)
    p.save()
    p.translate(sx, sy)
    if face < 0:
        p.scale(-1, 1)
    if k in ("pigeon", "sparrow"):
        _bird(p, ph, c.get("st") == "fly", "#9aa2ac" if k == "pigeon" else "#a8714b")
    elif k in ("duck", "duckling"):
        _duck(p, ph, 0.6 if k == "duckling" else 1.0)
    elif k == "swan":
        _swan(p, ph)
    elif k == "squirrel":
        _squirrel(p, ph, c.get("st") == "run")
    elif k == "dog":
        _dog(p, ph, c.get("st") == "walk", c.get("col", "#c99b6a"))
    elif k == "rabbit":
        _rabbit(p, ph, c.get("st") == "hop")
    elif k == "butterfly":
        p.restore()
        H.draw_butterfly(p, sx, sy, ph, c.get("col", "#f6c66b"))
        return
    elif k == "firefly":
        a = 0.5 + 0.5 * math.sin(ph * 1.7)
        g = QRadialGradient(QPointF(0, 0), 8)
        g.setColorAt(0, QColor(220, 255, 120, int(230 * a)))
        g.setColorAt(1, QColor(220, 255, 120, 0))
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        p.drawEllipse(QPointF(0, 0), 8, 8)
    elif k == "hawk":
        p.setPen(pen("#3a2a22", 1.0))
        p.setBrush(QColor("#6b4a35"))
        f = math.sin(ph * 0.6) * 4
        p.drawPolygon(poly((-16, -f), (0, 2), (16, -f), (0, -3)))
    elif k == "fish_jump":
        u = c.get("u", 0.0)
        if 0 < u < 1:
            h = 30 * math.sin(u * math.pi)
            p.setPen(pen("#4f7f9f", 0.8))
            p.setBrush(QColor("#9fc3dc"))
            p.save()
            p.translate(-14 + 28 * u, -h)
            p.rotate(-60 + 120 * u)
            p.drawEllipse(QPointF(0, 0), 7, 3.4)
            p.drawPolygon(poly((-7, 0), (-12, -4), (-12, 4)))
            p.restore()
        p.setPen(QPen(QColor(255, 255, 255, int(200 * max(0.0, 1 - abs(u - 0.0) * 2))), 1.2))
        p.setBrush(Qt.NoBrush)
        rr = 6 + 14 * max(0.0, u)
        p.drawEllipse(QPointF(-14, 0), rr, rr * 0.35)
        p.drawEllipse(QPointF(14, 0), rr * max(0.0, u - 0.8) * 4, rr * 0.35 * max(0.0, u - 0.8) * 4)
    elif k == "dragonfly":
        p.setPen(QPen(QColor("#3b8bd0"), 1.6))
        p.drawLine(QPointF(-8, 0), QPointF(6, 0))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(220, 240, 255, 170))
        f = abs(math.sin(ph * 8)) * 3
        p.drawEllipse(QPointF(-1, -2 - f), 5, 1.6)
        p.drawEllipse(QPointF(-1, 2 + f), 5, 1.6)
    p.restore()


def _bird(p, ph, fly, col):
    c = QColor(col)
    p.setPen(pen(c.darker(160).name(), 0.8))
    p.setBrush(c)
    if fly:
        f = math.sin(ph * 6) * 6
        p.drawEllipse(QPointF(0, -14), 6, 3.4)
        p.drawPolygon(poly((-2, -15), (-8, -15 - f), (4, -15)))
        p.drawPolygon(poly((2, -14), (9, -14 - f * 0.8), (5, -13)))
        return
    peck = 3 * max(0.0, math.sin(ph * 1.3)) ** 6
    p.drawEllipse(QPointF(0, -5), 6, 4.2)
    p.drawEllipse(QPointF(5, -9 + peck), 3.2, 3)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#2b211c"))
    p.drawEllipse(QPointF(6, -10 + peck), 0.8, 0.8)
    p.setBrush(QColor("#e0a040"))
    p.drawPolygon(poly((8, -9 + peck), (11, -8 + peck), (8, -7.6 + peck)))
    p.setPen(QPen(QColor("#e07a5f"), 0.9))
    p.drawLine(QPointF(-1, -1), QPointF(-1, 1))
    p.drawLine(QPointF(1, -1), QPointF(1, 1))


def _duck(p, ph, s):
    p.scale(s, s)
    bob = math.sin(ph) * 0.8
    p.setPen(pen("#8a7a5e", 0.8))
    p.setBrush(QColor("#f2e8d0") if s < 0.8 else QColor("#c9a77a"))
    p.drawEllipse(QPointF(0, -4 + bob), 10, 5)
    p.setBrush(QColor("#3f8a4e") if s >= 0.8 else QColor("#f6d35b"))
    p.drawEllipse(QPointF(8, -11 + bob), 4, 4)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#f29a3e"))
    p.drawPolygon(poly((11, -11 + bob), (16, -10 + bob), (11, -9 + bob)))
    p.setBrush(QColor("#2b211c"))
    p.drawEllipse(QPointF(9.5, -12 + bob), 0.8, 0.8)
    p.setPen(QPen(QColor(255, 255, 255, 120), 1))
    p.setBrush(Qt.NoBrush)
    p.drawArc(QRectF(-12, -2, 24, 6), 200 * 16, 140 * 16)


def _swan(p, ph):
    bob = math.sin(ph * 0.8)
    p.setPen(pen("#9aa2ac", 0.9))
    p.setBrush(QColor("#ffffff"))
    p.drawEllipse(QPointF(0, -6 + bob), 15, 7)
    path = QPainterPath(QPointF(9, -9 + bob))
    path.cubicTo(QPointF(16, -18 + bob), QPointF(8, -26 + bob), QPointF(13, -30 + bob))
    p.setPen(QPen(QColor("#ffffff"), 3.4, Qt.SolidLine, Qt.RoundCap))
    p.drawPath(path)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#ffffff"))
    p.drawEllipse(QPointF(14, -30 + bob), 3.4, 2.8)
    p.setBrush(QColor("#f29a3e"))
    p.drawPolygon(poly((16, -31 + bob), (21, -29 + bob), (16, -28 + bob)))
    p.setBrush(QColor("#2b211c"))
    p.drawEllipse(QPointF(14.5, -31 + bob), 0.8, 0.8)


def _squirrel(p, ph, run):
    hop = abs(math.sin(ph * 3)) * 4 if run else 0
    p.setPen(pen("#7a4f30", 0.8))
    p.setBrush(QColor("#c9773a"))
    tail = QPainterPath(QPointF(-5, -4 - hop))
    tail.cubicTo(QPointF(-16, -6 - hop), QPointF(-16, -22 - hop), QPointF(-6, -20 - hop))
    tail.cubicTo(QPointF(-10, -14 - hop), QPointF(-9, -8 - hop), QPointF(-5, -4 - hop))
    p.drawPath(tail)
    p.drawEllipse(QPointF(0, -5 - hop), 6, 4.5)
    p.drawEllipse(QPointF(5, -10 - hop), 3.6, 3.4)
    p.drawEllipse(QPointF(4, -14 - hop), 1.2, 2)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#2b211c"))
    p.drawEllipse(QPointF(6.5, -10.5 - hop), 0.8, 0.8)


def _dog(p, ph, walk, col):
    c = QColor(col)
    leg = math.sin(ph * 2.4) * 3 if walk else 0
    p.setPen(pen(c.darker(150).name(), 0.9))
    p.setBrush(c)
    for dx, s in ((-8, 1), (-4, -1), (6, 1), (10, -1)):
        p.drawRoundedRect(QRectF(dx - 1.5 + leg * s * 0.4, -9, 3, 9), 1.2, 1.2)
    p.drawEllipse(QPointF(0, -12), 13, 6.5)
    p.drawEllipse(QPointF(13, -19), 6, 5.5)
    p.drawEllipse(QPointF(18, -17), 3.4, 2.6)
    p.setBrush(c.darker(130))
    p.drawEllipse(QPointF(10, -20), 2.6, 5)
    wag = 6 * math.sin(ph * 5)
    p.setPen(QPen(c.darker(110), 2.6, Qt.SolidLine, Qt.RoundCap))
    p.drawLine(QPointF(-12, -14), QPointF(-18, -20 + wag * 0.3))
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#2b211c"))
    p.drawEllipse(QPointF(15, -20.5), 0.9, 0.9)
    p.drawEllipse(QPointF(21, -17.5), 1.2, 1)


def _rabbit(p, ph, hop):
    h = abs(math.sin(ph * 2)) * 6 if hop else 0
    p.setPen(pen("#9a8a76", 0.8))
    p.setBrush(QColor("#d9c8b0"))
    p.drawEllipse(QPointF(0, -5 - h), 7, 5)
    p.drawEllipse(QPointF(6, -10 - h), 4, 3.6)
    p.drawEllipse(QPointF(5, -17 - h), 1.4, 4.5)
    p.drawEllipse(QPointF(7.5, -16.5 - h), 1.4, 4.2)
    p.setBrush(QColor("#ffffff"))
    p.drawEllipse(QPointF(-7, -6 - h), 2.4, 2.4)


# ---------------------------------------------------------------------------------------------- boats, leash
def draw_boat(p, b, t, part):
    """A rowing boat on the lake: 'back' (hull behind the riders) or 'front' (its near side, and the oars)."""
    sx, sy = iso(b["x"], b["y"], 0)
    face = b.get("face", 1)
    rock = 1.2 * math.sin(t * 1.6 + b.get("ph", 0))
    col = QColor(b.get("col", "#e46f5b"))
    L, W = 46, 15
    p.save()
    p.translate(sx, sy + rock * 0.3)
    if part == "back":
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(20, 60, 90, 50))
        p.drawEllipse(QPointF(0, 2), L + 8, 7)
        p.setPen(pen(col.darker(160).name(), 1.2))
        p.setBrush(col.darker(115))
        p.drawPolygon(poly((-L, -6), (L, -6), (L - 6, -W * 0.9), (-L + 6, -W * 0.9)))
        p.setBrush(QColor("#c99a6a"))
        p.drawPolygon(poly((-L + 6, -6), (L - 6, -6), (L - 10, -W * 0.7), (-L + 10, -W * 0.7)))
        p.setBrush(QColor("#a8714b"))
        p.drawRect(QRectF(-L * 0.45, -10, 8, 4))
        p.drawRect(QRectF(L * 0.25, -10, 8, 4))
    else:
        path = QPainterPath(QPointF(-L - 4, -10))
        path.quadTo(QPointF(0, 8), QPointF(L + 4, -10))
        path.lineTo(QPointF(L, -3))
        path.quadTo(QPointF(0, 12), QPointF(-L, -3))
        path.closeSubpath()
        p.setPen(pen(col.darker(160).name(), 1.2))
        g = QLinearGradient(0, -10, 0, 10)
        g.setColorAt(0, col.lighter(110))
        g.setColorAt(1, col.darker(110))
        p.setBrush(g)
        p.drawPath(path)
        p.setPen(QPen(QColor(255, 255, 255, 140), 1.4))
        p.drawLine(QPointF(-L + 4, -8), QPointF(L - 4, -8))
        if b.get("riders"):
            a = math.sin(t * 2.4) * 0.6 if b.get("moving") else 0.1
            p.setPen(QPen(QColor("#8a5c3d"), 2.2, Qt.SolidLine, Qt.RoundCap))
            for s in (-1, 1):
                ox, oy = -4, -14
                ex = ox + s * 30 * math.cos(a) * face * 0.3 + face * 26 * math.sin(a)
                ey = oy + 18
                p.drawLine(QPointF(ox, oy), QPointF(ox + (ex - ox), ey))
                p.setBrush(QColor("#8a5c3d"))
                p.drawEllipse(QPointF(ox + (ex - ox), ey), 2.4, 4)
        if b.get("moving"):
            p.setPen(QPen(QColor(255, 255, 255, 120), 1.2))
            p.setBrush(Qt.NoBrush)
            for k in range(3):
                ph = (t * 0.9 + k / 3.0) % 1.0
                p.drawArc(QRectF(-face * (L + 10 + ph * 30) - 10, -6, 20, 10), 0, 360 * 16)
    p.restore()


def draw_leash(p, a, b, t, color="#e8473f"):
    """A leash from point a (the person's hand) to point b (the cat's collar), sagging a little."""
    d = math.hypot(b.x() - a.x(), b.y() - a.y())
    sag = max(4.0, 30 - d * 0.25)
    mid = QPointF((a.x() + b.x()) / 2, max(a.y(), b.y()) + sag)
    path = QPainterPath(a)
    path.quadTo(mid, b)
    p.setPen(QPen(QColor(color), 1.6, Qt.SolidLine, Qt.RoundCap))
    p.setBrush(Qt.NoBrush)
    p.drawPath(path)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(color).darker(130))
    p.drawEllipse(b, 1.8, 1.8)


def draw_travel_chip(p, rect, text, font):
    p.setPen(QPen(QColor("#d9b99b"), 1.2))
    p.setBrush(QColor(255, 250, 240, 238))
    p.drawRoundedRect(rect, rect.height() / 2, rect.height() / 2)
    p.setPen(QColor("#6b4a3a"))
    p.setFont(font)
    p.drawText(rect, Qt.AlignCenter, text)


def place_lamps(world, f):
    """Light sources of a place at night: [(sx, sy[, colour, flicker])]."""
    out = []
    for it in world.items:
        if it.f != f:
            continue
        if it.type == "campfire" and it.state.get("on"):
            sx, sy = iso(it.x, it.y, 30)
            out.append((sx, sy, "#ffb860", 0.85 + 0.15 * math.sin(world.t * 9)))
            out.append((sx, sy, "#ffb860", 0.8))
        elif it.type == "lantern_pole" and it.state.get("on"):
            out.append(iso(it.x + 18, it.y, 90))
    return out


def draw_weather_in(p, t, kind, region):
    """Rain / snow falling inside a screen region (the open-air parts of a place)."""
    if kind not in ("rain", "snow"):
        return
    p.save()
    p.setClipPath(region, Qt.IntersectClip)
    p.fillPath(region, QColor(70, 90, 120, 45 if kind == "rain" else 25))
    rnd = 7
    W, Hh = int(H.PANEL_W), int(H.PANEL_H)
    if kind == "rain":
        p.setPen(QPen(QColor(215, 230, 255, 210), 1.7))
        for i in range(240):
            rnd = (rnd * 1103515245 + 12345) & 0x7fffffff
            x = rnd % W
            y = ((rnd >> 8) % Hh + t * 520) % Hh
            p.drawLine(QPointF(x, y), QPointF(x - 5, y + 18))
    else:
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(255, 255, 255, 220))
        for i in range(120):
            rnd = (rnd * 1103515245 + 12345) & 0x7fffffff
            x = (rnd % W) + 14 * math.sin(t + i)
            y = ((rnd >> 8) % Hh + t * 60) % Hh
            p.drawEllipse(QPointF(x, y), 2.2, 2.2)
    p.restore()
