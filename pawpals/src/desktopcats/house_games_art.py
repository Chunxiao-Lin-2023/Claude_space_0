"""Drawing for the v21 games: side-view stages (竞技场 / 道场 / 屋顶竞速), the bomb grid, snow rollers, the per-game
HUD (cards, key bar, controls card) and the super-move cut-in."""
import math
import random

from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import QColor, QFont, QFontMetricsF, QLinearGradient, QPainterPath, QPen, QPolygonF, QRadialGradient

from . import house_art as H
from . import house_fanim as FA
from . import house_games as HG
from . import house_places_art as PA
from .house_art import box, cyl, iso, pen, poly

LANE = 36


def gy(z=0.0):
    """Screen y of height z in a side-view stage."""
    return iso(0, LANE, z)[1]


def gx(x):
    return iso(x, LANE, 0)[0]


def stage_of(f):
    from . import house_side as SD
    if f == 14:
        from . import house_race  # noqa: F401  (registers the track)
    if f == 24:
        from . import house_volley  # noqa: F401  (registers the court)
    return SD.STAGES.get(f)


# ================================================================================================ side backdrops
def draw_side_back(p, f, hour):
    d = stage_of(f)
    full = QRectF(0, 0, H.PANEL_W, H.PANEL_H)
    dark = H.is_dark(hour)
    if f == 9:
        _stadium(p, full, hour, dark)
    elif f == 13:
        _dojo(p, full, hour, dark)
    elif f == 14:
        _roofs(p, full, hour)
    elif f == 24:
        from . import house_games2_art as GA2
        GA2.draw_beach_court(p, full, hour, dark)
    if f in (9, 13):
        for x0, x1, z in d["plats"]:
            _platform(p, x0, x1, z, "stone" if f == 9 else "wood")


def _slab(p, x0, x1, z, thick, top_col, face_col, outline="#5e4436"):
    sx0, sx1 = gx(x0), gx(x1)
    y = gy(z)
    r = QRectF(sx0, y, sx1 - sx0, thick)
    p.setPen(pen(outline, 1.2))
    g = QLinearGradient(0, y, 0, y + thick)
    g.setColorAt(0, QColor(face_col).lighter(108))
    g.setColorAt(1, QColor(face_col).darker(115))
    p.setBrush(g)
    p.drawRoundedRect(r, 3, 3)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(top_col))
    p.drawRoundedRect(QRectF(sx0 + 1, y - 1, sx1 - sx0 - 2, 5), 2, 2)


def _platform(p, x0, x1, z, kind):
    sx0, sx1 = gx(x0), gx(x1)
    y = gy(z)
    if kind == "stone":
        # hanging on chains from above
        p.setPen(QPen(QColor("#6f685d"), 2, Qt.DotLine))
        for sx in (sx0 + 14, sx1 - 14):
            p.drawLine(QPointF(sx, 0), QPointF(sx, y))
        _slab(p, x0, x1, z, 16, "#e8e0d0", "#9d9587", "#6f685d")
        p.setPen(QPen(QColor("#c9443a"), 2))
        p.drawLine(QPointF(sx0 + 4, y + 8), QPointF(sx1 - 4, y + 8))
    else:
        # wooden loft on two posts
        p.setPen(pen("#5a3a22", 1))
        p.setBrush(QColor("#7a5236"))
        for sx in (sx0 + 10, sx1 - 18):
            p.drawRect(QRectF(sx, y + 12, 8, gy(0) - y - 12))
        _slab(p, x0, x1, z, 14, "#d9b382", "#a8794e", "#5a3a22")
        p.setPen(QPen(QColor(90, 58, 34, 120), 1))
        sx = sx0 + 30
        while sx < sx1 - 10:
            p.drawLine(QPointF(sx, y + 2), QPointF(sx, y + 13))
            sx += 34


def _stadium(p, full, hour, dark):
    yb = gy(0)
    PA.draw_sky(p, 21.0 if dark else 15.0, None, QRectF(full.left(), 0, full.width(), yb), seed=9)
    # stands
    for row in range(6):
        y = 150 + row * 34
        r = QRectF(full.left(), y - 24, full.width(), 28)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#8a6a8a").darker(100 + (5 - row) * 7))
        p.drawRect(r)
        rnd = random.Random(row * 7 + 1)
        x = full.left() + 8
        while x < full.right():
            p.setBrush(QColor(rnd.choice(("#f2c94c", "#e46f5b", "#5e9bd6", "#7bbf6a", "#f7b8cf", "#ffffff", "#c9a0dc"))))
            p.drawEllipse(QPointF(x, y - 14), 5.5, 6.5)
            p.setBrush(QColor(0, 0, 0, 25))
            p.drawRect(QRectF(x - 6, y - 8, 12, 8))
            x += rnd.uniform(14, 19)
    # banners and lights
    for k, (x, col, text) in enumerate(((160, "#c9443a", "猫"), (480, "#3b8bd0", "咕"), (850, "#e8b020", "喵"),
                                        (1170, "#5fb36a", "拳"))):
        r = QRectF(x - 30, 96, 60, 46)
        p.setPen(pen("#5e4436", 1))
        p.setBrush(QColor(col))
        p.drawRect(r)
        p.setPen(QColor("#ffffff"))
        f = QFont()
        f.setPixelSize(26)
        f.setBold(True)
        p.setFont(f)
        p.drawText(r, Qt.AlignCenter, text)
    for x in (60, 1270):
        p.setPen(pen("#4f4a46", 1.2))
        p.setBrush(QColor("#6f685d"))
        p.drawRect(QRectF(x - 5, 40, 10, yb - 40))
        p.setBrush(QColor("#fff6c8"))
        p.drawRoundedRect(QRectF(x - 26, 26, 52, 22), 6, 6)
        if dark:
            g = QRadialGradient(QPointF(x, 40), 220)
            g.setColorAt(0, QColor(255, 246, 200, 90))
            g.setColorAt(1, QColor(255, 246, 200, 0))
            p.setPen(Qt.NoPen)
            p.setBrush(g)
            p.drawEllipse(QPointF(x, 40), 220, 220)
    # the ring floor
    sx0, sx1 = gx(70), gx(1190)
    p.setPen(pen("#6f685d", 1.4))
    p.setBrush(QColor("#9d9587"))
    p.drawRect(QRectF(sx0, yb, sx1 - sx0, H.PANEL_H - yb))
    g = QLinearGradient(0, yb - 10, 0, yb + 6)
    g.setColorAt(0, QColor("#efe7d6"))
    g.setColorAt(1, QColor("#cfc6b4"))
    p.setBrush(g)
    p.drawRect(QRectF(sx0, yb - 10, sx1 - sx0, 12))
    p.setPen(QPen(QColor("#c9443a"), 3))
    p.drawLine(QPointF(sx0 + 6, yb + 14), QPointF(sx1 - 6, yb + 14))
    f = QFont()
    f.setPixelSize(20)
    f.setBold(True)
    p.setFont(f)
    p.setPen(QColor(201, 68, 58, 170))
    p.drawText(QRectF(sx0, yb + 18, sx1 - sx0, 40), Qt.AlignCenter, "猫 猫 咕 咕 杯")
    # posts at the ring ends
    for sx in (sx0, sx1):
        p.setPen(pen("#4f4a46", 1))
        p.setBrush(QColor("#c9443a"))
        p.drawRect(QRectF(sx - 6, yb - 70, 12, 70))
        p.setBrush(QColor("#e8e0d0"))
        p.drawEllipse(QPointF(sx, yb - 72), 8, 6)


def _dojo(p, full, hour, dark):
    yb = gy(0)
    wall = QRectF(full.left(), 0, full.width(), yb)
    g = QLinearGradient(0, 0, 0, yb)
    g.setColorAt(0, QColor("#efe3c8"))
    g.setColorAt(1, QColor("#e2d2ae"))
    p.setPen(Qt.NoPen)
    p.setBrush(g)
    p.drawRect(wall)
    # beams and shoji
    p.setBrush(QColor("#7a5236"))
    p.drawRect(QRectF(full.left(), 0, full.width(), 16))
    p.drawRect(QRectF(full.left(), yb - 40, full.width(), 8))
    x = full.left() + 10
    while x < full.right():
        r = QRectF(x, 30, 96, yb - 80)
        p.setPen(pen("#8a5c3d", 2))
        p.setBrush(QColor(255, 252, 240, 200 if not dark else 140))
        p.drawRect(r)
        p.setPen(QPen(QColor(138, 92, 61, 120), 1))
        for k in range(1, 4):
            p.drawLine(QPointF(r.left() + r.width() * k / 4, r.top()), QPointF(r.left() + r.width() * k / 4, r.bottom()))
        for k in range(1, 6):
            p.drawLine(QPointF(r.left(), r.top() + r.height() * k / 6), QPointF(r.right(), r.top() + r.height() * k / 6))
        x += 116
    # scrolls
    for x, text in ((gx(630) - 26, "武"), (gx(150) - 22, "猫"), (gx(1110) - 22, "咕")):
        r = QRectF(x, 46, 48 if text == "武" else 44, 120)
        p.setPen(pen("#5a3a22", 1))
        p.setBrush(QColor("#fbf6e8"))
        p.drawRect(r)
        p.setBrush(QColor("#8a5c3d"))
        p.drawRect(QRectF(r.left() - 4, r.top() - 4, r.width() + 8, 6))
        p.drawRect(QRectF(r.left() - 4, r.bottom() - 2, r.width() + 8, 6))
        f = QFont()
        f.setPixelSize(30)
        f.setBold(True)
        p.setFont(f)
        p.setPen(QColor("#2a2420"))
        p.drawText(r, Qt.AlignCenter, text)
    # lanterns
    for x in (gx(330), gx(930)):
        p.setPen(pen("#5a3a22", 1))
        p.drawLine(QPointF(x, 16), QPointF(x, 34))
        p.setBrush(QColor("#e8473f"))
        p.drawEllipse(QPointF(x, 48), 14, 16)
    # tatami floor band
    p.setPen(pen("#8a7a4a", 1))
    p.setBrush(QColor("#d9cf96"))
    p.drawRect(QRectF(full.left(), yb, full.width(), H.PANEL_H - yb))
    p.setPen(QPen(QColor("#a89a5c"), 1))
    x = full.left()
    while x < full.right():
        p.drawLine(QPointF(x, yb), QPointF(x, H.PANEL_H))
        x += 130
    p.setPen(QPen(QColor("#5a3a22"), 2))
    p.drawLine(QPointF(full.left(), yb), QPointF(full.right(), yb))


def _roofs(p, full, hour):
    from . import house_race as R
    yb = gy(0)
    # night sky, moon, stars, skyline
    g = QLinearGradient(0, 0, 0, H.PANEL_H)
    g.setColorAt(0, QColor("#0f1838"))
    g.setColorAt(1, QColor("#2c3768"))
    p.setPen(Qt.NoPen)
    p.setBrush(g)
    p.drawRect(full)
    rnd = random.Random(14)
    for _ in range(90):
        p.setBrush(QColor(255, 255, 230, rnd.randint(90, 230)))
        p.drawEllipse(QPointF(rnd.uniform(0, H.PANEL_W), rnd.uniform(0, 260)), 1.2, 1.2)
    p.setBrush(QColor("#fff6d0"))
    p.drawEllipse(QPointF(1150, 70), 34, 34)
    p.setBrush(QColor("#0f1838"))
    p.drawEllipse(QPointF(1136, 62), 30, 30)
    x = -10
    while x < H.PANEL_W:
        w = rnd.uniform(40, 90)
        h = rnd.uniform(60, 190)
        p.setBrush(QColor("#1b2348"))
        p.drawRect(QRectF(x, H.PANEL_H - 40 - h, w, h + 40))
        for wy in range(int(H.PANEL_H - 30 - h), int(H.PANEL_H - 40), 16):
            for wx in range(int(x + 6), int(x + w - 8), 14):
                if rnd.random() < 0.3:
                    p.setBrush(QColor(255, 220, 130, 150))
                    p.drawRect(QRectF(wx, wy, 6, 8))
        p.setBrush(QColor("#1b2348"))
        x += w + rnd.uniform(-6, 10)
    # lower roofs (with the gap)
    for x0, x1 in R.TRACK["ground"]:
        sx0, sx1 = gx(x0), gx(x1)
        p.setPen(pen("#3a2a2a", 1.2))
        p.setBrush(QColor("#6b4a45"))
        p.drawRect(QRectF(sx0, yb + 6, sx1 - sx0, H.PANEL_H - yb))
        g = QLinearGradient(0, yb - 8, 0, yb + 8)
        g.setColorAt(0, QColor("#b5655a"))
        g.setColorAt(1, QColor("#8a463a"))
        p.setBrush(g)
        p.drawRect(QRectF(sx0, yb - 2, sx1 - sx0, 10))
        p.setPen(QPen(QColor(60, 30, 25, 120), 1))
        sx = sx0 + 6
        while sx < sx1:
            p.drawArc(QRectF(sx - 8, yb - 2, 16, 10), 0, 180 * 16)
            sx += 16
    # upper decks on posts
    for x0, x1, z0, z1 in R.TRACK["solids"]:
        if z1 - z0 == 14:
            _slab(p, x0, x1, z1, 14, "#c7a27a", "#7a5236", "#3a2a22")
            p.setPen(pen("#3a2a22", 1))
            p.setBrush(QColor("#5a3a22"))
            for sx in (gx(x0) + 6, gx(x1) - 12):
                p.drawRect(QRectF(sx, gy(z0) + 1, 6, gy(0) - gy(z0) - 1))
    # chimney on the deck, the vent on the roof
    for x0, x1, z0, z1 in R.TRACK["solids"]:
        if z1 - z0 == 58:
            r = QRectF(gx(x0), gy(z1), gx(x1) - gx(x0), z1 - z0)
            p.setPen(pen("#3a2a22", 1.2))
            p.setBrush(QColor("#a8584a"))
            p.drawRect(r)
            p.setPen(QPen(QColor(60, 30, 25, 140), 1))
            for k in range(1, 5):
                p.drawLine(QPointF(r.left(), r.top() + k * 12), QPointF(r.right(), r.top() + k * 12))
            p.setPen(pen("#3a2a22", 1))
            p.setBrush(QColor("#6f685d"))
            p.drawRect(QRectF(r.left() - 4, r.top() - 6, r.width() + 8, 8))
        elif z1 - z0 == 34:
            r = QRectF(gx(x0), gy(z1), gx(x1) - gx(x0), z1 - z0)
            p.setPen(pen("#3a3a3a", 1.2))
            p.setBrush(QColor("#9aa3ad"))
            p.drawRoundedRect(r, 3, 3)
            p.setPen(QPen(QColor("#6f7883"), 1))
            for k in range(1, 4):
                p.drawLine(QPointF(r.left() + 4, r.top() + k * 8), QPointF(r.right() - 4, r.top() + k * 8))
    # the high ledge
    for x0, x1, z in R.TRACK["plats"]:
        _slab(p, x0, x1, z, 10, "#e8d8b8", "#8a6a4a", "#3a2a22")
        p.setPen(QPen(QColor("#8a6a4a"), 2))
        for sx in (gx(x0) + 20, gx(x1) - 20):
            p.drawLine(QPointF(sx, gy(z) + 10), QPointF(sx, gy(R.L1)))
    # speed pads
    for x0, x1, z in (R.PAD0, R.PAD2):
        r = QRectF(gx(x0), gy(z) - 3, gx(x1) - gx(x0), 5)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(110, 220, 255, 170))
        p.drawRoundedRect(r, 2, 2)
        p.setPen(QPen(QColor("#ffffff"), 2))
        sx = r.left() + 8
        while sx < r.right() - 6:
            p.drawLine(QPointF(sx, r.top() - 4), QPointF(sx + 6, r.center().y()))
            p.drawLine(QPointF(sx + 6, r.center().y()), QPointF(sx, r.bottom() + 4))
            sx += 16
    # the washing line: two posts, a sagging line, clothes
    x0, x1, z0, z1 = R.LINE
    p.setPen(pen("#3a2a22", 1.2))
    p.setBrush(QColor("#8a6a4a"))
    for x in (x0 - 6, x1 + 6):
        p.drawRect(QRectF(gx(x) - 3, gy(z1 + 10), 6, z1 + 10))
    path = QPainterPath()
    path.moveTo(gx(x0 - 6), gy(z1 + 6))
    path.quadTo(gx((x0 + x1) / 2), gy(z0 + 2), gx(x1 + 6), gy(z1 + 6))
    p.setPen(QPen(QColor("#e8e0d0"), 1.6))
    p.setBrush(Qt.NoBrush)
    p.drawPath(path)
    for k, col in enumerate(("#e46f5b", "#5e9bd6", "#f2c94c", "#ffffff")):
        x = x0 + 14 + k * 28
        u = (x - x0 + 6) / (x1 - x0 + 12)
        zz = z1 + 6 - (z1 - z0 + 4) * 4 * u * (1 - u)
        p.setPen(pen("#3a2a22", 0.8))
        p.setBrush(QColor(col))
        p.drawRect(QRectF(gx(x) - 8, gy(zz), 16, 14))
    # the spring at the far right
    s0, s1 = R.SPRING
    sx, sy = gx((s0 + s1) / 2), gy(0)
    p.setPen(QPen(QColor("#c9443a"), 2.4))
    for k in range(4):
        p.drawLine(QPointF(sx - 14, sy - 3 - k * 5), QPointF(sx + 14, sy - 5 - k * 5))
    p.setPen(pen("#3a2a22", 1))
    p.setBrush(QColor("#e8473f"))
    p.drawRoundedRect(QRectF(sx - 18, sy - 26, 36, 6), 2, 2)
    # start / finish line and the arrows
    sx = gx(60)
    for k in range(6):
        for j in range(2):
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#ffffff") if (k + j) % 2 == 0 else QColor("#222222"))
            p.drawRect(QRectF(sx + j * 7, yb - 60 + k * 10, 7, 10))
    f = QFont()
    f.setPixelSize(12)
    f.setBold(True)
    p.setFont(f)
    p.setPen(QColor("#fff6d0"))
    p.drawText(QRectF(sx - 30, yb - 80, 80, 16), Qt.AlignCenter, "起点 / 终点")
    for x, z, d in ((180, 0, 1), (640, 0, 1), (1040, 0, 1), (980, R.L1, -1), (450, R.L1, -1), (200, R.L1, -1)):
        _arrow(p, gx(x), gy(z) - 70 if z == 0 else gy(z) - 60, d)


def _arrow(p, x, y, d):
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 246, 200, 120))
    pts = [QPointF(x - 14 * d, y - 5), QPointF(x + 2 * d, y - 5), QPointF(x + 2 * d, y - 11), QPointF(x + 16 * d, y),
           QPointF(x + 2 * d, y + 11), QPointF(x + 2 * d, y + 5), QPointF(x - 14 * d, y + 5)]
    p.drawPolygon(QPolygonF(pts))


# ================================================================================================ floor overlays
def _rings(p, b, t):
    from .house_battle import TEAM_COLORS
    for fi in b.fighters:
        a = fi.a
        if a.f != b.f or a.traveling is not None or getattr(fi, "hidden", False) or fi.st == "out":
            continue
        sx, sy = iso(a.x, a.y, getattr(fi, "z", 0) if b.game in ("brawl", "race") else 0)
        col = QColor(TEAM_COLORS.get(fi.team, "#999"))
        if fi.st in ("ko", "fall"):
            col.setAlpha(60)
        r = 22 if a.is_cat else 18
        p.setPen(QPen(col, 2.2))
        c2 = QColor(col)
        c2.setAlpha(45)
        p.setBrush(c2)
        p.drawEllipse(QPointF(sx, sy), r, r * 0.34)
        if fi.inv > 0 and int(t * 12) % 2:
            p.setPen(QPen(QColor(255, 255, 255, 200), 2))
            p.setBrush(Qt.NoBrush)
            p.drawEllipse(QPointF(sx, sy), r + 4, (r + 4) * 0.34)


def draw_floor(p, b, t):
    g = b.game
    dim = getattr(b, "dim", 0.0)
    if dim > 0.01:                                    # the stage darkens while a super plays
        p.fillRect(QRectF(-10, -10, H.PANEL_W + 20, H.PANEL_H + 20), QColor(20, 14, 40, int(150 * min(1.0, dim))))
    if g in ("brawl", "race"):
        _rings(p, b, t)
        return
    from . import house_games2_art as GA2
    if g in GA2.GAMES2:
        GA2.draw_floor(p, b, t)
        return
    if g == "bomb":
        from . import house_bomb as BM
        p.setPen(QPen(QColor(80, 90, 100, 45), 1))
        for c in range(BM.COLS + 1):
            x = BM.X0 + c * BM.CW
            p.drawLine(QPointF(*iso(x, BM.Y0)), QPointF(*iso(x, BM.Y0 + BM.ROWS * BM.CH)))
        for r in range(BM.ROWS + 1):
            y = BM.Y0 + r * BM.CH
            p.drawLine(QPointF(*iso(BM.X0, y)), QPointF(*iso(BM.X0 + BM.COLS * BM.CW, y)))
        # flames (on the floor, glowing)
        for fl in getattr(b, "flames", []):
            k = max(0.0, min(1.0, fl["t"] / 0.5))
            x, y = BM.cx(fl["c"]), BM.cy(fl["r"])
            col = QColor(HG.CHARS.get(fl.get("char"), {}).get("color", "#e46f5b"))
            g2 = QRadialGradient(QPointF(*iso(x, y, 8)), 40)
            g2.setColorAt(0, QColor(255, 250, 230, int(240 * k)))
            c2 = QColor(col)
            c2.setAlpha(int(200 * k))
            g2.setColorAt(0.5, c2)
            g2.setColorAt(1, QColor(col.red(), col.green(), col.blue(), 0))
            p.setPen(Qt.NoPen)
            p.setBrush(g2)
            sx, sy = iso(x, y, 4)
            if fl["dir"] == 1:
                p.drawRoundedRect(QRectF(sx - 42, sy - 14, 84, 26), 12, 12)
            elif fl["dir"] == 2:
                p.drawRoundedRect(QRectF(sx - 18, sy - 18, 36, 34), 12, 12)
            else:
                p.drawEllipse(QPointF(sx, sy), 36, 22)
        for it in getattr(b, "cell_items", []):
            x, y = BM.cx(it["c"]), BM.cy(it["r"])
            sx, sy = iso(x, y)
            bob = 3 * math.sin(t * 4 + x)
            p.setPen(pen("#c4862c", 1.4))
            p.setBrush(QColor(255, 246, 225, 235))
            p.drawEllipse(QPointF(sx, sy - 14 + bob), 15, 15)
            emoji(p, QRectF(sx - 15, sy - 29 + bob, 30, 30),
                  {"bomb": "💣", "fire": "🔥", "speed": "👟", "needle": "📍"}.get(it["k"], "?"), 15)
        _rings(p, b, t)


# ================================================================================================ things
def draw_things(p, b, t):
    """Returns True when the game drew everything itself."""
    g = b.game
    if g == "brawl":
        _brawl_things(p, b, t)
        return True
    if g == "race":
        _race_things(p, b, t)
        return True
    if g == "bomb":
        return True
    from . import house_games2_art as GA2
    if g in GA2.GAMES2:
        GA2.draw_things(p, b, t)
        return True
    if g == "shoot":
        for r in getattr(b, "rollers", []):
            sx, sy = iso(r["x"], r["y"], r["rad"])
            gx_, gy_ = iso(r["x"], r["y"], 0)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(0, 0, 0, 40))
            p.drawEllipse(QPointF(gx_, gy_), r["rad"], r["rad"] * 0.35)
            p.setPen(pen("#b9c8d8", 1.2))
            p.setBrush(QColor("#ffffff"))
            p.drawEllipse(QPointF(sx, sy), r["rad"], r["rad"])
            p.setPen(QPen(QColor("#d8e4ee"), 1.4))
            a = r.get("rot", 0)
            p.drawArc(QRectF(sx - r["rad"] * 0.7, sy - r["rad"] * 0.7, r["rad"] * 1.4, r["rad"] * 1.4),
                      int(math.degrees(a) * 16), 100 * 16)
        return False
    return False


def _side_xy(x, z):
    return iso(x, LANE, z)


def _brawl_things(p, b, t):
    for it in b.items:
        sx, sy = _side_xy(it["x"], it.get("z", 0))
        bob = 3 * math.sin(t * 4 + it["x"])
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(255, 246, 200, 90))
        p.drawEllipse(QPointF(sx, sy - 14 + bob), 18, 18)
        f = QFont()
        f.setPixelSize(18)
        p.setFont(f)
        p.setPen(QColor("#5e4436"))
        p.drawText(QRectF(sx - 16, sy - 32 + bob, 32, 34), Qt.AlignCenter,
                   {"fish": "🐟", "meter": "⚡", "plush": "🧸"}.get(it["k"], "?"))
    # the giant's shadow before 泰山压顶 lands
    for fi in b.fighters:
        d = getattr(fi, "data", None) or {}
        if d.get("sk") == "s_mountain" and d.get("mark") is not None and getattr(fi, "hidden", False):
            sx = gx(d["mark"])
            k = 0.6 + 0.4 * math.sin(t * 10)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(0, 0, 0, int(90 * k)))
            p.drawEllipse(QPointF(sx, gy(0) - 2), 70, 12)
            p.setPen(QPen(QColor("#e8473f"), 2))
            p.drawLine(QPointF(sx, gy(0) - 20), QPointF(sx, gy(0) - 60))
            p.drawLine(QPointF(sx - 8, gy(0) - 30), QPointF(sx, gy(0) - 20))
            p.drawLine(QPointF(sx + 8, gy(0) - 30), QPointF(sx, gy(0) - 20))
    for pj in b.projs:
        sx, sy = _side_xy(pj["x"], pj["z"])
        k = pj["k"]
        rot = pj.get("rot", 0)
        p.save()
        p.translate(sx, sy)
        if k in ("plush", "rainplush"):
            p.rotate(math.degrees(rot) * 0.4)
            H.draw_plush(p, pj.get("kind", "bunny"), 0, 12, 0.6, None)
        elif k == "slipper":
            p.rotate(math.degrees(rot) * 1.4)
            p.setPen(pen("#5e4436", 1))
            p.setBrush(QColor("#5e9bd6"))
            p.drawRoundedRect(QRectF(-16, -7, 32, 14), 7, 7)
            p.setBrush(QColor("#f2c94c"))
            p.drawRect(QRectF(-4, -7, 6, 14))
        elif k == "rccar":
            f = pj.get("face", 1)
            p.scale(f if pj["vx"] >= 0 else -1, 1)
            p.setPen(pen("#5e4436", 1))
            p.setBrush(QColor("#e8473f"))
            p.drawRoundedRect(QRectF(-16, -16, 32, 11), 4, 4)
            p.setBrush(QColor("#a7d8f0"))
            p.drawRoundedRect(QRectF(-6, -22, 14, 8), 3, 3)
            p.setBrush(QColor("#333333"))
            for wx in (-10, 10):
                p.drawEllipse(QPointF(wx, -4), 4.5, 4.5)
            p.setPen(QPen(QColor("#5e4436"), 1))
            p.drawLine(QPointF(-12, -22), QPointF(-16, -32))
        elif k == "sofa":
            p.scale(1 if pj["vx"] >= 0 else -1, 1)
            p.rotate(-8)
            p.setPen(pen("#5e4436", 1.4))
            p.setBrush(QColor("#8fb7a0"))
            p.drawRoundedRect(QRectF(-56, -20, 112, 30), 8, 8)
            p.drawRoundedRect(QRectF(-56, -40, 112, 24), 8, 8)
            p.setBrush(QColor("#7aa38c"))
            p.drawRoundedRect(QRectF(-64, -30, 16, 40), 6, 6)
            p.drawRoundedRect(QRectF(48, -30, 16, 40), 6, 6)
            p.setPen(QPen(QColor(255, 255, 255, 160), 2))
            for j in range(4):
                p.drawLine(QPointF(-70 - j * 14, -20 + j * 8), QPointF(-100 - j * 14, -20 + j * 8))
        else:
            p.setPen(pen("#5e4436", 1))
            p.setBrush(QColor("#ffffff"))
            p.drawEllipse(QPointF(0, 0), 8, 8)
        p.restore()


def _race_things(p, b, t):
    for bx in getattr(b, "boxes", []):
        if bx["t"] > 0:
            continue
        sx, sy = _side_xy(bx["x"], bx["z"] + 36)
        bob = 3 * math.sin(t * 3 + bx["x"])
        r = QRectF(sx - 15, sy - 15 + bob, 30, 30)
        p.setPen(pen("#8a5c1a", 1.4))
        g = QLinearGradient(0, r.top(), 0, r.bottom())
        g.setColorAt(0, QColor("#ffd86a"))
        g.setColorAt(1, QColor("#f2a93a"))
        p.setBrush(g)
        p.drawRoundedRect(r, 5, 5)
        f = QFont()
        f.setPixelSize(20)
        f.setBold(True)
        p.setFont(f)
        p.setPen(QColor("#ffffff"))
        p.drawText(r, Qt.AlignCenter, "?")
    for bn in getattr(b, "bananas", []):
        sx, sy = _side_xy(bn["x"], bn["z"])
        p.setPen(pen("#8a6a1a", 1))
        p.setBrush(QColor("#f2d34c"))
        path = QPainterPath()
        path.moveTo(sx - 12, sy - 2)
        path.quadTo(sx, sy - 14, sx + 12, sy - 2)
        path.quadTo(sx, sy - 6, sx - 12, sy - 2)
        p.drawPath(path)
    for y in getattr(b, "yarns", []):
        sx, sy = _side_xy(y["x"], y["z"] + 12)
        _yarn_ball(p, sx, sy, 12, y.get("rot", 0), "#b8a3ea")


def _yarn_ball(p, x, y, r, rot, col):
    p.setPen(pen("#6b4a7a", 1))
    p.setBrush(QColor(col))
    p.drawEllipse(QPointF(x, y), r, r)
    p.setPen(QPen(QColor(255, 255, 255, 140), 1.2))
    for k in range(3):
        a = rot + k * 1.05
        p.drawArc(QRectF(x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6), int(math.degrees(a) * 16), 120 * 16)


# ================================================================================================ obstacles (bomb)
_SPRITES = {}


def _sprite(kind, scale):
    """Boxes and spools look the same everywhere: draw each once per zoom level and blit it."""
    from PySide6.QtGui import QPainter, QPixmap
    key = (kind, round(scale, 3))
    pm = _SPRITES.get(key)
    if pm is None:
        if len(_SPRITES) > 12:
            _SPRITES.clear()
        w, h = 100, 120
        pm = QPixmap(max(1, int(w * scale)), max(1, int(h * scale)))
        pm.fill(Qt.transparent)
        q = QPainter(pm)
        q.setRenderHint(QPainter.Antialiasing)
        q.scale(scale, scale)
        ox, oy = iso(0, 0)
        q.translate(w / 2 - ox, h - 24 - oy)
        _draw_block(q, {"k": kind, "x": 0.0, "y": 0.0, "w": 76.0, "d": 46.0}, 0.0)
        q.end()
        _SPRITES[key] = pm
    return pm


_ROWS = {}
_EMOJI = {}


def emoji(p, rect, text, px):
    """An emoji drawn from a cached picture (colour-font text is slow to draw every frame)."""
    from PySide6.QtGui import QPainter, QPixmap
    tr = p.worldTransform()
    zoom = math.hypot(tr.m11(), tr.m12())
    key = (text, px, round(zoom, 2), round(rect.width()), round(rect.height()))
    pm = _EMOJI.get(key)
    if pm is None:
        if len(_EMOJI) > 80:
            _EMOJI.clear()
        pm = QPixmap(max(1, int(rect.width() * zoom)), max(1, int(rect.height() * zoom)))
        pm.fill(Qt.transparent)
        q = QPainter(pm)
        q.scale(zoom, zoom)
        f = QFont()
        f.setPixelSize(px)
        q.setFont(f)
        q.drawText(QRectF(0, 0, rect.width(), rect.height()), Qt.AlignCenter, text)
        q.end()
        _EMOJI[key] = pm
    p.save()
    p.translate(rect.left(), rect.top())
    p.scale(1 / zoom, 1 / zoom)
    p.drawPixmap(QPointF(0, 0), pm)
    p.restore()


def draw_box_row(p, objs):
    """A whole row of boxes / spools as one picture (泡泡堂 has ~80 of them; one blit per row keeps 40 fps)."""
    from PySide6.QtGui import QPainter, QPixmap
    tr = p.worldTransform()
    scale = tr.m11()
    xs = [o["x"] for o in objs]
    x0, x1 = min(xs), max(xs)
    y = objs[0]["y"]
    key = (round(scale, 3), y, tuple(sorted((round(o["x"]), o["k"]) for o in objs)))
    pm = _ROWS.get(key)
    if pm is None:
        if len(_ROWS) > 60:
            _ROWS.clear()
        w = (x1 - x0) + 100
        pm = QPixmap(max(1, int(w * scale) + 2), max(1, int(120 * scale) + 2))
        pm.fill(Qt.transparent)
        q = QPainter(pm)
        for o in objs:
            q.drawPixmap(QPointF((o["x"] - x0) * scale, 0), _sprite(o["k"], scale))
        q.end()
        _ROWS[key] = pm
    dev = tr.map(QPointF(*iso(x0, y)))
    p.save()
    p.resetTransform()
    p.drawPixmap(QPointF(dev.x() - 50 * scale, dev.y() - (120 - 24) * scale), pm)
    p.restore()


def draw_obstacle(p, o, t):
    k = o["k"]
    if k in ("b_hard", "b_soft"):
        tr = p.worldTransform()
        scale = tr.m11()
        pm = _sprite(k, scale)
        dev = tr.map(QPointF(*iso(o["x"], o["y"])))
        p.save()
        p.resetTransform()
        p.drawPixmap(QPointF(dev.x() - 50 * scale, dev.y() - (120 - 24) * scale), pm)
        p.restore()
        return True
    return _draw_block(p, o, t)


def _draw_block(p, o, t):
    k = o["k"]
    x, y = o["x"], o["y"]
    if k == "b_hard":
        w, d = o["w"] / 2, o["d"] / 2
        cyl(p, x, y - 2, 0, 26, 50, "#c98a5a", "#e8b98a", ry=10)
        cyl(p, x, y - 2, 8, 22, 34, "#8a6ad0", "#b8a3ea", ry=8)
        p.setPen(QPen(QColor(255, 255, 255, 90), 1))
        sx, sy = iso(x, y - 2, 25)
        for j in range(-2, 3):
            p.drawLine(QPointF(sx - 20, sy + j * 6), QPointF(sx + 20, sy + j * 6 - 3))
        return True
    if k == "b_soft":
        w, d = o["w"] / 2 - 4, o["d"] / 2 - 4
        box(p, x - w, y - d, 0, x + w, y + d, 40, "#d9b382", top="#ecd2a8", radius=3)
        sx, sy = iso(x, y - d, 20)
        p.setPen(QPen(QColor("#a8794e"), 1.2))
        p.drawLine(QPointF(sx - w, sy - 6), QPointF(sx + w, sy - 6))
        p.setPen(pen("#8a5c3d", 1))
        p.setBrush(QColor("#f2d9b0"))
        p.drawRect(QRectF(sx - 10, sy - 4, 20, 12))
        return True
    if k == "b_bomb":
        fuse = o.get("fuse", 2.0)
        mini = o.get("mini")
        r = 12 if mini else 17
        pulse = 1.0 + (0.12 * math.sin(t * (10 if fuse < 1 else 5)) if fuse < 1.6 else 0.0)
        r *= pulse
        sx, sy = iso(x, y, r)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(0, 0, 0, 50))
        p.drawEllipse(QPointF(*iso(x, y)), r, r * 0.35)
        col = HG.CHARS.get(o.get("char"), {}).get("color", "#e46f5b")
        _yarn_ball(p, sx, sy, r, t * 0.5 + x, col)
        if o.get("frozen"):
            p.setPen(QPen(QColor(150, 210, 255, 220), 2))
            p.setBrush(QColor(170, 220, 255, 90))
            p.drawEllipse(QPointF(sx, sy), r + 4, r + 4)
        # fuse
        p.setPen(QPen(QColor("#5e4436"), 1.4))
        p.drawLine(QPointF(sx + r * 0.5, sy - r * 0.7), QPointF(sx + r * 0.9, sy - r * 1.2))
        if not o.get("frozen") and int(t * 12) % 2:
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#ffd34c"))
            p.drawEllipse(QPointF(sx + r * 0.95, sy - r * 1.3), 3.5, 3.5)
        return True
    return False


# ================================================================================================ effects
def draw_fx(p, b, t, font, me_uid):
    """Game-specific effects over the fighters. Returns the fx kinds it drew (the generic ones are drawn by AA)."""
    side = b.game in ("brawl", "race", "volley")
    done = set()
    from . import house_games2_art as GA2
    if b.game in GA2.GAMES2:
        GA2.draw_fx(p, b, t, font, me_uid)
    for e in b.fx:
        k = e["k"]
        u = e["age"] / max(0.01, e.get("dur", 0.5))
        x, y, z = e.get("x", 0), e.get("y", LANE), e.get("z", 0)
        if k == "burst":
            FA.draw_burst(p, e, iso)
            done.add(k)
        elif k == "blade":
            FA.draw_slash(p, e, iso)
            done.add(k)
        elif k == "ringz":
            sx, sy = iso(x, y, z)
            r = e.get("r", 50) * (0.25 + 0.95 * u)
            col = QColor(e.get("col", "#ffffff"))
            col.setAlphaF(max(0.0, 0.9 * (1 - u)))
            p.setPen(QPen(col, 5 * (1 - u) + 1))
            p.setBrush(Qt.NoBrush)
            p.drawEllipse(QPointF(sx, sy), r, r * (0.9 if side else 0.35))
            done.add(k)
        elif k == "skillname":
            sx, sy = iso(x, y, z + 50)
            f2 = QFont(font)
            f2.setPixelSize(15)
            f2.setBold(True)
            p.setFont(f2)
            fm = QFontMetricsF(f2)
            text = e.get("text", "")
            w = fm.horizontalAdvance(text) + 18
            r = QRectF(sx - w / 2, sy - 40 - 14 * u, w, 22)
            col = QColor(e.get("color", "#c4862c"))
            p.setOpacity(max(0.0, 1 - u * u))
            p.setPen(QPen(col, 1.6))
            p.setBrush(QColor(255, 250, 240, 235))
            p.drawRoundedRect(r, 11, 11)
            p.setPen(col.darker(140))
            p.drawText(r, Qt.AlignCenter, text)
            p.setOpacity(1.0)
        elif k == "combo":
            sx, sy = iso(x, y, z + 30)
            f2 = QFont(font)
            f2.setPixelSize(int(16 + min(10, e.get("n", 3))))
            f2.setBold(True)
            f2.setItalic(True)
            p.setFont(f2)
            p.setPen(QColor(255, 210, 60, int(255 * (1 - u))))
            p.drawText(QRectF(sx - 80, sy - 92 - 10 * u, 160, 30), Qt.AlignCenter, "%d 连击！" % e.get("n", 3))
        elif k == "claw":
            sx, sy = iso(x, y, z + 20)
            p.setPen(QPen(QColor(255, 255, 255, int(240 * (1 - u))), 3, Qt.SolidLine, Qt.RoundCap))
            for j in range(3):
                off = (j - 1) * 8
                if e.get("up"):
                    p.drawLine(QPointF(sx + off - 6, sy + 16), QPointF(sx + off + 6, sy - 22 - 10 * u))
                else:
                    p.drawLine(QPointF(sx - 18, sy - 14 + off), QPointF(sx + 20, sy + 4 + off))
        elif k == "dash":
            sx, sy = iso(x, y, z + 20)
            d = e.get("fx", 1)
            p.setPen(QPen(QColor(255, 255, 255, int(200 * (1 - u))), 2))
            for j in range(4):
                yy = sy - 18 + j * 10
                p.drawLine(QPointF(sx - d * (20 + 40 * u), yy), QPointF(sx - d * (60 + 40 * u), yy))
        elif k == "ring2":
            sx, sy = iso(x, y, z)
            r = e.get("r", 26) * (0.6 + u)
            p.setPen(QPen(QColor(255, 255, 255, int(220 * (1 - u))), 2))
            p.setBrush(Qt.NoBrush)
            p.drawEllipse(QPointF(sx, sy), r, r * 0.3)
        elif k == "wave" or (k in ("ring", "boom") and side):
            sx, sy = iso(x, y, z)
            r = e.get("r", 80) * (0.3 + 0.9 * u)
            col = QColor(255, 170, 80) if k == "boom" else QColor(255, 255, 255)
            p.setPen(QPen(QColor(col.red(), col.green(), col.blue(), int(220 * (1 - u))), 4))
            p.setBrush(QColor(col.red(), col.green(), col.blue(), int(60 * (1 - u))) if k == "boom" else Qt.NoBrush)
            p.drawEllipse(QPointF(sx, sy), r, r * 0.28)
            if k != "boom":
                for j in (-1, 1):
                    p.drawArc(QRectF(sx + j * r * 0.5 - 20, sy - 40, 40, 40), 0, 180 * 16)
            done.add(k)
        elif k == "smoke":
            sx, sy = iso(x, y, z + 10)
            p.setPen(Qt.NoPen)
            for j in range(6):
                a = j * math.tau / 6
                p.setBrush(QColor(120, 110, 140, int(170 * (1 - u))))
                p.drawEllipse(QPointF(sx + math.cos(a) * 20 * (0.5 + u), sy - 10 + math.sin(a) * 12 * (0.5 + u)),
                              10 * (1 - u * 0.5), 10 * (1 - u * 0.5))
        elif k == "hiss":
            sx, sy = iso(x, y, z + 30)
            d = e.get("fx", 1)
            p.setBrush(Qt.NoBrush)
            for j in range(3):
                r = 20 + j * 22 + 40 * u
                p.setPen(QPen(QColor(170, 120, 220, int(220 * (1 - u))), 3))
                p.drawArc(QRectF(sx - r, sy - r, 2 * r, 2 * r), (-50 if d > 0 else 130) * 16, 100 * 16)
        elif k == "suck":
            sx, sy = iso(x, y, z + 30)
            p.setPen(QPen(QColor(200, 230, 255, int(200 * (1 - u))), 2))
            for j in range(6):
                a = j * math.tau / 6 + t * 4
                r0 = 160 * (1 - u)
                p.drawLine(QPointF(sx + math.cos(a) * r0, sy + math.sin(a) * r0 * 0.5),
                           QPointF(sx + math.cos(a) * (r0 * 0.6), sy + math.sin(a) * r0 * 0.3))
        elif k == "steam":
            sx, sy = iso(x, y, z + 20)
            p.setPen(Qt.NoPen)
            for j in range(4):
                p.setBrush(QColor(255, 255, 255, int(160 * (1 - u))))
                p.drawEllipse(QPointF(sx + (j - 1.5) * 10, sy - 20 - 40 * u - j * 5), 7, 7)
        elif k == "lob":
            x0, y0, x1, y1 = e.get("x0", 0), e.get("y0", 0), e.get("x1", 0), e.get("y1", 0)
            if u < 1:
                xx, yy = x0 + (x1 - x0) * u, y0 + (y1 - y0) * u
                sx, sy = iso(xx, yy, 60 * math.sin(u * math.pi))
                _yarn_ball(p, sx, sy, 10, t, "#f29a3a")
    fl = getattr(b, "bflash", 0.0)
    if fl > 0.01:                                     # the white-out on a super's finishing blow
        p.fillRect(QRectF(-10, -10, H.PANEL_W + 20, H.PANEL_H + 20), QColor(255, 255, 255, int(170 * min(1.0, fl))))
    # per-fighter overlays
    for fi in b.fighters:
        a = fi.a
        if a.f != b.f or a.traveling is not None or getattr(fi, "hidden", False):
            continue
        h = 46 if a.is_cat else 90
        if b.game == "bomb" and getattr(fi, "trapped", 0) > 0:
            sx, sy = iso(a.x, a.y, 30)
            wob = 2 * math.sin(t * 6)
            g = QRadialGradient(QPointF(sx - 8, sy - 10), 46)
            col = QColor("#b8a3ea")
            g.setColorAt(0, QColor(255, 255, 255, 120))
            g.setColorAt(1, QColor(col.red(), col.green(), col.blue(), 150))
            p.setPen(QPen(QColor("#8a6ad0"), 2))
            p.setBrush(g)
            p.drawEllipse(QPointF(sx, sy - 8), 40 + wob, 44 - wob)
            p.setPen(QPen(QColor(255, 255, 255, 120), 1.4))
            for j in range(4):
                p.drawArc(QRectF(sx - 34, sy - 46 + j * 10, 68, 70), (20 + j * 30) * 16, 140 * 16)
            f2 = QFont(font)
            f2.setPixelSize(11)
            f2.setBold(True)
            p.setFont(f2)
            p.setPen(QColor("#5e4436"))
            p.drawText(QRectF(sx - 30, sy - 70, 60, 14), Qt.AlignCenter, "%.0f" % max(0, math.ceil(fi.trapped)))
        if b.game == "shoot" and fi.st == "ko":
            sx, sy = iso(a.x, a.y, 0)
            p.setPen(pen("#9fb4c8", 1.2))
            p.setBrush(QColor(255, 255, 255, 235))
            p.drawEllipse(QPointF(sx, sy - 22), 24, 22)
            p.drawEllipse(QPointF(sx, sy - 54), 17, 16)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#2a2420"))
            p.drawEllipse(QPointF(sx - 5, sy - 57), 2, 2)
            p.drawEllipse(QPointF(sx + 5, sy - 57), 2, 2)
            p.setBrush(QColor("#f29a3a"))
            p.drawPolygon(poly((sx, sy - 52), (sx + 12, sy - 50), (sx, sy - 48)))
        if b.game == "race":
            sx, sy = iso(a.x, a.y, fi.z)
            if getattr(fi, "shield", 0) > 0:
                p.setPen(QPen(QColor(120, 220, 255, 170), 2))
                p.setBrush(QColor(120, 220, 255, 35))
                p.drawEllipse(QPointF(sx, sy - h * 0.5), h * 0.45 + 8, h * 0.6)
            if getattr(fi, "skate", 0) > 0:
                p.setPen(pen("#5e4436", 1))
                p.setBrush(QColor("#f2c94c"))
                p.drawRoundedRect(QRectF(sx - 20, sy - 4, 40, 6), 3, 3)
                p.setBrush(QColor("#333333"))
                p.drawEllipse(QPointF(sx - 13, sy + 3), 3, 3)
                p.drawEllipse(QPointF(sx + 13, sy + 3), 3, 3)
            if getattr(fi, "boost", 0) > 0 or getattr(fi, "sprint", 0) > 0:
                d = getattr(fi, "face", 1)
                p.setPen(QPen(QColor(255, 255, 255, 170), 2))
                for j in range(3):
                    yy = sy - 12 - j * 14
                    p.drawLine(QPointF(sx - d * 22, yy), QPointF(sx - d * 48, yy))
            if getattr(fi, "superjump", False):
                p.setPen(QColor("#ffd34c"))
                f2 = QFont(font)
                f2.setPixelSize(14)
                p.setFont(f2)
                p.drawText(QPointF(sx - 8, sy + 16), "🌟")
        if b.game == "brawl":
            sx, sy = iso(a.x, a.y, fi.z)
            if fi.st == "super" or getattr(fi, "armor", False):
                g = QRadialGradient(QPointF(sx, sy - h * 0.5), h * 0.8)
                col = QColor(HG.CHARS.get(fi.char, {}).get("color", "#f2b630"))
                g.setColorAt(0, QColor(col.red(), col.green(), col.blue(), 90))
                g.setColorAt(1, QColor(col.red(), col.green(), col.blue(), 0))
                p.setPen(Qt.NoPen)
                p.setBrush(g)
                p.drawEllipse(QPointF(sx, sy - h * 0.5), h * 0.8, h * 0.8)
            if fi.st == "block":
                d = getattr(fi, "face", 1)
                p.setPen(QPen(QColor(160, 200, 255, 210), 3))
                p.setBrush(Qt.NoBrush)
                p.drawArc(QRectF(sx - 10 + d * 6 - h * 0.35, sy - h * 0.9, h * 0.7, h * 0.9), (-60 if d > 0 else 120) * 16,
                          120 * 16)
            if getattr(fi, "meter", 0) >= 100 and int(t * 4) % 2 == 0:
                p.setPen(QColor("#ffd34c"))
                f2 = QFont(font)
                f2.setPixelSize(12)
                f2.setBold(True)
                p.setFont(f2)
                p.drawText(QRectF(sx - 40, sy - h - 34, 80, 14), Qt.AlignCenter, "★ 大招就绪")
            sk = (getattr(fi, "data", None) or {}).get("sk")
            if sk == "tele":
                k = 0.5 + 0.5 * math.sin(t * 14)
                p.setPen(Qt.NoPen)
                p.setBrush(QColor(255, 120, 80, int(120 * k)))
                p.drawEllipse(QPointF(sx, sy - h * 0.5), h * 0.6, h * 0.6)
            if sk == "roll" and fi.st == "skill":
                _yarn_ball(p, sx, sy - 20, 22, t * 12, "#a8876a")
            if sk == "spatula" and fi.st == "skill":
                a0 = t * 18
                p.setPen(QPen(QColor("#6f685d"), 3))
                for j in range(2):
                    aa = a0 + j * math.pi
                    p.drawLine(QPointF(sx, sy - h * 0.55), QPointF(sx + math.cos(aa) * 60, sy - h * 0.55 + math.sin(aa) * 18))
            if sk in ("vacuum", "s_clean") and fi.st in ("skill", "super"):
                d = getattr(fi, "face", 1)
                p.setPen(pen("#5e4436", 1))
                p.setBrush(QColor("#e4639b"))
                p.drawRoundedRect(QRectF(sx + d * 10 - 10, sy - h * 0.45, 20, 14), 4, 4)
                p.setPen(QPen(QColor("#6f685d"), 3))
                p.drawLine(QPointF(sx + d * 12, sy - h * 0.4), QPointF(sx + d * 46, sy - h * 0.15))
            if sk == "pole" and fi.st == "skill":
                d = getattr(fi, "face", 1)
                p.setPen(QPen(QColor("#c7a27a"), 4, Qt.SolidLine, Qt.RoundCap))
                p.drawLine(QPointF(sx + d * 8, sy - h * 0.55), QPointF(sx + d * 120, sy - h * 1.9))
            if sk == "bounce" and fi.st == "skill":
                p.setPen(pen("#9c2e24", 1))
                p.setBrush(QColor("#e8473f"))
                p.drawEllipse(QPointF(sx, sy + 6), 16, 14)
            if sk == "s_sofa" and fi.st == "super" and fi.t < 0.45 if hasattr(fi, "t") else False:
                p.setPen(pen("#5e4436", 1.4))
                p.setBrush(QColor("#8fb7a0"))
                p.drawRoundedRect(QRectF(sx - 56, sy - h - 40, 112, 34), 8, 8)
    return done


def draw_head_hints(p, b, t, font, me_uid):
    from . import house_arena_art as AA
    me = next((fi for fi in b.fighters if fi.uid == me_uid), None)
    if me is None or me.a.f != b.f or not me.alive() or b.phase != "fight" or getattr(me, "hidden", False):
        return
    g = b.game
    sx, sy = iso(me.a.x, me.a.y, getattr(me, "z", 0) + (70 if me.a.is_cat else 104))
    if g == "bomb":
        if getattr(me, "trapped", 0) > 0:
            if getattr(me, "needles", 0) > 0:
                AA.bubble_hint(p, sx, sy - 20, "E", "用针自救！", font, hot=True)
            else:
                AA.bubble_hint(p, sx, sy - 20, "!", "等队友来救" if b.mode != "ffa" else "被困住了……", font)
    elif g == "shoot":
        if getattr(me, "ammo", 1) <= 0:
            AA.bubble_hint(p, sx, sy, "E", "捏雪球", font, hot=int(t * 3) % 2 == 0)
        elif me.hold:
            AA.bubble_hint(p, sx, sy, "E", "扔毛线炸弹", font, hot=True)
        elif getattr(me, "ammo", 6) < 6 and AA.near_pile(b, me):
            AA.bubble_hint(p, sx, sy, "E", "装满雪球", font)
        if me.st == "charge" and getattr(me, "charge", 0) > 0:
            k = min(1.0, me.charge)
            bx, by = iso(me.a.x, me.a.y, 0)
            r = QRectF(bx - 24, by + 10, 48, 6)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(0, 0, 0, 70))
            p.drawRoundedRect(r, 3, 3)
            p.setBrush(QColor("#6fb3e6") if k < 1 else QColor("#e8473f"))
            p.drawRoundedRect(QRectF(r.left(), r.top(), r.width() * k, r.height()), 3, 3)
    elif g == "race":
        if getattr(me, "item", None):
            AA.bubble_hint(p, sx, sy, "E", {"banana": "🍌 往后扔", "yarn": "🧶 往前滚", "fish": "🐟 加速"}.get(me.item, ""),
                           font, hot=True)
    elif g in ("defend", "paint", "soccer", "fish", "hide", "volley"):
        from . import house_games2_art as GA2
        GA2.head_hints(p, b, t, font, me_uid)
    elif g == "brawl":
        if getattr(me, "held_item", None):
            AA.bubble_hint(p, sx, sy, "E", "扔玩偶", font, hot=True)
        elif getattr(me, "meter", 0) >= 100:
            AA.bubble_hint(p, sx, sy, "J+K", "大招！", font, hot=int(t * 3) % 2 == 0)
    tr = getattr(b, "train", None)
    if tr is not None and g == "brawl":
        for fi in b.fighters:
            if fi.uid != tr.get("uid") and (getattr(fi, "data", None) or {}).get("sk") == "tele":
                sx2, sy2 = iso(fi.a.x, fi.a.y, getattr(fi, "z", 0) + (70 if fi.a.is_cat else 104))
                AA.bubble_hint(p, sx2, sy2, "L", "快按住 L 挡住！", font, hot=True)
    if tr is not None and g == "shoot":
        for fi in b.fighters:
            if fi.uid != tr.get("uid") and b.TRAIN_STEPS and tr.get("i", 0) < len(b.TRAIN_STEPS) and \
                    b.TRAIN_STEPS[tr["i"]][0] == "crouch" if hasattr(b, "TRAIN_STEPS") and b.TRAIN_STEPS else False:
                sx2, sy2 = iso(fi.a.x, fi.a.y, 104)
                AA.bubble_hint(p, sx2, sy2, "!", "我要扔你了", font)


# ================================================================================================ HUD
def draw_hud(p, b, w, h, font, small, me_uid, U, now, card=False, ready=False):
    from . import house_arena_art as AA
    from .house_battle import TEAM_COLORS, TEAM_NAMES
    g = b.game
    fs = list(b.fighters)
    me = next((fi for fi in fs if fi.uid == me_uid), None)
    fm = QFontMetricsF(small)
    y0 = 64 * U
    from . import house_games2_art as GA2
    if g == "race":
        _race_hud(p, b, w, h, small, U, me)
    elif g in GA2.GAMES2:
        GA2.hud(p, b, w, h, font, small, me_uid, U, now)
    else:
        n = len(fs)
        cw = min(250 * U, (w - 40 * U) / max(1, n))
        x0 = (w - cw * n) / 2
        ch = 50 * U
        for i, fi in enumerate(fs):
            r = QRectF(x0 + i * cw + 4 * U, y0, cw - 8 * U, ch)
            col = QColor(TEAM_COLORS.get(fi.team, "#999"))
            p.setPen(QPen(col, 2.4 if fi.uid == me_uid else 1.2))
            p.setBrush(QColor(255, 250, 240, 228))
            p.drawRoundedRect(r, 10, 10)
            p.setFont(small)
            p.setPen(QColor("#5e4436"))
            tag = "（我）" if fi.uid == me_uid else ("（AI）" if str(fi.ctrl).startswith("ai:") else "")
            pal = getattr(fi, "pal", None)
            if pal:
                from . import house_pals as PL
                tag += " " + PL.PALS.get(pal, {}).get("icon", "")
            p.drawText(QRectF(r.left() + 10, r.top() + 2 * U, r.width() - 20, 18 * U), Qt.AlignLeft | Qt.AlignVCenter,
                       fi.a.name + tag)
            left = max(0, b.kos_to_win - fi.kos) if b.mode == "ffa" else None
            sc = "★" * fi.score
            p.drawText(QRectF(r.left() + 10, r.top() + 2 * U, r.width() - 20, 18 * U), Qt.AlignRight | Qt.AlignVCenter,
                       ("♥" * left if left is not None else "") + (" " + sc if sc else ""))
            if g == "brawl":
                _bar(p, QRectF(r.left() + 10, r.top() + 21 * U, r.width() - 20, 9 * U), fi.hp / max(1, fi.maxhp), "hp")
                m = getattr(fi, "meter", 0.0) / 100.0
                mb = QRectF(r.left() + 10, r.top() + 33 * U, (r.width() - 20) * 0.5, 7 * U)
                _bar(p, mb, m, "meter", now)
                cds = getattr(fi, "cds", {}) or {}
                sks = HG.SKILLS["brawl"][fi.char]
                for j, key in enumerate(("k", "uk", "dk")):
                    cr = QRectF(mb.right() + 6 + j * ((r.right() - 10 - mb.right() - 6) / 3), r.top() + 30 * U,
                                (r.right() - 10 - mb.right() - 6) / 3 - 3, 14 * U)
                    cdv = cds.get(key, 0.0)
                    p.setPen(QPen(QColor("#9a8a76"), 1))
                    p.setBrush(QColor(255, 236, 170) if cdv <= 0 else QColor(220, 214, 204))
                    p.drawRoundedRect(cr, 4, 4)
                    f2 = QFont(small)
                    f2.setPixelSize(int(10 * U))
                    p.setFont(f2)
                    p.setPen(QColor("#5e4436"))
                    p.drawText(cr, Qt.AlignCenter, sks[j]["icon"] + ("%.0f" % math.ceil(cdv) if cdv > 0 else ""))
                if fi.uid == me_uid and getattr(fi, "combo_n", 0) >= 2 and getattr(fi, "combo_t", 0) > 0:
                    f2 = QFont(font)
                    f2.setPixelSize(int(22 * U))
                    f2.setBold(True)
                    f2.setItalic(True)
                    p.setFont(f2)
                    p.setPen(QColor(60, 30, 20, 160))
                    p.drawText(QRectF(r.left(), r.bottom() + 4 * U + 1.5, r.width(), 30 * U), Qt.AlignCenter,
                               "%d 连击！" % fi.combo_n)
                    p.setPen(QColor("#ffcf3a"))
                    p.drawText(QRectF(r.left(), r.bottom() + 4 * U, r.width(), 30 * U), Qt.AlignCenter,
                               "%d 连击！" % fi.combo_n)
            elif g == "bomb":
                f2 = QFont(small)
                f2.setPixelSize(int(12 * U))
                p.setFont(f2)
                p.setPen(QColor("#5e4436"))
                text = "💣%d  🔥%d  👟%d  📍%d" % (getattr(fi, "nb", 1), getattr(fi, "fire", 2), getattr(fi, "spd", 0),
                                                  getattr(fi, "needles", 0))
                if getattr(fi, "trapped", 0) > 0:
                    text = "🧶 被困住了！"
                elif fi.st == "ko":
                    text = "出局，马上回来"
                elif fi.st == "out":
                    text = "出局"
                p.drawText(QRectF(r.left() + 10, r.top() + 22 * U, r.width() - 20, 24 * U), Qt.AlignLeft | Qt.AlignVCenter,
                           text)
                sk = HG.SKILLS["bomb"][fi.char][0]
                cdv = (getattr(fi, "cds", {}) or {}).get("k", 0)
                _chip(p, QRectF(r.right() - 58 * U, r.top() + 25 * U, 48 * U, 17 * U), sk["icon"] +
                      ("%.0f" % math.ceil(cdv) if cdv > 0 else "✓"), cdv <= 0, small, U)
            elif g == "shoot":
                _bar(p, QRectF(r.left() + 10, r.top() + 21 * U, r.width() - 20, 9 * U), fi.hp / max(1, fi.maxhp), "hp")
                f2 = QFont(small)
                f2.setPixelSize(int(11 * U))
                p.setFont(f2)
                am = getattr(fi, "ammo", 0)
                for j in range(6):
                    p.setPen(QPen(QColor("#9fb4c8"), 1))
                    p.setBrush(QColor("#ffffff") if j < am else QColor(0, 0, 0, 30))
                    p.drawEllipse(QPointF(r.left() + 16 + j * 13 * U, r.top() + 38 * U), 5 * U, 5 * U)
                sk = HG.SKILLS["shoot"][fi.char][0]
                cdv = (getattr(fi, "cds", {}) or {}).get("k", 0)
                _chip(p, QRectF(r.right() - 58 * U, r.top() + 31 * U, 48 * U, 15 * U), sk["icon"] +
                      ("%.0f" % math.ceil(cdv) if cdv > 0 else "✓"), cdv <= 0, small, U)
        # clock and score
        p.setFont(small)
        if getattr(b, "train", None) is not None:
            text = "🎓 训练中"
        elif b.mode != "ffa":
            teams = sorted(set(fi.team for fi in fs))
            sc = " : ".join("%d" % sum(f.score for f in fs if f.team == tm) for tm in teams)
            text = "%s   ⏱ %d" % (sc, max(0, int(b.limit - b.clock)))
        else:
            text = "⏱ %d" % max(0, int(b.limit - b.clock))
        tw = fm.horizontalAdvance(text) + 30
        tr_ = QRectF((w - tw) / 2, y0 + ch + 4 * U, tw, 22 * U)
        if g == "brawl" and me is not None and getattr(me, "combo_n", 0) >= 2 and getattr(me, "combo_t", 0) > 0:
            tr_ = QRectF(w - tw - 20 * U, y0 + ch + 4 * U, tw, 22 * U)
        p.setPen(QPen(QColor("#9a8a76"), 1))
        p.setBrush(QColor(255, 250, 240, 230))
        p.drawRoundedRect(tr_, tr_.height() / 2, tr_.height() / 2)
        p.setPen(QColor("#5e4436"))
        p.drawText(tr_, Qt.AlignCenter, text)
    rects = _common_hud(p, b, w, h, font, small, me, U, now, card, ready, me_uid)
    if getattr(b, "cutin", None):
        _cutin(p, b, w, h, font, U)
    return rects


def _chip(p, r, text, hot, small, U):
    p.setPen(QPen(QColor("#9a8a76"), 1))
    p.setBrush(QColor(255, 236, 170) if hot else QColor(220, 214, 204))
    p.drawRoundedRect(r, 5, 5)
    f2 = QFont(small)
    f2.setPixelSize(int(10.5 * U))
    p.setFont(f2)
    p.setPen(QColor("#5e4436"))
    p.drawText(r, Qt.AlignCenter, text)


def _bar(p, r, k, kind, now=0.0):
    k = max(0.0, min(1.0, k))
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(0, 0, 0, 40))
    p.drawRoundedRect(r, 4, 4)
    if kind == "hp":
        col = QColor("#5fd36a") if k > 0.5 else (QColor("#f2c94c") if k > 0.25 else QColor("#e8473f"))
    else:
        col = QColor("#f2b630") if k < 1 else (QColor("#ff8a3a") if int(now * 4) % 2 else QColor("#ffd34c"))
    p.setBrush(col)
    p.drawRoundedRect(QRectF(r.left(), r.top(), r.width() * k, r.height()), 4, 4)


def _race_hud(p, b, w, h, small, U, me):
    from .house_battle import TEAM_COLORS
    rank = sorted(b.fighters, key=lambda f: (getattr(f, "place", None) or 99, -getattr(f, "prog", 0)))
    laps = getattr(b, "laps", 3)
    y = 64 * U
    lr = QRectF(14 * U, y, 190 * U, (24 + 22 * len(rank)) * U)
    p.setPen(QPen(QColor("#9a8a76"), 1))
    p.setBrush(QColor(255, 250, 240, 225))
    p.drawRoundedRect(lr, 10, 10)
    p.setFont(small)
    p.setPen(QColor("#6b3f1a"))
    p.drawText(QRectF(lr.left() + 10, y + 2 * U, lr.width() - 20, 20 * U), Qt.AlignLeft | Qt.AlignVCenter,
               "🏁 名次" if b.train is None else "🎓 练习")
    f2 = QFont(small)
    f2.setPixelSize(int(12 * U))
    p.setFont(f2)
    for i, fi in enumerate(rank):
        yy = y + (24 + i * 22) * U
        col = QColor(TEAM_COLORS.get(fi.team, "#999"))
        p.setPen(Qt.NoPen)
        p.setBrush(col)
        p.drawEllipse(QPointF(lr.left() + 14 * U, yy + 9 * U), 4 * U, 4 * U)
        p.setPen(QColor("#2e6b36") if getattr(fi, "place", None) else QColor("#5e4436"))
        lap = min(laps, getattr(fi, "lap", 0) + 1)
        item = {"banana": "🍌", "yarn": "🧶", "fish": "🐟"}.get(getattr(fi, "item", None), "")
        txt = "%d. %s%s" % (i + 1, fi.a.name, "（我）" if me is fi else "")
        right = ("🏁" if getattr(fi, "place", None) else ("圈 %d/%d" % (lap, laps) if b.train is None else "")) + " " + item
        p.drawText(QRectF(lr.left() + 24 * U, yy, lr.width() - 30 * U, 18 * U), Qt.AlignLeft | Qt.AlignVCenter, txt)
        p.drawText(QRectF(lr.left() + 24 * U, yy, lr.width() - 34 * U, 18 * U), Qt.AlignRight | Qt.AlignVCenter, right)
    if me is not None and b.train is None:
        pos = rank.index(me) + 1
        text = "第 %d 圈 / %d   ·   第 %d 名" % (min(laps, getattr(me, "lap", 0) + 1), laps, pos)
        f3 = QFont(small)
        f3.setPixelSize(int(15 * U))
        f3.setBold(True)
        p.setFont(f3)
        fm = QFontMetricsF(f3)
        tw = fm.horizontalAdvance(text) + 36
        r = QRectF((w - tw) / 2, y, tw, 26 * U)
        p.setPen(QPen(QColor("#c4862c"), 1.4))
        p.setBrush(QColor(255, 248, 232, 235))
        p.drawRoundedRect(r, r.height() / 2, r.height() / 2)
        p.setPen(QColor("#6b3f1a"))
        p.drawText(r, Qt.AlignCenter, text)


def _common_hud(p, b, w, h, font, small, me, U, now, card, ready, me_uid):
    """Count-down, banners, result, buttons, key bar, controls card, tutorial panel."""
    from . import house_arena_art as AA
    big = None
    ct = getattr(b, "count_t", 0)
    if b.phase == "count" and ct > 3.0:
        hs = b.humans() if hasattr(b, "humans") else set()
        rd = getattr(b, "ready", set())
        big = "等大家准备好…（%d/%d）" % (len(rd & hs), len(hs)) if me is None or ready else None
    elif b.phase == "count":
        big = str(max(1, int(math.ceil(ct))))
    elif b.phase == "travel":
        big = "出发！"
    elif b.banner and (b.banner.get("until", 0) > b.t if hasattr(b, "t") else True):
        big = b.banner["text"]
    if big:
        f2 = QFont(font)
        f2.setPixelSize(int(40 * U) if len(big) < 4 else int(26 * U))
        f2.setBold(True)
        p.setFont(f2)
        r = QRectF(0, h * 0.36, w, 56 * U)
        if len(big) >= 4:
            bw = QFontMetricsF(f2).horizontalAdvance(big) + 56 * U
            pr = QRectF((w - bw) / 2, r.top() + 4 * U, bw, r.height() - 8 * U)
            if b.phase == "over":
                xl = _result_lines(b, me)
                pr = QRectF(min(pr.left(), w / 2 - 190 * U), pr.top(), max(bw, 380 * U),
                            r.height() + (64 + 24 * len(xl)) * U)
            p.setPen(QPen(QColor("#c4862c"), 2))
            p.setBrush(QColor(255, 246, 225, 238))
            p.drawRoundedRect(pr, 18 * U, 18 * U)
            p.setPen(QColor("#6b3f1a"))
            p.drawText(r, Qt.AlignCenter, big)
            if b.phase == "over":
                p.setFont(small)
                for j, line in enumerate(_result_lines(b, me)):
                    p.setPen(QColor("#b0641a") if line.startswith("解锁") else QColor("#8a6a4a"))
                    p.drawText(QRectF(0, r.bottom() - 4 * U + j * 24 * U, w, 22 * U), Qt.AlignCenter, line)
        else:
            p.setPen(QColor(60, 30, 20, 180))
            p.drawText(r.translated(2, 2), Qt.AlignCenter, big)
            p.setPen(QColor("#fff2c4"))
            p.drawText(r, Qt.AlignCenter, big)
    rects = {}
    trn = getattr(b, "train", None)
    if trn is not None and b.phase == "fight":
        AA.draw_train_panel(p, b, w, h, small, U, trn, now)
    if b.phase == "over":
        nl = len(_result_lines(b, me))
        again = "⟳ 再练一次" if trn is not None else "⟳ 再来一局"
        for j, (key, label) in enumerate((("again", again), ("home", "⌂ 回家"))):
            r = QRectF(w / 2 - 130 * U + j * 140 * U, h * 0.36 + (62 + 24 * nl) * U, 120 * U, 32 * U)
            p.setPen(QPen(QColor("#6b4a3a"), 1.6))
            p.setBrush(QColor("#ffd99a"))
            p.drawRoundedRect(r, r.height() / 2, r.height() / 2)
            p.setFont(small)
            p.setPen(QColor("#6b4a3a"))
            p.drawText(r, Qt.AlignCenter, label)
            rects[key] = r
    else:
        qr = QRectF(w - 84 * U, 66 * U if b.game != "race" else 66 * U, 70 * U, 22 * U)
        if b.game != "race":
            qr = QRectF(w - 84 * U, h - 92 * U, 70 * U, 22 * U)
        p.setFont(small)
        p.setPen(QPen(QColor("#9a8a76"), 1))
        p.setBrush(QColor(255, 250, 240, 230))
        p.drawRoundedRect(qr, qr.height() / 2, qr.height() / 2)
        p.setPen(QColor("#8a2e24"))
        p.drawText(qr, Qt.AlignCenter, "✕ 结束")
        rects["home"] = qr
    if b.phase in ("fight", "count") and me is not None:
        draw_bar(p, b, me, w, h, small, U, now)
    if me is not None and b.phase in ("travel", "count", "fight") and \
            (card or (b.phase in ("travel", "count") and not ready)):
        draw_card(p, b, me, w, h, font, small, U, now, waiting=b.phase != "fight" and not ready)
    return rects


def _result_lines(b, me):
    """Under the result: the race ranking, my record in this game, achievements just unlocked."""
    res = b.result or {}
    out = []
    if res.get("rank"):
        out.append(res["rank"])
    recs = res.get("recs") or {}
    key = me.uid if me is not None else None
    out += list(recs.get(key) or recs.get("_train") or [])
    return out[:3]


def _sub_for(b, me, key, base):
    """Live text for a slot of the key bar."""
    g = b.game
    if key == "K":
        sks = HG.skills(g, me.char)
        if g == "brawl":
            return " / ".join(s["name"] for s in sks[:3])
        if g == "hide" and len(sks) > 1:
            return sks[1 if getattr(me, "role", "") == "seek" else 0]["name"]
        return sks[0]["name"] if sks else ""
    if g == "paint" and key == "J":
        return "颜料 %d%%" % int(getattr(me, "ink", 100))
    if g == "fish" and key == "E":
        return "抱着 %d 条" % len(getattr(me, "fish", None) or []) if getattr(me, "fish", None) else "手里没鱼"
    if g == "hide" and key in ("E", "J"):
        role = getattr(me, "role", "")
        if key == "E":
            return "出来" if getattr(me, "spot", None) is not None else ("躲进家具" if role == "hide" else "（躲的人用）")
        return "搜家具 / 抓人" if role == "seek" else "（找的人用）"
    if g == "soccer" and key == "J":
        return "带球：传 / 按住射" if (getattr(b, "ball", None) or {}).get("own") == me.uid else "伸脚抢球"
    if g == "volley" and key == "E":
        return "现在发球！" if (getattr(b, "ball", None) or {}).get("held") == me.uid else "轮到你时发球"
    if g == "bomb" and key == "J":
        return "还能放 %d 颗" % max(0, getattr(me, "nb", 1) - sum(1 for o in getattr(b, "obst", [])
                                                                if o.get("k") == "b_bomb" and False))
    if g == "shoot" and key == "J":
        return "剩 %d 个 · 按住蓄力" % getattr(me, "ammo", 0)
    if g == "shoot" and key == "E":
        return "雪球堆旁装满" if getattr(me, "ammo", 6) < 6 else "雪球是满的"
    if g == "race" and key == "E":
        return {"banana": "🍌 香蕉皮", "yarn": "🧶 毛线球", "fish": "🐟 加速"}.get(getattr(me, "item", None), "撞问号箱拿")
    if g == "race" and key == "J":
        return "冲刺"
    if g == "bomb" and key == "E":
        return "针 ×%d" % getattr(me, "needles", 0)
    if g == "brawl" and key == "J+K":
        return "怒气 %d%%" % int(getattr(me, "meter", 0))
    return base


def draw_bar(p, b, me, w, h, small, U, now):
    from . import house_arena_art as AA
    g = b.game
    slots = HG.BAR[g]
    cds = getattr(me, "cds", {}) or {}
    sw, sh, gap = 118 * U, 44 * U, 6 * U
    total = len(slots) * sw + (len(slots) - 1) * gap
    x = (w - total) / 2
    y = h - sh - 8 * U
    back = QRectF(x - 8 * U, y - 6 * U, total + 16 * U, sh + 12 * U)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(60, 40, 30, 165))
    p.drawRoundedRect(back, 14 * U, 14 * U)
    f_t = QFont(small)
    f_t.setPixelSize(int(12.5 * U))
    f_t.setBold(True)
    f_s = QFont(small)
    f_s.setPixelSize(int(10 * U))
    st = me.st
    for key, title, sub in slots:
        hot, dim, prog = False, False, None
        if key == "K":
            cdv = cds.get("k", 0.0)
            sks = HG.skills(g, me.char)
            if g == "hide" and len(sks) > 1:
                sks = [sks[1]] if getattr(me, "role", "") == "seek" else [sks[0]]
            title = (sks[0]["icon"] + " 技能") if sks else "技能"
            hot = cdv <= 0
            dim = cdv > 0 and g != "brawl"
            if cdv > 0 and sks:
                prog = 1 - cdv / max(0.1, sks[0]["cd"])
        elif key == "J+K":
            m = getattr(me, "meter", 0)
            hot = m >= 100
            prog = m / 100.0
        elif key == "J":
            hot = st in ("atk", "charge", "throw", "place")
            if g == "shoot" and st == "charge":
                prog = getattr(me, "charge", 0)
            if g == "shoot" and getattr(me, "ammo", 1) <= 0:
                dim = True
        elif key == "E":
            if g == "shoot":
                hot = getattr(me, "ammo", 6) <= 0 or bool(me.hold)
            elif g == "race":
                hot = bool(getattr(me, "item", None))
                dim = not hot
            elif g == "bomb":
                hot = getattr(me, "trapped", 0) > 0 and getattr(me, "needles", 0) > 0
                dim = getattr(me, "needles", 0) <= 0
            elif g == "brawl":
                hot = bool(getattr(me, "held_item", None))
            elif g == "fish":
                hot = bool(getattr(me, "fish", None))
                dim = not hot
            elif g == "hide":
                hot = getattr(me, "role", "") == "hide"
                dim = not hot
            elif g == "volley":
                hot = (getattr(b, "ball", None) or {}).get("held") == me.uid
            elif g == "paint":
                hot = getattr(me, "ink", 0) >= 35
                dim = not hot
            elif g == "defend":
                from .house_defend import to_castle
                hot = to_castle(me.a.x, me.a.y)[0] < 48
        elif key == "L":
            hot = st in ("block", "crouch", "dash", "roll", "slide", "kick")
        elif key == "空格":
            hot = st in ("air", "jump", "hop")
        sub = _sub_for(b, me, key, sub)
        r = QRectF(x, y, sw, sh)
        p.setPen(QPen(QColor("#f2b630") if hot else QColor(255, 255, 255, 50), 2 if hot else 1))
        p.setBrush(QColor(255, 250, 240, 245) if not dim else QColor(235, 228, 218, 200))
        p.drawRoundedRect(r, 9 * U, 9 * U)
        if prog is not None:
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(242, 182, 48, 130))
            p.drawRoundedRect(QRectF(r.left(), r.bottom() - 6 * U, r.width() * max(0.0, min(1.0, prog)), 6 * U), 3, 3)
        kw = (24 if len(key) == 1 else 42) * U
        AA.keycap(p, QRectF(r.left() + 6 * U, r.top() + 8 * U, kw, 26 * U), key, f_t, hot=hot, dim=dim)
        tx = r.left() + kw + 12 * U
        p.setFont(f_t)
        p.setPen(QColor("#5e4436") if not dim else QColor("#9a8a76"))
        p.drawText(QRectF(tx, r.top() + 4 * U, r.right() - tx - 4, 20 * U), Qt.AlignLeft | Qt.AlignVCenter, title)
        p.setFont(f_s)
        p.setPen(QColor("#8a7a68"))
        p.drawText(QRectF(tx, r.top() + 22 * U, r.right() - tx - 2, 18 * U), Qt.AlignLeft | Qt.AlignVCenter, sub)
        x += sw + gap


def draw_card(p, b, me, w, h, font, small, U, now, waiting=False):
    from . import house_arena_art as AA
    g = b.game
    ch_ = HG.CHARS[me.char]
    sks = HG.skills(g, me.char)
    rows = []
    for key, text in HG.CONTROLS[g]:
        if text == "{K}":
            if g in ("brawl", "hide"):
                for s in sks[:3]:
                    rows.append((s["slot"], "%s %s：%s（冷却 %d 秒）" % (s["icon"], s["name"], s["desc"], s["cd"])))
                continue
            s = sks[0]
            rows.append(("K", "%s 技能「%s」：%s（冷却 %d 秒）" % (s["icon"], s["name"], s["desc"], s["cd"])))
            continue
        if key == "J+K" and g == "brawl":
            s = sks[3]
            rows.append(("J+K", "%s 大招「%s」：%s" % (s["icon"], s["name"], s["desc"])))
            continue
        rows.append((key, text))
    step = 30
    cw, chh = min(w - 60 * U, 700 * U), (72 + step * len(rows) + 52) * U
    top, bot = 66 * U, h - 64 * U
    r = QRectF((w - cw) / 2, max(top, top + (bot - top - chh) / 2), cw, min(chh, bot - top))
    p.setPen(QPen(QColor(ch_["color"]), 2.4))
    p.setBrush(QColor(255, 248, 232, 250))
    p.drawRoundedRect(r, 16 * U, 16 * U)
    f_b = QFont(font)
    f_b.setPixelSize(int(18 * U))
    f_b.setBold(True)
    p.setFont(f_b)
    p.setPen(QColor("#6b3f1a"))
    gm = HG.GAMES[g]
    p.drawText(QRectF(r.left() + 20 * U, r.top() + 10 * U, r.width() - 40 * U, 28 * U), Qt.AlignLeft | Qt.AlignVCenter,
               "%s %s · 你是 %s" % (gm["icon"], gm["name"], me.a.name))
    p.setFont(small)
    p.setPen(QColor("#8a7a68"))
    p.drawText(QRectF(r.left() + 20 * U, r.top() + 38 * U, r.width() - 40 * U, 22 * U), Qt.AlignLeft | Qt.AlignVCenter,
               "%s · %s　|　%s" % (ch_["name"], ch_["style"], gm["rule"]))
    y = r.top() + 64 * U
    f_r = QFont(small)
    f_r.setPixelSize(int(12.5 * U))
    for key, text in rows:
        kw = (28 if len(key) <= 1 else (44 if len(key) <= 3 else 56)) * U
        AA.keycap(p, QRectF(r.left() + 20 * U, y + 3 * U, kw, 24 * U), key, f_r, hot=key in ("J", "K", "↑K", "↓K", "J+K"))
        p.setFont(f_r)
        p.setPen(QColor("#5e4436"))
        p.drawText(QRectF(r.left() + 20 * U + 64 * U, y, r.width() - 104 * U, 30 * U),
                   Qt.AlignLeft | Qt.AlignVCenter | Qt.TextWordWrap, text)
        y += step * U
    fr = QRectF(r.left() + 20 * U, r.bottom() - 36 * U, r.width() - 40 * U, 26 * U)
    if waiting:
        pulse = 0.5 + 0.5 * math.sin(now * 5)
        p.setPen(QPen(QColor("#c4862c"), 1.6))
        p.setBrush(QColor(255, int(205 + 30 * pulse), int(120 + 40 * pulse)))
        p.drawRoundedRect(fr, fr.height() / 2, fr.height() / 2)
        f_g = QFont(small)
        f_g.setBold(True)
        p.setFont(f_g)
        p.setPen(QColor("#6b3f1a"))
        p.drawText(fr, Qt.AlignCenter, "看懂了？按 J 准备好！（中途随时按 H 再看）")
    else:
        p.setPen(QColor("#9a8a76"))
        p.setFont(small)
        p.drawText(fr, Qt.AlignCenter, "按 H 关上")


def _cutin(p, b, w, h, font, U):
    c = b.cutin
    dur = c.get("dur", 1.0)
    u = 1 - max(0.0, c.get("t", 0)) / dur
    ch_ = HG.CHARS.get(c.get("char"), {"color": "#f2b630"})
    p.save()
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(0, 0, 0, int(120 * min(1.0, u * 4) * min(1.0, (1 - u) * 6))))
    p.drawRect(QRectF(0, 0, w, h))
    # the band
    k_in = min(1.0, u * 5)
    k_out = min(1.0, (1 - u) * 6)
    band_h = 150 * U * min(k_in, k_out)
    cy = h * 0.5
    col = QColor(ch_["color"])
    path = QPainterPath()
    path.moveTo(0, cy - band_h / 2 + 20 * U)
    path.lineTo(w, cy - band_h / 2 - 20 * U)
    path.lineTo(w, cy + band_h / 2 - 20 * U)
    path.lineTo(0, cy + band_h / 2 + 20 * U)
    path.closeSubpath()
    g = QLinearGradient(0, 0, w, 0)
    g.setColorAt(0, col.darker(160))
    g.setColorAt(0.5, col)
    g.setColorAt(1, col.darker(160))
    p.setBrush(g)
    p.drawPath(path)
    p.setClipPath(path)
    # speed lines
    rnd = random.Random(int(u * 30))
    p.setPen(QPen(QColor(255, 255, 255, 120), 2))
    for _ in range(26):
        yy = cy + rnd.uniform(-band_h / 2, band_h / 2)
        xx = rnd.uniform(0, w)
        p.drawLine(QPointF(xx, yy), QPointF(xx + rnd.uniform(60, 180), yy - 6))
    # the portrait, big
    a = next((fi.a for fi in b.fighters if fi.uid == c.get("uid")), None)
    if a is not None:
        size = int(220 * U)
        try:
            if a.is_cat:
                from . import house_cats as HC
                pm = HC.cat_pixmap(getattr(a.src, "kind", "calico"), size)
            else:
                pm = H.person_preview(a.P, size)
            px = w * 0.12 + (1 - k_in) * -200 * U
            p.drawPixmap(int(px), int(cy - size * 0.45), pm)
        except Exception:
            pass
    f2 = QFont(font)
    f2.setPixelSize(int(46 * U))
    f2.setBold(True)
    f2.setItalic(True)
    p.setFont(f2)
    tx = w * 0.42 + (1 - k_in) * 300 * U
    p.setPen(QColor(0, 0, 0, 120))
    p.drawText(QRectF(tx + 3, cy - 40 * U + 3, w * 0.55, 80 * U), Qt.AlignLeft | Qt.AlignVCenter, c.get("name", ""))
    p.setPen(QColor("#ffffff"))
    p.drawText(QRectF(tx, cy - 40 * U, w * 0.55, 80 * U), Qt.AlignLeft | Qt.AlignVCenter, c.get("name", ""))
    f3 = QFont(font)
    f3.setPixelSize(int(16 * U))
    f3.setBold(True)
    p.setFont(f3)
    p.setPen(QColor(255, 255, 255, 220))
    if a is not None:
        p.drawText(QRectF(tx, cy + 26 * U, w * 0.5, 26 * U), Qt.AlignLeft | Qt.AlignVCenter, "%s · 大招" % a.name)
    p.restore()
