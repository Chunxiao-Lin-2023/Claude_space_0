"""Drawing for the v24 games (合作守家 / 涂地占领 / 猫咪足球 / 抢鱼大作战 / 躲猫猫 / 猫咪排球): the things that stand on
the floor (sorted with the fighters), the floor overlays, what flies over everyone, hints over your head and the HUD.

Everything here reads only what a guest also gets over the network (the game's net_extra / fighter_extra names).
"""
import math
import random

from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import (QColor, QFont, QFontMetricsF, QImage, QLinearGradient, QPainter, QPainterPath, QPen, QPixmap,
                           QPolygonF, QRadialGradient)

from . import house_art as H
from . import house_games as HG
from .house_art import box, cyl, iso, pen, poly

GAMES2 = ("defend", "paint", "soccer", "fish", "hide", "volley")
TEAM_COLORS = {0: "#e8473f", 1: "#3b8bd0", 2: "#f2b630", 3: "#5fb36a"}
PAINT_COL = {0: "#ff4f7b", 1: "#2fa6ff", 2: "#ffc21f", 3: "#3fd35a"}


def _font(base, px, bold=True):
    f = QFont(base) if base is not None else QFont()
    f.setPixelSize(max(6, int(px)))
    f.setBold(bold)
    return f


def _shadow(p, x, y, rx, a=45):
    sx, sy = iso(x, y, 0)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(0, 0, 0, a))
    p.drawEllipse(QPointF(sx, sy), rx, rx * 0.34)


def _hpbar(p, sx, sy, w, k, col="#5fd36a"):
    k = max(0.0, min(1.0, k))
    r = QRectF(sx - w / 2, sy, w, 5)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(0, 0, 0, 90))
    p.drawRoundedRect(r.adjusted(-1, -1, 1, 1), 3, 3)
    c = QColor(col) if k > 0.5 else (QColor("#f2c94c") if k > 0.25 else QColor("#e8473f"))
    p.setBrush(c)
    p.drawRoundedRect(QRectF(r.left(), r.top(), r.width() * k, r.height()), 2.5, 2.5)


def _eyes(p, x, y, s=1.0, angry=False, look=0.0):
    p.setPen(Qt.NoPen)
    for d in (-1, 1):
        p.setBrush(QColor("#ffffff"))
        p.drawEllipse(QPointF(x + d * 5 * s, y), 3.6 * s, 4.2 * s)
        p.setBrush(QColor("#2a2420"))
        p.drawEllipse(QPointF(x + d * 5 * s + look * 1.4 * s, y + 0.6 * s), 2.0 * s, 2.4 * s)
    if angry:
        p.setPen(QPen(QColor("#2a2420"), 1.6 * s, Qt.SolidLine, Qt.RoundCap))
        for d in (-1, 1):
            p.drawLine(QPointF(x + d * 8.5 * s, y - 6 * s), QPointF(x + d * 2 * s, y - 3.6 * s))


# ===================================================================================================== sprites
def sprites(b):
    """Things that stand on the floor and must be sorted with the fighters: dicts with x, y, w, d (and z)."""
    g = getattr(b, "game", "")
    out = []
    if g == "defend":
        from .house_defend import CASTLE
        c = CASTLE
        out.append(dict(kind="castle", x=c["x"], y=c["y"], w=c["w"], d=c["d"], z=0))
        for m in getattr(b, "mobs", []):
            r = m.get("r", 16)
            out.append(dict(kind="mob", x=m["x"], y=m["y"], w=r * 2, d=r * 0.8, z=0, obj=m))
        for tu in getattr(b, "turrets", []):
            out.append(dict(kind="turret", x=tu["x"], y=tu["y"], w=30, d=20, z=0, obj=tu))
        for d in getattr(b, "drops", []):
            out.append(dict(kind="drop", x=d["x"], y=d["y"], w=20, d=10, z=0, obj=d))
    elif g == "paint":
        for s in getattr(b, "sprinklers", []):
            out.append(dict(kind="sprinkler", x=s["x"], y=s["y"], w=26, d=18, z=0, obj=s))
    elif g == "soccer":
        from .house_arena_art import PITCH as P
        for x, side in ((P["x0"], -1), (P["x1"], 1)):
            out.append(dict(kind="goal", x=x + side * 18, y=(P["goal_y0"] + P["goal_y1"]) / 2, w=40,
                            d=P["goal_y1"] - P["goal_y0"], z=0, obj=side))
        for k, kp in (getattr(b, "keepers", None) or {}).items():
            out.append(dict(kind="keeper", x=kp["x"], y=kp["y"], w=30, d=14, z=0, obj=(int(k), kp)))
        bl = getattr(b, "ball", None)
        if bl:
            out.append(dict(kind="ball", x=bl["x"], y=bl["y"], w=18, d=8, z=bl.get("z", 0), obj=bl))
    elif g == "fish":
        for k, (x, y) in (getattr(b, "baskets", None) or {}).items():
            out.append(dict(kind="basket", x=x, y=y, w=86, d=50, z=0, obj=int(k)))
        for f in getattr(b, "fish", []):
            if f["st"] == "lie":
                out.append(dict(kind="fish", x=f["x"], y=f["y"], w=26, d=8, z=0, obj=f))
    elif g == "hide":
        for fi in b.fighters:
            if getattr(fi, "disguise", 0) > 0 and fi.a.f == b.f:
                out.append(dict(kind="plush", x=fi.a.x, y=fi.a.y, w=24, d=10, z=0, obj=fi))
    return out


def draw_sprite(p, b, s, t):
    k = s["kind"]
    if k == "castle":
        _castle(p, b, s, t)
    elif k == "mob":
        _mob(p, s["obj"], t)
    elif k == "turret":
        _turret(p, s["obj"], t)
    elif k == "drop":
        _drop(p, s["obj"], t)
    elif k == "sprinkler":
        _sprinkler(p, s["obj"], t)
    elif k == "goal":
        _goal(p, s, t)
    elif k == "keeper":
        _keeper(p, b, s["obj"], t)
    elif k == "ball":
        _soccer_ball(p, s["obj"], t)
    elif k == "basket":
        _basket(p, b, s, t)
    elif k == "fish":
        _fish_lying(p, s["obj"], t)
    elif k == "plush":
        fi = s["obj"]
        sx, sy = iso(fi.a.x, fi.a.y, 0)
        _shadow(p, fi.a.x, fi.a.y, 14)
        kind = (getattr(fi, "data", None) or {}).get("plush") or "bear"
        H.draw_plush(p, kind, sx, sy, 1.15, None)


# ---- 合作守家 -----------------------------------------------------------------------------------------------------
def _castle(p, b, s, t):
    c = getattr(b, "castle", None) or {"hp": 100, "max": 100, "hit": 0}
    k = c["hp"] / max(1.0, c["max"])
    shake = 2.5 * math.sin(t * 60) * min(1.0, c.get("hit", 0) / 0.3)
    x, y, w, d = s["x"] + shake, s["y"], s["w"], s["d"]
    x0, x1, y0, y1 = x - w / 2, x + w / 2, y - d / 2, y + d / 2
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(0, 0, 0, 40))
    sx, sy = iso(x, y0)
    p.drawEllipse(QPointF(sx, sy), w * 0.62, 10)
    def tower(tx, ty, h, col):
        cyl(p, tx, ty, 0, 17, h, col)
        sx_, sy_ = iso(tx, ty, h)
        p.setPen(pen("#9c6a7a", 1))
        p.setBrush(QColor("#ff8fb0"))
        p.drawPolygon(poly((sx_ - 20, sy_), (sx_ + 20, sy_), (sx_, sy_ - 34)))
        p.setPen(QPen(QColor("#9c6a7a"), 1))
        p.drawLine(QPointF(sx_, sy_ - 34), QPointF(sx_, sy_ - 48))
        wv = 3 * math.sin(t * 5 + tx)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#ffd34c"))
        p.drawPolygon(poly((sx_, sy_ - 48), (sx_ + 14, sy_ - 45 + wv), (sx_, sy_ - 41)))
        p.setBrush(QColor("#ffffff"))
        p.drawEllipse(QPointF(sx_, sy_ + 18 - h * 0.35), 5, 6)

    tower(x, y1 - 4, 124, "#d6c4f2")                    # the keep at the back
    # the body: a soft plush wall with stitches
    box(p, x0 + 12, y0 + 10, 0, x1 - 12, y1 - 6, 58, "#f7d6e0", top="#fbe6ec", radius=8)
    fr = H.srect(x0 + 12, x1 - 12, y0 + 10, 0, 58)
    p.setPen(QPen(QColor("#e3a6b8"), 1.2, Qt.DashLine))
    p.setBrush(Qt.NoBrush)
    p.drawRoundedRect(fr.adjusted(4, 4, -4, -4), 6, 6)
    # crenellations
    for j in range(5):
        bx = x0 + 18 + j * (w - 36) / 4.0
        box(p, bx - 7, y0 + 10, 58, bx + 7, y0 + 22, 70, "#f2c4d2", top="#fbe0e8", radius=3)
    tower(x0 + 10, y0 + 18, 96, "#bfe0f2")
    tower(x1 - 10, y0 + 18, 96, "#fbe7a6")
    # the heart door
    sx, sy = iso(x, y0 + 10, 0)
    p.setPen(pen("#9c4a5a", 1.2))
    p.setBrush(QColor("#c9604a"))
    path = QPainterPath(QPointF(sx, sy))
    path.lineTo(sx - 13, sy)
    path.lineTo(sx - 13, sy - 20)
    path.arcTo(QRectF(sx - 13, sy - 33, 26, 26), 180, -180)
    path.lineTo(sx + 13, sy)
    path.closeSubpath()
    p.drawPath(path)
    p.setBrush(QColor("#ff8fb0"))
    hy = sy - 38
    hp_ = QPainterPath(QPointF(sx, hy + 9))
    hp_.cubicTo(QPointF(sx - 14, hy), QPointF(sx - 7, hy - 10), QPointF(sx, hy - 3))
    hp_.cubicTo(QPointF(sx + 7, hy - 10), QPointF(sx + 14, hy), QPointF(sx, hy + 9))
    p.drawPath(hp_)
    # damage: band-aids and patches
    if k < 0.66:
        for j, (dx, dz) in enumerate(((-40, 30), (34, 18), (-8, 46), (48, 40))[:1 + int((0.66 - k) * 7)]):
            bx, by = iso(x + dx, y0 + 10, dz)
            p.save()
            p.translate(bx, by)
            p.rotate(25 if j % 2 else -30)
            p.setPen(pen("#c49a6a", 0.8))
            p.setBrush(QColor("#f2d9b0"))
            p.drawRoundedRect(QRectF(-11, -4, 22, 8), 3, 3)
            p.setBrush(QColor("#e8c89a"))
            p.drawRect(QRectF(-3.5, -4, 7, 8))
            p.restore()
    if k < 0.3 and int(t * 3) % 2:
        sx, sy = iso(x, y0, 140)
        p.setPen(QColor("#e8473f"))
        p.setFont(_font(None, 14))
        p.drawText(QRectF(sx - 60, sy - 20, 120, 20), Qt.AlignCenter, "城堡快撑不住了！")


def _mob(p, m, t):
    k = m["k"]
    x, y = m["x"], m["y"]
    r = m.get("r", 16)
    face = m.get("face", 1)
    st = m.get("st", "walk")
    bob = abs(math.sin(t * 9 + m["id"])) * (4 if k != "boss" else 3)
    _shadow(p, x, y, r * 1.1)
    sx, sy = iso(x, y, r + bob)
    fl = m.get("fl", 0) > 0
    p.save()
    p.translate(sx, sy)
    if face < 0:
        p.scale(-1, 1)
    if k in ("dust", "boss"):
        col = QColor("#b9b2a8") if k == "dust" else QColor("#8f8778")
        if fl:
            col = QColor("#ffffff")
        rnd = random.Random(m["id"])
        p.setPen(QPen(col.darker(130), 1))
        p.setBrush(col)
        for j in range(9):
            a = j * math.tau / 9 + 0.3 * math.sin(t * 3 + j)
            rr = r * (0.55 + 0.12 * rnd.random())
            p.drawEllipse(QPointF(math.cos(a) * r * 0.45, math.sin(a) * r * 0.4), rr, rr)
        p.setPen(Qt.NoPen)
        p.drawEllipse(QPointF(0, 0), r * 0.75, r * 0.72)
        # little feet
        p.setBrush(col.darker(140))
        for d in (-1, 1):
            p.drawEllipse(QPointF(d * r * 0.4 + math.sin(t * 14) * 2 * d, r * 0.85), r * 0.22, r * 0.12)
        s = r / 14.0
        _eyes(p, r * 0.15, -r * 0.1, s * 0.9 if k == "dust" else s * 0.7, angry=True, look=1)
        if k == "boss":
            p.setPen(pen("#a07a1a", 1.2))
            p.setBrush(QColor("#ffd34c"))
            cr = r * 0.55
            p.drawPolygon(poly((-cr, -r * 0.7), (-cr, -r * 1.05), (-cr * 0.5, -r * 0.85), (0, -r * 1.15),
                               (cr * 0.5, -r * 0.85), (cr, -r * 1.05), (cr, -r * 0.7)))
            p.setPen(QPen(QColor("#2a2420"), 2))
            p.drawArc(QRectF(-8, 6, 22, 12), 200 * 16, 140 * 16)
    elif k == "fur":
        col = QColor("#e7a6d0") if not fl else QColor("#ffffff")
        rot = (t * 900 if st == "charge" else 0) % 360
        p.rotate(rot)
        p.setPen(QPen(col.darker(140), 1.4))
        for j in range(16):
            a = j * math.tau / 16
            p.drawLine(QPointF(math.cos(a) * r * 0.7, math.sin(a) * r * 0.7),
                       QPointF(math.cos(a) * r * 1.15, math.sin(a) * r * 1.15))
        p.setBrush(col)
        p.drawEllipse(QPointF(0, 0), r, r)
        p.rotate(-rot)
        _eyes(p, r * 0.2, -r * 0.15, 1.15, angry=st == "charge", look=1)
        if st == "charge":
            p.setPen(QPen(QColor(255, 255, 255, 180), 2))
            for j in range(3):
                p.drawLine(QPointF(-r - 6 - j * 6, -8 + j * 8), QPointF(-r - 22 - j * 6, -8 + j * 8))
    elif k == "sock":
        col = QColor("#7fc0e8") if not fl else QColor("#ffffff")
        hop = -abs(math.sin(t * 7 + m["id"])) * 5
        p.translate(0, hop)
        lean = -15 if st == "throw" else 0
        p.rotate(lean)
        path = QPainterPath(QPointF(-9, -22))
        path.lineTo(7, -22)
        path.lineTo(7, 4)
        path.quadTo(QPointF(20, 6), QPointF(18, 14))
        path.quadTo(QPointF(4, 18), QPointF(-9, 10))
        path.closeSubpath()
        p.setPen(pen("#3f6f8f", 1.1))
        p.setBrush(col)
        p.drawPath(path)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#ffffff"))
        for yy in (-17, -9):
            p.drawRect(QRectF(-9, yy, 16, 3.4))
        p.setBrush(QColor("#e8473f"))
        p.drawEllipse(QPointF(14, 12), 4, 3)
        _eyes(p, 0, -2, 0.85, angry=True, look=1)
    p.restore()
    if m.get("stun", 0) > 0:
        sx2, sy2 = iso(x, y, r * 2 + 10)
        p.setPen(QColor("#ffd34c"))
        p.setFont(_font(None, 10))
        for j in range(3):
            a = t * 6 + j * math.tau / 3
            p.drawText(QPointF(sx2 + math.cos(a) * 12 - 4, sy2 + math.sin(a) * 4), "★")
    if m.get("slow", 0) > 0:
        sx2, sy2 = iso(x, y, r)
        p.setPen(QPen(QColor(170, 220, 255, 200), 1.6))
        for j in range(2):
            a = t * 2 + j * 3
            fx_, fy_ = sx2 + math.cos(a) * r, sy2 + math.sin(a) * r * 0.4
            for q in range(3):
                aa = q * math.pi / 3
                p.drawLine(QPointF(fx_ - 4 * math.cos(aa), fy_ - 4 * math.sin(aa)),
                           QPointF(fx_ + 4 * math.cos(aa), fy_ + 4 * math.sin(aa)))
    if m.get("hp", 1) < m.get("mx", 1):
        sx2, sy2 = iso(x, y, r * 2 + 14)
        _hpbar(p, sx2, sy2, 34 if m["k"] != "boss" else 90, m["hp"] / max(1, m["mx"]), "#e46f5b")
    if k == "boss":
        sx2, sy2 = iso(x, y, r * 2 + 34)
        p.setPen(QColor("#5e4436"))
        p.setFont(_font(None, 11))
        p.drawText(QRectF(sx2 - 60, sy2 - 14, 120, 14), Qt.AlignCenter, "👑 灰尘大王")


def _turret(p, tu, t):
    x, y = tu["x"], tu["y"]
    _shadow(p, x, y, 16)
    box(p, x - 12, y - 8, 0, x + 12, y + 8, 14, "#f2c94c", top="#f6d878", radius=3)
    sx, sy = iso(x, y, 14)
    p.save()
    p.translate(sx, sy)
    if tu.get("face", 1) < 0:
        p.scale(-1, 1)
    p.setPen(pen("#5e4436", 1))
    p.setBrush(QColor("#e8473f"))
    p.drawRoundedRect(QRectF(-4, -16, 24, 10), 4, 4)
    p.setBrush(QColor("#5e9bd6"))
    p.drawEllipse(QPointF(-2, -10), 9, 9)
    p.restore()
    if tu.get("t", 10) < 2.5 and int(t * 6) % 2:
        p.setOpacity(0.6)
    sx2, sy2 = iso(x, y, 40)
    p.setPen(QColor("#5e4436"))
    p.setFont(_font(None, 9))
    p.drawText(QRectF(sx2 - 20, sy2 - 12, 40, 12), Qt.AlignCenter, "%.0f" % max(0, tu.get("t", 0)))
    p.setOpacity(1.0)


def _drop(p, d, t):
    from . import house_games_art as GA
    x, y = d["x"], d["y"]
    _shadow(p, x, y, 10, 35)
    sx, sy = iso(x, y, 14 + 3 * math.sin(t * 4 + x))
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 246, 200, 110))
    p.drawEllipse(QPointF(sx, sy), 14, 14)
    GA.emoji(p, QRectF(sx - 12, sy - 12, 24, 24), "🐟" if d["k"] == "fish" else "🧶", 16)


# ---- 涂地占领 -----------------------------------------------------------------------------------------------------
def _sprinkler(p, s, t):
    x, y = s["x"], s["y"]
    col = QColor(PAINT_COL.get(s.get("team", 0), "#ffffff"))
    _shadow(p, x, y, 12)
    cyl(p, x, y, 0, 9, 14, "#9aa2ac")
    sx, sy = iso(x, y, 16)
    rot = s.get("rot", 0)
    p.setPen(QPen(col, 3, Qt.SolidLine, Qt.RoundCap))
    for j in range(3):
        a = rot + j * math.tau / 3
        ex, ey = sx + math.cos(a) * 26, sy + math.sin(a) * 10 - 10
        path = QPainterPath(QPointF(sx, sy - 2))
        path.quadTo(QPointF((sx + ex) / 2, sy - 22), QPointF(ex, ey))
        p.setBrush(Qt.NoBrush)
        p.drawPath(path)
    p.setPen(pen("#4f4a46", 1))
    p.setBrush(col)
    p.drawEllipse(QPointF(sx, sy - 2), 6, 4)


_PAINT = {}


def paint_layer(b):
    """The painted ground as one picture (rebuilt only when it changed)."""
    from .house_paint import CELL, COLS, ROWS
    grid = getattr(b, "grid", None)
    if grid is None:
        return None
    if isinstance(grid, str):
        cells = [ord(ch) - 48 for ch in grid]
    else:
        cells = list(grid)
    ver = getattr(b, "gver", 0)
    key = (id(b), ver, len(cells))
    hit = _PAINT.get("key")
    if hit == key:
        return _PAINT["pm"]
    sc = 1.5
    w, h = int(H.PW * sc), int(H.PD_PLACE * H.KY * sc) + 4
    img = QImage(w, h, QImage.Format_ARGB32_Premultiplied)
    img.fill(Qt.transparent)
    q = QPainter(img)
    q.setRenderHint(QPainter.Antialiasing)
    q.scale(sc, sc)
    q.setPen(Qt.NoPen)
    rad = CELL * 0.82
    for team in range(4):
        col = QColor(PAINT_COL[team])
        col.setAlpha(225)
        q.setBrush(col)
        v = team + 1
        for i, c in enumerate(cells):
            if c != v:
                continue
            cx, cy = (i % COLS + 0.5) * CELL, (i // COLS + 0.5) * CELL
            q.drawEllipse(QPointF(cx, (H.PD_PLACE - cy) * H.KY), rad, rad * H.KY)
    # a glossy rim on top
    q.setCompositionMode(QPainter.CompositionMode_SourceAtop)
    q.setBrush(QColor(255, 255, 255, 40))
    for i, c in enumerate(cells):
        if c:
            cx, cy = (i % COLS + 0.5) * CELL, (i // COLS + 0.5) * CELL
            q.drawEllipse(QPointF(cx - 4, (H.PD_PLACE - cy) * H.KY - 2), rad * 0.4, rad * 0.4 * H.KY)
    q.end()
    pm = QPixmap.fromImage(img)
    _PAINT["key"] = key
    _PAINT["pm"] = pm
    return pm


# ---- 猫咪足球 -----------------------------------------------------------------------------------------------------
def _goal(p, s, t):
    from .house_arena_art import PITCH as P
    side = s["obj"]
    line = P["x0"] if side < 0 else P["x1"]
    back = line + side * 38
    y0, y1 = P["goal_y0"], P["goal_y1"]
    bar = 70
    p.setPen(QPen(QColor(255, 255, 255, 120), 1))
    # the net: back panel and the roof
    for k in range(9):
        u = k / 8.0
        yy = y0 + (y1 - y0) * u
        p.drawLine(QPointF(*iso(line, yy, bar)), QPointF(*iso(back, yy, bar * 0.7)))
        p.drawLine(QPointF(*iso(back, yy, 0)), QPointF(*iso(back, yy, bar * 0.7)))
    for k in range(6):
        u = k / 5.0
        zz = bar * 0.7 * u
        p.drawLine(QPointF(*iso(back, y0, zz)), QPointF(*iso(back, y1, zz)))
    for yy in (y0, y1):
        for k in range(4):
            u = k / 3.0
            p.drawLine(QPointF(*iso(line + (back - line) * u, yy, 0)), QPointF(*iso(line + (back - line) * u, yy, bar - 30 * u)))
    # posts and bar
    p.setPen(QPen(QColor("#ffffff"), 4.5, Qt.SolidLine, Qt.RoundCap))
    p.drawLine(QPointF(*iso(line, y1, 0)), QPointF(*iso(line, y1, bar)))
    p.drawLine(QPointF(*iso(line, y0, bar)), QPointF(*iso(line, y1, bar)))
    p.drawLine(QPointF(*iso(line, y0, 0)), QPointF(*iso(line, y0, bar)))
    p.setPen(QPen(QColor(0, 0, 0, 60), 1))
    p.drawLine(QPointF(*iso(line, y0, 0)), QPointF(*iso(line, y0, bar)))


def _keeper(p, b, obj, t):
    team, kp = obj
    x, y = kp["x"], kp["y"]
    _shadow(p, x, y, 16)
    sx, sy = iso(x, y, 0)
    dive = kp.get("st") == "dive"
    p.save()
    p.translate(sx, sy)
    if kp.get("stun", 0) > 0:
        p.rotate(70 if team == 0 else -70)
    elif dive:
        p.rotate(18 * math.sin(t * 20))
    H.draw_plush(p, "bear", 0, 0, 1.35, "#e9d2b0")
    col = QColor(TEAM_COLORS.get(team, "#999"))
    p.setPen(pen(col.darker(140).name(), 1))
    p.setBrush(col)
    p.drawRoundedRect(QRectF(-10, -26, 20, 12), 4, 4)        # the jersey
    p.setBrush(QColor("#ffd34c"))
    for d in (-1, 1):
        p.drawEllipse(QPointF(d * 15, -30 if dive else -22), 5, 5)  # gloves
    p.restore()
    if kp.get("stun", 0) > 0:
        p.setPen(QColor("#ffd34c"))
        p.setFont(_font(None, 10))
        for j in range(3):
            a = t * 6 + j * math.tau / 3
            p.drawText(QPointF(sx + math.cos(a) * 14 - 4, sy - 44 + math.sin(a) * 4), "★")


def _soccer_ball(p, bl, t):
    x, y, z = bl["x"], bl["y"], bl.get("z", 0)
    sx, sy = iso(x, y, z + 9)
    if bl.get("trail", 0) > 0:
        vx, vy = bl.get("vx", 0), bl.get("vy", 0)
        n = math.hypot(vx, vy)
        if n > 1:
            ux, uy = vx / n, vy / n
            col = QColor(255, 120, 60) if bl.get("cannon") else QColor(255, 255, 255)
            for j in range(4):
                col.setAlpha(int(150 * bl["trail"] * (1 - j / 4)))
                p.setPen(QPen(col, 7 - j * 1.4, Qt.SolidLine, Qt.RoundCap))
                ax, ay = iso(x - ux * (12 + j * 14), y - uy * (12 + j * 14), z + 9)
                bx, by = iso(x - ux * (24 + j * 14), y - uy * (24 + j * 14), z + 9)
                p.drawLine(QPointF(ax, ay), QPointF(bx, by))
    p.setPen(pen("#5e4436", 1))
    p.setBrush(QColor("#ffffff"))
    p.drawEllipse(QPointF(sx, sy), 9, 9)
    rot = bl.get("rot", 0)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#3a3a44"))
    for j in range(3):
        a = rot + j * math.tau / 3
        px, py = sx + math.cos(a) * 5, sy + math.sin(a) * 5
        p.drawEllipse(QPointF(px, py), 2.6, 2.6)
    p.drawEllipse(QPointF(sx + math.cos(rot) * 0.5, sy), 2.2, 2.2)


# ---- 抢鱼大作战 ---------------------------------------------------------------------------------------------------
def _fish_shape(p, x, y, k, s=1.0, flip=1, flop=0.0, gold=False):
    p.save()
    p.translate(x, y)
    p.scale(flip * s, s)
    p.rotate(flop)
    col = QColor("#f2b630") if gold else QColor("#8fb9d6")
    p.setPen(pen("#9c6a1a" if gold else "#4f7f9f", 0.9))
    p.setBrush(col)
    p.drawEllipse(QPointF(0, 0), 11, 5.5)
    p.drawPolygon(poly((-9, 0), (-17, -6), (-15, 0), (-17, 6)))
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#2a2420"))
    p.drawEllipse(QPointF(6, -1.2), 1.4, 1.4)
    p.setBrush(QColor(255, 255, 255, 120))
    p.drawEllipse(QPointF(1, -2.4), 5, 1.5)
    p.restore()


def _fish_lying(p, f, t):
    x, y = f["x"], f["y"]
    _shadow(p, x, y, 11, 35)
    sx, sy = iso(x, y, 4)
    fl = f.get("flop", 0)
    hop = max(0.0, math.sin(t * 7 + fl)) ** 6 * 6
    gold = f.get("k") == "g"
    if gold:
        g = QRadialGradient(QPointF(sx, sy - 4), 22)
        g.setColorAt(0, QColor(255, 230, 120, 150))
        g.setColorAt(1, QColor(255, 230, 120, 0))
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        p.drawEllipse(QPointF(sx, sy - 4), 22, 14)
    _fish_shape(p, sx, sy - hop, f.get("k"), 1.0, 1 if int(fl) % 2 else -1, 20 * math.sin(t * 9 + fl), gold)


def _basket(p, b, s, t):
    team = s["obj"]
    x, y = s["x"], s["y"]
    col = TEAM_COLORS.get(team, "#999")
    _shadow(p, x, y, 46)
    sx, sy = iso(x, y, 0)
    # a woven basket
    path = QPainterPath(QPointF(sx - 40, sy - 38))
    path.lineTo(sx + 40, sy - 38)
    path.lineTo(sx + 32, sy)
    path.quadTo(QPointF(sx, sy + 8), QPointF(sx - 32, sy))
    path.closeSubpath()
    p.setPen(pen("#6b4a2a", 1.3))
    p.setBrush(QColor("#c08a5c"))
    p.drawPath(path)
    p.setPen(QPen(QColor("#8a5c3d"), 1))
    for j in range(1, 4):
        yy = sy - 38 + j * 9.5
        p.drawLine(QPointF(sx - 40 + j * 2, yy), QPointF(sx + 40 - j * 2, yy))
    for j in range(-3, 4):
        p.drawLine(QPointF(sx + j * 11, sy - 38), QPointF(sx + j * 9, sy + 2))
    # fish tails sticking out (more as the score grows)
    pts = (getattr(b, "pts", None) or {}).get(str(team), (getattr(b, "pts", None) or {}).get(team, 0))
    for j in range(min(6, pts // 2)):
        fx = sx - 28 + j * 11
        p.setPen(pen("#4f7f9f", 0.8))
        p.setBrush(QColor("#8fb9d6") if j % 3 else QColor("#f2b630"))
        p.drawPolygon(poly((fx, sy - 40), (fx - 5, sy - 52 - (j % 2) * 4), (fx + 5, sy - 52 - (j % 2) * 4)))
    p.setPen(pen("#5e4436", 1.2))
    p.setBrush(QColor("#d9a877"))
    p.drawEllipse(QPointF(sx, sy - 38), 40, 8)
    p.setBrush(QColor(col))
    p.setPen(Qt.NoPen)
    p.drawRoundedRect(QRectF(sx - 30, sy - 24, 60, 10), 4, 4)
    p.setPen(QColor("#ffffff"))
    p.setFont(_font(None, 9))
    p.drawText(QRectF(sx - 30, sy - 25, 60, 12), Qt.AlignCenter, "%d 分" % pts)


# ===================================================================================================== floor
def draw_floor(p, b, t):
    g = b.game
    from . import house_games_art as GA
    if g == "paint":
        pm = paint_layer(b)
        if pm is not None:
            p.save()
            x0, y0 = iso(0, H.PD_PLACE)
            p.translate(x0, y0)
            p.scale(1 / 1.5, 1 / 1.5)
            p.drawPixmap(QPointF(0, 0), pm)
            p.restore()
    if g == "defend":
        for w in getattr(b, "warns", []):
            k = min(1.0, w["t"] / max(0.01, w["dur"]))
            sx, sy = iso(w["x"], w["y"])
            p.setPen(QPen(QColor(232, 71, 63, 220), 2.4, Qt.DashLine))
            p.setBrush(QColor(232, 71, 63, int(40 + 100 * k)))
            p.drawEllipse(QPointF(sx, sy), w["r"], w["r"] * H.KY)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(232, 71, 63, 90))
            p.drawEllipse(QPointF(sx, sy), w["r"] * k, w["r"] * k * H.KY)
    if g == "fish":
        for tr in getattr(b, "traps", []):
            sx, sy = iso(tr["x"], tr["y"], 1)
            p.setPen(pen("#8a6a1a", 1))
            p.setBrush(QColor("#f2d34c"))
            for a in (-0.9, 0.2, 1.3):
                p.save()
                p.translate(sx, sy)
                p.rotate(math.degrees(a))
                p.drawEllipse(QRectF(-2, -3, 14, 6))
                p.restore()
        for f in getattr(b, "fish", []):
            if f["st"] in ("fall", "fly"):
                k = max(0.2, min(1.0, 1 - f["z"] / 400.0))
                sx, sy = iso(f["x"], f["y"])
                p.setPen(Qt.NoPen)
                p.setBrush(QColor(0, 0, 0, int(25 + 50 * k)))
                p.drawEllipse(QPointF(sx, sy), 6 + 10 * k, (6 + 10 * k) * 0.36)
                if f["st"] == "fall":
                    p.setPen(QPen(QColor(255, 255, 255, int(160 * k)), 1.4, Qt.DashLine))
                    p.setBrush(Qt.NoBrush)
                    p.drawEllipse(QPointF(sx, sy), 18, 6.5)
        gl = getattr(b, "gull", None)
        if gl:
            sx, sy = iso(gl["x"], gl["y"])
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(0, 0, 0, 50))
            p.drawEllipse(QPointF(sx, sy), 22, 6)
    if g == "soccer":
        bl = getattr(b, "ball", None)
        if bl and bl.get("z", 0) > 1:
            k = max(0.3, 1 - bl["z"] / 200.0)
            sx, sy = iso(bl["x"], bl["y"])
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(0, 0, 0, int(60 * k)))
            p.drawEllipse(QPointF(sx, sy), 9 * k + 2, (9 * k + 2) * 0.4)
    if g == "volley":
        bl = getattr(b, "ball", None)
        if bl:
            from .house_volley import LANE
            k = max(0.25, 1 - bl["z"] / 400.0)
            sx, sy = iso(bl["x"], LANE, 0)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(0, 0, 0, int(70 * k)))
            p.drawEllipse(QPointF(sx, sy), 14 * k + 3, (14 * k + 3) * 0.34)
    # team rings (not for those hiding)
    for fi in b.fighters:
        a = fi.a
        if a.f != b.f or a.traveling is not None or getattr(fi, "hidden", False) or a.hidden or fi.st == "out":
            continue
        side = g == "volley"
        sx, sy = iso(a.x, a.y, getattr(fi, "z", 0) if side else 0)
        col = QColor(PAINT_COL.get(fi.team, "#999") if g == "paint" else TEAM_COLORS.get(fi.team, "#999"))
        if g == "hide":
            col = QColor("#e8473f") if getattr(fi, "role", "") == "seek" else QColor("#5fb36a")
        if fi.st in ("ko",):
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
        if g == "paint" and fi.st == "ko":
            pc = QColor(getattr(fi, "splat_col", None) or "#ffffff")
            pc.setAlpha(200)
            p.setPen(Qt.NoPen)
            p.setBrush(pc)
            p.drawEllipse(QPointF(sx, sy), 30, 11)


# ===================================================================================================== things
def draw_things(p, b, t):
    """Before the fighters are drawn (the volley net, low things)."""
    if b.game == "volley":
        _volley_net(p, b, t)
    return False


def _volley_net(p, b, t):
    from .house_volley import LANE, NET_H, NET_X
    bx, by = iso(NET_X, LANE, 0)
    tx, ty = iso(NET_X, LANE, NET_H)
    p.setPen(QPen(QColor("#6b4a35"), 6, Qt.SolidLine, Qt.RoundCap))
    p.drawLine(QPointF(bx, by + 4), QPointF(tx, ty - 6))
    # the mesh, seen edge-on as a thin band with a white top tape
    mesh = QRectF(tx - 10, ty, 20, (by - ty) * 0.62)
    p.setPen(QPen(QColor(60, 60, 70, 150), 1))
    p.setBrush(QColor(255, 255, 255, 50))
    p.drawRect(mesh)
    yy = mesh.top()
    while yy < mesh.bottom():
        p.drawLine(QPointF(mesh.left(), yy), QPointF(mesh.right(), yy + 4))
        yy += 6
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#ffffff"))
    p.drawRect(QRectF(tx - 9, ty - 3, 18, 6))
    p.setBrush(QColor("#ffd34c"))
    p.drawEllipse(QPointF(tx, ty - 8), 5, 5)


# ===================================================================================================== effects
def draw_fx(p, b, t, font, me_uid):
    g = b.game
    if g == "defend":
        for s in getattr(b, "shots", []):
            sx, sy = iso(s["x"], s["y"], s["z"])
            k = s["k"]
            if k == "plush":
                p.save()
                p.translate(sx, sy)
                p.rotate(math.degrees(s.get("rot", 0)) * 0.5)
                H.draw_plush(p, "bunny", 0, 8, 0.5, "#fbf8f2")
                p.restore()
            elif k == "sock":
                p.save()
                p.translate(sx, sy)
                p.rotate(math.degrees(s.get("rot", 0)) * 2)
                p.setPen(pen("#3f6f8f", 1))
                p.setBrush(QColor("#7fc0e8"))
                p.drawRoundedRect(QRectF(-4, -9, 8, 14), 3, 3)
                p.drawEllipse(QPointF(3, 5), 5, 3.5)
                p.restore()
            elif k == "fire":
                gr = QRadialGradient(QPointF(sx, sy), 11)
                gr.setColorAt(0, QColor(255, 250, 200, 255))
                gr.setColorAt(0.4, QColor(255, 170, 60, 230))
                gr.setColorAt(1, QColor(230, 70, 40, 0))
                p.setPen(Qt.NoPen)
                p.setBrush(gr)
                p.drawEllipse(QPointF(sx, sy), 11, 11)
            else:
                p.setPen(QPen(QColor(220, 240, 255), 2, Qt.SolidLine, Qt.RoundCap))
                for j in range(3):
                    aa = t * 6 + j * math.pi / 3
                    p.drawLine(QPointF(sx - 7 * math.cos(aa), sy - 7 * math.sin(aa)),
                               QPointF(sx + 7 * math.cos(aa), sy + 7 * math.sin(aa)))
    elif g == "paint":
        for bl in getattr(b, "blobs", []):
            sx, sy = iso(bl["x"], bl["y"], bl["z"])
            gx, gy = iso(bl["x"], bl["y"], 0)
            col = QColor(PAINT_COL.get(bl.get("team", 0), "#fff"))
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(0, 0, 0, 35))
            p.drawEllipse(QPointF(gx, gy), 5, 2)
            r = 10 if bl["k"] == "bomb" else 5.5
            p.setBrush(col)
            p.setPen(pen(col.darker(150).name(), 1))
            p.drawEllipse(QPointF(sx, sy), r, r)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(255, 255, 255, 150))
            p.drawEllipse(QPointF(sx - r * 0.3, sy - r * 0.35), r * 0.35, r * 0.3)
            if bl["k"] == "bomb":
                p.setPen(QPen(QColor("#5e4436"), 1.4))
                p.drawLine(QPointF(sx + 5, sy - 8), QPointF(sx + 9, sy - 14))
                if int(t * 12) % 2:
                    p.setPen(Qt.NoPen)
                    p.setBrush(QColor("#ffd34c"))
                    p.drawEllipse(QPointF(sx + 10, sy - 15), 3, 3)
        for d in getattr(b, "rains", []):
            if d["t"] < 0:
                continue
            k = min(1.0, d["t"] / 0.55)
            sx, sy = iso(d["x"], d["y"], 320 * (1 - k))
            gx, gy = iso(d["x"], d["y"], 0)
            col = QColor(PAINT_COL.get(d.get("team", 0), "#fff"))
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(0, 0, 0, int(30 + 40 * k)))
            p.drawEllipse(QPointF(gx, gy), 6 + 10 * k, (6 + 10 * k) * 0.36)
            p.setBrush(col)
            path = QPainterPath(QPointF(sx, sy - 12))
            path.quadTo(QPointF(sx + 7, sy), QPointF(sx, sy + 4))
            path.quadTo(QPointF(sx - 7, sy), QPointF(sx, sy - 12))
            p.drawPath(path)
        for fi in b.fighters:
            a = fi.a
            if a.f != b.f or a.traveling is not None:
                continue
            if getattr(fi, "swim", False):
                sx, sy = iso(a.x, a.y, 0)
                col = QColor(PAINT_COL.get(fi.team, "#fff"))
                p.setPen(QPen(col.lighter(130), 2))
                p.setBrush(col.darker(110))
                wob = 2 * math.sin(t * 10)
                p.drawEllipse(QPointF(sx, sy - 2), 16 + wob, 6 - wob * 0.3)
                p.setPen(QPen(QColor(255, 255, 255, 120), 1.4))
                p.setBrush(Qt.NoBrush)
                for j in range(2):
                    rr = 20 + ((t * 30 + j * 12) % 24)
                    p.drawEllipse(QPointF(sx, sy), rr, rr * 0.34)
                _eyes(p, sx + (3 if fi.fx >= 0 else -3), sy - 8, 0.7, look=1 if fi.fx >= 0 else -1)
                if me_uid == fi.uid:
                    p.setPen(QColor("#ffffff"))
                    p.setFont(_font(font, 10))
                    p.drawText(QRectF(sx - 40, sy - 34, 80, 14), Qt.AlignCenter, "🫧 潜游中")
            elif getattr(fi, "splat", 0) > 8 and fi.st != "ko":
                sx, sy = iso(a.x, a.y, getattr(fi, "z", 0) + (26 if a.is_cat else 50))
                col = QColor(getattr(fi, "splat_col", None) or "#ffffff")
                k = min(1.0, fi.splat / 100.0)
                p.setPen(Qt.NoPen)
                rnd = random.Random(hash(fi.uid) % 997)
                for j in range(int(3 + 8 * k)):
                    col.setAlpha(210)
                    p.setBrush(col)
                    p.drawEllipse(QPointF(sx + rnd.uniform(-14, 14), sy + rnd.uniform(-20, 20)),
                                  rnd.uniform(2.5, 5.5), rnd.uniform(2.5, 5.5))
            if getattr(fi, "roller", 0) > 0 and not getattr(fi, "swim", False):
                d = 1 if fi.fx >= 0 else -1
                sx, sy = iso(a.x + fi.fx * 26, a.y + fi.fy * 20, 0)
                col = QColor(PAINT_COL.get(fi.team, "#fff"))
                p.setPen(pen("#5e4436", 1))
                p.setBrush(col)
                p.drawRoundedRect(QRectF(sx - 22, sy - 16, 44, 16), 7, 7)
                p.setPen(QPen(QColor("#5e4436"), 2))
                p.drawLine(QPointF(sx, sy - 16), QPointF(sx - d * 14, sy - 34))
    elif g == "soccer":
        pass
    elif g == "fish":
        for f in getattr(b, "fish", []):
            if f["st"] in ("fall", "fly"):
                sx, sy = iso(f["x"], f["y"], f["z"])
                _fish_shape(p, sx, sy, f["k"], 1.05, 1, (t * 300) % 360 if f["st"] == "fly" else 80,
                            f["k"] == "g")
        for n in getattr(b, "nets", []):
            u = min(1.0, n["t"] / max(0.01, n["dur"]))
            x = n["x0"] + (n["tx"] - n["x0"]) * u
            y = n["y0"] + (n["ty"] - n["y0"]) * u
            sx, sy = iso(x, y, 70 * math.sin(u * math.pi) + 10)
            r = 20 + 50 * u
            p.setPen(QPen(QColor("#6b4a35"), 1.2))
            p.setBrush(QColor(255, 255, 255, 40))
            p.drawEllipse(QPointF(sx, sy), r, r * 0.4)
            for j in range(-2, 3):
                p.drawLine(QPointF(sx + j * r * 0.35, sy - r * 0.38), QPointF(sx + j * r * 0.35, sy + r * 0.38))
        gl = getattr(b, "gull", None)
        if gl:
            sx, sy = iso(gl["x"], gl["y"], 70)
            d = 1 if gl["vx"] > 0 else -1
            flap = math.sin(t * 14) * 10
            p.setPen(pen("#5e4436", 1.2))
            p.setBrush(QColor("#ffffff"))
            p.drawEllipse(QPointF(sx, sy), 13, 7)
            p.drawPolygon(poly((sx - 6, sy - 2), (sx - 22, sy - 12 - flap), (sx + 4, sy - 3)))
            p.drawPolygon(poly((sx - 2, sy - 2), (sx + 14, sy - 14 - flap), (sx + 8, sy - 2)))
            p.setBrush(QColor("#f2b630"))
            p.drawPolygon(poly((sx + d * 12, sy - 2), (sx + d * 20, sy), (sx + d * 12, sy + 2)))
        for fi in b.fighters:
            a = fi.a
            fs = getattr(fi, "fish", None) or []
            if not fs or a.f != b.f or a.traveling is not None:
                continue
            sx, sy = iso(a.x, a.y, getattr(fi, "z", 0) + (44 if a.is_cat else 96))
            for j, k in enumerate(fs[:6]):
                _fish_shape(p, sx + (j % 2) * 4 - 2, sy - j * 7, k, 0.85, 1 if j % 2 else -1, 0, k == "g")
            if getattr(fi, "belly", 0) > 0:
                p.setPen(QColor("#f2b630"))
                p.setFont(_font(font, 10))
                p.drawText(QRectF(sx - 30, sy - len(fs) * 7 - 22, 60, 14), Qt.AlignCenter, "🍙 大肚子")
    elif g == "hide":
        _hide_fx(p, b, t, font, me_uid)
    elif g == "volley":
        _volley_ball(p, b, t)
        from .house_volley import LANE
        sv = getattr(b, "server", None)
        for fi in b.fighters:
            a = fi.a
            if getattr(fi, "block", 0) > 0 and getattr(fi, "z", 0) > 2:
                sx, sy = iso(a.x, LANE, fi.z + getattr(fi, "hgt", 60) + 14)
                p.setPen(QPen(QColor(160, 200, 255, 220), 3))
                p.setBrush(QColor(160, 200, 255, 50))
                p.drawRoundedRect(QRectF(sx - 26, sy - 26, 52, 40), 10, 10)
            if getattr(fi, "smash", 0) > 0 or getattr(fi, "power", 0) > 0:
                sx, sy = iso(a.x, LANE, getattr(fi, "z", 0) + getattr(fi, "hgt", 60) * 0.5)
                gr = QRadialGradient(QPointF(sx, sy), 46)
                gr.setColorAt(0, QColor(255, 140, 60, 90))
                gr.setColorAt(1, QColor(255, 140, 60, 0))
                p.setPen(Qt.NoPen)
                p.setBrush(gr)
                p.drawEllipse(QPointF(sx, sy), 46, 46)
            if getattr(fi, "dink", 0) > 0:
                sx, sy = iso(a.x, LANE, getattr(fi, "z", 0) + getattr(fi, "hgt", 60) + 20)
                p.setPen(QColor("#ffffff"))
                p.setFont(_font(font, 11))
                p.drawText(QRectF(sx - 30, sy - 12, 60, 14), Qt.AlignCenter, "🪶")


def _volley_ball(p, b, t):
    from .house_volley import LANE
    bl = getattr(b, "ball", None)
    if not bl:
        return
    x, z = bl["x"], bl["z"]
    sx, sy = iso(x, LANE, z)
    if bl.get("trail", 0) > 0:
        vx, vz = bl.get("vx", 0), bl.get("vz", 0)
        n = math.hypot(vx, vz)
        if n > 1:
            ux, uz = vx / n, vz / n
            for j in range(5):
                col = QColor(255, 120, 60, int(170 * bl["trail"] * (1 - j / 5)))
                p.setPen(QPen(col, 9 - j * 1.5, Qt.SolidLine, Qt.RoundCap))
                ax, ay = iso(x - ux * (14 + j * 16), LANE, z - uz * (14 + j * 16))
                bx, by = iso(x - ux * (28 + j * 16), LANE, z - uz * (28 + j * 16))
                p.drawLine(QPointF(ax, ay), QPointF(bx, by))
    if bl.get("kind") == "smash":
        gr = QRadialGradient(QPointF(sx, sy), 26)
        gr.setColorAt(0, QColor(255, 140, 60, 160))
        gr.setColorAt(1, QColor(255, 140, 60, 0))
        p.setPen(Qt.NoPen)
        p.setBrush(gr)
        p.drawEllipse(QPointF(sx, sy), 26, 26)
    from . import house_games_art as GA
    GA._yarn_ball(p, sx, sy, 13, bl.get("rot", 0), "#f7b8cf")
    p.setPen(QPen(QColor("#ffffff"), 2))
    p.setBrush(Qt.NoBrush)
    p.drawArc(QRectF(sx - 9, sy - 9, 18, 18), 30 * 16, 120 * 16)


def _hide_fx(p, b, t, font, me_uid):
    from . import house_games_art as GA
    me = next((fi for fi in b.fighters if fi.uid == me_uid), None)
    # rustling furniture: wobble lines, and a tail / ears / a paw peeking out
    for s in getattr(b, "spots", []):
        if s.get("rus", 0) > 0:
            k = min(1.0, s["rus"] / 0.6)
            ix, iy, h, w = s["ix"], s["iy"], s.get("h", 40), s.get("w", 40)
            sx, sy = iso(ix, iy, h + 6)
            p.setPen(QPen(QColor(90, 60, 40, int(200 * k)), 2, Qt.SolidLine, Qt.RoundCap))
            for d in (-1, 1):
                for j in range(2):
                    xx = sx + d * (w * 0.5 + 6 + j * 7)
                    yy = sy + 10 + j * 6
                    p.drawArc(QRectF(xx - 6, yy - 6, 12, 12), (90 if d > 0 else 270) * 16 - 60 * 16, 120 * 16)
            peek = s.get("peek", "tail")
            ex, ey = iso(s["x"] + (w * 0.3 if int(s["ix"]) % 2 else -w * 0.3), s["y"] + 10, 6)
            wag = math.sin(t * 12) * 8
            p.setOpacity(min(1.0, k * 1.5))
            if peek == "tail":
                path = QPainterPath(QPointF(ex, ey))
                path.cubicTo(QPointF(ex + 8, ey - 12), QPointF(ex - 6 + wag, ey - 22), QPointF(ex + 4 + wag, ey - 30))
                p.setPen(QPen(QColor("#a8876a"), 5, Qt.SolidLine, Qt.RoundCap))
                p.setBrush(Qt.NoBrush)
                p.drawPath(path)
                p.setPen(QPen(QColor("#5e4436"), 5, Qt.SolidLine, Qt.RoundCap))
                p.drawPoint(QPointF(ex + 4 + wag, ey - 30))
            elif peek == "ears":
                ex2, ey2 = iso(s["ix"], s["iy"], h + 2)
                p.setPen(pen("#5e4436", 1))
                p.setBrush(QColor("#c9a27a"))
                for d in (-1, 1):
                    p.drawPolygon(poly((ex2 + d * 4, ey2), (ex2 + d * 13, ey2 - 13 - abs(wag) * 0.3), (ex2 + d * 16, ey2 + 1)))
            else:
                p.setPen(pen("#5e4436", 1))
                p.setBrush(QColor("#f3e2c4"))
                p.drawEllipse(QPointF(ex, ey - 2), 6, 4.5)
                for j in range(3):
                    p.drawEllipse(QPointF(ex - 4 + j * 4, ey - 6), 2, 2)
            p.setOpacity(1.0)
        if s.get("glow", 0) > 0:
            sx, sy = iso(s["ix"], s["iy"], s.get("h", 40) * 0.5)
            k = s["glow"] / 1.2
            gr = QRadialGradient(QPointF(sx, sy), 60)
            gr.setColorAt(0, QColor(255, 236, 140, int(150 * k)))
            gr.setColorAt(1, QColor(255, 236, 140, 0))
            p.setPen(Qt.NoPen)
            p.setBrush(gr)
            p.drawEllipse(QPointF(sx, sy), 60, 50)
    for bl in getattr(b, "balls", []):
        sx, sy = iso(bl["x"], bl["y"], 8 + abs(math.sin(t * 10)) * 12)
        GA._yarn_ball(p, sx, sy, 8, bl.get("rot", 0), "#e8473f")
    for fi in b.fighters:
        a = fi.a
        if a.f != b.f:
            continue
        # flashlight cone
        if (getattr(fi, "data", None) or {}).get("flash", 0) and getattr(fi, "role", "") == "seek" and fi.st == "skill":
            sx, sy = iso(a.x, a.y, 30)
            ang = math.atan2(-fi.fy * H.KY, fi.fx)
            path = QPainterPath(QPointF(sx, sy))
            for j in range(13):
                aa = ang - 0.62 + j * 1.24 / 12
                path.lineTo(QPointF(sx + math.cos(aa) * 300, sy + math.sin(aa) * 300 * 0.6))
            path.closeSubpath()
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(255, 246, 180, 90))
            p.drawPath(path)
        if getattr(fi, "outline", 0) > 0 and getattr(fi, "role", "") == "hide" and not getattr(fi, "caught", False):
            sx, sy = iso(a.x, a.y, 20)
            p.setPen(QPen(QColor(255, 220, 90, 230), 2.5, Qt.DashLine))
            p.setBrush(QColor(255, 220, 90, 50))
            p.drawEllipse(QPointF(sx, sy - 10), 22, 30)
            p.setPen(QColor("#e8473f"))
            p.setFont(_font(font, 16))
            p.drawText(QRectF(sx - 10, sy - 64, 20, 20), Qt.AlignCenter, "!")
        if getattr(fi, "radar", 0) > 0 and getattr(fi, "role", "") == "seek":
            tgt = None
            for o in b.fighters:
                if getattr(o, "role", "") == "hide" and not getattr(o, "caught", False):
                    d = math.hypot(o.a.x - a.x, o.a.y - a.y)
                    if tgt is None or d < tgt[0]:
                        tgt = (d, o)
            if tgt is not None:
                o = tgt[1]
                ux, uy = o.a.x - a.x, o.a.y - a.y
                n = math.hypot(ux, uy) or 1
                ux, uy = ux / n, uy / n
                sx, sy = iso(a.x + ux * 44, a.y + uy * 44, 4)
                ang = math.degrees(math.atan2(-uy * H.KY, ux))
                p.save()
                p.translate(sx, sy)
                p.rotate(-ang)
                p.setPen(pen("#9c2e24", 1.2))
                p.setBrush(QColor("#ffd34c"))
                p.drawPolygon(poly((-10, -6), (6, -6), (6, -12), (20, 0), (6, 12), (6, 6), (-10, 6)))
                p.restore()
        if me is not None and fi is me and getattr(fi, "role", "") == "hide" and a.hidden and \
                not getattr(fi, "caught", False):
            # where I am, for me only
            sx, sy = iso(a.x, a.y, 0)
            p.setPen(QPen(QColor(95, 179, 106, 220), 2, Qt.DashLine))
            p.setBrush(QColor(95, 179, 106, 40))
            p.drawEllipse(QPointF(sx, sy), 22, 8)
            sp = getattr(fi, "spot", None)
            spots = getattr(b, "spots", [])
            where = spots[sp]["name"] if sp is not None and sp < len(spots) else (
                "变成玩偶中" if getattr(fi, "disguise", 0) > 0 else "隐身中")
            f2 = _font(font, 12)
            p.setFont(f2)
            text = "🙈 你在%s" % where if sp is not None else "🙈 " + where
            tw = QFontMetricsF(f2).horizontalAdvance(text) + 16
            r = QRectF(sx - tw / 2, sy - 92, tw, 20)
            p.setPen(QPen(QColor("#5fb36a"), 1.2))
            p.setBrush(QColor(240, 255, 240, 230))
            p.drawRoundedRect(r, 9, 9)
            p.setPen(QColor("#2e6b36"))
            p.drawText(r, Qt.AlignCenter, text)


# ===================================================================================================== hints
def head_hints(p, b, t, font, me_uid):
    from . import house_arena_art as AA
    me = next((fi for fi in b.fighters if fi.uid == me_uid), None)
    if me is None or me.a.f != b.f or b.phase != "fight":
        return
    g = b.game
    z = getattr(me, "z", 0) + (70 if me.a.is_cat else 104)
    if g == "volley":
        from .house_volley import LANE
        sx, sy = iso(me.a.x, LANE, z)
    else:
        sx, sy = iso(me.a.x, me.a.y, z)
    if g == "defend":
        from .house_defend import to_castle
        c = getattr(b, "castle", None) or {}
        if me.alive() and to_castle(me.a.x, me.a.y)[0] < 48 and c.get("hp", 1) < c.get("max", 1):
            AA.bubble_hint(p, sx, sy, "E", "修城堡", font, hot=getattr(b, "wphase", "") == "break")
        elif me.st == "ko":
            AA.bubble_hint(p, sx, sy, "…", "晕倒了，马上回来", font)
    elif g == "paint":
        if me.alive() and getattr(me, "ink", 100) < 20 and not getattr(me, "swim", False):
            AA.bubble_hint(p, sx, sy, "L", "按住在自己颜色上潜游补颜料", font, hot=int(t * 3) % 2 == 0)
        if me.alive() and not getattr(me, "swim", False):
            k = max(0.0, min(1.0, getattr(me, "ink", 100) / 100.0))
            bx, by = iso(me.a.x, me.a.y, 0)
            r = QRectF(bx - 22, by + 9, 44, 5)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(0, 0, 0, 80))
            p.drawRoundedRect(r, 2.5, 2.5)
            p.setBrush(QColor(PAINT_COL.get(me.team, "#fff")))
            p.drawRoundedRect(QRectF(r.left(), r.top(), r.width() * k, r.height()), 2.5, 2.5)
    elif g == "soccer":
        bl = getattr(b, "ball", None) or {}
        if bl.get("own") == me.uid:
            if me.st == "kick":
                k = getattr(me, "charge", 0)
                bx, by = iso(me.a.x, me.a.y, 0)
                r = QRectF(bx - 24, by + 10, 48, 6)
                p.setPen(Qt.NoPen)
                p.setBrush(QColor(0, 0, 0, 70))
                p.drawRoundedRect(r, 3, 3)
                p.setBrush(QColor("#f2b630") if k < 1 else QColor("#e8473f"))
                p.drawRoundedRect(QRectF(r.left(), r.top(), r.width() * k, r.height()), 3, 3)
            else:
                from .house_soccer import goal_x
                near = abs(goal_x(me.team) - me.a.x) < 380
                AA.bubble_hint(p, sx, sy, "J", "按住射门！" if near else "点一下传球 / 按住射门", font, hot=near)
    elif g == "fish":
        fs = getattr(me, "fish", None) or []
        bs = getattr(b, "baskets", None) or {}
        bk = bs.get(str(me.team), bs.get(me.team))
        if fs and bk:
            d = math.hypot(bk[0] - me.a.x, bk[1] - me.a.y)
            if d < 470:
                AA.bubble_hint(p, sx, sy, "E", "扔进篮子！", font, hot=True)
            else:
                AA.bubble_hint(p, sx, sy, "→", "送回篮子", font)
    elif g == "hide":
        role = getattr(me, "role", "")
        rph = getattr(b, "rphase", "")
        spots = getattr(b, "spots", [])
        if role == "hide" and not getattr(me, "caught", False) and rph in ("hide", "seek"):
            if getattr(me, "spot", None) is not None:
                AA.bubble_hint(p, sx, sy - 10, "E", "出来", font)
            else:
                near = None
                for s in spots:
                    d = math.hypot(s["x"] - me.a.x, s["y"] - me.a.y)
                    if d < 60 and not s.get("occ", s.get("who") is not None) and (near is None or d < near[0]):
                        near = (d, s)
                if near is not None:
                    AA.bubble_hint(p, sx, sy, "E", "躲进" + near[1]["name"], font, hot=True)
        elif role == "seek" and rph == "seek":
            near = None
            for s in spots:
                d = math.hypot(s["x"] - me.a.x, s["y"] - me.a.y)
                if d < 72 and (near is None or d < near[0]):
                    near = (d, s)
            if near is not None:
                AA.bubble_hint(p, sx, sy, "J", "搜" + near[1]["name"], font, hot=True)
    elif g == "volley":
        bl = getattr(b, "ball", None) or {}
        if bl.get("held") == me.uid:
            AA.bubble_hint(p, sx, sy, "J", "发球！", font, hot=int(t * 3) % 2 == 0)


# ===================================================================================================== HUD
def _card(p, r, col, mine):
    p.setPen(QPen(QColor(col), 2.4 if mine else 1.2))
    p.setBrush(QColor(255, 250, 240, 228))
    p.drawRoundedRect(r, 10, 10)


def _pill(p, rect, text, font, hot=False):
    p.setPen(QPen(QColor("#c4862c") if hot else QColor("#9a8a76"), 1.2))
    p.setBrush(QColor(255, 248, 232, 238))
    p.drawRoundedRect(rect, rect.height() / 2, rect.height() / 2)
    p.setFont(font)
    p.setPen(QColor("#6b3f1a"))
    p.drawText(rect, Qt.AlignCenter, text)


def hud(p, b, w, h, font, small, me_uid, U, now):
    """The fighters' cards and the score line at the top."""
    from . import house_games_art as GA
    g = b.game
    fs = list(b.fighters)
    me = next((fi for fi in fs if fi.uid == me_uid), None)
    y0 = 64 * U
    n = len(fs)
    cw = min(230 * U, (w - 40 * U) / max(1, n))
    x0 = (w - cw * n) / 2
    ch = 46 * U
    f_small = _font(small, 11 * U, False)
    f_b = _font(small, 12 * U)
    for i, fi in enumerate(fs):
        r = QRectF(x0 + i * cw + 4 * U, y0, cw - 8 * U, ch)
        col = PAINT_COL.get(fi.team, "#999") if g == "paint" else TEAM_COLORS.get(fi.team, "#999")
        if g == "hide":
            col = "#e8473f" if getattr(fi, "role", "") == "seek" else "#5fb36a"
        if g == "defend":
            col = HG.CHARS.get(fi.char, {}).get("color", "#999")
        _card(p, r, col, fi.uid == me_uid)
        p.setFont(f_b)
        p.setPen(QColor("#5e4436"))
        tag = "（我）" if fi.uid == me_uid else ("（AI）" if str(fi.ctrl).startswith("ai:") else "")
        pal = getattr(fi, "pal", None)
        if pal:
            from . import house_pals as PL
            tag += " " + PL.PALS.get(pal, {}).get("icon", "")
        p.drawText(QRectF(r.left() + 10, r.top() + 2 * U, r.width() - 20, 18 * U), Qt.AlignLeft | Qt.AlignVCenter,
                   fi.a.name + tag)
        right = ""
        if g in ("defend",):
            right = "👾%d" % fi.score
        elif g in ("soccer", "volley", "fish", "hide"):
            right = "★ %d" % fi.score if fi.score else ""
        elif g == "paint":
            right = "💥%d" % fi.score if fi.score else ""
        p.drawText(QRectF(r.left() + 10, r.top() + 2 * U, r.width() - 20, 18 * U), Qt.AlignRight | Qt.AlignVCenter, right)
        sks = HG.skills(g, fi.char)
        sk = sks[0] if sks else None
        if g == "hide" and len(sks) > 1 and getattr(fi, "role", "") == "seek":
            sk = sks[1]
        cdv = (getattr(fi, "cds", {}) or {}).get("k", 0)
        chip = QRectF(r.right() - 52 * U, r.top() + 24 * U, 44 * U, 16 * U)
        if sk is not None:
            GA._chip(p, chip, sk["icon"] + ("%.0f" % math.ceil(cdv) if cdv > 0 else "✓"), cdv <= 0, small, U)
        line = QRectF(r.left() + 10, r.top() + 21 * U, chip.left() - r.left() - 16, 20 * U)
        p.setFont(f_small)
        p.setPen(QColor("#5e4436"))
        if g == "defend":
            GA._bar(p, QRectF(line.left(), line.top() + 6 * U, line.width(), 8 * U), fi.hp / max(1, fi.maxhp), "hp")
            if fi.st == "ko":
                p.drawText(line, Qt.AlignCenter, "晕倒了…")
        elif g == "paint":
            k = max(0.0, min(1.0, getattr(fi, "ink", 100) / 100.0))
            rr = QRectF(line.left(), line.top() + 4 * U, line.width(), 7 * U)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(0, 0, 0, 40))
            p.drawRoundedRect(rr, 3, 3)
            p.setBrush(QColor(PAINT_COL.get(fi.team, "#fff")))
            p.drawRoundedRect(QRectF(rr.left(), rr.top(), rr.width() * k, rr.height()), 3, 3)
            sp = max(0.0, min(1.0, getattr(fi, "splat", 0) / 100.0))
            if sp > 0.02:
                rr2 = QRectF(line.left(), line.top() + 13 * U, line.width() * sp, 4 * U)
                p.setBrush(QColor("#e8473f"))
                p.drawRoundedRect(rr2, 2, 2)
            if fi.st == "ko":
                p.setPen(QColor("#5e4436"))
                p.drawText(line, Qt.AlignCenter, "被涂晕了")
        elif g == "fish":
            fsh = getattr(fi, "fish", None) or []
            p.drawText(line, Qt.AlignLeft | Qt.AlignVCenter,
                       ("抱着 " + "".join("🌟" if k == "g" else "🐟" for k in fsh)) if fsh else "空着手")
        elif g == "hide":
            role = getattr(fi, "role", "")
            if role == "seek":
                text = "🔍 找的人"
            elif getattr(fi, "caught", False):
                text = "😿 被找到了"
            else:
                hid = getattr(fi, "spot", None) is not None or getattr(fi, "disguise", 0) > 0
                text = "🙈 躲好了" if (fi.uid == me_uid and hid) else ("🏃 快去躲！" if fi.uid == me_uid else "🙈 躲的人")
            p.drawText(line, Qt.AlignLeft | Qt.AlignVCenter, text)
        elif g == "soccer":
            extra = []
            if getattr(fi, "glue", 0) > 0:
                extra.append("🐾 粘球中")
            if getattr(fi, "sprint", 0) > 0:
                extra.append("💨")
            bl = getattr(b, "ball", None) or {}
            if bl.get("own") == fi.uid:
                extra.insert(0, "⚽ 带球")
            p.drawText(line, Qt.AlignLeft | Qt.AlignVCenter, " ".join(extra))
        elif g == "volley":
            extra = []
            if (getattr(b, "ball", None) or {}).get("held") == fi.uid:
                extra.append("🏐 发球")
            if getattr(fi, "smash", 0) > 0:
                extra.append("💥 重炮")
            if getattr(fi, "dink", 0) > 0:
                extra.append("🪶 吊球")
            p.drawText(line, Qt.AlignLeft | Qt.AlignVCenter, " ".join(extra))
    # the line in the middle: score, time, waves...
    f_big = _font(small, 15 * U)
    top = y0 + ch + 6 * U
    text = ""
    if getattr(b, "train", None) is not None:
        text = "🎓 训练中"
    elif g == "defend":
        c = getattr(b, "castle", None) or {"hp": 0, "max": 1}
        bw = min(520 * U, w * 0.5)
        br = QRectF((w - bw) / 2, top, bw, 26 * U)
        p.setPen(QPen(QColor("#c4862c"), 1.4))
        p.setBrush(QColor(255, 248, 232, 240))
        p.drawRoundedRect(br, 13 * U, 13 * U)
        inner = br.adjusted(118 * U, 7 * U, -12 * U, -7 * U)
        GA._bar(p, inner, c["hp"] / max(1.0, c["max"]), "hp")
        p.setFont(_font(small, 12 * U))
        p.setPen(QColor("#6b3f1a"))
        p.drawText(QRectF(br.left() + 10 * U, br.top(), 108 * U, br.height()), Qt.AlignLeft | Qt.AlignVCenter,
                   "🏰 城堡 %d" % max(0, int(math.ceil(c["hp"]))))
        wp = getattr(b, "wphase", "")
        if wp == "break":
            text = "第 %d / %d 波 · %d 秒后下一波（快去修城堡）" % (min(getattr(b, "wave", 0) + 1, getattr(b, "waves", 1)),
                                                     getattr(b, "waves", 1), max(0, int(math.ceil(getattr(b, "wtimer", 0)))))
        else:
            text = "第 %d / %d 波 · 还剩 %d 只怪" % (getattr(b, "wave", 0), getattr(b, "waves", 1), getattr(b, "left", 0))
        top = br.bottom() + 4 * U
    elif g == "paint":
        area = getattr(b, "area", None) or {}
        total = max(1, getattr(b, "total", 1))
        bw = min(560 * U, w * 0.55)
        br = QRectF((w - bw) / 2, top, bw, 22 * U)
        p.setPen(QPen(QColor("#9a8a76"), 1.2))
        p.setBrush(QColor(255, 248, 232, 238))
        p.drawRoundedRect(br, 11 * U, 11 * U)
        x = br.left() + 4
        inner_w = br.width() - 8
        for tm in sorted(area, key=lambda k: int(k)):
            v = area[tm]
            ww = inner_w * v / total
            if ww <= 0:
                continue
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(PAINT_COL.get(int(tm), "#999")))
            p.drawRect(QRectF(x, br.top() + 4, ww, br.height() - 8))
            if ww > 34 * U:
                p.setPen(QColor("#ffffff"))
                p.setFont(_font(small, 11 * U))
                p.drawText(QRectF(x, br.top(), ww, br.height()), Qt.AlignCenter, "%d%%" % round(100 * v / total))
            x += ww
        text = "⏱ %d" % max(0, int(b.limit - b.clock))
        top = br.bottom() + 4 * U
    elif g == "soccer":
        gl = getattr(b, "goals", None) or {}
        text = "红队 %d : %d 蓝队    ⏱ %d" % (gl.get("0", gl.get(0, 0)), gl.get("1", gl.get(1, 0)),
                                         max(0, int(b.limit - b.clock)))
    elif g == "fish":
        pts = getattr(b, "pts", None) or {}
        if b.mode == "ffa":
            parts = []
            for fi in fs:
                parts.append("%s %d" % (fi.a.name, pts.get(str(fi.team), pts.get(fi.team, 0))))
            text = " · ".join(parts) + "    ⏱ %d" % max(0, int(b.limit - b.clock))
        else:
            text = "红队 %d : %d 蓝队    ⏱ %d" % (pts.get("0", pts.get(0, 0)), pts.get("1", pts.get(1, 0)),
                                             max(0, int(b.limit - b.clock)))
    elif g == "hide":
        rph = getattr(b, "rphase", "")
        sk = next((fi for fi in fs if fi.uid == getattr(b, "seeker", None)), None)
        rt = max(0, int(math.ceil(getattr(b, "rtimer", 0))))
        rr = "第 %d / %d 轮" % (getattr(b, "rnd", 0) + 1, getattr(b, "rounds", 1))
        if rph == "hide":
            text = "%s · %s 在数数… %d · 快躲起来！" % (rr, sk.a.name if sk else "", rt)
        elif rph == "seek":
            left = sum(1 for fi in fs if getattr(fi, "role", "") == "hide" and not getattr(fi, "caught", False))
            text = "%s · %s 在找 · 还有 %d 人没找到 · ⏱ %d" % (rr, sk.a.name if sk else "", left, rt)
        else:
            text = rr
    elif g == "volley":
        pt = getattr(b, "points", None) or {}
        text = "红队 %d : %d 蓝队    先得 %d 分" % (pt.get("0", pt.get(0, 0)), pt.get("1", pt.get(1, 0)), b.kos_to_win)
    if text:
        fm = QFontMetricsF(f_big)
        tw = fm.horizontalAdvance(text) + 36 * U
        _pill(p, QRectF((w - tw) / 2, top, tw, 26 * U), text, f_big)
    # the seeker's blindfold
    if g == "hide" and me is not None and getattr(me, "role", "") == "seek" and getattr(b, "rphase", "") == "hide":
        p.fillRect(QRectF(0, 0, w, h), QColor(30, 20, 40, 225))
        p.setPen(QColor("#fff2c4"))
        p.setFont(_font(font, 34 * U))
        rt = max(0, int(math.ceil(getattr(b, "rtimer", 0))))
        p.drawText(QRectF(0, h * 0.34, w, 60 * U), Qt.AlignCenter, "🙈 数到十…  %d" % (10 - rt if rt <= 10 else 0))
        p.setFont(_font(font, 16 * U, False))
        p.drawText(QRectF(0, h * 0.34 + 64 * U, w, 30 * U), Qt.AlignCenter, "不许偷看！大家正在躲起来")


# ===================================================================================================== volley stage
def draw_beach_court(p, full, hour, dark):
    from . import house_places_art as PA
    from .house_games_art import gy, gx
    from .house_volley import XMAX, XMIN
    yb = gy(0)
    PA.draw_sky(p, hour, None, QRectF(full.left(), 0, full.width(), yb), seed=24)
    sea = QRectF(full.left(), yb - 120, full.width(), 70)
    gr = QLinearGradient(0, sea.top(), 0, sea.bottom())
    gr.setColorAt(0, QColor("#4f97c6"))
    gr.setColorAt(1, QColor("#8fd0ea"))
    p.setPen(Qt.NoPen)
    p.setBrush(gr)
    p.drawRect(sea)
    p.setPen(QPen(QColor(255, 255, 255, 140), 1.6))
    for k in range(12):
        x = full.left() + 40 + k * 110
        y = sea.top() + 10 + (k % 4) * 14
        p.drawLine(QPointF(x, y), QPointF(x + 44, y))
    sand = QRectF(full.left(), sea.bottom(), full.width(), full.height() - sea.bottom())
    gr2 = QLinearGradient(0, sand.top(), 0, sand.bottom())
    gr2.setColorAt(0, QColor("#f2dfae"))
    gr2.setColorAt(1, QColor("#e2c88e"))
    p.setBrush(gr2)
    p.setPen(Qt.NoPen)
    p.drawRect(sand)
    rnd = random.Random(24)
    for _ in range(260):
        p.setBrush(QColor(200, 170, 110, rnd.randint(40, 110)))
        p.drawEllipse(QPointF(rnd.uniform(sand.left(), sand.right()), rnd.uniform(sand.top(), sand.bottom())), 1.3, 0.9)
    # palm trees and a lifeguard chair far back
    for x in (full.left() + 60, full.right() - 70):
        p.setPen(QPen(QColor("#8a6a4a"), 8, Qt.SolidLine, Qt.RoundCap))
        path = QPainterPath(QPointF(x, yb - 40))
        path.quadTo(QPointF(x + 16, yb - 120), QPointF(x + 6, yb - 210))
        p.setBrush(Qt.NoBrush)
        p.drawPath(path)
        p.setPen(pen("#2f6a3e", 1))
        p.setBrush(QColor("#4f9a5e"))
        for k in range(6):
            a = math.pi + k * math.pi / 5
            ex, ey = x + 6 + math.cos(a) * 70, yb - 210 + math.sin(a) * 26 + 26
            leaf = QPainterPath(QPointF(x + 6, yb - 210))
            leaf.quadTo(QPointF((x + 6 + ex) / 2, yb - 236), QPointF(ex, ey))
            leaf.quadTo(QPointF((x + 6 + ex) / 2, yb - 220), QPointF(x + 6, yb - 210))
            p.drawPath(leaf)
    # the court: lines in the sand (ground level), the two halves tinted
    for x0, x1, col in ((XMIN, 630, QColor(232, 71, 63, 26)), (630, XMAX, QColor(59, 139, 208, 26))):
        p.setPen(Qt.NoPen)
        p.setBrush(col)
        p.drawRect(QRectF(gx(x0), yb - 4, gx(x1) - gx(x0), 16))
    p.setPen(QPen(QColor(255, 255, 255, 220), 3))
    p.drawLine(QPointF(gx(XMIN), yb + 2), QPointF(gx(XMAX), yb + 2))
    for x in (XMIN, XMAX):
        p.drawLine(QPointF(gx(x), yb - 2), QPointF(gx(x), yb + 8))
    # side boards (the ball bounces off them)
    for x in (XMIN - 14, XMAX + 2):
        p.setPen(pen("#6b4a35", 1.2))
        p.setBrush(QColor("#c08a5c"))
        p.drawRect(QRectF(gx(x), yb - 64, 12, 66))
        p.setBrush(QColor("#e8473f") if x < 630 else QColor("#3b8bd0"))
        p.drawRect(QRectF(gx(x), yb - 64, 12, 10))
