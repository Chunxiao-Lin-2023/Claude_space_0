# -*- coding: utf-8 -*-
"""Art for the cat house, drawn straight-on (a front 3/4 view): every storey is a little diorama seen
from the front and a bit from above. 二楼 follows the user's floor plan, 一楼 is designed around it and
户外 is the garden in front of the house.

World coordinates per storey: x 0..PW (left to right on the plan), y 0..PD (front to back: y = 0 is the
near side with the balcony and the front door), z up. Each storey is drawn into its own panel; in panel
coordinates a world point lands at  sx = OX + x,  sy = OY - y * KY - z  (see iso())."""

import copy as _copy
import math
import random
import time

from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import (QColor, QFont, QFontMetricsF, QLinearGradient, QPainter, QPainterPath, QPen, QPixmap,
                           QPolygonF, QRadialGradient)

from .art import clamp, lerp, qc, shade

# ---------------------------------------------------------------------------------- projection
PW, PD = 840.0, 320.0           # plan width (x) and depth (y), scaled by SCALE below
DEPTH = 1.3                     # (v26) the house's rooms (and garden) are this much deeper than the plan
PD_OLD = 480.0                  # house depth before v26 (house units): saved layouts are moved from it
PD_PLACE = 480.0                # depth of the places outside and the arenas (unchanged)
KY = 0.52                       # how much the floor is foreshortened (looking down at ~30 degrees)
WALL_H = 140.0                  # back walls
IN_H = 24.0                     # interior walls are cut low so you can see into the rooms
FRONT_H = 10.0                  # front walls are cut down to a skirting board
FH = 150.0                      # storey height (for the stairs)
SIDE_T = 12.0                   # thickness of the side walls
MARGIN_X = 36.0
HEADROOM = 34.0
OX, OY = 0.0, 0.0               # panel position of the world origin (set by _scale_plan)
PANEL_W, PANEL_H = 0.0, 0.0
TW, TH = 0.0, 0.0
OUT = "#5e4436"


ROT = None      # (v26) the garden turned on its side (beside the house in the all view): (a, b, c, d, w, h) with
#                 u = a + b * y,  v = c + d * x - z  in the garden's own panel (w x h)


def iso(x, y, z=0.0):
    """World -> panel coordinates (the name is historical; the view is straight-on now)."""
    if ROT is not None:
        return ROT[0] + ROT[1] * y, ROT[2] + ROT[3] * x - z
    return OX + x, OY - y * KY - z


def ipt(x, y, z=0.0):
    if ROT is not None:
        return QPointF(ROT[0] + ROT[1] * y, ROT[2] + ROT[3] * x - z)
    return QPointF(OX + x, OY - y * KY - z)


def from_screen(sx, sy, z=0.0):
    if ROT is not None:
        return (sy + z - ROT[2]) / ROT[3], (sx - ROT[0]) / ROT[1]
    return sx - OX, (OY - sy - z) / KY


class rotated:
    """with rotated(rot): draw with the garden on its side (rot from the house window), or with None: the usual
    straight-on view (sprites are always rendered that way)."""

    def __init__(self, rot):
        self.rot = rot

    def __enter__(self):
        global ROT, PANEL_W, PANEL_H
        self.old = (ROT, PANEL_W, PANEL_H)
        ROT = self.rot
        PANEL_W, PANEL_H = (self.rot[4], self.rot[5]) if self.rot is not None else (TW, TH)
        return self

    def __exit__(self, *a):
        global ROT, PANEL_W, PANEL_H
        ROT, PANEL_W, PANEL_H = self.old
        return False


def pen(c=OUT, w=1.3, a=255):
    return QPen(qc(c, a), w, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin)


def poly(*pts):
    return QPolygonF([p if isinstance(p, QPointF) else QPointF(*p) for p in pts])


def srect(x0, x1, y, z0, z1):
    """Screen rect of a vertical face at depth y spanning x0..x1 and z0..z1."""
    if ROT is not None:                     # seen edge-on: a sliver (on the outer side)
        u = ROT[0] + ROT[1] * y
        t = max(1.0, (z1 - z0) * 0.3)
        va, vb = sorted((ROT[2] + ROT[3] * x0, ROT[2] + ROT[3] * x1))
        return QRectF(u if ROT[1] < 0 else u - t, va - z1, t, vb - va + (z1 - z0))
    return QRectF(OX + x0, OY - y * KY - z1, x1 - x0, z1 - z0)


def frect(x0, y0, x1, y1, z=0.0):
    """Screen rect of a horizontal rectangle (x0..x1, y0..y1) at height z."""
    if ROT is not None:
        ua, ub = sorted((ROT[0] + ROT[1] * y0, ROT[0] + ROT[1] * y1))
        va, vb = sorted((ROT[2] + ROT[3] * x0, ROT[2] + ROT[3] * x1))
        return QRectF(ua, va - z, ub - ua, vb - va)
    return QRectF(OX + x0, OY - y1 * KY - z, x1 - x0, (y1 - y0) * KY)


def vgrad(r, c0, c1):
    g = QLinearGradient(r.left(), r.top(), r.left(), r.bottom())
    g.setColorAt(0, QColor(c0))
    g.setColorAt(1, QColor(c1))
    return g


def hgrad(r, c0, c1, mid=None):
    g = QLinearGradient(r.left(), r.top(), r.right(), r.top())
    g.setColorAt(0, QColor(c0))
    if mid is not None:
        g.setColorAt(0.4, QColor(mid))
    g.setColorAt(1, QColor(c1))
    return g


def fill_rect(p, r, brush, outline=None, w=1.0, radius=0.0, alpha=200):
    p.setPen(pen(outline, w, alpha) if outline else Qt.NoPen)
    p.setBrush(brush)
    if radius > 0:
        p.drawRoundedRect(r, radius, radius)
    else:
        p.drawRect(r)


# ---------------------------------------------------------------------------------- floor plans
# rooms: key -> (label, x0, y0, x1, y1, floor style); walls: (x0, y0, x1, y1, [gaps along the wall])
FLOOR_NAMES = {0: "一楼", 1: "二楼"}
STYLES = {
    "wood": ("#dcac78", "#c99862"), "oak": ("#e6c393", "#d2aa78"), "tile": ("#efe9de", "#d9d1c3"),
    "carpet": ("#d3bddc", "#c0a8cc"), "kids": ("#f4dba6", "#e6c88a"), "wet": ("#d3e6e9", "#bad3d8"),
    "stone": ("#ddd7cd", "#c7c0b4"), "deck": ("#cc9e6e", "#b6875c"), "grass": ("#bddc93", "#a7c97e"),
}
WALLPAPER = {
    "master": "#efe2f2", "second": "#fde3dc", "hall": "#f3e7d3", "wc": "#dceff1", "dining": "#f6e6cc",
    "living": "#f7e7cf", "kitchen": "#e3efdc", "stair": "#eee5d8", "balcony": "#f7e7cf",
    "play": "#fbe8cf", "study": "#e4ebf5", "laundry": "#e2f0ec", "sun": "#fff1d2",
}
CURTAINS = {
    "master": "#c9a3d6", "second": "#f2a9a0", "hall": "#d9b98f", "wc": "#9fcfd6", "dining": "#e8b77d",
    "living": "#8fb4cf", "kitchen": "#a9cf97", "stair": "#cdb79a", "play": "#f2b56b", "study": "#93a9d1",
    "laundry": "#93cbbd", "sun": "#f2cf6b",
}
FLOORS = {
    1: dict(
        rooms={
            "master": ("主卧", 0, 0, 243, 320, "carpet"),
            "second": ("次卧", 243, 0, 486, 203, "kids"),
            "hall": ("走廊", 243, 203, 486, 261, "oak"),
            "wc": ("厕所", 243, 261, 365, 320, "wet"),
            "dining": ("餐厅", 365, 261, 486, 320, "oak"),
            "living": ("客厅", 486, 0, 689, 203, "wood"),
            "kitchen": ("厨房", 486, 203, 689, 320, "tile"),
            "stair": ("楼道", 689, 0, 840, 320, "stone"),
            "balcony": ("阳台", 486, -40, 689, 0, "deck"),            # (v26: a third deeper)
        },
        walls=[
            (243, 0, 243, 320, [(212, 248)]),            # 主卧 | 次卧 / 走廊 (主卧 door)
            (243, 203, 486, 203, [(278, 314)]),          # 次卧 | 走廊 (次卧 door)
            (243, 261, 486, 261, [(253, 287), (382, 472)]),  # 走廊 | 厕所 / 餐厅
            (365, 261, 365, 320, []),                    # 厕所 | 餐厅
            (486, 0, 486, 320, [(207, 259)]),            # 次卧 / 走廊 / 餐厅 | 客厅 / 厨房
            (514, 203, 650, 203, []),                    # TV wall between 客厅 and 厨房
            (689, 0, 689, 320, [(247, 277)]),            # 外门
        ],
        windows=[("S", 70, 170), ("S", 285, 330), ("S", 395, 460), ("S", 540, 600), ("E", 90, 170)],
        labels=True,
    ),
    0: dict(
        rooms={
            "play": ("猫咪游戏室", 0, 0, 300, 320, "wood"),
            "study": ("书房", 300, 0, 520, 190, "oak"),
            "laundry": ("洗衣房", 300, 190, 520, 320, "wet"),
            "sun": ("阳光房", 520, 0, 689, 320, "grass"),
            "stair": ("玄关", 689, 0, 840, 320, "stone"),
        },
        walls=[
            (300, 0, 300, 320, [(110, 165), (238, 280)]),
            (300, 190, 520, 190, [(380, 422)]),
            (520, 0, 520, 320, [(50, 110), (228, 272)]),
            (689, 0, 689, 320, [(240, 296)]),
        ],
        windows=[("S", 70, 190), ("S", 380, 450), ("S", 545, 665), ("E", 110, 190)],
        labels=True,
    ),
}
FLOORS[2] = dict(                                         # 户外: the garden in front of the house
    rooms={"yard": ("院子", 0, 0, 840, 320, "grass")},
    walls=[],
    windows=[("S", 70, 190), ("S", 380, 450), ("S", 545, 665)],
    labels=False,
)
FLOOR_NAMES[2] = "户外"
GATE = (380.0, 460.0)                                    # garden gate on the near fence (y = 0)
STAIR = dict(x0=742.0, x1=808.0, y0=70.0, y1=230.0)      # one straight flight, rising towards +y
STAIR_BOTTOM = (775.0, 54.0)                             # ground floor, in front of the first step
STAIR_TOP = (775.0, 250.0)                               # top floor, at the head of the flight
ENTRANCE = (722.0, 808.0)                                # ground floor front door (on the y = 0 wall)
EXIT = (765.0, -14.0)
ENTRY_D = 24.0                                           # depth of the entrance step in front of the door
BALCONY = (486.0, 689.0, -40.0)

# Rooms are drawn larger than the plan's pixels (the furniture and people keep their size), so the
# house feels roomy. Everything above is in plan pixels; scale it once here.
SCALE = 1.5


def _scale_plan(s):
    global PW, PD, PD_PLACE, OX, OY, TW, TH, PANEL_W, PANEL_H, STAIR, STAIR_BOTTOM, STAIR_TOP, ENTRANCE, EXIT, \
        ENTRY_D, BALCONY
    sy = s * DEPTH                                   # y inside the house: deeper rooms
    PW, PD = 840.0 * s, 320.0 * sy
    PD_PLACE = 320.0 * s

    def yy(y):
        return y * sy if y > 0 else y * s            # in front of the house (balcony, steps) stays as it was
    for fl in FLOORS.values():
        fl["rooms"] = {k: (lab, x0 * s, yy(y0), x1 * s, yy(y1), st)
                       for k, (lab, x0, y0, x1, y1, st) in fl["rooms"].items()}
        fl["walls"] = [(x0 * s, yy(y0), x1 * s, yy(y1),
                        [(a * s, b * s) if y0 == y1 else (yy(a), yy(b)) for a, b in g])
                       for x0, y0, x1, y1, g in fl["walls"]]
        fl["windows"] = [(side, a * s, b * s) if side == "S" else (side, yy(a), yy(b))
                         for side, a, b in fl["windows"]]
    STAIR = {k: (v * s if k.startswith("x") else yy(v)) for k, v in STAIR.items()}
    STAIR_BOTTOM = (STAIR_BOTTOM[0] * s, yy(STAIR_BOTTOM[1]))
    STAIR_TOP = (STAIR_TOP[0] * s, yy(STAIR_TOP[1]))
    ENTRANCE = (ENTRANCE[0] * s, ENTRANCE[1] * s)
    EXIT = (EXIT[0] * s, EXIT[1] * s)
    ENTRY_D *= s
    BALCONY = tuple(v * s for v in BALCONY)
    OX = MARGIN_X
    OY = HEADROOM + 20.0 + WALL_H + PD * KY          # 20: the roof band on the garden facade
    PANEL_W = PW + 2 * MARGIN_X
    PANEL_H = OY + 56.0
    TW, TH = PANEL_W, PANEL_H


_RAW = _copy.deepcopy(dict(FLOORS=FLOORS, STAIR=STAIR, STAIR_BOTTOM=STAIR_BOTTOM, STAIR_TOP=STAIR_TOP,
                           ENTRANCE=ENTRANCE, EXIT=EXIT, ENTRY_D=ENTRY_D, BALCONY=BALCONY, GATE=GATE))
MIRROR = False


def mx(x):
    """Mirror an x coordinate when the layout is flipped left-right."""
    return PW - x if MIRROR else x


def mrot(rot):
    return {1: 3, 3: 1}.get(rot, rot) if MIRROR else rot


def configure(mirror=False):
    """(Re)build the plan geometry in house units, optionally mirrored left-right."""
    global FLOORS, STAIR, STAIR_BOTTOM, STAIR_TOP, ENTRANCE, EXIT, ENTRY_D, BALCONY, GATE, MIRROR, \
        DEFAULT_LAYOUT, YARD_DOOR, INSIDE_DOOR, GATE_OUT, GATE_IN, SIDE_DOOR
    raw = _copy.deepcopy(_RAW)
    FLOORS = raw["FLOORS"]
    STAIR, STAIR_BOTTOM, STAIR_TOP = raw["STAIR"], raw["STAIR_BOTTOM"], raw["STAIR_TOP"]
    ENTRANCE, EXIT, ENTRY_D, BALCONY, GATE = raw["ENTRANCE"], raw["EXIT"], raw["ENTRY_D"], raw["BALCONY"], raw["GATE"]
    _scale_plan(SCALE)
    GATE = (GATE[0] * SCALE, GATE[1] * SCALE)
    MIRROR = bool(mirror)
    STAIR["open"] = "x0"
    if MIRROR:
        for fl in FLOORS.values():
            fl["rooms"] = {k: (lab, PW - x1, y0, PW - x0, y1, st) for k, (lab, x0, y0, x1, y1, st) in fl["rooms"].items()}
            fl["walls"] = [(min(PW - x0, PW - x1), y0, max(PW - x0, PW - x1), y1,
                            sorted((PW - b, PW - a) for a, b in g) if y0 == y1 else list(g))
                           for x0, y0, x1, y1, g in fl["walls"]]
            fl["windows"] = [(side, PW - b, PW - a) if side == "S" else ("W", a, b) for side, a, b in fl["windows"]]
        STAIR = dict(x0=PW - STAIR["x1"], x1=PW - STAIR["x0"], y0=STAIR["y0"], y1=STAIR["y1"], open="x1")
        STAIR_BOTTOM = (PW - STAIR_BOTTOM[0], STAIR_BOTTOM[1])
        STAIR_TOP = (PW - STAIR_TOP[0], STAIR_TOP[1])
        ENTRANCE = (PW - ENTRANCE[1], PW - ENTRANCE[0])
        EXIT = (PW - EXIT[0], EXIT[1])
        BALCONY = (PW - BALCONY[1], PW - BALCONY[0], BALCONY[2])
        GATE = (PW - GATE[1], PW - GATE[0])
    door_x = (ENTRANCE[0] + ENTRANCE[1]) / 2
    # (v26) 一楼's front door is in the side wall at the front corner, on the garden's side (the garden door is
    # at that end of the garden's house wall), so in the all view the two doors meet
    SIDE_DOOR = ("left" if door_x < PW / 2 else "right", 12.0, 118.0)
    INSIDE_DOOR = (30.0 if SIDE_DOOR[0] == "left" else PW - 30.0, (SIDE_DOOR[1] + SIDE_DOOR[2]) / 2)
    YARD_DOOR = (door_x, PD - 34.0)                  # garden, in front of the same door
    gx = (GATE[0] + GATE[1]) / 2
    GATE_IN = (gx, 22.0)
    GATE_OUT = (gx, -ENTRY_D * 0.6)
    DEFAULT_LAYOUT = [(t, f, mx(x), deepen_y(t, r, y), mrot(r)) for t, f, x, y, r in _RAW_LAYOUT]


_scale_plan(SCALE)
UI = TW / 1200.0                                         # chrome (buttons, fonts) scales with the canvas


def depth(f):
    """How deep storey / place f is: the house floors and the garden are deeper than the places outside."""
    return PD if f in (0, 1, 2) else PD_PLACE


def deepen_y(typ, rot, y):
    """A furniture position from the old (pre-v26) house depth to the deeper rooms: things against the back
    wall stay against it, things in front of the house stay, everything else moves back in proportion."""
    if y <= 0:
        return y
    cat = CATALOG.get(typ) or {}
    d = float(cat.get("d", 40) if rot in (0, 2) else cat.get("w", 40))
    if y + d / 2 >= PD_OLD - 16 or cat.get("wall"):
        return y + (PD - PD_OLD)
    return y * DEPTH


def rooms(f):
    return FLOORS[f]["rooms"]


def room_at(f, x, y):
    for key, (label, x0, y0, x1, y1, st) in rooms(f).items():
        if x0 <= x < x1 and y0 <= y < y1:
            return key
    return None


def inside(f, x, y, margin=0.0):
    """Is (x, y) on the walkable floor of storey f (rooms, balcony, the entrance step)?"""
    if room_at(f, x, y) is None:
        if f == 2 and GATE[0] <= x <= GATE[1] and -ENTRY_D <= y < 0:
            return True
        return False
    return True


DOOR_H = 62.0                   # door frames stand taller than the cut-down walls (v23), so doors read as doors
WALL_T = 10.0                   # interior wall thickness as drawn (v23: was 6, too thin to see when seen end-on)


def wall_between(f, x0, y0, x1, y1):
    """(v26) Does the straight line from (x0, y0) to (x1, y1) go through a wall of storey f (not a doorway)?"""
    for wx0, wy0, wx1, wy1, gaps in FLOORS.get(f, {}).get("walls", ()):
        if wy0 == wy1:                                   # along x, at y = wy0
            if (y0 - wy0) * (y1 - wy0) >= 0 or y0 == y1:
                continue
            t = (wy0 - y0) / (y1 - y0)
            c = x0 + t * (x1 - x0)
            lo, hi = min(wx0, wx1), max(wx0, wx1)
        else:                                            # along y, at x = wx0
            if (x0 - wx0) * (x1 - wx0) >= 0 or x0 == x1:
                continue
            t = (wx0 - x0) / (x1 - x0)
            c = y0 + t * (y1 - y0)
            lo, hi = min(wy0, wy1), max(wy0, wy1)
        if lo <= c <= hi and not any(g0 <= c <= g1 for g0, g1 in gaps):
            return True
    return False


def wall_segments(f, step=24.0, thick=WALL_T):
    """Interior walls split into short pieces so they depth-sort against cats and people."""
    out = []
    for x0, y0, x1, y1, gaps in FLOORS[f]["walls"]:
        horiz = y0 == y1
        a0, a1 = (x0, x1) if horiz else (y0, y1)
        cuts = [a0]
        for g0, g1 in sorted(gaps):
            cuts += [g0, g1]
        cuts.append(a1)
        for i in range(0, len(cuts), 2):
            s, e = cuts[i], cuts[i + 1]
            a = s
            while a < e - 0.5:
                b = min(e, a + step)
                if horiz:
                    out.append((a, y0 - thick / 2, b, y0 + thick / 2))
                else:
                    out.append((x0 - thick / 2, a, x0 + thick / 2, b))
                a = b
    return out


def wall_ends(f):
    """Door posts: the ends of wall runs next to gaps (drawn a little taller)."""
    out = []
    for x0, y0, x1, y1, gaps in FLOORS[f]["walls"]:
        horiz = y0 == y1
        for g0, g1 in gaps:
            for a in (g0, g1):
                out.append((a, y0) if horiz else (x0, a))
    return out


# ---------------------------------------------------------------------------------- primitives
def face(p, pts, color, outline=OUT, ow=1.0, alpha=255):
    p.setPen(pen(outline, ow, 170) if outline else Qt.NoPen)
    c = QColor(color)
    c.setAlpha(alpha)
    p.setBrush(c)
    p.drawPolygon(poly(*pts))


def box(p, x0, y0, z0, x1, y1, z1, color, top=None, outline=True, radius=0.0, alpha=255):
    """Axis-aligned box seen from the front: its top and its front (y = y0) face, with soft shading."""
    c = QColor(color)
    tc = QColor(top) if top else c.lighter(114)
    fr = srect(x0, x1, y0, z0, z1)
    tr = frect(x0, y0, x1, y1, z1)
    whole = QRectF(fr.left(), tr.top(), fr.width(), fr.bottom() - tr.top())
    if alpha < 255:
        p.save()
        p.setOpacity(alpha / 255.0)
    if radius > 0:
        clip = QPainterPath()
        clip.addRoundedRect(whole, radius, radius)
        p.save()
        p.setClipPath(clip)
    p.setPen(Qt.NoPen)
    if fr.height() > 0.2:
        p.setBrush(vgrad(fr, c.lighter(104), c.darker(112)))
        p.drawRect(fr)
        # a darker sliver on the right edge suggests the side
        if fr.width() > 8:
            p.setBrush(QColor(0, 0, 0, 22))
            p.drawRect(QRectF(fr.right() - min(3.0, fr.width() * 0.08), fr.top(), min(3.0, fr.width() * 0.08), fr.height()))
    if tr.height() > 0.2:
        p.setBrush(vgrad(tr, tc.darker(104), tc))
        p.drawRect(tr)
        if fr.height() > 0.2:
            p.setPen(QPen(QColor(255, 255, 255, 110), 1.0))
            p.drawLine(QPointF(tr.left() + 1, tr.bottom() - 0.5), QPointF(tr.right() - 1, tr.bottom() - 0.5))
    if radius > 0:
        p.restore()
    if outline:
        p.setPen(pen(c.darker(165).name(), 1.0, 190))
        p.setBrush(Qt.NoBrush)
        if radius > 0:
            p.drawRoundedRect(whole, radius, radius)
        else:
            p.drawRect(whole)
        if fr.height() > 0.2 and tr.height() > 0.2:
            p.setPen(pen(c.darker(140).name(), 0.8, 120))
            p.drawLine(QPointF(whole.left() + radius * 0.3, tr.bottom()), QPointF(whole.right() - radius * 0.3, tr.bottom()))
    if alpha < 255:
        p.restore()


def cyl(p, cx, cy, z0, r, h, color, top=None, outline=True, ry=None):
    """Upright cylinder: shaded side plus the top ellipse."""
    ry = r if ry is None else ry
    c = QColor(color)
    sx, sy0 = iso(cx, cy, z0)
    sy1 = sy0 - h
    ey = ry * KY
    path = QPainterPath(QPointF(sx - r, sy1))
    path.lineTo(sx - r, sy0)
    path.arcTo(QRectF(sx - r, sy0 - ey, 2 * r, 2 * ey), 180, 180)
    path.lineTo(sx + r, sy1)
    path.closeSubpath()
    p.setPen(pen(c.darker(165).name(), 1.0, 190) if outline else Qt.NoPen)
    g = QLinearGradient(sx - r, 0, sx + r, 0)
    g.setColorAt(0, c.darker(108))
    g.setColorAt(0.35, c.lighter(110))
    g.setColorAt(1, c.darker(125))
    p.setBrush(g)
    p.drawPath(path)
    tc = QColor(top) if top else c.lighter(116)
    p.setBrush(tc)
    p.drawEllipse(QRectF(sx - r, sy1 - ey, 2 * r, 2 * ey))


def disc(p, cx, cy, z, rx, ry, color, outline=OUT, ow=1.0, alpha=255):
    """Flat ellipse lying on a surface."""
    sx, sy = iso(cx, cy, z)
    c = QColor(color)
    c.setAlpha(alpha)
    p.setPen(pen(outline, ow, 170) if outline else Qt.NoPen)
    p.setBrush(c)
    if ROT is not None:
        p.drawEllipse(QPointF(sx, sy), ry * abs(ROT[1]), rx * abs(ROT[3]))
        return
    p.drawEllipse(QPointF(sx, sy), rx, ry * KY)


iso_box = box
iso_cyl = cyl


def iso_ellipse(p, cx, cy, z, rx, ry, color, outline=OUT, ow=1.0, alpha=255):
    disc(p, cx, cy, z, rx, ry, color, outline, ow, alpha)


def floor_poly(x0, y0, x1, y1, z=0.0):
    return [iso(x0, y0, z), iso(x1, y0, z), iso(x1, y1, z), iso(x0, y1, z)]


def soft_shadow(p, x0, y0, x1, y1, strength=1.0):
    """Contact shadow on the floor under a piece of furniture."""
    r = frect(x0, y0, x1, y1, 0)
    p.setPen(Qt.NoPen)
    for i, a in enumerate((16, 16, 20)):
        g = 5 - i * 2.2
        p.setBrush(QColor(60, 35, 20, int(a * strength)))
        rr = r.adjusted(-g, -g * 0.5, g, g * 0.6 + 1.5)
        p.drawRoundedRect(rr, 6, 4)


# ---------------------------------------------------------------------------------- the shell
def draw_base(p, f):
    """The diorama block: the floor slab and each room's floor."""
    slab = 16.0
    fr = srect(0, PW, 0, -slab, 0)
    p.setPen(pen(OUT, 1.2, 180))
    p.setBrush(vgrad(fr, "#b98657", "#8f633f"))
    p.drawRect(fr)
    p.setPen(QPen(QColor(255, 255, 255, 60), 1))
    p.drawLine(QPointF(fr.left(), fr.top() + 1), QPointF(fr.right(), fr.top() + 1))
    base = frect(0, 0, PW, PD)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#cfa77c"))
    p.drawRect(base)
    for key, (label, x0, y0, x1, y1, st) in rooms(f).items():
        c0, c1 = STYLES[st]
        if y0 < 0:          # balcony: its own little slab in front
            sr = srect(x0, x1, y0, -slab, 0)
            p.setPen(pen(OUT, 1.1, 180))
            p.setBrush(vgrad(sr, "#b98657", "#8f633f"))
            p.drawRect(sr)
        r = frect(x0, y0, x1, y1)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(c0))
        p.drawRect(r)
        p.save()
        p.setClipRect(r)
        floor_texture(p, st, x0, y0, x1, y1, c0, c1)
        p.restore()
        # a soft darkening along the back of each room (ambient occlusion)
        if y1 > 0:
            band = frect(x0, max(y0, y1 - 40), x1, y1)
            g = QLinearGradient(iso(0, y1)[0], 0, iso(0, max(y0, y1 - 40))[0], 0) if ROT is not None else \
                QLinearGradient(0, band.top(), 0, band.bottom())
            g.setColorAt(0, QColor(70, 40, 20, 40))
            g.setColorAt(1, QColor(70, 40, 20, 0))
            p.setBrush(g)
            p.drawRect(band)
    if f == 2:
        draw_yard_extras(p)
    if f == 0 and ROT is None:
        # (v26) the step outside the front door, in the side wall
        side, dy0, dy1 = SIDE_DOOR
        x0, x1 = (-SIDE_T - 22.0, -SIDE_T) if side == "left" else (PW + SIDE_T, PW + SIDE_T + 22.0)
        sr = srect(x0, x1, dy0, -slab, 0)
        p.setPen(pen(OUT, 1.1, 180))
        p.setBrush(vgrad(sr, "#a69d90", "#8a8276"))
        p.drawRect(sr)
        fill_rect(p, frect(x0, dy0, x1, dy1), QColor("#cdc5b8"), OUT, 1.0)
        fill_rect(p, frect(x0 + 5, dy0 + 14, x1 - 5, dy1 - 14), QColor("#b0574a"), None, radius=3)
        p.setPen(QPen(QColor(255, 255, 255, 90), 1, Qt.DashLine))
        p.setBrush(Qt.NoBrush)
        p.drawRoundedRect(frect(x0 + 7, dy0 + 17, x1 - 7, dy1 - 17), 2, 2)


def floor_texture(p, st, x0, y0, x1, y1, c0, c1):
    if st in ("tile", "wet", "stone"):
        step = 24 if st != "stone" else 36
        # checker tint for a little life
        p.setPen(Qt.NoPen)
        tint = QColor(c1)
        tint.setAlpha(60)
        p.setBrush(tint)
        j = 0
        y = y0
        while y < y1:
            i = 0
            x = x0
            while x < x1:
                if (i + j) % 2 == 0:
                    p.drawRect(frect(x, y, min(x1, x + step), min(y1, y + step)))
                x += step
                i += 1
            y += step
            j += 1
        p.setPen(QPen(QColor(c1), 1.0))
        x = x0 + step
        while x < x1:
            p.drawLine(ipt(x, y0), ipt(x, y1))
            x += step
        y = y0 + step
        while y < y1:
            p.drawLine(ipt(x0, y), ipt(x1, y))
            y += step
    elif st in ("wood", "oak", "deck", "kids"):
        plank = 20.0
        y = y0
        row = 0
        p.setPen(Qt.NoPen)
        while y < y1:
            if row % 2:
                p.setBrush(QColor(255, 255, 255, 22))
                p.drawRect(frect(x0, y, x1, min(y1, y + plank)))
            if row % 3 == 2:
                p.setBrush(QColor(120, 70, 30, 14))
                p.drawRect(frect(x0, y, x1, min(y1, y + plank)))
            y += plank
            row += 1
        p.setPen(QPen(QColor(c1), 1.0))
        y = y0 + plank
        row = 0
        while y < y1 + plank:
            p.drawLine(ipt(x0, y), ipt(x1, y))
            x = x0 + (40 if row % 2 else 95) + (row * 37) % 60
            while x < x1:
                p.drawLine(ipt(x, y - plank), ipt(x, min(y, y1)))
                x += 150
            y += plank
            row += 1
    elif st == "carpet":
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(c1))
        y = y0 + 8
        row = 0
        while y < y1:
            x = x0 + (8 if row % 2 else 22)
            while x < x1:
                p.drawEllipse(ipt(x, y), 1.5, 1.0)
                x += 28
            y += 16
            row += 1
        p.setPen(QPen(QColor(255, 255, 255, 70), 2))
        p.setBrush(Qt.NoBrush)
        p.drawRect(frect(x0 + 10, max(y0, 0) + 10, x1 - 10, y1 - 10))
    elif st == "grass":
        p.setPen(Qt.NoPen)
        rnd = int(x0 * 7 + y0 * 13) + 3
        for i in range(int((x1 - x0) * (y1 - y0) / 2400)):
            rnd = (rnd * 1103515245 + 12345) & 0x7fffffff
            gx = x0 + (rnd % 1000) / 1000.0 * (x1 - x0)
            gy = y0 + ((rnd >> 10) % 1000) / 1000.0 * (y1 - y0)
            p.setBrush(QColor(255, 255, 255, 26) if i % 2 else QColor(60, 110, 40, 22))
            sx, sy = iso(gx, gy)
            p.drawEllipse(QPointF(sx, sy), 18 + (rnd % 14), 7 + (rnd % 5))
        p.setPen(QPen(QColor(c1), 1.2))
        k = 0
        y = y0 + 6
        while y < y1:
            x = x0 + 6 + (k * 13) % 22
            while x < x1:
                sx, sy = iso(x, y)
                p.drawLine(QPointF(sx, sy), QPointF(sx - 1.5, sy - 4))
                p.drawLine(QPointF(sx, sy), QPointF(sx + 1.5, sy - 4))
                x += 24
            y += 14
            k += 1


def room_of_wall_point(f, x, y):
    return room_at(f, min(max(x, 0.5), PW - 0.5), min(max(y, 0.5), PD - 0.5))


def draw_side_walls(p, h=None, door=False):
    """The two side walls are seen edge-on: a strip each, cut lower towards the front. door: (v26) 一楼's front
    door in one of them, at the front corner."""
    h = WALL_H if h is None else h
    for x0, x1 in ((-SIDE_T, 0.0), (PW, PW + SIDE_T)):
        _side_wall(p, x0, x1, h)
        if door and (SIDE_DOOR[0] == "left") == (x0 < 0):
            _side_door(p, x0, x1)


def _side_door(p, x0, x1):
    """The front door seen edge-on in the side wall: its frame, the open doorway and the light outside."""
    _, y0, y1 = SIDE_DOOR
    top = iso(0, y1, 100)[1]
    bot = iso(0, y0, 0)[1]
    r = QRectF(OX + x0 - 2, top, x1 - x0 + 4, bot - top)
    p.setPen(pen("#5e3b26", 1.2))
    p.setBrush(vgrad(r, "#b27a52", "#94603e"))
    p.drawRoundedRect(r, 2, 2)
    inner = r.adjusted(3, 6, -3, -2)
    g = QLinearGradient(inner.left(), 0, inner.right(), 0)
    g.setColorAt(0, QColor("#fff4d6"))
    g.setColorAt(1, QColor("#e9d3a8"))
    p.setPen(Qt.NoPen)
    p.setBrush(g)
    p.drawRect(inner)
    p.setBrush(QColor("#f2c94c"))
    p.drawEllipse(QPointF(r.center().x(), inner.top() + inner.height() * 0.55), 1.8, 1.8)


def _side_wall(p, x0, x1, h):
    if True:
        top = iso(0, PD + 8, h)[1]
        bot = iso(0, 0, 0)[1]
        r = QRectF(OX + x0, top, x1 - x0, bot - top)
        p.setPen(pen(OUT, 1.2, 190))
        g = QLinearGradient(0, r.top(), 0, r.bottom())
        g.setColorAt(0, QColor("#efd9b8"))
        g.setColorAt(0.7, QColor("#e2c39b"))
        g.setColorAt(1, QColor("#c9a57c"))
        p.setBrush(g)
        p.drawRect(r)
        p.setPen(QPen(QColor(255, 255, 255, 110), 1.2))
        xi = r.right() - 1.5 if x0 < 0 else r.left() + 1.5
        p.drawLine(QPointF(xi, r.top() + 2), QPointF(xi, r.bottom() - 2))


def draw_back_walls(p, f):
    """Full-height wall along the back of the storey, papered per room, plus the side walls."""
    if f == 2:
        draw_facade(p)
        return
    xs = sorted({0.0, PW} | {r[1] for r in rooms(f).values() if r[4] >= PD - 0.5} |
                {r[3] for r in rooms(f).values() if r[4] >= PD - 0.5})
    for a, b in zip(xs, xs[1:]):
        key = room_of_wall_point(f, (a + b) / 2, PD - 1)
        col = QColor(WALLPAPER.get(key, "#f3e7d3"))
        r = srect(a, b, PD, 0, WALL_H)
        p.setPen(Qt.NoPen)
        p.setBrush(vgrad(r, col.darker(106), col.lighter(103)))
        p.drawRect(r)
        p.save()
        p.setClipRect(r)
        wall_pattern(p, key, a, b)
        p.restore()
        # skirting board and crown moulding
        sk = srect(a, b, PD, 0, 10)
        p.setBrush(vgrad(sk, shade(col.name(), 0.86).name(), shade(col.name(), 0.78).name()))
        p.drawRect(sk)
        p.setPen(QPen(QColor(255, 255, 255, 150), 1))
        p.drawLine(QPointF(sk.left(), sk.top() + 0.5), QPointF(sk.right(), sk.top() + 0.5))
        cr = srect(a, b, PD, WALL_H - 7, WALL_H)
        p.setPen(Qt.NoPen)
        p.setBrush(vgrad(cr, "#fbf4e8", shade(col.name(), 0.9).name()))
        p.drawRect(cr)
    # wall top (thickness) and the seams where interior walls meet the back wall
    cap = frect(-SIDE_T, PD, PW + SIDE_T, PD + 8, WALL_H)
    fill_rect(p, cap, QColor("#ead2b0"), OUT, 1.2)
    p.setPen(pen(OUT, 1.0, 120))
    for x0, y0, x1, y1, gaps in FLOORS[f]["walls"]:
        if y1 >= PD - 0.5 and x0 == x1:
            p.drawLine(ipt(x0, PD, 0), ipt(x0, PD, WALL_H - 7))
    p.setPen(pen(OUT, 1.2, 150))
    p.drawLine(ipt(0, PD, 0), ipt(PW, PD, 0))
    draw_side_walls(p, door=(f == 0))


def wall_pattern(p, key, a, b):
    if key in ("second", "play"):
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(255, 255, 255, 130))
        z = 26
        row = 0
        while z < WALL_H - 14:
            x = a + (10 if row % 2 else 28)
            while x < b - 6:
                sx, sy = iso(x, PD, z)
                p.drawPath(star_path(sx, sy, 3.4))
                x += 36
            z += 26
            row += 1
    elif key in ("living", "master", "study", "sun"):
        p.setPen(QPen(QColor(255, 255, 255, 80), 4))
        x = a + 10
        while x < b:
            p.drawLine(ipt(x, PD, 10), ipt(x, PD, WALL_H))
            x += 24
        p.setPen(QPen(QColor(0, 0, 0, 14), 1))
        x = a + 22
        while x < b:
            p.drawLine(ipt(x, PD, 10), ipt(x, PD, WALL_H))
            x += 24
    elif key in ("kitchen", "wc", "laundry"):
        top = 62
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(255, 255, 255, 120))
        p.drawRect(srect(a, b, PD, 10, top))
        p.setPen(QPen(QColor(0, 0, 0, 22), 1))
        z = 10
        while z <= top:
            p.drawLine(ipt(a, PD, z), ipt(b, PD, z))
            z += 10
        row = 0
        z = 10
        while z < top:
            x = a + (0 if row % 2 else 7)
            while x < b:
                p.drawLine(ipt(x, PD, z), ipt(x, PD, z + 10))
                x += 14
            z += 10
            row += 1
    elif key in ("dining", "hall", "stair"):
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(0, 0, 0, 12))
        p.drawRect(srect(a, b, PD, 10, 52))
        p.setPen(QPen(QColor(255, 255, 255, 140), 2))
        p.drawLine(ipt(a, PD, 52), ipt(b, PD, 52))


def star_path(cx, cy, r, n=5):
    path = QPainterPath()
    for i in range(n * 2):
        a = -math.pi / 2 + i * math.pi / n
        rr = r if i % 2 == 0 else r * 0.45
        pt = QPointF(cx + rr * math.cos(a), cy + rr * math.sin(a))
        if i == 0:
            path.moveTo(pt)
        else:
            path.lineTo(pt)
    path.closeSubpath()
    return path


WIN_Z0, WIN_Z1 = 50.0, 118.0


def window_rect(a, b, z0=WIN_Z0, z1=WIN_Z1):
    return srect(a, b, PD, z0, z1)


def draw_window_birds(p, f, t, birds):
    """Birds flying past the back windows (drawn every frame over the cached windows)."""
    if f == 2 or not birds:
        return
    for side, a, b in FLOORS[f]["windows"]:
        if side != "S":
            continue
        r = window_rect(a, b)
        cx, cy = r.center().x(), r.center().y()
        mine = [bd for bd in birds if bd["f"] == f and bd["w"] == (side, a)]
        if not mine:
            continue
        p.save()
        p.setClipRect(r.adjusted(2, 2, -2, -2), Qt.IntersectClip)
        for bd in mine:
            bx = cx + bd["x"]
            by = cy - 6 + bd["y"]
            flap = 3 * math.sin(t * 14 + bd["ph"])
            pp = QPainterPath(QPointF(bx - 5, by - flap))
            pp.quadTo(QPointF(bx - 2, by - 2), QPointF(bx, by))
            pp.quadTo(QPointF(bx + 2, by - 2), QPointF(bx + 5, by - flap))
            p.setPen(pen("#3d3d4a", 1.2))
            p.setBrush(Qt.NoBrush)
            p.drawPath(pp)
        p.restore()


def draw_window_weather(p, f, t, weather, closed=()):
    """Rain running down / snow drifting past the back windows (drawn every frame)."""
    if f == 2 or weather not in ("rain", "snow"):
        return
    for side, a, b in FLOORS[f]["windows"]:
        if side != "S":
            continue
        if room_of_wall_point(f, (a + b) / 2, PD - 1) in closed:
            continue
        r = window_rect(a, b)
        p.save()
        p.setClipRect(r.adjusted(2, 2, -2, -2), Qt.IntersectClip)
        w, h = r.width(), r.height()
        if weather == "rain":
            p.setPen(QPen(QColor(220, 235, 255, 120), 0.9))
            for i in range(16):
                k = (t * 1.9 + i * 0.137 + a * 0.01) % 1.0
                x = r.left() + ((i * 23.7 + a) % (w + 10)) - 5 + k * 6
                y = r.top() - 8 + k * (h + 16)
                p.drawLine(QPointF(x, y), QPointF(x - 2.2, y + 7))
            # drops gathering on the glass and running down
            p.setPen(Qt.NoPen)
            for i in range(6):
                seed = (i * 37 + int(a)) % 97
                k = ((t * (0.05 + (seed % 5) * 0.02) + seed / 97.0) % 1.0) ** 2
                x = r.left() + 6 + (seed * 3.3) % (w - 12)
                y = r.top() + 4 + k * (h - 8)
                p.setBrush(QColor(235, 245, 255, 150))
                p.drawEllipse(QPointF(x, y), 1.4, 1.9)
                p.setBrush(QColor(235, 245, 255, 60))
                p.drawRect(QRectF(x - 0.5, r.top() + 4, 1.0, y - r.top() - 4))
        else:
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(255, 255, 255, 220))
            for i in range(18):
                k = (t * 0.22 + i * 0.113 + a * 0.003) % 1.0
                x = r.left() + ((i * 19.3 + a) % w) + 4 * math.sin(t * 1.3 + i)
                y = r.top() - 4 + k * (h + 8)
                p.drawEllipse(QPointF(x, y), 1.3 + (i % 3) * 0.3, 1.3 + (i % 3) * 0.3)
            # snow piling on the outside sill
            p.setBrush(QColor(255, 255, 255, 235))
            p.drawRoundedRect(QRectF(r.left() + 2, r.bottom() - 5, w - 4, 4), 2, 2)
        p.restore()


def overcast(c, k=0.7, grey="#8f9aa8"):
    g = QColor(grey)
    c = QColor(c)
    return QColor(int(c.red() + (g.red() - c.red()) * k), int(c.green() + (g.green() - c.green()) * k),
                  int(c.blue() + (g.blue() - c.blue()) * k))


def draw_windows(p, f, hour, t, birds, closed=(), weather=None):
    """Back-wall windows with the sky of the hour; curtains drawn shut for the rooms in closed."""
    if f == 2:
        return
    top, bot = sky_colors(hour)
    dark = is_dark(hour)
    grey = weather in ("rain", "snow")
    if grey:
        top, bot = overcast(top, 0.65 if not dark else 0.3), overcast(bot, 0.7 if not dark else 0.3, "#b3bcc8")
    for side, a, b in FLOORS[f]["windows"]:
        if side != "S":
            continue
        r = window_rect(a, b)
        key = room_of_wall_point(f, (a + b) / 2, PD - 1)
        g = QLinearGradient(0, r.top(), 0, r.bottom())
        g.setColorAt(0, top)
        g.setColorAt(1, bot)
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        p.drawRect(r)
        p.save()
        p.setClipRect(r)
        cx, cy = r.center().x(), r.center().y()
        if not dark:
            p.setBrush(QColor(140, 190, 120, 160))                  # distant hills
            p.drawEllipse(QPointF(cx - r.width() * 0.3, r.bottom() + 6), r.width() * 0.5, 16)
            p.setBrush(QColor(120, 175, 110, 170))
            p.drawEllipse(QPointF(cx + r.width() * 0.35, r.bottom() + 8), r.width() * 0.45, 14)
        p.setBrush(QColor(255, 255, 255, 110 if dark else 220) if not grey else QColor(150, 158, 170, 200))
        for i in range(2 if not grey else 4):
            ox = ((t * (5 + i * 2) + i * 70 + a) % (r.width() + 80)) - r.width() / 2 - 40
            for dx, rr in ((-9, 6), (0, 8), (9, 6)):
                p.drawEllipse(QPointF(cx + ox + dx, cy - 14 + i * 16), rr, rr * 0.7)
        if dark and not grey:
            p.setBrush(QColor("#fff4c8"))
            p.drawEllipse(QPointF(cx + 14, cy - 18), 6, 6)
            p.setBrush(QColor(255, 255, 255, 180))
            for i in range(5):
                p.drawEllipse(QPointF(r.left() + (i * 37 + a) % r.width(), r.top() + 6 + (i * 19) % 30), 1.1, 1.1)
        # a soft reflection
        p.setPen(QPen(QColor(255, 255, 255, 70 if not dark else 30), 6))
        p.drawLine(QPointF(r.left() + 12, r.bottom() - 6), QPointF(r.left() + 30, r.top() + 6))
        p.restore()
        # frame, mullions, sill
        p.setBrush(Qt.NoBrush)
        p.setPen(QPen(QColor("#ffffff"), 4))
        p.drawRect(r)
        p.drawLine(QPointF(cx, r.top()), QPointF(cx, r.bottom()))
        p.drawLine(QPointF(r.left(), cy), QPointF(r.right(), cy))
        p.setPen(pen("#9b8570", 1.0))
        p.drawRect(r.adjusted(-2, -2, 2, 2))
        box(p, a - 6, PD - 7, WIN_Z0 - 4, b + 6, PD, WIN_Z0, "#fbf3e6")
        # curtains
        cc = QColor(CURTAINS.get(key, "#d9b98f"))
        rod_y = r.top() - 7
        p.setPen(pen("#8a6a50", 2.0))
        p.drawLine(QPointF(r.left() - 14, rod_y), QPointF(r.right() + 14, rod_y))
        shut = key in closed
        for side_k in (-1, 1):
            x_out = r.left() - 12 if side_k < 0 else r.right() + 12
            if shut:
                x_in = cx + side_k * 1.0
                path = QPainterPath(QPointF(x_out, rod_y))
                path.lineTo(x_in, rod_y)
                path.lineTo(x_in, r.bottom() + 10)
                path.lineTo(x_out, r.bottom() + 10)
                path.closeSubpath()
            else:
                x_in = r.left() + 10 if side_k < 0 else r.right() - 10
                path = QPainterPath(QPointF(x_out, rod_y))
                path.lineTo(x_in, rod_y)
                path.quadTo(QPointF(x_in - side_k * 2, r.center().y()), QPointF((x_in + x_out) / 2, r.bottom() + 8))
                path.lineTo(x_out, r.bottom() + 10)
                path.closeSubpath()
            p.setPen(pen(cc.darker(150).name(), 1.0, 200))
            g2 = QLinearGradient(min(x_in, x_out), 0, max(x_in, x_out), 0)
            g2.setColorAt(0, cc.lighter(108))
            g2.setColorAt(0.5, cc.darker(108))
            g2.setColorAt(1, cc.lighter(104))
            p.setBrush(g2)
            p.drawPath(path)
            p.setPen(QPen(cc.darker(125), 1))
            for k in ((0.2, 0.4, 0.6, 0.8) if shut else (0.33, 0.66)):
                xx = lerp(x_out, x_in, k)
                p.drawLine(QPointF(xx, rod_y + 2), QPointF(xx - (0 if shut else side_k * 3), r.bottom() + 6))
            if shut:
                continue
            p.setPen(pen("#c9a043", 1.6))
            ty = r.center().y() + 8
            p.drawLine(QPointF(lerp(x_out, x_in, 0.1), ty), QPointF(lerp(x_out, x_in, 0.75), ty + 2))


def draw_front_walls(p, f):
    """The near walls are cut down to a skirting board so you can look in."""
    if f == 2:
        draw_fence(p)
        return
    h = FRONT_H
    t = 7.0
    bx0, bx1, by0 = BALCONY
    if f == 1:
        segs = [(0, bx0), (bx1, PW)]          # the balcony side is open (sliding door)
    else:
        segs = [(0, PW)]                     # (v26: the front door is in the side wall now)
    for a, b in segs:
        box(p, a, -t, 0, b, 0, h, "#ead2ad", top="#f6e6cc")
    if f == 1:
        # balcony railing along its front edge, posts at the corners
        x0, x1, y0 = bx0, bx1, by0
        for x in (x0, x1):
            box(p, x - 3, y0 - 3, 0, x + 3, 3, 38, "#8a6248", top="#a87a58")
        p.setPen(pen("#7b5a43", 1.4))
        x = x0 + 12
        while x < x1 - 6:
            p.drawLine(ipt(x, y0, 0), ipt(x, y0, 34))
            x += 12
        box(p, x0, y0 - 3, 32, x1, y0 + 3, 37, "#9a6c4e", top="#b98a62")
        # (v26) flower boxes hung on the railing, so the balcony stands out
        for bx in (x0 + 26, x1 - 86):
            box(p, bx, y0 - 9, 26, bx + 60, y0 - 1, 38, "#c4704e", top="#7a5a3e", radius=2)
            for k in range(6):
                fx, fy = iso(bx + 6 + k * 10, y0 - 5, 41 + (k % 2) * 2)
                p.setPen(Qt.NoPen)
                p.setBrush(QColor("#6fae5a"))
                p.drawEllipse(QPointF(fx, fy + 2), 4.2, 3.0)
                p.setBrush(QColor(("#ff8fa3", "#ffd166", "#f4f1ff", "#ff9f6b")[k % 4]))
                p.drawEllipse(QPointF(fx, fy - 1), 2.6, 2.6)
        # sliding door frame
        for x in (bx0, bx1):
            box(p, x - 3, -3, 0, x + 3, 3, 70, "#f7f1e8", top="#ffffff")



def draw_stairs(p, f):
    """Ground floor: the flight rising towards the back. Top floor: the stairwell with steps below."""
    s = STAIR
    n = 10
    step = (s["y1"] - s["y0"]) / n
    if f == 0:
        for i in reversed(range(n)):
            y0 = s["y0"] + i * step
            z1 = (i + 1) * FH / n
            box(p, s["x0"], y0, 0, s["x1"], y0 + step, z1, "#c08d63", top="#e6bd92")
            # nosing highlight
            p.setPen(QPen(QColor(255, 255, 255, 120), 1.2))
            a = iso(s["x0"] + 2, y0, z1)
            b = iso(s["x1"] - 2, y0, z1)
            p.drawLine(QPointF(a[0], a[1] + 0.5), QPointF(b[0], b[1] + 0.5))
        # stringers on both sides, the handrail on the open side
        top_y = iso(0, s["y1"], FH)[1]
        bot_y = iso(0, s["y0"], 0)[1]
        for x0_, x1_ in ((s["x0"] - 4, s["x0"]), (s["x1"], s["x1"] + 4)):
            r = QRectF(OX + x0_, top_y, x1_ - x0_, bot_y - top_y)
            p.setPen(pen("#5a3a26", 0.9))
            p.setBrush(hgrad(r, "#9a6c4e", "#7a5236"))
            p.drawRect(r)
        ox = s[s.get("open", "x0")]
        sx = OX + ox + (-7 if ox == s["x0"] else 7)
        p.setPen(QPen(QColor("#6d4a33"), 3.0, Qt.SolidLine, Qt.RoundCap))
        p.drawLine(QPointF(sx, top_y - 38), QPointF(sx, bot_y - 40))
        p.setPen(QPen(QColor(255, 255, 255, 90), 1))
        p.drawLine(QPointF(sx - 0.8, top_y - 36), QPointF(sx - 0.8, bot_y - 42))
        box(p, ox - 3, s["y0"] - 3, 0, ox + 3, s["y0"] + 3, 44, "#6d4a33", top="#8a6248")
    else:
        hole = frect(s["x0"], s["y0"], s["x1"], s["y1"])
        p.setPen(pen(OUT, 1.2))
        p.setBrush(QColor("#3b2e27"))
        p.drawRect(hole)
        p.save()
        p.setClipRect(hole)
        for i in reversed(range(n)):
            y0 = s["y0"] + i * step
            z1 = (i + 1) * FH / n - FH
            box(p, s["x0"], y0, -FH, s["x1"], y0 + step, z1, "#a87a55", top="#c99b70")
        g = QLinearGradient(0, hole.top(), 0, hole.bottom())
        g.setColorAt(0, QColor(0, 0, 0, 0))
        g.setColorAt(1, QColor(0, 0, 0, 90))
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        p.drawRect(hole)
        p.restore()


def draw_rail(p):
    """Top floor: railing around the stairwell opening (a depth-sorted drawable)."""
    s = STAIR
    h = 34
    ox = s[s.get("open", "x0")]
    p.setPen(pen("#6d4a33", 1.3))
    x = s["x0"] + 10
    while x < s["x1"] - 4:
        p.drawLine(ipt(x, s["y0"], 0), ipt(x, s["y0"], h))
        x += 11
    box(p, s["x0"], s["y0"] - 3, h - 4, s["x1"], s["y0"] + 1, h, "#7b5236", top="#9a6c4e")
    box(p, ox - 2.5, s["y0"], h - 4, ox + 2.5, s["y1"], h, "#7b5236", top="#9a6c4e")
    for x in (s["x0"], s["x1"]):
        box(p, x - 3, s["y0"] - 3, 0, x + 3, s["y0"] + 3, h + 6, "#6d4a33", top="#8a6248")


def draw_wall_piece(p, seg):
    """One piece of a low interior wall (v23): a light cap with a dark outline, shaded sides, a shadow on the
    floor, so walls running away from you (seen end-on) still read as walls."""
    x0, y0, x1, y1 = seg
    h = IN_H
    fr = srect(x0, x1, y0, 0, h)
    tr = frect(x0, y0, x1, y1, h)
    horiz = (x1 - x0) > (y1 - y0)
    p.setPen(Qt.NoPen)
    # shadow on the floor (to the right of walls that run back, in front of the others)
    sh = QColor(60, 40, 20, 38)
    p.setBrush(sh)
    if horiz:
        p.drawRect(QRectF(fr.left(), fr.bottom(), fr.width(), 4))
    else:
        b0 = frect(x1, y0, x1 + 5, y1, 0)
        p.drawRect(b0)
    p.setBrush(vgrad(fr, "#f3e1c6", "#dcc19c"))
    p.drawRect(fr)
    p.setBrush(QColor("#c9a37a"))
    p.drawRect(QRectF(fr.left(), fr.bottom() - 5, fr.width(), 5))
    # the cap: light wood, with a highlight on the near edge
    p.setBrush(QColor("#e9d2ad") if horiz else QColor("#d4b285"))
    p.drawRect(tr)
    p.setPen(QPen(QColor(255, 255, 255, 150), 1.2))
    if horiz:
        p.drawLine(QPointF(tr.left(), tr.bottom() - 0.8), QPointF(tr.right(), tr.bottom() - 0.8))
    else:
        p.drawLine(QPointF(tr.left() + 1.2, tr.top()), QPointF(tr.left() + 1.2, tr.bottom()))
    p.setPen(QPen(QColor("#7a5536"), 1.3))
    if horiz:
        p.drawLine(QPointF(tr.left(), tr.top()), QPointF(tr.right(), tr.top()))
        p.drawLine(QPointF(fr.left(), fr.top()), QPointF(fr.right(), fr.top()))
        p.setPen(QPen(QColor("#7a5536"), 1.0))
        p.drawLine(QPointF(fr.left(), fr.bottom()), QPointF(fr.right(), fr.bottom()))
    else:
        p.drawLine(QPointF(tr.left(), tr.top()), QPointF(tr.left(), fr.bottom()))
        p.drawLine(QPointF(tr.right(), tr.top()), QPointF(tr.right(), fr.bottom()))
        p.drawLine(QPointF(fr.left(), fr.top()), QPointF(fr.right(), fr.top()))


def draw_post(p, x, y):
    """A door frame post: darker wood, taller than the wall, with a little cap."""
    box(p, x - 4.5, y - 4.5, 0, x + 4.5, y + 4.5, DOOR_H, "#9a6c4e", top="#b98a64")
    box(p, x - 5.5, y - 5.5, DOOR_H, x + 5.5, y + 5.5, DOOR_H + 3, "#7b5236", top="#9a6c4e")


def door_gaps(f):
    """(horizontal, a0, a1, fixed coordinate) of every doorway in the interior walls."""
    out = []
    for x0, y0, x1, y1, gaps in FLOORS[f]["walls"]:
        horiz = y0 == y1
        for g0, g1 in gaps:
            out.append((horiz, g0, g1, y0 if horiz else x0))
    return out


def draw_thresholds(p, f):
    """A wooden threshold on the floor in each doorway (drawn with the floor)."""
    if f not in (0, 1) or "walls" not in FLOORS.get(f, {}):
        return
    for horiz, a0, a1, c in door_gaps(f):
        r = frect(a0, c - 6, a1, c + 6, 0.3) if horiz else frect(c - 6, a0, c + 6, a1, 0.3)
        p.setPen(pen("#8a6248", 1.0, 200))
        p.setBrush(QColor("#c9a27a"))
        p.drawRect(r)
        p.setPen(QPen(QColor(255, 255, 255, 90), 1))
        if horiz:
            p.drawLine(QPointF(r.left() + 2, r.top() + 1.5), QPointF(r.right() - 2, r.top() + 1.5))
        else:
            p.drawLine(QPointF(r.left() + 1.5, r.top() + 2), QPointF(r.left() + 1.5, r.bottom() - 2))


def draw_labels(p, f, font, obstacles=()):
    """Room names on the floor, each placed where furniture covers it least.
    obstacles: [(QRectF on screen, weight)] - furniture, stairs..."""
    if not FLOORS[f].get("labels", True):
        return
    p.setFont(font)
    fm = QFontMetricsF(font)
    for key, (label, x0, y0, x1, y1, st) in rooms(f).items():
        w, h = fm.horizontalAdvance(label) + 8, fm.height() + 2
        # the visible floor: the wall along the room's front edge hides a strip of it
        near = iso(0, y0, 0)[1] - (IN_H if y0 > 1 else FRONT_H) - 1
        far = iso(0, y1, 0)[1] + 1
        floor = QRectF(OX + x0 + 6, far, x1 - x0 - 12, near - far)
        best = None
        for fy in (0.3, 0.2, 0.42, 0.55, 0.12, 0.68, 0.8, 0.92):
            for fx in (0.5, 0.35, 0.65, 0.22, 0.78, 0.12, 0.88):
                cx = x0 + (x1 - x0) * fx
                cy = y0 + (y1 - y0) * (fy if key != "balcony" else 0.5)
                sx, sy = iso(cx, cy, 0)
                r = QRectF(sx - w / 2, sy - h / 2, w, h)
                if not floor.contains(r):
                    continue
                cover = 0.0
                for o, wt in obstacles:
                    if o.intersects(r):
                        i = o.intersected(r)
                        cover += i.width() * i.height() * wt
                score = cover + abs(fx - 0.5) * 40 + abs(fy - 0.3) * 50
                if best is None or score < best[0]:
                    best = (score, r)
        if best is None:
            if floor.height() < h * 0.8:
                continue                      # too thin a strip to label
            best = (0, QRectF(floor.center().x() - w / 2, floor.center().y() - h / 2, w, h))
        p.setPen(QColor(90, 60, 40, 120))
        p.drawText(best[1], Qt.AlignCenter, label)


def room_volume(x0, y0, x1, y1, h=WALL_H):
    """Screen region of a room: its floor plus the wall above its back edge."""
    hh = h if y1 >= PD - 1 else min(h, IN_H)
    top = iso(0, y1, hh)[1]
    bot = iso(0, y0, 0)[1]
    path = QPainterPath()
    path.addRect(QRectF(OX + x0, top, x1 - x0, bot - top))
    return path


NIGHT = QColor(16, 22, 58, 122)          # the dark over unlit rooms
LIGHT_WARM = (255, 228, 188)              # ~3000 K: warm, but not orange


def draw_lights(p, f, hour, lit_rooms, lamps):
    """Night: darken the storey; lit rooms keep their colours under a soft warm light that falls off towards the
    corners (v23: brighter and less yellow); lamps and the TV glow."""
    if not is_dark(hour):
        return
    p.setPen(Qt.NoPen)
    if f > 2:
        region = QPainterPath()
        region.addRect(QRectF(OX - SIDE_T - 6, 0, PW + 2 * SIDE_T + 12, iso(0, -ENTRY_D, 0)[1] + 18))
    elif f == 2:
        region = yard_volume()
    else:
        region = room_volume(-SIDE_T, -FRONT_H, PW + SIDE_T, PD + 8)
        if f == 1:
            bx0, bx1, by0 = BALCONY
            region = region.united(room_volume(bx0, by0, bx1, 0, 40))

    lit = []
    for key in lit_rooms:
        r = rooms(f).get(key)
        if r is not None:
            lit.append(r)
    holes = QPainterPath()
    for label, x0, y0, x1, y1, st in lit:
        holes = holes.united(room_volume(x0, y0, x1, y1))
    p.setBrush(NIGHT)
    p.drawPath(region.subtracted(holes) if lit else region)
    pts = [(lp[0], lp[1]) for lp in lamps if len(lp) <= 2]
    for label, x0, y0, x1, y1, st in lit:
        vol = room_volume(x0, y0, x1, y1)
        br = vol.boundingRect()
        src = [q for q in pts if br.contains(QPointF(q[0], q[1] + 40))]
        cx, cy = src[0] if src else iso((x0 + x1) / 2, (y0 + y1) / 2, 120)
        rad = max(br.width(), br.height()) * 0.95
        # dimmer towards the far corners (a lamp, not daylight)
        g = QRadialGradient(QPointF(cx, cy), rad)
        g.setColorAt(0, QColor(16, 22, 58, 0))
        g.setColorAt(0.55, QColor(16, 22, 58, 16))
        g.setColorAt(1, QColor(16, 22, 58, 62))
        p.setBrush(g)
        p.drawPath(vol)
        # the warm light itself, added on top
        p.save()
        p.setCompositionMode(QPainter.CompositionMode_Screen)
        g = QRadialGradient(QPointF(cx, cy), rad * 0.85)
        r_, g_, b_ = LIGHT_WARM
        g.setColorAt(0, QColor(r_, g_, b_, 70))
        g.setColorAt(0.5, QColor(r_, g_, b_, 32))
        g.setColorAt(1, QColor(r_, g_, b_, 0))
        p.setBrush(g)
        p.drawPath(vol)
        p.restore()
    if lamps:
        p.save()
        p.setClipPath(region, Qt.IntersectClip)
        for lamp in lamps:
            sx, sy = lamp[0], lamp[1]
            tv = len(lamp) > 2
            c = QColor(lamp[2]) if tv else QColor(*LIGHT_WARM)
            flick = lamp[3] if len(lamp) > 3 else 1.0
            if not tv:
                p.setCompositionMode(QPainter.CompositionMode_Screen)
            g = QRadialGradient(QPointF(sx, sy), 110)
            c.setAlpha(int((110 if tv else 120) * flick))
            g.setColorAt(0, c)
            c2 = QColor(c)
            c2.setAlpha(int(c.alpha() * 0.35))
            g.setColorAt(0.35, c2)
            c.setAlpha(0)
            g.setColorAt(1, c)
            p.setBrush(g)
            p.drawEllipse(QPointF(sx, sy), 110, 110)
            p.setCompositionMode(QPainter.CompositionMode_SourceOver)
            if not tv:
                # a pool of light on the floor under the lamp
                g = QRadialGradient(QPointF(sx, sy + 120), 70)
                g.setColorAt(0, QColor(255, 236, 205, 60))
                g.setColorAt(1, QColor(255, 236, 205, 0))
                p.setBrush(g)
                p.drawEllipse(QPointF(sx, sy + 120), 70, 26)
        p.restore()


# ---------------------------------------------------------------------------------- sky
def sky_colors(hour):
    """(top, bottom) sky colours for a fractional hour of the day."""
    keys = [(0, "#0f1838", "#24305a"), (5, "#1d2650", "#4d4a7a"), (6.3, "#f6a77d", "#fbd9a5"),
            (8, "#7cc3f0", "#cbe9fb"), (16, "#6db8ec", "#c4e4fa"), (18.3, "#f08a5d", "#fbcf8f"),
            (19.6, "#3b3a72", "#8b6aa0"), (21, "#121a3d", "#28325e"), (24, "#0f1838", "#24305a")]
    for (h0, t0, b0), (h1, t1, b1) in zip(keys, keys[1:]):
        if h0 <= hour <= h1:
            k = (hour - h0) / (h1 - h0)
            return mix(t0, t1, k), mix(b0, b1, k)
    return QColor(keys[0][1]), QColor(keys[0][2])


def mix(a, b, k):
    a, b = QColor(a), QColor(b)
    return QColor(int(lerp(a.red(), b.red(), k)), int(lerp(a.green(), b.green(), k)),
                  int(lerp(a.blue(), b.blue(), k)))


def is_dark(hour):
    return hour < 6.4 or hour > 18.9


# ---------------------------------------------------------------------------------- furniture
# Items are described in local coordinates: u across the front, v from front (-d/2) to back (+d/2), z up.
# rot (0..3) turns the front towards -y (the viewer), -x, +y (away), +x.
def rot_vec(rot, u, v):
    if rot == 0:
        return u, v
    if rot == 1:
        return v, -u
    if rot == 2:
        return -u, -v
    return -v, u


def B(u0, v0, z0, u1, v1, z1, color, top=None, r=0.0, alpha=255):
    return ("box", u0, v0, z0, u1, v1, z1, color, top, r, alpha)


def C(u, v, z0, r, h, color, top=None):
    return ("cyl", u, v, z0, r, h, color, top)


def E(u, v, z, ru, rv, color, outline=OUT):
    return ("ell", u, v, z, ru, rv, color, outline)


def Fc(pts, color, v=None, side="front", outline=True):
    """Decoration on a vertical face of the item: pts are (s, z), s along the face (u for front / back,
    v for left / right). Drawn only while that face looks at the viewer."""
    return ("face", side, pts, color, v, outline)


def Fr(s0, z0, s1, z1, color, v=None, side="front", outline=True):
    return Fc([(s0, z0), (s1, z0), (s1, z1), (s0, z1)], color, v, side, outline)


def Ft(pts, z, color, outline=None):
    """Decoration lying on a horizontal surface at height z: pts are (u, v)."""
    return ("top", pts, z, color, outline)


def Tl(pts, z, color, w=1.0):
    """A line lying on a horizontal surface."""
    return ("tline", pts, z, color, w)


def Fn(fn, u=0.0, v=0.0, z=0.0, dyn=False, face=None):
    return ("fn", fn, u, v, z, dyn, face)


SIDE_NORMALS = {"front": (0, -1), "back": (0, 1), "left": (-1, 0), "right": (1, 0)}


def face_visible(rot, side):
    nx, ny = rot_vec(rot, *SIDE_NORMALS[side])
    return abs(nx) < 0.5 and ny < -0.5


def _ext(part):
    """(x0, x1, y0, y1, z0, z1) of a world part (relative to the item centre)."""
    k = part[0]
    if k == "box":
        return part[1], part[4], part[2], part[5], part[3], part[6]
    if k == "cyl":
        _, x, y, z0, r, h = part[:6]
        return x - r, x + r, y - r, y + r, z0, z0 + h
    if k == "ell":
        _, x, y, z, rx, ry = part[:6]
        return x - rx, x + rx, y - ry, y + ry, z, z
    if k == "face":
        _, yf, pts = part[:3]
        xs = [q[0] for q in pts]
        zs = [q[1] for q in pts]
        return min(xs), max(xs), yf, yf, min(zs), max(zs)
    if k in ("top", "tline"):
        pts, z = part[1], part[2]
        xs = [q[0] for q in pts]
        ys = [q[1] for q in pts]
        return min(xs), max(xs), min(ys), max(ys), z, z
    return 0, 0, 0, 0, 0, 0


def _before(a, b, eps=0.05):
    """True if part a has to be drawn before part b (a is behind or below b); None if unrelated."""
    ax0, ax1, ay0, ay1, az0, az1 = a
    bx0, bx1, by0, by1, bz0, bz1 = b
    if ax1 <= bx0 + eps or bx1 <= ax0 + eps:
        return None
    a_behind = ay0 >= by1 - eps
    b_behind = by0 >= ay1 - eps
    if a_behind and not b_behind:
        return True
    if b_behind and not a_behind:
        return False
    a_below = az1 <= bz0 + eps
    b_below = bz1 <= az0 + eps
    if a_below and not b_below:
        return True
    if b_below and not a_below:
        return False
    if abs(ay0 - by0) > eps:
        return ay0 > by0
    return az0 < bz0


def topo_order(nodes, before, key):
    """Order nodes so that before(a, b) is respected where defined; ties broken by key (smallest first)."""
    n = len(nodes)
    succ = [[] for _ in range(n)]
    indeg = [0] * n
    for i in range(n):
        for j in range(i + 1, n):
            r = before(nodes[i], nodes[j])
            if r is True:
                succ[i].append(j)
                indeg[j] += 1
            elif r is False:
                succ[j].append(i)
                indeg[i] += 1
    keys = [key(x) for x in nodes]
    import heapq as _hq
    ready = [(keys[i], i) for i in range(n) if indeg[i] == 0]
    _hq.heapify(ready)
    done = [False] * n
    out = []
    while len(out) < n:
        if not ready:                       # a cycle: release the smallest remaining node
            i = min((k for k in range(n) if not done[k]), key=lambda k: keys[k])
            indeg[i] = 0
            _hq.heappush(ready, (keys[i], i))
        _, i = _hq.heappop(ready)
        if done[i]:
            continue
        done[i] = True
        out.append(nodes[i])
        for j in succ[i]:
            if not done[j]:
                indeg[j] -= 1
                if indeg[j] == 0:
                    _hq.heappush(ready, (keys[j], j))
    return out


_PARTS_CACHE = {}


def item_parts(it):
    """Parts in world offsets relative to the item centre, in drawing order (far / low first)."""
    c = CATALOG[it.type]
    sig = None
    try:
        sig = (it.type, it.rot, c.get("sig", lambda i: None)(it))
    except Exception:
        sig = None
    if sig is not None and sig in _PARTS_CACHE:
        return _PARTS_CACHE[sig]
    rot = it.rot
    half_w, half_d = c["w"] / 2.0, c["d"] / 2.0
    solid, fns = [], []
    for part in c["parts"](it):
        kind = part[0]
        if kind == "box":
            _, u0, v0, z0, u1, v1, z1, col, top, r, alpha = part
            a = rot_vec(rot, u0, v0)
            b = rot_vec(rot, u1, v1)
            x0, x1 = sorted((a[0], b[0]))
            y0, y1 = sorted((a[1], b[1]))
            solid.append(("box", x0, y0, z0, x1, y1, z1, col, top, r, alpha))
        elif kind == "cyl":
            _, u, v, z0, r, h, col, top = part
            x, y = rot_vec(rot, u, v)
            solid.append(("cyl", x, y, z0, r, h, col, top))
        elif kind == "ell":
            _, u, v, z, ru, rv, col, ol = part
            x, y = rot_vec(rot, u, v)
            rx, ry = (ru, rv) if rot % 2 == 0 else (rv, ru)
            solid.append(("ell", x, y, z, rx, ry, col, ol))
        elif kind == "face":
            _, side, pts, col, vplane, ol = part
            if not face_visible(rot, side):
                continue
            wpts = []
            for s, z in pts:
                if side in ("front", "back"):
                    pl = vplane if vplane is not None else (-half_d if side == "front" else half_d)
                    pl += -0.15 if side == "front" else 0.15
                    x, y = rot_vec(rot, s, pl)
                else:
                    pl = vplane if vplane is not None else (-half_w if side == "left" else half_w)
                    pl += -0.15 if side == "left" else 0.15
                    x, y = rot_vec(rot, pl, s)
                wpts.append((x, y, z))
            yf = min(q[1] for q in wpts)
            solid.append(("face", yf, [(q[0], q[2]) for q in wpts], col, ol))
        elif kind in ("top", "tline"):
            _, pts, z, col, extra = part
            wp = [rot_vec(rot, u, v) for u, v in pts]
            solid.append((kind, wp, z, col, extra))
        elif kind == "fn":
            _, fn, u, v, z, dyn, side = part
            if side is not None and not face_visible(rot, side):
                continue
            x, y = rot_vec(rot, u, v)
            fns.append(("fn", fn, x, y, z, dyn))
    exts = {id(s): _ext(s) for s in solid}
    order = topo_order(solid, lambda a, b: _before(exts[id(a)], exts[id(b)]),
                       lambda s: (-(exts[id(s)][2] + exts[id(s)][3]) / 2, exts[id(s)][4]))
    fns.sort(key=lambda f: (-f[3], f[4]))
    out = order + fns
    if sig is not None:
        if len(_PARTS_CACHE) > 600:
            _PARTS_CACHE.clear()
        _PARTS_CACHE[sig] = out
    return out


def front_height(it, dx, dy, half=10.0):
    """Highest part of the item standing in front of the point (dx, dy) (offsets from the item centre):
    an agent sitting there is partly hidden behind it."""
    best = 0.0
    for part in item_parts(it):
        if part[0] not in ("box", "cyl"):
            continue
        x0, x1, y0, y1, z0, z1 = _ext(part)
        if x1 < dx - half or x0 > dx + half:
            continue
        if y1 <= dy - 2:
            best = max(best, z1)
    return best


def draw_parts(p, parts, it, t, cx, cy, dyn=False, which=None):
    """Draw parts of an item whose centre is at world (cx, cy). dyn: only animated bits."""
    for part in parts:
        kind = part[0]
        if kind == "fn":
            if part[5] != dyn:
                continue
            sx, sy = iso(cx + part[2], cy + part[3], part[4])
            part[1](p, sx, sy, it, t)
            continue
        if dyn:
            continue
        if which is not None and not which(part):
            continue
        if kind == "box":
            _, x0, y0, z0, x1, y1, z1, col, top, r, alpha = part
            box(p, cx + x0, cy + y0, z0, cx + x1, cy + y1, z1, col, top, True, r, alpha)
        elif kind == "cyl":
            _, x, y, z0, r, h, col, top = part
            cyl(p, cx + x, cy + y, z0, r, h, col, top)
        elif kind == "ell":
            _, x, y, z, rx, ry, col, ol = part
            disc(p, cx + x, cy + y, z, rx, ry, col, ol)
        elif kind == "face":
            _, yf, pts, col, ol = part
            qc_ = QColor(col)
            p.setPen(pen(qc_.darker(150).name(), 0.8, 170) if ol else Qt.NoPen)
            p.setBrush(qc_)
            p.drawPolygon(poly(*[iso(cx + x, cy + yf, z) for x, z in pts]))
        elif kind == "top":
            _, pts, z, col, ol = part
            p.setPen(pen(ol, 0.8, 170) if ol else Qt.NoPen)
            p.setBrush(QColor(col))
            p.drawPolygon(poly(*[iso(cx + x, cy + y, z) for x, y in pts]))
        elif kind == "tline":
            _, pts, z, col, w = part
            p.setPen(QPen(QColor(col), w, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin))
            p.setBrush(Qt.NoBrush)
            path = QPainterPath(ipt(cx + pts[0][0], cy + pts[0][1], z))
            for x, y in pts[1:]:
                path.lineTo(ipt(cx + x, cy + y, z))
            p.drawPath(path)


def item_screen_bbox(it):
    c = CATALOG[it.type]
    x0, y0, x1, y1 = footprint(it)
    h = c["h"] + 40
    left = x0 - it.x - 40
    right = x1 - it.x + 40
    top = -(y1 - it.y) * KY - h - 30
    bottom = (it.y - y0) * KY + 30
    return QRectF(left, top, right - left, bottom - top)


def render_sprite(it, scale, which=None):
    """Pre-render the static parts of an item; returns (pixmap, bbox in canvas units relative to iso(x, y))."""
    bb = item_screen_bbox(it)
    pm = QPixmap(max(1, int(bb.width() * scale + 2)), max(1, int(bb.height() * scale + 2)))
    pm.fill(Qt.transparent)
    p = QPainter(pm)
    p.setRenderHint(QPainter.Antialiasing)
    p.scale(scale, scale)
    ox, oy = iso(0, 0)
    p.translate(-bb.left() - ox, -bb.top() - oy)
    draw_parts(p, item_parts(it), it, 0.0, 0.0, 0.0, False, which)
    p.end()
    return pm, bb


# ---- little painted details ------------------------------------------------------------------
def thirst(it):
    """0 = well watered .. 1 = parched (plants dry out until somebody waters them)."""
    return max(0.0, min(1.0, 1.0 - float(it.state.get("water", 1.0)) * 1.25))


def leaf_colors(it):
    k = thirst(it)
    a, b = QColor("#4f9a55"), QColor("#78c072")
    dry_a, dry_b = QColor("#9a8a45"), QColor("#c9b45a")
    mix = lambda c1, c2: QColor(int(c1.red() + (c2.red() - c1.red()) * k), int(c1.green() + (c2.green() - c1.green()) * k),
                                int(c1.blue() + (c2.blue() - c1.blue()) * k))
    return mix(a, dry_a), mix(b, dry_b), k


def _leaves(p, sx, sy, it, t):
    ca, cb, k = leaf_colors(it)
    for dx, dy, rx, ry, rot in ((-12, -24, 8, 17, -34), (12, -28, 8, 18, 32), (0, -40, 9, 20, 0),
                                (-20, -12, 6, 13, -66), (20, -14, 6, 13, 64), (-6, -32, 6, 14, -12),
                                (7, -20, 6, 13, 18)):
        p.save()
        droop = k * (10 + abs(dx) * 0.4)
        p.translate(sx + dx * (1 + k * 0.25), sy + dy * (1 - k * 0.3))
        p.rotate(rot * (1 + k * 1.2) + (8 * k if dx >= 0 else -8 * k) + 2 * math.sin(t * 0.8 + dx) * (1 - k))
        g = QLinearGradient(-rx, 0, rx, 0)
        g.setColorAt(0, ca)
        g.setColorAt(1, cb)
        p.setPen(pen("#3a6e40" if k < 0.5 else "#6e6234", 1.0, 220))
        p.setBrush(g)
        path = QPainterPath(QPointF(0, ry))
        path.cubicTo(QPointF(rx * 1.3, ry * 0.3), QPointF(rx * 0.9, -ry * 0.8), QPointF(0, -ry))
        path.cubicTo(QPointF(-rx * 0.9, -ry * 0.8), QPointF(-rx * 1.3, ry * 0.3), QPointF(0, ry))
        p.drawPath(path)
        p.setPen(pen("#3a6e40", 0.7, 170))
        p.drawLine(QPointF(0, -ry * 0.8), QPointF(0, ry))
        p.restore()


def _small_leaves(p, sx, sy, it, t):
    ca, cb, k = leaf_colors(it)
    p.setPen(pen("#3f7a46" if k < 0.5 else "#6e6234", 0.9, 220))
    for dx, dy, r in ((-8, -6, 6), (5, -9, 7), (0, -14, 6), (-11, -12, 5), (9, -4, 5), (12, -12, 5)):
        p.setBrush(cb)
        p.drawEllipse(QPointF(sx + dx * (1 + k * 0.2), sy + dy * (1 - k * 0.45)), r, r * 0.8)
    for dx, dy, col in ((-5, -15, "#f28fb0"), (6, -12, "#f6c64f"), (-11, -9, "#ffffff"), (11, -16, "#f28fb0")):
        p.setPen(pen(shade(col, 0.7).name(), 0.8))
        p.setBrush(QColor(col))
        for a in range(5):
            ang = a * math.tau / 5
            p.drawEllipse(QPointF(sx + dx + math.cos(ang) * 2.2, sy + dy + math.sin(ang) * 2.2), 1.8, 1.8)
        p.setBrush(QColor("#f2c94c"))
        p.drawEllipse(QPointF(sx + dx, sy + dy), 1.2, 1.2)


def _lampshade(p, sx, sy, it, t):
    on = it.state.get("on")
    p.setPen(pen("#b8935c", 1.1))
    g = QLinearGradient(sx - 15, 0, sx + 15, 0)
    if on:
        g.setColorAt(0, QColor("#fff6d6"))
        g.setColorAt(1, QColor("#ffe3a0"))
    else:
        g.setColorAt(0, QColor("#f6e7cc"))
        g.setColorAt(1, QColor("#e2c99f"))
    p.setBrush(g)
    path = QPainterPath(QPointF(sx - 15, sy))
    path.lineTo(sx - 10, sy - 24)
    path.quadTo(QPointF(sx, sy - 26), QPointF(sx + 10, sy - 24))
    path.lineTo(sx + 15, sy)
    path.quadTo(QPointF(sx, sy + 4), QPointF(sx - 15, sy))
    p.drawPath(path)
    p.setPen(QPen(QColor(255, 255, 255, 120), 1.4))
    p.drawLine(QPointF(sx - 9, sy - 21), QPointF(sx - 12, sy - 3))
    if on:
        g2 = QRadialGradient(QPointF(sx, sy + 2), 18)
        g2.setColorAt(0, QColor(255, 236, 170, 170))
        g2.setColorAt(1, QColor(255, 236, 170, 0))
        p.setPen(Qt.NoPen)
        p.setBrush(g2)
        p.drawEllipse(QPointF(sx, sy + 2), 18, 8)


def _hat(p, sx, sy, it, t):
    p.setPen(pen("#8a6a40", 1.0))
    p.setBrush(QColor("#d4ad6f"))
    p.drawEllipse(QRectF(sx - 13, sy - 3, 26, 6))
    p.drawRoundedRect(QRectF(sx - 8, sy - 13, 16, 11), 5, 5)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#9c5b4a"))
    p.drawRect(QRectF(sx - 8, sy - 5, 16, 2.6))


def _coat(p, sx, sy, it, t):
    if not it.state.get("coat", True):
        return
    p.setPen(pen("#8a6a40", 1.1))
    g = QLinearGradient(sx - 6, 0, sx + 16, 0)
    g.setColorAt(0, QColor("#d9ab78"))
    g.setColorAt(1, QColor("#b8875a"))
    p.setBrush(g)
    path = QPainterPath(QPointF(sx - 3, sy))
    path.lineTo(sx + 12, sy + 4)
    path.lineTo(sx + 16, sy + 56)
    path.quadTo(QPointF(sx + 5, sy + 59), QPointF(sx - 7, sy + 56))
    path.closeSubpath()
    p.drawPath(path)
    p.setPen(pen("#8a6a40", 1.0))
    p.drawLine(QPointF(sx + 5, sy + 8), QPointF(sx + 5, sy + 52))
    p.setBrush(QColor("#6b4a2e"))
    for k in range(3):
        p.drawEllipse(QPointF(sx + 7.5, sy + 18 + k * 11), 1.2, 1.2)


def _scarf(p, sx, sy, it, t):
    sw = it.state.get("swing", 0.0)
    ang = sw * math.sin(t * 7.0) * 24
    p.save()
    p.translate(sx, sy)
    p.rotate(ang)
    p.setPen(pen("#9c3532", 1.0))
    p.setBrush(QColor("#d9534f"))
    p.drawPolygon(poly((-3, 0), (3, 0), (4, 46), (-2, 48)))
    p.setPen(QPen(QColor("#ffffff"), 2))
    for y in (12, 25, 37):
        p.drawLine(QPointF(-2.5, y), QPointF(3.5, y))
    p.setPen(pen("#9c3532", 0.8))
    for k in range(4):
        p.drawLine(QPointF(-2 + k * 1.8, 47), QPointF(-2 + k * 1.8, 51))
    p.restore()


def _pompom(p, sx, sy, it, t):
    a = math.sin(t * 2.0) * 3
    p.setPen(pen("#8a6248", 1.0))
    p.drawLine(QPointF(sx, sy), QPointF(sx + a, sy + 20))
    p.setPen(pen("#c74a6b", 1.0))
    p.setBrush(QColor("#ef6f8f"))
    p.drawEllipse(QPointF(sx + a, sy + 23), 4.4, 4.4)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 255, 255, 140))
    p.drawEllipse(QPointF(sx + a - 1.3, sy + 21.8), 1.4, 1.4)


def _fish(p, sx, sy, it, t):
    p.setPen(Qt.NoPen)
    for i, (col, sp) in enumerate((("#f39c4b", 0.6), ("#ef5d7d", 0.45), ("#fbd34c", 0.7))):
        u = math.sin(t * sp + i * 2.2)
        x = sx + u * 18
        y = sy - 22 + i * 8 + 2.5 * math.sin(t * 1.3 + i)
        d = 1 if math.cos(t * sp + i * 2.2) > 0 else -1
        p.setBrush(QColor(col))
        p.drawEllipse(QPointF(x, y), 4.5, 3)
        p.drawPolygon(poly((x - d * 4, y), (x - d * 8, y - 3), (x - d * 8, y + 3)))
        p.setBrush(QColor("#2b211c"))
        p.drawEllipse(QPointF(x + d * 2.2, y - 0.6), 0.8, 0.8)
    p.setBrush(QColor(255, 255, 255, 170))
    for i in range(3):
        k = (t * 0.5 + i / 3.0) % 1.0
        p.drawEllipse(QPointF(sx + 14 + i * 2, sy - 6 - 28 * k), 1.3, 1.3)


def _tank_plants(p, sx, sy, it, t):
    p.setPen(pen("#2f7a46", 1.4))
    for dx, h in ((-20, 18), (-16, 24), (16, 20), (21, 14)):
        sw = 2 * math.sin(t * 1.4 + dx)
        path = QPainterPath(QPointF(sx + dx, sy))
        path.quadTo(QPointF(sx + dx + sw, sy - h * 0.5), QPointF(sx + dx + sw * 1.5, sy - h))
        p.drawPath(path)


def _steam(p, sx, sy, it, t):
    if not it.state.get("on"):
        return
    p.setPen(Qt.NoPen)
    for i in range(3):
        k = (t * 0.7 + i / 3.0) % 1.0
        p.setBrush(QColor(255, 255, 255, int(150 * (1 - k))))
        p.drawEllipse(QPointF(sx + 5 * math.sin(t * 2 + i * 2), sy - 6 - 28 * k), 3.5 + 4 * k, 2.5 + 3 * k)


def _fruit(p, sx, sy, it, t):
    p.setPen(pen("#9a8a7a", 0.9))
    p.setBrush(QColor("#ffffff"))
    p.drawEllipse(QRectF(sx - 11, sy - 4, 22, 7))
    for dx, dy, c in ((-5, -4, "#e46f5b"), (4, -4, "#f2c94c"), (0, -7, "#7bbf6a"), (-1, -2, "#e46f5b")):
        p.setPen(pen(shade(c, 0.7).name(), 0.8))
        p.setBrush(QColor(c))
        p.drawEllipse(QPointF(sx + dx, sy + dy), 3.4, 3.4)
    p.setPen(pen("#6b4a2e", 1.0))
    p.drawLine(QPointF(sx + 0.5, sy - 10), QPointF(sx + 1.5, sy - 12))


def _toys(p, sx, sy, it, t):
    p.setPen(pen("#9c4a3a", 0.9))
    p.setBrush(QColor("#e46f5b"))
    p.drawEllipse(QPointF(sx - 7, sy - 4), 6, 6)
    p.setPen(QPen(QColor("#ffffff"), 1.2))
    p.drawArc(QRectF(sx - 12, sy - 9, 10, 10), 30 * 16, 120 * 16)
    p.setPen(pen("#b08a2a", 0.9))
    p.setBrush(QColor("#f2d34c"))
    p.drawEllipse(QPointF(sx + 6, sy - 3), 5, 4)
    p.drawEllipse(QPointF(sx + 9, sy - 8), 3.4, 3.4)
    p.setPen(pen("#4a6fa5", 0.9))
    p.setBrush(QColor("#7fb2e5"))
    p.drawRect(QRectF(sx - 1, sy - 12, 7, 7))


def _desk_things(p, sx, sy, it, t):
    # desk lamp
    p.setPen(pen("#555", 1.4))
    p.drawLine(QPointF(sx + 12, sy), QPointF(sx + 16, sy - 22))
    p.drawLine(QPointF(sx + 16, sy - 22), QPointF(sx + 6, sy - 28))
    p.setPen(pen("#4a7a44", 0.9))
    p.setBrush(QColor("#7bbf6a"))
    p.drawPolygon(poly((sx + 6, sy - 30), (sx - 3, sy - 23), (sx + 9, sy - 20)))
    p.setPen(pen("#555", 1.0))
    p.setBrush(QColor("#6b6b75"))
    p.drawEllipse(QRectF(sx + 7, sy - 2, 10, 4))
    # notebook and pencil cup
    p.setPen(pen("#9a8a7a", 0.8))
    p.setBrush(QColor("#ffffff"))
    p.drawPolygon(poly((sx - 18, sy + 2), (sx - 4, sy + 2), (sx - 3, sy - 5), (sx - 17, sy - 5)))
    p.setPen(pen("#8fb8e8", 0.8))
    p.drawLine(QPointF(sx - 15, sy - 2), QPointF(sx - 6, sy - 2))
    p.setPen(pen("#7a5a3a", 0.9))
    p.setBrush(QColor("#e9a185"))
    p.drawRect(QRectF(sx - 30, sy - 9, 7, 9))
    for dx, c in ((-29, "#e46f5b"), (-27, "#5e9bd6"), (-25, "#f2c94c")):
        p.setPen(pen(c, 1.3))
        p.drawLine(QPointF(sx + dx, sy - 9), QPointF(sx + dx - 0.5, sy - 14))


def _pot(p, sx, sy, it, t):
    p.setPen(pen("#7a2f28", 1.0))
    g = QLinearGradient(sx - 9, 0, sx + 9, 0)
    g.setColorAt(0, QColor("#e06a5c"))
    g.setColorAt(1, QColor("#b8463b"))
    p.setBrush(g)
    p.drawRoundedRect(QRectF(sx - 9, sy - 10, 18, 11), 3, 3)
    p.drawRect(QRectF(sx - 11, sy - 12, 22, 3))
    p.drawLine(QPointF(sx + 11, sy - 9), QPointF(sx + 16, sy - 9))


def _food(p, sx, sy, it, t):
    """What is in the food bowl: kibble, wet food, canned fish / chicken, or kibble with freeze-dried bits."""
    food = it.state.get("food", 100)
    if food <= 0:
        return
    kind = it.state.get("kind", "dry")
    k = clamp(food / 100.0, 0.2, 1.0)
    p.setPen(Qt.NoPen)
    if kind == "wet":
        p.setBrush(QColor("#a0644a"))
        p.drawEllipse(QRectF(sx - 7 * k, sy - 2 - 3 * k, 14 * k, 3 + 3 * k))
        p.setBrush(QColor(255, 255, 255, 90))
        p.drawEllipse(QRectF(sx - 3 * k, sy - 1.5 - 3 * k, 5 * k, 1.4))
        return
    if kind in ("fish", "chicken"):
        base, chunk = ("#f2b7a6", "#e98f7a") if kind == "fish" else ("#e9cfa5", "#d4ab72")
        p.setBrush(QColor(base))
        p.drawEllipse(QRectF(sx - 7 * k, sy - 2 - 3 * k, 14 * k, 3 + 3 * k))
        p.setBrush(QColor(chunk))
        for dx, dy in ((-3, -0.5), (1.5, -1.2), (4, 0.2), (-0.5, 0.6)):
            p.drawRoundedRect(QRectF(sx + dx * k - 1.4, sy - 2 - 3 * k + 2 + dy, 2.8, 1.8), 0.6, 0.6)
        return
    p.setBrush(QColor("#b9763e"))
    p.drawEllipse(QRectF(sx - 7 * k, sy - 2 - 3 * k, 14 * k, 3 + 3 * k))
    p.setBrush(QColor("#d69556"))
    for dx in (-3, 1, 4):
        p.drawEllipse(QPointF(sx + dx * k, sy - 2 - 3 * k), 1.3, 1.0)
    if kind == "fdmix":
        p.setBrush(QColor("#f6e3c4"))
        for dx in (-2, 2.5):
            p.drawRect(QRectF(sx + dx * k - 1.1, sy - 3.4 - 3 * k, 2.2, 2.2))


def _water(p, sx, sy, it, t):
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#bfe3fb"))
    p.drawEllipse(QRectF(sx - 7, sy - 2.5, 14, 4))
    p.setBrush(QColor(255, 255, 255, 170))
    p.drawEllipse(QRectF(sx - 4, sy - 2, 4, 1.4))


def _porthole(p, sx, sy, it, t):
    on = it.state.get("on")
    p.setPen(pen("#7d8a94", 1.2))
    g = QRadialGradient(QPointF(sx - 3, sy - 3), 14)
    g.setColorAt(0, QColor("#d9e2e9"))
    g.setColorAt(1, QColor("#93a4b2"))
    p.setBrush(g)
    p.drawEllipse(QPointF(sx, sy), 13, 13)
    p.setBrush(QColor("#c9e6f5") if not on else QColor("#86c0e6"))
    p.drawEllipse(QPointF(sx, sy), 9, 9)
    if on:
        p.setPen(QPen(QColor(255, 255, 255, 200), 1.6))
        a = t * 8
        p.drawArc(QRectF(sx - 6, sy - 6, 12, 12), int(math.degrees(a) * 16) % 5760, 100 * 16)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(255, 255, 255, 120))
        for i in range(3):
            ang = a * 0.6 + i * 2.1
            p.drawEllipse(QPointF(sx + 4 * math.cos(ang), sy + 4 * math.sin(ang)), 1.6, 1.6)
    p.setPen(QPen(QColor(255, 255, 255, 170), 1.4))
    p.drawArc(QRectF(sx - 7, sy - 7, 14, 14), 100 * 16, 60 * 16)


def _sisal(h, r):
    def fn(p, sx, sy, it, t):
        p.setPen(QPen(QColor(150, 115, 70, 120), 1.0))
        y = sy - 3
        while y > sy - h + 2:
            p.drawLine(QPointF(sx - r + 0.6, y), QPointF(sx + r - 0.6, y - 1.2))
            y -= 3.2
    return fn


def _faucet(p, sx, sy, it, t):
    p.setPen(QPen(QColor("#9aa3a8"), 3.2, Qt.SolidLine, Qt.RoundCap))
    path = QPainterPath(QPointF(sx, sy))
    path.lineTo(sx, sy - 14)
    path.quadTo(QPointF(sx, sy - 19), QPointF(sx + 6, sy - 18))
    path.lineTo(sx + 8, sy - 14)
    p.setBrush(Qt.NoBrush)
    p.drawPath(path)
    p.setPen(QPen(QColor(255, 255, 255, 150), 1))
    p.drawLine(QPointF(sx - 0.8, sy - 2), QPointF(sx - 0.8, sy - 13))


def _dish_rack(p, sx, sy, it, t):
    p.setPen(pen("#8a949a", 1.0))
    for i, c in enumerate(("#ffffff", "#f2c4c4", "#ffffff")):
        p.setBrush(QColor(c))
        p.drawEllipse(QRectF(sx - 8 + i * 5, sy - 15, 4, 15))
    p.setBrush(Qt.NoBrush)
    p.drawRect(QRectF(sx - 10, sy - 6, 18, 6))


def _towel(p, sx, sy, it, t):
    p.setPen(pen("#4a7f9a", 0.9))
    p.setBrush(QColor("#8fc4de"))
    p.drawRoundedRect(QRectF(sx - 6, sy, 12, 18), 2, 2)
    p.setPen(QPen(QColor(255, 255, 255, 180), 1.2))
    p.drawLine(QPointF(sx - 6, sy + 13), QPointF(sx + 6, sy + 13))


def _shoes(p, sx, sy, it, t):
    for dx, c in ((-12, "#e46f5b"), (-4, "#e46f5b"), (8, "#5a4036"), (16, "#5a4036")):
        p.setPen(pen(shade(c, 0.6).name(), 0.8))
        p.setBrush(QColor(c))
        p.drawRoundedRect(QRectF(sx + dx - 3.5, sy - 4, 7, 4.5), 2, 2)


def _tv_show(p, sx, sy, it, t):
    """The picture, drawn every frame (see house_tv)."""
    if not face_visible(it.rot, "front"):
        return
    from . import house_tv
    house_tv.draw_screen(p, QRectF(sx - 33.6, sy - 39.6, 67.2, 39.4), it, t)


def _tv_screen(it):
    on = it.state.get("on")
    if not on:
        return "#2a2a33"
    return TV_COLORS[int(time.time() / 3) % len(TV_COLORS)]


def _tv_picture(p, sx, sy, it, t):
    if not it.state.get("on"):
        p.setPen(QPen(QColor(255, 255, 255, 40), 3))
        p.drawLine(QPointF(sx - 22, sy - 30), QPointF(sx - 12, sy - 8))
        return
    k = int(time.time() / 3) % 5
    p.setPen(Qt.NoPen)
    if k in (0, 3):
        p.setBrush(QColor(255, 255, 255, 200))
        p.drawEllipse(QPointF(sx + 14, sy - 30), 5, 5)
        p.setBrush(QColor(90, 150, 80, 200))
        p.drawEllipse(QPointF(sx - 8, sy - 4), 26, 10)
    elif k in (1, 4):
        p.setBrush(QColor(255, 255, 255, 190))
        for dx in (-14, 0, 14):
            p.drawRoundedRect(QRectF(sx + dx - 5, sy - 26, 10, 18), 3, 3)
    else:
        p.setBrush(QColor(60, 60, 80, 170))
        p.drawEllipse(QPointF(sx, sy - 16), 12, 9)
        p.drawEllipse(QPointF(sx - 8, sy - 26), 4, 5)
        p.drawEllipse(QPointF(sx + 8, sy - 26), 4, 5)


TV_COLORS = ["#7cc3f0", "#9fd67a", "#f6c66b", "#f39ab3", "#b8a3ea"]


def S(kind, u=0.0, v=0.0, h=0.0, who="cat", face=None, **kw):
    d = {"kind": kind, "u": u, "v": v, "h": h, "who": who, "face": face}
    d.update(kw)
    return d


def side_panels(w, d, z0, z1, col, inset=5):
    """Framed panels on both sides of a cabinet (seen when it is turned sideways)."""
    out = []
    for side in ("left", "right"):
        out.append(Fr(-d / 2 + inset, z0 + inset, d / 2 - inset, z1 - inset, col, side=side))
    return out


# ---- the catalogue ------------------------------------------------------------------------------
def p_cat_bed(it):
    return [C(0, 0, 0, 21, 11, "#e58f6b", "#f0a080"), E(0, 0, 11.2, 15, 15, "#fbe3d2", "#d9a083"),
            E(-3, 3, 11.4, 6, 4, "#f7d0bc", None), Tl([(-8, -10), (8, -10)], 11.4, "#e7b49c", 1.0)]


def p_cat_tree(it):
    post, plat, top = "#d9bd8f", "#93acc4", "#aac2d8"
    return [B(-27, -27, 0, 27, 27, 7, "#cdb48c", "#e2cba3", r=3), C(-10, -8, 7, 6, 136, post),
            Fn(_sisal(136, 6), -10, -8, 7), C(14, 10, 7, 5, 88, post), Fn(_sisal(88, 5), 14, 10, 7),
            B(-28, -22, 46, 6, 10, 53, plat, top, r=3), B(-4, -6, 88, 30, 26, 95, plat, top, r=3),
            C(-10, -8, 136, 19, 9, plat, top), E(-10, -8, 145.3, 14, 14, "#d7e3ee", "#7d97ae"),
            Fn(_pompom, 24, -4, 88)]


def p_big_cat_tree(it):
    """大猫爬架 (v23): floor to ceiling — a cubby, a hammock deck, a high platform and a bed on top."""
    post, plat, top, felt = "#d9bd8f", "#c9a27a", "#e6c9a2", "#f1e4d2"
    return [B(-40, -28, 0, 40, 28, 7, "#cdb48c", "#e2cba3", r=3),
            # the cubby (a little house to hide in)
            B(-40, -28, 7, -6, 6, 40, "#b98d63", "#d6ae84", r=3), Fn(_cubby_hole, -23, -28, 10, face="front"),
            C(-26, -10, 40, 5.5, 106, post), Fn(_sisal(106, 5.5), -26, -10, 40),
            C(26, 14, 7, 5, 112, post), Fn(_sisal(112, 5), 26, 14, 7),
            C(-2, 18, 7, 4.5, 73, post),
            # middle deck with a hammock under it
            B(-6, -6, 74, 40, 28, 80, plat, top, r=3), Ft([(-2, -2), (36, -2), (36, 24), (-2, 24)], 80.2, felt),
            Fn(_hammock, 14, 4, 56),
            # high platform and the bed on top
            B(-40, -28, 112, -8, 8, 118, plat, top, r=3), Ft([(-36, -24), (-12, -24), (-12, 4), (-36, 4)], 118.2, felt),
            C(18, 12, 119, 18, 7, plat, top), E(18, 12, 126.3, 13, 13, "#f2d8c2", "#c9a27a"),
            C(-26, -10, 146, 17, 6, plat, top), E(-26, -10, 152.3, 12, 12, "#f2d8c2", "#c9a27a"),
            Fn(_pompom, 38, -4, 74)]


def _cubby_hole(p, sx, sy, it, t):
    p.setPen(pen("#7a5a3e", 1.0))
    p.setBrush(QColor("#4a3324"))
    p.drawEllipse(QPointF(sx, sy - 12), 9, 10)


def _hammock(p, sx, sy, it, t):
    """A cloth sling hanging under the deck."""
    sway = math.sin(t * 1.3) * 1.2
    p.setPen(pen("#b06a7a", 1.0))
    p.setBrush(QColor("#f2a7b8"))
    path = QPainterPath(QPointF(sx - 18, sy - 14))
    path.quadTo(QPointF(sx + sway, sy + 6), QPointF(sx + 18, sy - 14))
    path.lineTo(sx + 16, sy - 16)
    path.quadTo(QPointF(sx + sway, sy + 1), QPointF(sx - 16, sy - 16))
    path.closeSubpath()
    p.drawPath(path)
    p.setPen(QPen(QColor("#8a6248"), 0.9))
    for dx in (-18, 18):
        p.drawLine(QPointF(sx + dx, sy - 14), QPointF(sx + dx * 0.8, sy - 26))


# ---- v24: four more cat trees, levels about 35 apart so every hop up is an easy one -------------------------------
POST, PLAT, PTOP, FELT = "#d9bd8f", "#c9a27a", "#e6c9a2", "#f1e4d2"


def _pad(u, v, z, r, col=PLAT, top=PTOP, felt=FELT):
    """A round platform with a felt top."""
    return [C(u, v, z, r, 6, col, top), E(u, v, z + 6.2, r - 3, r - 3, felt, None)]


def _cubby(u0, v0, z0, u1, v1, z1, col="#b98d63", inner="#7a5a3e", cushion="#f2b8c8"):
    """An open-fronted cube to curl up in: back, sides, roof, and a cushion on the floor."""
    t = 3.0
    return [B(u0, v1 - t, z0, u1, v1, z1, inner, inner),                  # back
            B(u0, v0, z0, u0 + t, v1, z1, col, None),                    # left side
            B(u1 - t, v0, z0, u1, v1, z1, col, None),                    # right side
            B(u0 + t, v0 + 2, z0, u1 - t, v1 - t, z0 + 4, col, cushion, r=2),   # floor with its cushion
            E((u0 + u1) / 2, (v0 + v1) / 2, z0 + 4.4, (u1 - u0) / 2 - 6, (v1 - v0) / 2 - 6, cushion, None),
            B(u0, v0, z1 - 4, u1, v1, z1, col, None, r=2)]               # roof


def p_tree_tower(it):
    """原木多层塔: a sisal post with five round platforms winding up it, a cubby at the bottom and a bed on top."""
    out = [B(-34, -30, 0, 34, 30, 8, "#cdb48c", "#e2cba3", r=3)]
    out += _cubby(-34, -30, 8, -4, -2, 40)
    out += [C(0, 6, 8, 7, 172, POST), Fn(_sisal(172, 7), 0, 6, 8)]
    out += _pad(-18, 12, 142, 15)                                 # L4 (back left)
    out += _pad(16, 10, 106, 16) + [E(16, 10, 112.4, 10, 10, "#f2d8c2", None)]   # L3 with a donut bed
    out += _pad(-18, -6, 70, 15)                                  # L2
    out += _pad(18, -12, 34, 15)                                  # L1
    out += [C(4, 4, 176, 20, 7, PLAT, PTOP), E(4, 4, 183.3, 15, 15, "#f2d8c2", "#c9a27a"),
            Fn(_pompom, 30, -12, 34), Fn(_pompom, -32, -6, 70)]
    return out


def p_tree_castle(it):
    """城堡格子塔: open cubes stacked like a little castle, a flat roof deck and a lookout post on top."""
    wood = "#d9b48a"
    out = [B(-44, -30, 0, 44, 30, 6, "#cdb48c", "#e2cba3", r=3)]
    out += [C(-26, 12, 82, 4, 62, POST), Fn(_sisal(62, 4), -26, 12, 82)]          # the lookout's post (behind)
    out += _cubby(4, -24, 6, 42, 14, 44, wood, "#8a6248", "#bfe0f2")             # B: bottom right
    out += _cubby(-42, -28, 6, -4, 10, 44, wood, "#8a6248", "#f2b8c8")           # A: bottom left
    out += _cubby(-24, -20, 44, 14, 18, 82, "#c99a6a", "#7a5a3e", "#fbe7a6")     # C: middle
    out += _cubby(0, -16, 82, 40, 20, 120, wood, "#8a6248", "#c9e8b8")           # D: top right
    out += [Ft([(4, -12), (36, -12), (36, 16), (4, 16)], 120.2, FELT)]
    for k in range(4):                                                            # crenellations on D
        out.append(B(2 + k * 10, -16, 120, 8 + k * 10, -12, 127, wood, None, r=1))
    out += [C(-26, 12, 144, 15, 6, PLAT, PTOP), E(-26, 12, 150.2, 12, 12, FELT, None),
            Fn(_flag_tiny, 38, 18, 120, True), Fn(_pompom, -40, -26, 44)]
    return out


def _flag_tiny(p, sx, sy, it, t):
    p.setPen(QPen(QColor("#8a6248"), 1.2))
    p.drawLine(QPointF(sx, sy), QPointF(sx, sy - 30))
    w = 2 * math.sin(t * 4 + it.x)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#ef6f8f"))
    p.drawPolygon(poly((sx, sy - 30), (sx + 14, sy - 26 + w), (sx, sy - 22)))


def p_tree_big(it):
    """大树造型: a trunk with leafy branch platforms zig-zagging up, a knot hole at the bottom and a nest in the crown."""
    bark, leaf, leaf2 = "#8a6248", "#6fb36a", "#8fcf7a"
    out = [E(0, 4, 0.2, 46, 30, "#a8876a", "#7a5a3e"), C(0, 6, 0, 13, 166, bark), Fn(_bark, 0, 6, 0),
           Fn(_knothole, 0, -7, 10, face="front")]
    # branches (thin boxes from the trunk out to each pad), back ones first
    out += [B(0, 10, 150, 30, 16, 155, bark, None, r=2), B(-28, 8, 116, 0, 14, 121, bark, None, r=2)]
    out += _leafpad(30, 14, 152, 17, leaf, leaf2) + _leafpad(-28, 12, 116, 18, leaf, leaf2) + \
        [E(-28, 12, 122.4, 11, 11, "#c9a27a", "#8a6248")]                              # a nest on L3
    out += [B(0, -2, 78, 32, 4, 83, bark, None, r=2), B(-30, -8, 38, 0, -2, 43, bark, None, r=2)]
    out += _leafpad(32, 2, 78, 17, leaf, leaf2) + _leafpad(-30, -6, 38, 17, leaf, leaf2)
    out += [Fn(_crown, 0, 8, 166, True)]
    return out


def _leafpad(u, v, z, r, leaf, leaf2):
    return [C(u, v, z, r, 6, leaf, leaf2), E(u, v, z + 6.2, r - 4, r - 4, "#e9dfc6", None)]


def _bark(p, sx, sy, it, t):
    p.setPen(QPen(QColor(90, 60, 40, 110), 1.0))
    for k in range(12):
        y = sy - 10 - k * 13
        p.drawLine(QPointF(sx - 9 + (k % 3) * 3, y), QPointF(sx - 6 + (k % 3) * 3, y - 9))
        p.drawLine(QPointF(sx + 5 - (k % 2) * 3, y - 4), QPointF(sx + 8 - (k % 2) * 3, y - 12))


def _knothole(p, sx, sy, it, t):
    p.setPen(pen("#5e4436", 1.0))
    p.setBrush(QColor("#3a281c"))
    p.drawEllipse(QPointF(sx, sy - 14), 9, 12)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 255, 255, 40))
    p.drawEllipse(QPointF(sx - 3, sy - 19), 3, 4)


def _crown(p, sx, sy, it, t):
    """The leafy crown with a nest in it (the top bed)."""
    sw = 1.5 * math.sin(t * 0.9 + it.x)
    p.setPen(pen("#3f7a3a", 1.0))
    for k, (dx, dy, r, col) in enumerate(((-30, 6, 24, "#5fa35a"), (30, 4, 24, "#5fa35a"), (-14, -14, 26, "#6fb36a"),
                                          (16, -16, 26, "#6fb36a"), (0, -30, 24, "#8fcf7a"))):
        p.setBrush(QColor(col))
        p.drawEllipse(QPointF(sx + dx + sw, sy + dy), r, r * 0.8)
    p.setPen(pen("#7a5a3e", 1.0))
    p.setBrush(QColor("#c9a27a"))
    p.drawEllipse(QPointF(sx, sy - 22), 18, 7)
    p.setBrush(QColor("#f2d8c2"))
    p.drawEllipse(QPointF(sx, sy - 23), 13, 4.5)
    for dx in (-22, 20):
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#ef6f8f"))
        p.drawEllipse(QPointF(sx + dx + sw, sy - 6), 3, 3)


def p_wall_steps(it):
    """靠墙阶梯组合: four steps climbing the wall and a cosy cubby at the top end."""
    wood, top = "#c9a27a", "#e0bf96"
    out = []
    for k, (u, z) in enumerate(((-62, 40), (-31, 66), (0, 92), (31, 118))):
        out += [B(u - 4, 9, z - 14, u - 2, 11, z - 6, "#6f5a48", "#7d6654"), B(u + 2, 9, z - 14, u + 4, 11, z - 6, "#6f5a48", "#7d6654"),
                B(u - 14, -11, z - 6, u + 14, 11, z, wood, top, r=2), Ft([(u - 11, -8), (u + 11, -8), (u + 11, 8), (u - 11, 8)], z + 0.15, FELT)]
    out += [B(46, 9, 120, 49, 11, 144, "#6f5a48", "#7d6654"), B(70, 9, 120, 73, 11, 144, "#6f5a48", "#7d6654")]
    out += _cubby(44, -12, 144, 76, 12, 174, "#d9b48a", "#8a6248", "#f2b8c8")
    out += [Fn(_rope, -62, 0, 40), Fn(_pompom, 46, -12, 144)]
    return out


def _rope(p, sx, sy, it, t):
    """A little rope ladder hanging under the first step."""
    sw = math.sin(t * 1.4) * 1.5
    p.setPen(QPen(QColor("#b08a5a"), 1.4))
    p.drawLine(QPointF(sx - 6, sy + 6), QPointF(sx - 6 + sw, sy + 34))
    p.drawLine(QPointF(sx + 6, sy + 6), QPointF(sx + 6 + sw, sy + 34))
    for k in range(3):
        y = sy + 14 + k * 9
        p.drawLine(QPointF(sx - 6 + sw * k / 3, y), QPointF(sx + 6 + sw * k / 3, y))


def p_wall_shelf(h):
    """墙上跳台 (v23): a plank on two brackets, fixed to the wall at height h, with a felt pad on top."""
    def parts(it):
        wood, top = "#c9a27a", "#e0bf96"
        return [B(-20, 9, h - 16, -17.5, 11, h - 6, "#6f5a48", "#7d6654"), B(17.5, 9, h - 16, 20, 11, h - 6, "#6f5a48", "#7d6654"),
                B(-28, -11, h - 6, 28, 11, h, wood, top, r=2),
                Ft([(-24, -8), (24, -8), (24, 8), (-24, 8)], h + 0.15, "#efe2cf")]
    return parts


def p_side_cabinet(it):
    """小边柜: two doors, a little vase on top."""
    wood, top = "#d2a676", "#e6c193"
    return [B(-30, -14, 0, 30, 14, 4, "#8a6248", "#9c7458"), B(-30, -15, 4, 30, 15, 50, wood, top, r=2),
            Fr(-26, 9, -2, 44, "#dcb385", v=-15), Fr(2, 9, 26, 44, "#dcb385", v=-15),
            Fr(-6, 24, -4, 30, "#7d5236", v=-15), Fr(4, 24, 6, 30, "#7d5236", v=-15),
            B(-31, -16, 50, 31, 16, 53, "#c49464", "#ecd0a6", r=1.5), Fn(_vase, -16, 4, 53),
            *side_panels(60, 30, 4, 48, "#d8ac7c", 4)]


def _vase(p, sx, sy, it, t):
    p.setPen(pen("#5e8fb0", 0.9))
    p.setBrush(QColor("#9fc8e2"))
    path = QPainterPath(QPointF(sx - 3, sy))
    path.quadTo(QPointF(sx - 6, sy - 6), QPointF(sx - 2, sy - 11))
    path.lineTo(sx + 2, sy - 11)
    path.quadTo(QPointF(sx + 6, sy - 6), QPointF(sx + 3, sy))
    path.closeSubpath()
    p.drawPath(path)
    p.setPen(QPen(QColor("#5e9e52"), 1.0))
    p.drawLine(QPointF(sx, sy - 11), QPointF(sx - 3, sy - 19))
    p.drawLine(QPointF(sx, sy - 11), QPointF(sx + 4, sy - 17))
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#f29ab3"))
    p.drawEllipse(QPointF(sx - 3, sy - 19), 2.4, 2.4)
    p.setBrush(QColor("#ffd34c"))
    p.drawEllipse(QPointF(sx + 4, sy - 17), 2.2, 2.2)


def p_nightstand(it):
    """床头柜: two drawers and a small lamp."""
    wood, top = "#c8986a", "#dfb482"
    return [B(-17, -15, 0, 17, 15, 44, wood, top, r=2), Fr(-14, 24, 14, 39, "#d6a676", v=-15),
            Fr(-14, 6, 14, 21, "#d6a676", v=-15), Fr(-3, 30, 3, 32, "#7d5236", v=-15), Fr(-3, 12, 3, 14, "#7d5236", v=-15),
            Fn(_mini_lamp, 6, 4, 44), *side_panels(34, 30, 2, 42, "#d0a070", 4)]


def _mini_lamp(p, sx, sy, it, t):
    p.setPen(pen("#8a6248", 0.9))
    p.setBrush(QColor("#a87a58"))
    p.drawRect(QRectF(sx - 1, sy - 12, 2, 12))
    p.setBrush(QColor("#fbe9c9"))
    path = QPainterPath(QPointF(sx - 7, sy - 12))
    path.lineTo(sx + 7, sy - 12)
    path.lineTo(sx + 4, sy - 21)
    path.lineTo(sx - 4, sy - 21)
    path.closeSubpath()
    p.drawPath(path)


def p_round_table(it):
    """小圆桌: one leg, a round top."""
    return [C(0, 0, 0, 13, 3, "#8a6248", "#a07052"), C(0, 0, 3, 3.5, 43, "#a07052"),
            C(0, 0, 46, 25, 4, "#d2a676", "#ecd0a6"), Fn(_cup, -7, -4, 50)]


def _cup(p, sx, sy, it, t):
    p.setPen(pen("#b9b2a6", 0.9))
    p.setBrush(QColor("#fbf8f2"))
    p.drawRoundedRect(QRectF(sx - 4, sy - 8, 8, 8), 1.5, 1.5)
    p.setBrush(Qt.NoBrush)
    p.drawArc(QRectF(sx + 2, sy - 7, 5, 5), -90 * 16, 180 * 16)


def p_chair(it):
    """椅子: four legs, a seat with a cushion, a back."""
    wood, top = "#b98a5e", "#d2a676"
    return [B(-15, -14, 0, -12, -11, 34, "#8a6248"), B(12, -14, 0, 15, -11, 34, "#8a6248"),
            B(-15, 11, 0, -12, 14, 34, "#8a6248"), B(12, 11, 0, 15, 14, 34, "#8a6248"),
            B(-16, -15, 34, 16, 15, 38, wood, top, r=2), E(0, 0, 38.2, 12, 11, "#e9a0a0", "#c97a7a"),
            B(-16, 11, 38, 16, 15, 72, wood, top, r=2), Fr(-12, 46, 12, 66, "#c9996c", v=15, side="back")]


def p_stool(it):
    """小凳子: a low round stool — a handy step for a cat."""
    return [C(-8, -6, 0, 2, 26, "#8a6248"), C(8, -6, 0, 2, 26, "#8a6248"), C(0, 8, 0, 2, 26, "#8a6248"),
            C(0, 0, 26, 15, 4, "#e2b46c", "#f0cb8a"), E(0, 0, 30.2, 10, 10, "#f6dfb0", None)]


def p_scratcher(it):
    wear = float(it.state.get("wear", 0.0))
    parts = [B(-25, -12, 0, 25, 12, 8, "#d3a46e", "#e6be8a", r=2)]
    for u in range(-21, 22, 4):
        parts.append(Tl([(u, -10), (u, 10)], 8.1, "#c18f5a", 0.9))
    parts.append(Fr(-22, 1.5, 22, 6.5, "#c99a64", outline=False))
    if wear > 0.2:
        # clawed-up patch in the middle, loose fibres sticking out
        n = int(wear * 14)
        parts.append(Ft([(-12, -7), (12, -7), (14, 7), (-13, 7)], 8.15, "#ead1a6" if wear < 0.7 else "#f1dfbf"))
        for i in range(n):
            u = -12 + (i * 7.3) % 24
            v = -6 + (i * 5.1) % 12
            parts.append(Tl([(u, v), (u + (2 if i % 2 else -2), v + 2.5)], 8.3, "#b8834e", 0.8))
    return parts


def p_bowls(it):
    return [B(-29, -13, 0, 29, 13, 1.2, "#f4d7dc", "#f8dfe3", r=5),
            Ft([(-4, -4), (4, -4), (4, 4), (-4, 4)], 1.3, "#efc3cb"),
            C(-14, 0, 1.2, 9.5, 5.5, "#e8708c", "#f08aa2"), E(-14, 0, 6.8, 7, 7, "#fbe5ea", None),
            C(14, 0, 1.2, 9.5, 5.5, "#6aa9dc", "#86bde6"), E(14, 0, 6.8, 7, 7, "#e6f2fb", None),
            Fn(_food, -14, 0, 6.6), Fn(_water, 14, 0, 6.6)]


def p_litter(it):
    dirty = float(it.state.get("dirty", 0.0))
    parts = [B(-24, -18, 0, 24, 18, 15, "#8fbfae", "#a6d0c0", r=4), B(-20, -14, 15, 20, 14, 15.5, "#e6ddcd", "#ebe3d5"),
             Fr(-14, 4, 14, 10, "#7aae9c", outline=False), Fn(_scoop, 16, -6, 15.5)]
    for i in range(int(dirty * 7)):
        u = -14 + (i * 9.7) % 26
        v = -9 + (i * 6.3) % 18
        parts.append(Ft([(u - 2, v - 1.5), (u + 2, v - 1.5), (u + 2.4, v + 1.5), (u - 2.2, v + 1.5)], 15.6, "#b9a684"))
    return parts


def _scoop(p, sx, sy, it, t):
    p.setPen(pen("#5f8f86", 1.0))
    p.setBrush(QColor("#f2c94c"))
    p.drawRoundedRect(QRectF(sx - 5, sy - 3, 8, 5), 2, 2)
    p.setPen(pen("#d4a92e", 2.0))
    p.drawLine(QPointF(sx + 3, sy - 1), QPointF(sx + 10, sy - 5))


def p_box(it):
    col, top = "#d4a066", "#e4b67f"
    return [B(-24, -18, 0, 24, 18, 2, "#7d5332"), B(-24, 14, 0, 24, 18, 30, col, top), B(20, -18, 0, 24, 18, 30, col, top),
            B(-24, -18, 0, -20, 18, 30, col, top), B(-24, -18, 0, 24, -14, 30, col, top),
            B(-32, -18, 28, -24, 18, 30, "#e2b177", "#ecc28e"), B(24, -18, 28, 32, 18, 30, "#e2b177", "#ecc28e"),
            Fr(-24, 22, 24, 26, "#f0d9a8", outline=False), Fr(-8, 6, 8, 16, "#b98858", outline=False)]


def p_window_seat(it):
    return [B(-36, -14, 0, 36, 14, 28, "#efe3d2", "#f6ecdf", r=2), Fr(-32, 5, -2, 23, "#e4d4bd"),
            Fr(2, 5, 32, 23, "#e4d4bd"), Fr(-19, 13, -15, 15, "#b8956a"), Fr(15, 13, 19, 15, "#b8956a"),
            B(-35, -13, 28, 35, 13, 35, "#9fb8d8", "#b4c9e3", r=5), Tl([(-30, -11), (30, -11)], 35.1, "#ffffff", 0.8),
            B(-32, 3, 35, -16, 12, 48, "#f2c45a", "#f6d47a", r=5), B(18, 3, 35, 33, 12, 46, "#ef8f80", "#f4a597", r=5)]


def p_sofa(it):
    c = QColor("#7fa7c3")
    dark, mid, lite = c.darker(112).name(), c.name(), c.lighter(110).name()
    parts = [B(-58, -20, 0, -52, -14, 5, "#6b4a35"), B(52, -20, 0, 58, -14, 5, "#6b4a35"),
             B(-58, 14, 0, -52, 20, 5, "#6b4a35"), B(52, 14, 0, 58, 20, 5, "#6b4a35"),
             B(-62, -22, 5, 62, 22, 24, dark, mid, r=3),
             B(-62, 12, 24, 62, 24, 60, mid, lite, r=7),
             B(-54, -21, 24, -1, 13, 33, lite, c.lighter(118).name(), r=6),
             B(1, -21, 24, 54, 13, 33, lite, c.lighter(118).name(), r=6),
             B(-54, 6, 33, -1, 13, 55, mid, lite, r=6), B(1, 6, 33, 54, 13, 55, mid, lite, r=6),
             B(-64, -22, 22, -52, 20, 44, mid, lite, r=6), B(52, -22, 22, 64, 20, 44, mid, lite, r=6),
             B(-48, 2, 33, -30, 8, 50, "#f2c45a", "#f6d47a", r=6), B(32, 2, 33, 50, 8, 49, "#ef8f80", "#f4a597", r=6),
             Fr(-60, 30, 60, 56, c.darker(105).name(), v=24, side="back", outline=False),
             Fr(-60, 42, 60, 44, c.darker(120).name(), v=24, side="back", outline=False)]
    return parts


def p_armchair(it):
    c = QColor("#e0b450")
    mid, lite, dark = c.name(), c.lighter(110).name(), c.darker(112).name()
    return [B(-24, -20, 0, -19, -15, 5, "#6b4a35"), B(19, -20, 0, 24, -15, 5, "#6b4a35"),
            B(-28, -24, 5, 28, 24, 22, dark, mid, r=3), B(-28, 13, 22, 28, 24, 56, mid, lite, r=7),
            B(-21, -23, 22, 21, 13, 30, lite, c.lighter(118).name(), r=6),
            B(-30, -24, 20, -21, 20, 40, mid, lite, r=5), B(21, -24, 20, 30, 20, 40, mid, lite, r=5),
            B(-12, 6, 30, 12, 12, 46, "#f6efe0", "#fbf6ec", r=6),
            Fr(-26, 28, 26, 52, c.darker(106).name(), v=24, side="back", outline=False)]


def p_tv(it):
    wood = "#b07f55"
    return [B(-40, -15, 0, 40, 15, 4, "#6b4a35"), B(-40, -15, 4, 40, 15, 32, wood, "#c4936a", r=2),
            Fr(-37, 7, -1, 29, "#c4956b"), Fr(1, 7, 37, 29, "#c4956b"),
            Fr(-4, 16, -2, 20, "#e8d3a8"), Fr(2, 16, 4, 20, "#e8d3a8"),
            B(-6, -3, 32, 6, 3, 36, "#3a3a44"), B(-38, -3, 36, 38, 3, 84, "#26262e", "#3a3a46", r=3),
            Fr(-34, 40, 34, 80, "#22232b", v=-3.2, outline=False), Fn(_tv_show, 0, -3.4, 40, dyn=True, face="front"),
            Fn(_plant_small, 30, 6, 32), Fn(_remote, -24, -6, 32)]


def _plant_small(p, sx, sy, it, t):
    p.setPen(pen("#9c5a3a", 0.9))
    p.setBrush(QColor("#e9a185"))
    p.drawRoundedRect(QRectF(sx - 4, sy - 7, 8, 7), 2, 2)
    p.setPen(pen("#3f7a46", 0.8))
    p.setBrush(QColor("#6fb760"))
    for dx, dy in ((-3, -10), (2, -12), (0, -15), (4, -8)):
        p.drawEllipse(QPointF(sx + dx, sy + dy), 2.6, 3.4)


def _remote(p, sx, sy, it, t):
    p.setPen(pen("#222", 0.8))
    p.setBrush(QColor("#3a3a44"))
    p.drawRoundedRect(QRectF(sx - 6, sy - 2.5, 12, 3.5), 1.5, 1.5)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#e46f5b"))
    p.drawEllipse(QPointF(sx + 3.5, sy - 1), 0.9, 0.9)


def p_rug(it):
    parts = [E(0, 0, 0.3, 80, 46, "#e9a185", "#c9705e"), E(0, 0, 0.6, 70, 38, "#f6c3a6", None),
             E(0, 0, 0.9, 52, 26, "#e9a185", None), E(0, 0, 1.2, 30, 14, "#f8d9c4", None)]
    for k in range(10):
        a = k * math.tau / 10
        parts.append(E(math.cos(a) * 61, math.sin(a) * 32, 0.95, 4, 3, "#ffffff", None))
    return parts


def p_coat_rack(it):
    return [C(0, 0, 0, 13, 4, "#7d5236", "#93633f"), C(0, 0, 4, 2.8, 128, "#8a5c3d"), C(0, 0, 132, 4.4, 4, "#7d5236"),
            B(-10, -1, 118, 10, 1, 121, "#7d5236"), Fn(_hat, -7, -2, 134), Fn(_coat, 3, -6, 122),
            Fn(_scarf, -9, -4, 122, True)]


def p_bookshelf(it):
    cols = ["#e46f5b", "#5e9bd6", "#f2c94c", "#7bbf6a", "#b48ae0", "#ef9a74", "#4fb0a6", "#f2f0ea"]
    wood = "#b98457"
    parts = [B(-35, -14, 0, 35, 14, 120, wood, "#cd9a6c", r=2), Fr(-31, 6, 31, 114, "#7d5232")]
    k = 0
    for row in range(3):
        z0 = 8 + row * 36
        u = -29.0
        while u < 25:
            wd = 4.5 + (k * 7) % 5
            hh = 20 + (k * 5) % 10
            if k % 9 == 4:
                parts.append(Fc([(u, z0), (u + 4, z0), (u + 10, z0 + hh - 2), (u + 6, z0 + hh)], cols[k % len(cols)]))
                u += 12
            else:
                parts.append(Fr(u, z0, u + wd, z0 + hh, cols[k % len(cols)]))
                parts.append(Fr(u + 0.8, z0 + hh * 0.7, u + wd - 0.8, z0 + hh * 0.7 + 1.6, "#ffffff", outline=False))
                u += wd + 1.2
            k += 1
        if row < 2:
            parts.append(Fr(-31, z0 + 32, 31, z0 + 36, "#c8935f"))
    parts += side_panels(70, 28, 0, 120, "#c08d61")
    parts.append(Fn(_plant_small, 18, 0, 120))
    parts.append(Fn(_book_stack, -16, 0, 120))
    return parts


def _book_stack(p, sx, sy, it, t):
    for i, c in enumerate(("#5e9bd6", "#f2c94c", "#e46f5b")):
        p.setPen(pen(shade(c, 0.65).name(), 0.8))
        p.setBrush(QColor(c))
        p.drawRect(QRectF(sx - 8 + i, sy - 4 - i * 4, 15 - i * 2, 4))


def p_plant(it):
    return [C(0, 0, 0, 12, 20, "#d27a52", "#b9653f"), C(0, 0, 17, 13.5, 4, "#de8a62", "#c06a45"),
            E(0, 0, 21.2, 11, 11, "#6b4a35", None), Fn(_leaves, 0, 0, 21)]


def p_flowers(it):
    return [B(-15, -8, 0, 15, 8, 13, "#c98059", "#6b4a35", r=2), Fr(-12, 3, 12, 9, "#b06c4c", outline=False),
            Fn(_small_leaves, 0, 0, 13)]


def p_lamp(it):
    return [C(0, 0, 0, 11, 3, "#5d4e44", "#71625a"), C(0, 0, 3, 2, 106, "#6b5a4e"), Fn(_lampshade, 0, 0, 108)]


def _meal(p, sx, sy, it, t):
    """Dinner on the table: a bowl at each place, a dish and soup in the middle; empty plates afterwards."""
    meal = it.state.get("meal")
    if not meal:
        return
    left = float(meal.get("left", 1.0))
    dirty = bool(meal.get("dirty"))
    cx, cy = it.x, it.y
    kind = int(meal.get("kind", 0))

    def at(u, v, z=53.4):
        dx, dy = rot_vec(it.rot, u, v)
        return iso(cx + dx, cy + dy, z)
    food = ("#e8743b", "#c0392b", "#6fb760", "#d9a441")[kind % 4]
    # plates and rice bowls at the two places
    for u in (-26, 26):
        x, y = at(u, 0)
        p.setPen(pen("#b9b2a6", 0.8))
        p.setBrush(QColor("#fbf8f2"))
        p.drawEllipse(QPointF(x, y), 8.5, 3.6)
        p.setBrush(QColor("#f1ece2"))
        p.drawChord(QRectF(x - 4.6, y - 6.5, 9.2, 8), 180 * 16, 180 * 16)
        if not dirty and left > 0.1:
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#ffffff"))
            p.drawEllipse(QPointF(x, y - 2.6), 4.2, 1.6 + 1.6 * left)
        elif dirty:
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(190, 140, 90, 120))
            p.drawEllipse(QPointF(x + 3, y + 0.5), 2.0, 0.9)
        p.setPen(QPen(QColor("#8a5c3d"), 0.9))
        p.drawLine(QPointF(x + 7, y - 4), QPointF(x + 12, y - 1))
    # the shared dish
    x, y = at(0, -6)
    p.setPen(pen("#b9b2a6", 0.8))
    p.setBrush(QColor("#ffffff"))
    p.drawEllipse(QPointF(x, y), 11, 4.4)
    if not dirty and left > 0.05:
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(food))
        p.drawEllipse(QPointF(x, y - 1.2), 8 * (0.35 + 0.65 * left), 2.4 + 1.6 * left)
        p.setBrush(QColor("#7bbf6a"))
        for k in range(int(3 * left) + 1):
            p.drawEllipse(QPointF(x - 4 + k * 4, y - 2), 1.2, 0.8)
    elif dirty:
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(200, 110, 60, 110))
        p.drawEllipse(QPointF(x - 2, y), 4, 1.4)
    # soup pot, steaming while it's hot
    x, y = at(0, 12)
    p.setPen(pen("#7a7a80", 0.8))
    p.setBrush(QColor("#d9dde3"))
    p.drawRoundedRect(QRectF(x - 6.5, y - 7, 13, 7), 2, 2)
    p.setBrush(QColor("#f2c37a") if not dirty else QColor("#e6e0d6"))
    p.drawEllipse(QPointF(x, y - 7), 6.5, 1.8)
    age = t - float(meal.get("t", t))
    if not dirty and age < 400:
        p.setPen(QPen(QColor(255, 255, 255, 150), 1.0))
        p.setBrush(Qt.NoBrush)
        for i in range(3):
            k = (t * 0.5 + i / 3) % 1.0
            xx = x - 3 + i * 3 + math.sin(t * 2 + i) * 1.2
            path = QPainterPath(QPointF(xx, y - 9 - k * 4))
            path.quadTo(QPointF(xx + 2, y - 12 - k * 7), QPointF(xx, y - 15 - k * 9))
            p.drawPath(path)


def p_table(it):
    wood, top = "#b88358", "#d8a776"
    parts = []
    for cu, back in ((-52, -62), (52, 58)):
        seat = "#c99a6c"
        for du, dv in ((-7, -7), (7, -7), (-7, 7), (7, 7)):
            parts.append(B(cu + du - 1.5, dv - 1.5, 0, cu + du + 1.5, dv + 1.5, 26, "#8a5c3d"))
        parts += [B(cu - 9, -9, 26, cu + 9, 9, 30, seat, "#dcb185", r=2),
                  B(back, -9, 30, back + 4, 9, 56, seat, "#dcb185", r=2)]
    parts += [B(-37, -23, 0, -33, -19, 48, "#8e5f3e"), B(33, -23, 0, 37, -19, 48, "#8e5f3e"),
              B(-37, 19, 0, -33, 23, 48, "#8e5f3e"), B(33, 19, 0, 37, 23, 48, "#8e5f3e"),
              B(-40, -26, 48, 40, 26, 53, wood, top, r=2),
              Ft([(-40, -6), (40, -6), (40, 6), (-40, 6)], 53.1, "#f4ead8"),
              Fr(-40, 46, 40, 48.5, "#f4ead8", outline=False), Fn(_fruit, -6, 0, 53), Fn(_cups, 22, 4, 53)]
    parts.append(Fn(_meal, 0, 0, 53, dyn=True))
    return parts


def _cups(p, sx, sy, it, t):
    for dx, c in ((-3, "#ffffff"), (6, "#f2c4c4")):
        p.setPen(pen("#9a8a7a", 0.8))
        p.setBrush(QColor(c))
        p.drawRoundedRect(QRectF(sx + dx - 3, sy - 6, 6, 6), 1.5, 1.5)


def p_stove(it):
    body = "#f5f1e9"
    return [B(-25, -22, 0, 25, 22, 56, body, "#e6e1d8", r=2), B(-26, -23, 56, 26, 23, 59, "#3a3a44", "#4a4a56", r=1.5),
            E(-11, -6, 59.2, 8, 8, "#22222a", "#555560"), E(11, 8, 59.2, 7, 7, "#22222a", "#555560"),
            E(11, -6, 59.2, 6, 6, "#22222a", "#555560"),
            Fr(-21, 8, 21, 40, "#3d3d48"), Fr(-17, 13, 17, 34, "#5a5a68"), Fr(-12, 16, -2, 30, "#7a7a88", outline=False),
            Fr(-18, 43, 18, 45.5, "#9a9aa4"), Fc([(-16, 49), (-12, 49), (-12, 53), (-16, 53)], "#c9c9cf"),
            Fc([(-6, 49), (-2, 49), (-2, 53), (-6, 53)], "#c9c9cf"), Fc([(4, 49), (8, 49), (8, 53), (4, 53)], "#c9c9cf"),
            Fc([(14, 49), (18, 49), (18, 53), (14, 53)], "#c9c9cf"),
            Fn(_pot, -11, -6, 59), Fn(_steam, -11, -6, 70, True)]


def p_fridge(it):
    return [B(-22, -22, 0, 22, 22, 118, "#9fd3c7", "#bde3da", r=4), Fr(-21, 76, 21, 77.2, "#6f9f95", outline=False),
            Fr(14, 84, 17, 106, "#e9f4f1"), Fr(14, 42, 17, 70, "#e9f4f1"),
            Fr(-16, 46, 4, 64, "#ffffff"), Fr(-13, 52, -3, 58, "#f39ab3", outline=False),
            Fr(-12, 90, -6, 96, "#f2c94c"), Fr(-2, 92, 4, 98, "#7bbf6a"),
            *side_panels(44, 44, 2, 116, "#93c9bd", 4)]


def p_counter(it):
    return [B(-30, -22, 0, 30, 22, 54, "#f2e9da", "#f2e9da", r=1), Fr(-27, 6, -2, 46, "#e8dcc8"), Fr(2, 6, 27, 46, "#e8dcc8"),
            Fr(-6, 24, -4, 32, "#b8956a"), Fr(4, 24, 6, 32, "#b8956a"), Fr(-30, 0, 30, 4, "#cbbda6", outline=False),
            B(-31, -23, 54, 31, 23, 58, "#a7b0b5", "#d5dbde", r=1.5), E(-8, 0, 58.2, 13, 10, "#7d878c", "#6a7378"),
            E(-8, 1, 58.4, 10, 7, "#9aa4a9", None), Fn(_faucet, -8, 10, 58), Fn(_dish_rack, 16, 4, 58),
            Fn(_towel, 22, -23, 44, face="front")]


def p_bed(it, kid=False):
    w, d = (36, 62) if kid else (58, 76)
    frame = "#e9c37d" if kid else "#a9774f"
    frame_top = "#f2d394" if kid else "#c08a5e"
    blanket = "#8fb8e8" if kid else "#e7a5a0"
    b = QColor(blanket)
    parts = [B(-w, -d, 0, w, d, 16, frame, frame_top, r=2),
             B(-w + 3, -d + 3, 16, w - 3, d - 3, 27, "#fbf7f0", "#ffffff", r=4),
             B(-w, d - 7, 0, w, d, 64 if not kid else 56, frame, frame_top, r=8),
             Fr(-w + 6, 30, w - 6, (58 if not kid else 50), QColor(frame).lighter(108).name(), v=d - 7),
             B(-w + 7, d - 30, 27, (-3 if not kid else w - 7), d - 10, 38, "#ffffff", "#fdfbf7", r=7),
             *([B(3, d - 30, 27, w - 7, d - 10, 38, "#ffffff", "#fdfbf7", r=7)] if not kid else []),
             B(-w + 2, -d + 2, 27, w - 2, d - 34, 34, b.darker(104).name(), b.name(), r=5),
             B(-w + 2, d - 40, 27, w - 2, d - 32, 35.5, b.lighter(115).name(), b.lighter(122).name(), r=4),
             B(-w, -d, 0, w, -d + 6, 30 if not kid else 26, frame, frame_top, r=4),
             Fr(-w + 6, 6, w - 6, 24 if not kid else 20, QColor(frame).lighter(110).name(), v=-d)]
    # quilt pattern
    rnd = 3
    for row in range(5):
        for col in range(4 if not kid else 3):
            u = -w + 12 + col * ((2 * w - 20) / (4 if not kid else 3))
            v = -d + 12 + row * 20
            if v > d - 40:
                continue
            if kid:
                parts.append(Ft([(u, v - 3), (u + 3, v), (u, v + 3), (u - 3, v)], 34.2, "#ffffff"))
            else:
                parts.append(Ft([(u - 3, v - 3), (u + 3, v - 3), (u + 3, v + 3), (u - 3, v + 3)], 34.2,
                                b.lighter(112).name()))
    if kid:
        parts.append(B(w - 4, -d + 20, 27, w, d - 40, 44, "#f2d394", "#f8e2b0", r=2))
    else:
        parts.append(Ft([(-w + 2, -d + 30), (w - 2, -d + 30), (w - 2, -d + 46), (-w + 2, -d + 46)], 34.3, "#d9c3a0"))
    return parts


def p_kid_bed(it):
    return p_bed(it, True)


def p_wardrobe(it):
    wood = "#c99a6c"
    return [B(-38, -18, 0, -34, -14, 6, "#7d5236"), B(34, -18, 0, 38, -14, 6, "#7d5236"),
            B(-40, -20, 6, 40, 20, 126, wood, "#d9ad80", r=2), B(-42, -21, 126, 42, 21, 132, "#b98a5e", "#d4a477", r=1.5),
            Fr(-36, 12, -2, 120, "#d9ae82"), Fr(2, 12, 36, 120, "#d9ae82"),
            Fr(-32, 70, -6, 114, "#e2bb92"), Fr(6, 70, 32, 114, "#e2bb92"),
            Fr(-32, 18, -6, 64, "#e2bb92"), Fr(6, 18, 32, 64, "#e2bb92"),
            Fr(-6, 62, -4, 74, "#f2c94c"), Fr(4, 62, 6, 74, "#f2c94c"), *side_panels(80, 40, 8, 124, "#d4a679")]


def p_desk(it):
    wood, top = "#c8986a", "#e0b483"
    return [B(-11, -35, 0, -9, -33, 26, "#8a5c3d"), B(9, -35, 0, 11, -33, 26, "#8a5c3d"),
            B(-11, -17, 0, -9, -15, 26, "#8a5c3d"), B(9, -17, 0, 11, -15, 26, "#8a5c3d"),
            B(-13, -35, 26, 13, -14, 30, "#f2c94c", "#f6d76e", r=3), B(-13, -39, 30, 13, -34, 56, "#e9bd3f", "#f2cd5c", r=3),
            B(-40, 4, 0, -36, 8, 48, "#a87a50"), B(-40, 40, 0, -36, 44, 48, "#a87a50"),
            B(14, 4, 0, 40, 44, 48, wood, top, r=1.5), Fr(17, 32, 37, 44, "#d8a878", v=4), Fr(17, 18, 37, 30, "#d8a878", v=4),
            Fr(17, 4, 37, 16, "#d8a878", v=4), Fr(25, 37, 29, 39, "#7d5236", v=4), Fr(25, 23, 29, 25, "#7d5236", v=4),
            B(-42, 2, 48, 42, 46, 52, wood, top, r=1.5), Fn(_desk_things, 4, 26, 52)]


def p_toy_box(it):
    return [B(-24, -15, 0, 24, 15, 30, "#f2c94c", "#f6d76e", r=3), B(-24, 15, 30, 24, 19, 52, "#e9a840", "#f0b95a", r=2),
            Fn(_toys, 0, 4, 30), Fr(-19, 7, -9, 19, "#e46f5b"), Fr(-5, 7, 5, 19, "#5e9bd6"), Fr(9, 7, 19, 19, "#7bbf6a"),
            Fn(_abc, 0, -15.3, 7, face="front")]


def _abc(p, sx, sy, it, t):
    p.setPen(QPen(QColor("#ffffff"), 1.6))
    for dx, ch in ((-14, "A"), (0, "B"), (14, "C")):
        x, y = sx + dx, sy - 6
        if ch == "A":
            p.drawLine(QPointF(x - 3, y + 3), QPointF(x, y - 3))
            p.drawLine(QPointF(x, y - 3), QPointF(x + 3, y + 3))
        elif ch == "B":
            p.drawLine(QPointF(x - 2, y - 3), QPointF(x - 2, y + 3))
            p.drawArc(QRectF(x - 3, y - 3, 5, 3), -90 * 16, 180 * 16)
            p.drawArc(QRectF(x - 3, y, 5, 3), -90 * 16, 180 * 16)
        else:
            p.drawArc(QRectF(x - 3, y - 3, 6, 6), 45 * 16, 270 * 16)


def p_toilet(it):
    return [B(-14, 8, 0, 14, 18, 46, "#fbfbfb", "#eef2f4", r=4), Fr(-4, 40, 4, 42, "#b0b8bc", v=8),
            B(-10, -8, 0, 10, 8, 18, "#f6f8f9", "#eef2f4", r=6), B(-12, -16, 18, 12, 10, 24, "#fbfbfb", "#eef2f4", r=10),
            E(0, -4, 24.3, 9, 10, "#e2e8ec", "#c2ccd2"), Fn(_tp_roll, 18, 12, 32)]


def _tp_roll(p, sx, sy, it, t):
    p.setPen(pen("#9a9a9a", 0.8))
    p.setBrush(QColor("#ffffff"))
    p.drawRoundedRect(QRectF(sx - 4, sy - 8, 8, 8), 3, 3)


def p_washbasin(it):
    return [B(-22, -14, 0, 22, 14, 48, "#e9dccb", "#efe4d5", r=2), Fr(-19, 5, -1, 42, "#ddcdb6"), Fr(1, 5, 19, 42, "#ddcdb6"),
            Fr(-4, 22, -2, 28, "#b8956a"), Fr(2, 22, 4, 28, "#b8956a"),
            B(-23, -15, 48, 23, 15, 52, "#fbfbfb", "#f4f7f8", r=3), E(0, -2, 52.2, 14, 9, "#c9dde6", "#a9bfc9"),
            Fn(_faucet, 0, 10, 52), Fn(_soap, 16, 6, 52)]


def _soap(p, sx, sy, it, t):
    p.setPen(pen("#c56a8a", 0.8))
    p.setBrush(QColor("#f39ab3"))
    p.drawRoundedRect(QRectF(sx - 3, sy - 9, 6, 9), 2, 2)
    p.drawRect(QRectF(sx - 1, sy - 12, 2, 3))


def p_washer(it):
    return [B(-22, -22, 0, 22, 22, 60, "#f7f7f7", "#eceff1", r=4), Fr(-20, 48, 20, 57, "#d9e2e8"),
            Fc([(10, 50), (16, 50), (16, 55), (10, 55)], "#7bbf6a"), Fc([(-16, 50), (-4, 50), (-4, 55), (-16, 55)], "#ffffff"),
            Fn(_porthole, 0, -22, 26, True, face="front"), *side_panels(44, 44, 2, 58, "#eef1f3", 4)]


def p_shoe_cabinet(it):
    return [B(-30, -12, 0, 30, 12, 44, "#dcb78d", "#e8c8a2", r=2), Fr(-27, 5, -2, 39, "#e8c49c"), Fr(2, 5, 27, 39, "#e8c49c"),
            Fr(-6, 20, -4, 26, "#8a6248"), Fr(4, 20, 6, 26, "#8a6248"), Fn(_shoes, 0, 0, 44),
            *side_panels(60, 24, 2, 42, "#e2bf96", 3)]


CATALOG = {
    "cat_bed": dict(name="猫窝", group="猫咪用品", w=44, d=44, h=12, parts=p_cat_bed, walk=True,
                    spots=[S("sleep", 0, 0, 8)]),
    "cat_tree": dict(name="猫爬架", group="猫咪用品", w=56, d=56, h=146, parts=p_cat_tree,
                     spots=[S("scratch", -12, -30, 0, face=(0, 1)), S("perch", -12, -8, 53), S("perch", 14, 10, 95),
                            S("sleep", -10, -8, 146)]),
    "big_cat_tree": dict(name="大猫爬架", group="猫咪用品", w=80, d=56, h=152, parts=p_big_cat_tree,
                         spots=[S("hide", -23, -12, 8), S("scratch", 26, -26, 0, face=(0, 1)), S("bat", 40, -36, 0),
                                S("sleep", 16, 6, 80), S("perch", 34, 20, 80), S("perch", -30, -18, 118),
                                S("sleep", 18, 12, 126), S("sleep", -26, -10, 152)]),
    "tree_tower": dict(name="原木多层塔", group="猫咪用品", w=72, d=64, h=192, parts=p_tree_tower,
                       spots=[S("hide", -19, -16, 12), S("scratch", 0, -36, 0, face=(0, 1)), S("perch", 18, -12, 40),
                              S("perch", -18, -6, 76), S("sleep", 16, 10, 113), S("perch", -18, 12, 148),
                              S("sleep", 4, 4, 184)]),
    "tree_castle": dict(name="城堡格子塔", group="猫咪用品", w=88, d=60, h=170, parts=p_tree_castle,
                        spots=[S("sleep", -23, -10, 11), S("sleep", 23, -6, 11), S("perch", -30, -12, 44),
                               S("perch", 30, -8, 44), S("sleep", -5, 0, 49), S("perch", -14, -4, 82),
                               S("sleep", 20, 2, 87), S("perch", 20, 0, 120), S("perch", -26, 12, 150)]),
    "tree_big": dict(name="大树猫爬架", group="猫咪用品", w=100, d=66, h=200, parts=p_tree_big,
                     spots=[S("hide", 0, -12, 4), S("scratch", 0, -24, 0, face=(0, 1)), S("perch", -30, -6, 44),
                            S("perch", 32, 2, 84), S("sleep", -28, 12, 123), S("perch", 30, 14, 158),
                            S("sleep", 0, 4, 186)]),
    "wall_steps": dict(name="靠墙阶梯组合", group="猫咪用品", w=150, d=24, h=176, parts=p_wall_steps, walk=True,
                       wall=True, spots=[S("perch", -62, -1, 40), S("perch", -31, -1, 66), S("perch", 0, -1, 92),
                                         S("perch", 31, -1, 118), S("sleep", 60, -1, 149), S("perch", 60, 0, 174)]),
    "shelf_lo": dict(name="墙上跳台（低）", group="猫咪用品", w=56, d=22, h=62, parts=p_wall_shelf(62), walk=True,
                     wall=True, spots=[S("perch", 0, -1, 62)]),
    "shelf_mid": dict(name="墙上跳台（中）", group="猫咪用品", w=56, d=22, h=96, parts=p_wall_shelf(96), walk=True,
                      wall=True, spots=[S("perch", 0, -1, 96)]),
    "shelf_hi": dict(name="墙上跳台（高）", group="猫咪用品", w=56, d=22, h=128, parts=p_wall_shelf(128), walk=True,
                     wall=True, spots=[S("perch", 0, -1, 128)]),
    "side_cabinet": dict(name="小边柜", group="装饰", w=62, d=32, h=53, parts=p_side_cabinet,
                         spots=[S("hideaway", 0, 0, 6, name="小边柜里", peek="door"), S("perch", 10, 2, 53), S("sleep", 12, 0, 53)]),
    "nightstand": dict(name="床头柜", group="卧室", w=34, d=30, h=44, parts=p_nightstand, spots=[S("perch", -6, 0, 44)]),
    "round_table": dict(name="小圆桌", group="客厅", w=52, d=52, h=50, parts=p_round_table,
                        spots=[S("perch", 6, 4, 50)]),
    "chair": dict(name="椅子", group="客厅", w=34, d=32, h=72, parts=p_chair,
                  spots=[S("sit", 0, -4, 36, "person", face=(0, -1)), S("perch", 0, -2, 38)]),
    "stool": dict(name="小凳子", group="装饰", w=32, d=32, h=30, parts=p_stool, spots=[S("perch", 0, 0, 30)]),
    "scratcher": dict(name="猫抓板", group="猫咪用品", w=50, d=24, h=8, parts=p_scratcher, walk=True,
                      sig=lambda it: round(float(it.state.get("wear", 0.0)) * 5),
                      spots=[S("scratch", 0, 0, 8)]),
    "bowls": dict(name="食盆和水碗", group="猫咪用品", w=58, d=26, h=7, parts=p_bowls, walk=True,
                  spots=[S("eat", -14, -20, 0, face=(0, 1)), S("drink", 14, -20, 0, face=(0, 1)),
                         S("feed", -56, -8, 0, "person", face=(1, 0))],
                  sig=lambda it: (int(it.state.get("food", 0) // 20), it.state.get("kind", "dry"))),
    "litter": dict(name="猫砂盆", group="猫咪用品", w=48, d=36, h=16, parts=p_litter,
                   sig=lambda it: round(float(it.state.get("dirty", 0.0)) * 7), spots=[S("litter", 0, 0, 15)]),
    "box": dict(name="纸箱", group="猫咪用品", w=48, d=36, h=30, parts=p_box, split=True, spots=[S("hide", 0, 0, 2)]),
    "window_seat": dict(name="窗台软垫", group="猫咪用品", w=72, d=28, h=48, parts=p_window_seat,
                        spots=[S("watch", -20, -2, 35, face=(0, 1)), S("sleep", 22, -4, 35)]),
    "sofa": dict(name="沙发", group="客厅", w=128, d=46, h=60, parts=p_sofa,
                 spots=[S("hideaway", 0, 30, 0, name="沙发后面", peek="top"), S("sit", -36, -6, 33, "person", face=(0, -1)), S("sit", 2, -6, 33, "person", face=(0, -1)),
                        S("perch", 44, -6, 33), S("sleep", 46, 18, 60)]),
    "armchair": dict(name="单人沙发", group="客厅", w=60, d=48, h=56, parts=p_armchair,
                     spots=[S("hideaway", 0, 30, 0, name="单人沙发后面", peek="top"), S("sit", 0, -6, 30, "person", face=(0, -1)), S("perch", 0, 19, 56)]),
    "tv": dict(name="电视", group="客厅", w=80, d=30, h=84, parts=p_tv,
               spots=[S("perch", -22, -4, 32), S("tv", 0, -58, 0, face=(0, 1))],
               sig=lambda it: (bool(it.state.get("on")), int(time.time() / 3) % 5 if it.state.get("on") else 0)),
    "rug": dict(name="地毯", group="客厅", w=160, d=92, h=0, parts=p_rug, flat=True, walk=True,
                spots=[S("play", -30, 0, 0, "person", face=(1, 0)), S("play", 30, 4, 0)]),
    "coat_rack": dict(name="衣架", group="客厅", w=28, d=28, h=140, parts=p_coat_rack,
                      spots=[S("hideaway", 0, 6, 0, name="大衣后面", peek="front"), S("bat", -30, -14, 0, face=(1, 1)), S("coat", 26, -22, 0, "person", face=(-1, 1))],
                      sig=lambda it: bool(it.state.get("coat", True))),
    "bookshelf": dict(name="书架", group="客厅", w=70, d=28, h=124, parts=p_bookshelf,
                      spots=[S("perch", -14, 0, 120), S("sleep", 16, 0, 120)]),
    "plant": dict(name="盆栽", group="装饰", w=26, d=26, h=70, parts=p_plant, sig=lambda it: round(thirst(it) * 4),
                  spots=[S("hideaway", 0, 14, 0, name="盆栽后面", peek="top"), S("nibble", 22, -14, 0), S("water", -26, -16, 0, "person", face=(1, 0))]),
    "flowers": dict(name="花盆", group="装饰", w=30, d=16, h=28, parts=p_flowers, sig=lambda it: round(thirst(it) * 4),
                    spots=[S("nibble", 0, -18, 0), S("water", -28, -12, 0, "person", face=(1, 0))]),
    "lamp": dict(name="落地灯", group="装饰", w=22, d=22, h=134, parts=p_lamp, spots=[],
                 sig=lambda it: bool(it.state.get("on"))),
    "fish_tank": dict(name="鱼缸", group="装饰", w=60, d=28, h=84, parts=lambda it: p_fish_tank(it),
                      spots=[S("watch_tank", 4, -36, 0, face=(0, 1))]),
    "table": dict(name="餐桌", group="厨房 / 餐厅", w=128, d=52, h=56, parts=p_table,
                  spots=[S("eat", -52, 0, 30, "person", face=(1, 0)), S("eat", 52, 0, 30, "person", face=(-1, 0)),
                         S("perch", 14, -4, 53)]),
    "stove": dict(name="灶台", group="厨房 / 餐厅", w=52, d=46, h=60, parts=p_stove,
                  spots=[S("cook", 0, -38, 0, "person", face=(0, 1)), S("beg", 48, -40, 0)]),
    "fridge": dict(name="冰箱", group="厨房 / 餐厅", w=44, d=44, h=118, parts=p_fridge, spots=[S("sleep", 0, 0, 118)]),
    "counter": dict(name="橱柜水槽", group="厨房 / 餐厅", w=62, d=46, h=58, parts=p_counter,
                    spots=[S("hideaway", 0, 0, 8, name="橱柜里", peek="door"), S("wash", -6, -40, 0, "person", face=(0, 1)), S("perch", 18, -4, 58)]),
    "bed": dict(name="大床", group="卧室", w=116, d=152, h=64, parts=p_bed,
                spots=[S("hideaway", 0, 10, 0, name="床底下", peek="front"), S("sleep", -24, 50, 34, "person"), S("sleep", 24, 50, 34, "person"),
                       S("sleep", 28, -50, 34), S("perch", -28, -54, 34)]),
    "kid_bed": dict(name="儿童床", group="卧室", w=72, d=124, h=56, parts=p_kid_bed,
                    spots=[S("hideaway", 0, 10, 0, name="小床底下", peek="front"), S("sleep", 0, 38, 34, "person", kid=True), S("sit", -10, -30, 34, "person", face=(0, -1)),
                           S("sleep", 14, -50, 34)]),
    "wardrobe": dict(name="衣柜", group="卧室", w=84, d=42, h=132, parts=p_wardrobe, spots=[S("hideaway", 0, 0, 12, name="衣柜里", peek="door"), S("sleep", 0, 0, 132)]),
    "desk": dict(name="书桌", group="卧室", w=84, d=84, h=56, parts=p_desk,
                 spots=[S("hideaway", 0, 0, 0, name="书桌底下", peek="front"), S("work", 0, -24, 30, "person", face=(0, 1)), S("perch", 26, 26, 52)]),
    "toy_box": dict(name="玩具箱", group="卧室", w=48, d=36, h=52, parts=p_toy_box,
                    spots=[S("hideaway", 0, 0, 8, name="玩具箱里", peek="top"), S("play", -6, -40, 0, "person", face=(0, 1)), S("perch", 0, 0, 30), S("play", 48, -30, 0)]),
    "toilet": dict(name="马桶", group="卫生间", w=30, d=36, h=46, parts=p_toilet,
                   spots=[S("toilet", 0, -6, 24, "person", face=(0, -1))]),
    "washbasin": dict(name="洗手台", group="卫生间", w=46, d=30, h=60, parts=p_washbasin,
                      spots=[S("wash", 0, -32, 0, "person", face=(0, 1)), S("perch", 15, 4, 52)]),
    "washer": dict(name="洗衣机", group="卫生间", w=44, d=44, h=60, parts=p_washer,
                   spots=[S("hideaway", 0, 0, 16, name="洗衣机里", peek="door"), S("laundry", 0, -40, 0, "person", face=(0, 1)), S("sleep", 0, 0, 60), S("perch", -10, -6, 60)]),
    "shoe_cabinet": dict(name="鞋柜", group="装饰", w=60, d=24, h=46, parts=p_shoe_cabinet, spots=[S("hideaway", 0, 0, 6, name="鞋柜里", peek="door"), S("perch", 0, 0, 44)]),
}
GROUPS = ["猫咪用品", "客厅", "厨房 / 餐厅", "卧室", "卫生间", "装饰"]


def p_fish_tank(it):
    return [B(-30, -14, 0, 30, 14, 40, "#8a6248", "#a87a58", r=2), Fr(-27, 5, -1, 35, "#9a7052"), Fr(1, 5, 27, 35, "#9a7052"),
            B(-28, -12, 40, 28, 12, 80, "#9fd0ea", "#c4e6f6", alpha=210), Fr(-27, 41, 27, 46, "#e6d3a3", v=-12),
            Fn(_tank_plants, 0, -12.2, 46, face="front"), Fn(_fish, 0, -12, 66, True, face="front"),
            B(-29, -13, 80, 29, 13, 84, "#3a3a44", "#4a4a56", r=1.5)]


# (type, floor, x, y, rot) in scaled coordinates -- 二楼 follows the plan; 一楼 is ours; 2 = the garden
_RAW_LAYOUT = [
    # 二楼 主卧 (0..364 x 0..480)
    ("bed", 1, 150, 402, 0), ("wardrobe", 1, 338, 150, 1), ("armchair", 1, 290, 330, 0), ("cat_bed", 1, 230, 80, 0),
    ("plant", 1, 30, 455, 0), ("lamp", 1, 30, 300, 0),
    # 次卧 / kid (364..729 x 0..304)
    ("kid_bed", 1, 663, 90, 1), ("desk", 1, 470, 46, 2), ("toy_box", 1, 560, 282, 0), ("rug", 1, 545, 175, 0),
    ("scratcher", 1, 680, 230, 0),
    # 走廊 / 厕所 / 餐厅
    ("flowers", 1, 700, 380, 1), ("toilet", 1, 505, 458, 0), ("washbasin", 1, 420, 462, 0), ("table", 1, 638, 436, 0),
    # 客厅 (729..1033 x 0..304) + 阳台 (y -45..0)
    ("sofa", 1, 880, 95, 2), ("tv", 1, 873, 285, 0), ("rug", 1, 880, 190, 0), ("lamp", 1, 1005, 30, 0),
    ("cat_tree", 1, 772, 250, 0), ("bookshelf", 1, 1015, 200, 1), ("plant", 1, 755, -22, 0),
    ("flowers", 1, 1000, -22, 0), ("window_seat", 1, 880, -22, 2),
    # 厨房 (729..1033 x 304..480)
    ("fridge", 1, 760, 454, 0), ("stove", 1, 820, 454, 0), ("counter", 1, 885, 453, 0), ("bowls", 1, 960, 350, 0),
    # 楼道
    ("shoe_cabinet", 1, 1080, 464, 0),
    # 一楼 猫咪游戏室 (0..450 x 0..480)
    ("cat_tree", 0, 60, 420, 0), ("window_seat", 0, 195, 462, 0), ("scratcher", 0, 220, 60, 0), ("box", 0, 300, 340, 0),
    ("cat_bed", 0, 90, 90, 0), ("rug", 0, 230, 240, 0), ("bookshelf", 0, 432, 110, 1),
    # 书房 (450..780 x 0..285)
    ("desk", 0, 620, 46, 2), ("bookshelf", 0, 762, 180, 1), ("armchair", 0, 520, 220, 0), ("lamp", 0, 480, 30, 0),
    # 洗衣房 (450..780 x 285..480)
    ("washer", 0, 500, 454, 0), ("counter", 0, 580, 453, 0), ("litter", 0, 720, 458, 0), ("bowls", 0, 650, 340, 0),
    # 阳光房 (780..1033 x 0..480)
    ("rug", 0, 905, 230, 0), ("toy_box", 0, 915, 458, 0), ("fish_tank", 0, 1015, 110, 1), ("plant", 0, 805, 30, 0),
    ("plant", 0, 1005, 455, 0), ("armchair", 0, 840, 380, 0), ("flowers", 0, 905, 18, 0),
    # 玄关
    ("coat_rack", 0, 1060, 40, 0), ("shoe_cabinet", 0, 1244, 430, 1),
]


# v23: more for the cats to climb (also added once to layouts saved before v23, where there is room)
V23_ITEMS = [
    ("big_cat_tree", 0, 398, 430, 0), ("shelf_lo", 0, 318, 470, 0), ("shelf_mid", 0, 346, 470, 0),
    ("shelf_hi", 1, 850, 470, 0), ("shelf_hi", 1, 936, 470, 0), ("shelf_mid", 1, 120, 470, 0),
    # small furniture: steps and stops on the cats' routes
    ("stool", 0, 245, 430, 0), ("stool", 0, 540, 395, 0), ("side_cabinet", 0, 700, 260, 0),
    ("nightstand", 1, 232, 455, 0), ("round_table", 1, 990, 130, 0),
    # lamps in every room downstairs
    ("lamp", 0, 22, 250, 0), ("lamp", 0, 655, 466, 0), ("lamp", 0, 862, 466, 0),
]
_RAW_LAYOUT += V23_ITEMS
# v24: four more cat trees (added once to older layouts too, where there is room)
V24_ITEMS = [
    ("tree_tower", 0, 990, 330, 0), ("tree_castle", 1, 430, 238, 0), ("tree_big", 1, 110, 200, 0),
    ("wall_steps", 1, 660, 291, 0),
]
_RAW_LAYOUT += V24_ITEMS
V26_ITEMS = [("lamp", 0, 1236, 466, 0)]                  # (v26) 玄关 gets its own lamp: every room has one now
_RAW_LAYOUT += V26_ITEMS


def footprint(it):
    c = CATALOG[it.type]
    w, d = c["w"], c["d"]
    if it.rot % 2:
        w, d = d, w
    return it.x - w / 2, it.y - d / 2, it.x + w / 2, it.y + d / 2


# ---------------------------------------------------------------------------------- people
OUTFITS = {"shirt": "T恤", "stripes": "条纹衫", "hoodie": "卫衣", "dress": "连衣裙", "overalls": "背带裤", "suit": "衬衫领带"}
ACCESSORIES = {"none": "无", "glasses": "眼镜", "hat": "帽子", "bow": "蝴蝶结", "headphones": "耳机"}
HEIGHTS = {0.92: "矮一点", 1.0: "普通", 1.08: "高一点"}
OUTINGS = {"often": "经常出门", "sometimes": "偶尔出门", "never": "宅家"}
HAIR_STYLES = {"short": "短发", "long": "长发", "bun": "丸子头", "pony": "马尾", "pigtails": "双马尾", "curly": "卷发"}
DEFAULT_PEOPLE = [
    {"name": "", "role": "adult", "hair": "short", "hair_c": "#3b2a22", "shirt": "#5e9bd6", "pants": "#4a4f63",
     "skin": "#f6d3b5", "outfit": "hoodie", "acc": "glasses", "beard": False, "height": 1.0, "wake": 7.0,
     "bed": 23.5, "out": "sometimes", "on": True},
    {"name": "", "role": "adult", "hair": "long", "hair_c": "#5a3a2a", "shirt": "#ef8f80", "pants": "#6b6f86",
     "skin": "#f8d8bf", "outfit": "dress", "acc": "none", "beard": False, "height": 1.0, "wake": 7.0, "bed": 23.0,
     "out": "sometimes", "on": True},
]
# a child can still be added in the settings (no longer part of the default family since v22)
KID_DEFAULT = {"name": "小宝", "role": "kid", "hair": "pigtails", "hair_c": "#3b2a22", "shirt": "#f2c94c",
               "pants": "#7bbf6a", "skin": "#f9dcc4", "outfit": "overalls", "acc": "bow", "beard": False, "height": 1.0,
               "wake": 7.0, "bed": 21.0, "out": "never", "on": True}


def person_default(role):
    return KID_DEFAULT if role == "kid" else DEFAULT_PEOPLE[0]
SEATED_POSES = ("sit", "doze", "eat", "work", "toilet")
LONG_SLEEVES = ("hoodie", "suit")


BUSY_PROPS = ["book", "phone", "laptop", "toy", "pencil"]     # things held in front with both hands


def person_dims(role):
    if role == "kid":
        return dict(leg=26.0, torso=24.0, r=14.0, lw=7.6, aw=5.6, sw=21.0, hw=18.0, neck=2.0)
    return dict(leg=44.0, torso=34.0, r=15.0, lw=9.2, aw=6.6, sw=27.0, hw=22.0, neck=3.0)


def person_top(P, pose, seat):
    """Height of the top of the head above the feet (or above the seat when sitting)."""
    d = person_dims(P.get("role", "adult"))
    head = d["neck"] + 2 * d["r"] + 3
    if pose == "sleep":
        return 18.0
    if pose in SEATED_POSES and seat > 0 or pose == "floor":
        return d["torso"] + head
    if pose in ("crouch", "feed", "kneel", "pet"):
        return d["leg"] * 0.55 + d["torso"] * 0.95 + head
    return d["leg"] + d["torso"] + head


def _ol(c, k=0.62):
    return QColor(c).darker(int(100 / k))


def _limb(p, a, b, c, color, w, outline=None):
    path = QPainterPath(QPointF(*a))
    path.quadTo(QPointF(*b), QPointF(*c))
    p.setBrush(Qt.NoBrush)
    p.setPen(QPen(outline if outline is not None else _ol(color), w + 2.0, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin))
    p.drawPath(path)
    p.setPen(QPen(QColor(color), w, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin))
    p.drawPath(path)


def _seg_point(a, b, c, k):
    """Point at parameter k on the quadratic a-b-c."""
    x = (1 - k) ** 2 * a[0] + 2 * (1 - k) * k * b[0] + k * k * c[0]
    y = (1 - k) ** 2 * a[1] + 2 * (1 - k) * k * b[1] + k * k * c[1]
    return x, y


def _arm(p, P, sh, el, hand, aw, shade_k=1.0, show_hand=True):
    """Arm from shoulder through elbow to hand: skin, then the sleeve over it, then the hand."""
    skin = QColor(P["skin"])
    sl = QColor(P["shirt"])
    if shade_k != 1.0:
        skin = skin.darker(int(100 / shade_k))
        sl = sl.darker(int(100 / shade_k))
    outfit = P.get("outfit", "shirt")
    if outfit in LONG_SLEEVES:
        _limb(p, sh, el, hand, sl, aw)
        k = 0.88
    else:
        _limb(p, sh, el, hand, skin, aw * 0.86)
        k = 0.42
        if outfit == "overalls" and P.get("role") == "kid":
            k = 0.36
    mid = _seg_point(sh, el, hand, k)
    ctrl = _seg_point(sh, el, hand, k * 0.5)
    _limb(p, sh, ctrl, mid, sl, aw + 0.6)
    # cuff
    cu = _seg_point(sh, el, hand, min(0.97, k + 0.02))
    p.setPen(QPen(sl.darker(122), 1.0, Qt.SolidLine, Qt.RoundCap))
    ang = math.atan2(cu[1] - mid[1], cu[0] - mid[0])
    nx, ny = -math.sin(ang) * (aw * 0.5 + 0.3), math.cos(ang) * (aw * 0.5 + 0.3)
    p.drawLine(QPointF(mid[0] + nx, mid[1] + ny), QPointF(mid[0] - nx, mid[1] - ny))
    if show_hand:
        _hand(p, skin, el, hand, aw)


def _hand(p, skin, el, hand, aw):
    """A small mitten pointing along the forearm, thumb on the upper side."""
    ang = math.degrees(math.atan2(hand[1] - el[1], hand[0] - el[0]))
    p.save()
    p.translate(*hand)
    p.rotate(ang)
    p.setPen(pen(_ol(skin).name(), 0.9))
    p.setBrush(skin)
    p.drawEllipse(QPointF(aw * 0.18, 0), aw * 0.62, aw * 0.52)
    p.drawEllipse(QPointF(-aw * 0.02, -aw * 0.42), aw * 0.26, aw * 0.2)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 255, 255, 60))
    p.drawEllipse(QPointF(aw * 0.12, -aw * 0.16), aw * 0.26, aw * 0.14)
    p.restore()


def _shoe(p, x, y, w, h, color, front=True):
    c = QColor(color)
    p.setPen(pen(_ol(c).name(), 0.9))
    p.setBrush(c)
    sole = QColor("#f4ede2") if c.lightness() < 150 else c.darker(135)
    if front:
        p.drawRoundedRect(QRectF(x - w / 2, y - h, w, h), h * 0.5, h * 0.5)
        p.setPen(Qt.NoPen)
        p.setBrush(sole)
        p.drawRoundedRect(QRectF(x - w / 2 + 0.6, y - h * 0.3, w - 1.2, h * 0.3), h * 0.15, h * 0.15)
        p.setPen(QPen(QColor(255, 255, 255, 110), 1, Qt.SolidLine, Qt.RoundCap))
        p.drawLine(QPointF(x - w * 0.25, y - h + 1.4), QPointF(x + w * 0.05, y - h + 1.4))
    else:
        path = QPainterPath(QPointF(x - w * 0.38, y))
        path.lineTo(x + w * 0.62, y)
        path.cubicTo(QPointF(x + w * 0.86, y), QPointF(x + w * 0.8, y - h * 1.05), QPointF(x + w * 0.22, y - h * 1.05))
        path.quadTo(QPointF(x - w * 0.1, y - h * 1.1), QPointF(x - w * 0.38, y - h * 0.95))
        path.closeSubpath()
        p.drawPath(path)
        p.setPen(Qt.NoPen)
        p.setBrush(sole)
        p.drawRoundedRect(QRectF(x - w * 0.38, y - h * 0.28, w * 1.12, h * 0.28), h * 0.12, h * 0.12)
        p.setPen(QPen(QColor(255, 255, 255, 110), 1, Qt.SolidLine, Qt.RoundCap))
        p.drawLine(QPointF(x + w * 0.2, y - h * 0.82), QPointF(x + w * 0.48, y - h * 0.7))


def shoe_color(P):
    return P.get("shoes") or ("#e46f5b" if P.get("role") == "kid" else "#5a4036")


# ---- heads -----------------------------------------------------------------------------------------
def _fringe(style, r):
    """Points of the lower edge of the hair on the forehead, right to left (front view)."""
    if style == "long":
        return [(r * 0.98, r * 0.45), (r * 0.62, -r * 0.18), (r * 0.06, -r * 0.6), (-r * 0.06, -r * 0.6),
                (-r * 0.62, -r * 0.18), (-r * 0.98, r * 0.45)]
    if style in ("bun", "pony"):
        return [(r * 0.97, r * 0.0), (r * 0.55, -r * 0.5), (-r * 0.55, -r * 0.5), (-r * 0.97, r * 0.0)]
    if style == "pigtails":
        return [(r * 0.97, r * 0.05), (r * 0.72, -r * 0.16), (r * 0.25, -r * 0.2), (-r * 0.25, -r * 0.2),
                (-r * 0.72, -r * 0.16), (-r * 0.97, r * 0.05)]
    if style == "curly":
        return [(r * 0.97, r * 0.05), (r * 0.62, -r * 0.3), (r * 0.25, -r * 0.18), (-r * 0.15, -r * 0.32),
                (-r * 0.55, -r * 0.18), (-r * 0.97, r * 0.05)]
    return [(r * 0.97, r * 0.02), (r * 0.6, -r * 0.3), (r * 0.15, -r * 0.16), (-r * 0.3, -r * 0.4),
            (-r * 0.72, -r * 0.22), (-r * 0.98, r * 0.06)]


def _hair_brush(hair, r, x=0.0, y=0.0):
    g = QRadialGradient(QPointF(x - r * 0.3, y - r * 0.7), r * 2.0)
    g.setColorAt(0, hair.lighter(128))
    g.setColorAt(0.45, hair)
    g.setColorAt(1, hair.darker(128))
    return g


def _hair_shine(p, hair, r, cx=0.0, cy=0.0, side=False):
    """The soft ring of light across the top of the hair, broken into a few strokes."""
    hl = QColor(hair).lighter(175)
    hl.setAlpha(150)
    p.setBrush(Qt.NoBrush)
    rect = QRectF(cx - r * 0.82, cy - r * 0.86, r * 1.64, r * 1.0)
    p.setPen(QPen(hl, r * 0.1, Qt.SolidLine, Qt.RoundCap))
    for a0, span in ((112, 20), (138, 14), (64, 18)) if not side else ((100, 22), (130, 16), (60, 14)):
        p.drawArc(rect, a0 * 16, span * 16)
    hl.setAlpha(220)
    p.setPen(QPen(hl, r * 0.05, Qt.SolidLine, Qt.RoundCap))
    p.drawArc(rect, 118 * 16, 9 * 16)


def _hair_strands(p, hair, r, pts):
    """Thin darker lines following the hair, for a little texture."""
    p.setPen(QPen(QColor(hair).darker(135), max(0.6, r * 0.045), Qt.SolidLine, Qt.RoundCap))
    p.setBrush(Qt.NoBrush)
    for a, b, c in pts:
        path = QPainterPath(QPointF(*a))
        path.quadTo(QPointF(*b), QPointF(*c))
        p.drawPath(path)


def head_front(p, P, r, eyes="open", blink=False, talk=False, part="all"):
    hair = QColor(P["hair_c"])
    skin = QColor(P["skin"])
    style = P.get("hair", "short")
    hol = _ol(hair)
    p.setPen(pen(hol.name(), 1.1))
    p.setBrush(_hair_brush(hair, r))
    if part in ("all", "back"):
        _hair_back_front(p, style, r, hair)
    if part == "back":
        return
    p.setPen(pen(hol.name(), 1.1))
    p.setBrush(_hair_brush(hair, r))
    p.drawEllipse(QPointF(0, -r * 0.06), r * 1.05, r * 1.02)
    _head_front_rest(p, P, r, eyes, blink, talk)


def _hair_back_front(p, style, r, hair_c=None):
    if style == "long":
        path = QPainterPath(QPointF(-r * 1.05, -r * 0.2))
        path.lineTo(-r * 1.12, r * 1.4)
        path.quadTo(QPointF(-r * 0.9, r * 1.75), QPointF(-r * 0.4, r * 1.55))
        path.lineTo(r * 0.4, r * 1.55)
        path.quadTo(QPointF(r * 0.9, r * 1.75), QPointF(r * 1.12, r * 1.4))
        path.lineTo(r * 1.05, -r * 0.2)
        path.closeSubpath()
        p.drawPath(path)
        p.save()
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(0, 0, 0, 40))
        p.drawRoundedRect(QRectF(-r * 0.8, r * 0.2, r * 1.6, r * 1.35), r * 0.4, r * 0.4)
        p.restore()
        hair_c = QColor(hair_c or "#3b2a22")
        _hair_strands(p, hair_c, r, [((-r * 1.0, r * 0.3), (-r * 1.08, r * 0.9), (-r * 0.85, r * 1.5)),
                                     ((r * 1.0, r * 0.3), (r * 1.08, r * 0.9), (r * 0.85, r * 1.5))])
        p.setPen(pen(_ol(hair_c).name(), 1.1))
        p.setBrush(_hair_brush(hair_c, r))
    elif style == "pigtails":
        for s in (-1, 1):
            p.save()
            p.translate(s * r * 1.12, r * 0.3)
            p.rotate(-s * 14)
            p.drawEllipse(QRectF(-r * 0.36, -r * 0.3, r * 0.72, r * 1.25))
            p.restore()
    elif style == "bun":
        p.drawEllipse(QPointF(0, -r * 1.02), r * 0.44, r * 0.42)
    elif style == "curly":
        for i in range(9):
            a = math.pi * (0.95 + i * 0.14)
            p.drawEllipse(QPointF(math.cos(a) * r * 0.98, math.sin(a) * r * 0.92 + r * 0.05), r * 0.36, r * 0.36)
        for s in (-1, 1):
            p.drawEllipse(QPointF(s * r * 1.02, r * 0.35), r * 0.32, r * 0.34)
    elif style == "pony":
        p.drawEllipse(QPointF(r * 0.92, r * 0.55), r * 0.22, r * 0.4)


def _head_front_rest(p, P, r, eyes, blink, talk):
    hair = QColor(P["hair_c"])
    skin = QColor(P["skin"])
    style = P.get("hair", "short")
    hol = _ol(hair)
    # ears
    if style in ("short", "bun", "pony"):
        p.setPen(pen(_ol(skin).name(), 0.9))
        p.setBrush(skin)
        for s in (-1, 1):
            p.drawEllipse(QPointF(s * r * 0.93, r * 0.16), r * 0.17, r * 0.22)
    # face
    p.setPen(pen(_ol(skin).name(), 1.0))
    g = QRadialGradient(QPointF(-r * 0.25, -r * 0.1), r * 1.3)
    g.setColorAt(0, skin.lighter(106))
    g.setColorAt(1, skin.darker(104))
    p.setBrush(g)
    p.drawEllipse(QPointF(0, r * 0.08), r * 0.92, r * 0.88)
    # bangs: locks that come to soft points
    edge = _fringe(style, r)
    path = QPainterPath(QPointF(*edge[-1]))
    path.cubicTo(QPointF(-r * 1.1, -r * 1.35), QPointF(r * 1.1, -r * 1.35), QPointF(*edge[0]))
    for i in range(1, len(edge)):
        a, b = edge[i - 1], edge[i]
        mx_, my_ = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - r * 0.07
        path.quadTo(QPointF(mx_ + (b[0] - a[0]) * 0.18, my_), QPointF(*b))
    path.closeSubpath()
    # the shadow the bangs cast on the forehead
    p.save()
    fc = QPainterPath()
    fc.addEllipse(QPointF(0, r * 0.08), r * 0.92, r * 0.88)
    p.setClipPath(fc)
    p.setPen(Qt.NoPen)
    sh_c = QColor(skin).darker(118)
    sh_c.setAlpha(150)
    p.setBrush(sh_c)
    p.drawPath(path.translated(r * 0.02, r * 0.1))
    p.restore()
    p.setPen(pen(hol.name(), 1.1))
    p.setBrush(_hair_brush(hair, r))
    p.drawPath(path)
    if style == "curly":
        for i in range(5):
            a = math.pi * (1.1 + i * 0.2)
            p.drawEllipse(QPointF(math.cos(a) * r * 0.78, math.sin(a) * r * 0.7 - r * 0.1), r * 0.26, r * 0.24)
    else:
        lines = []
        for x, y in edge[1:-1]:
            lines.append(((x * 0.4, -r * 0.85), (x * 0.85, (y - r * 0.85) / 2), (x * 0.96, y - r * 0.05)))
        _hair_strands(p, hair, r, lines)
    _hair_shine(p, hair, r, 0.0, -r * 0.08)
    _face_features(p, P, r, eyes, blink, talk, front=True)
    if P.get("beard"):
        _beard(p, P, r, True)
    draw_head_acc(p, P, r, "front")


def _face_features(p, P, r, eyes, blink, talk, front=True):
    skin = QColor(P["skin"])
    hair = QColor(P["hair_c"])
    ex = [(-r * 0.36, r * 0.2), (r * 0.36, r * 0.2)] if front else [(r * 0.5, r * 0.2)]
    closed = (eyes == "closed" or blink) and eyes not in ("hurt", "fierce")
    # brows: short tapered strokes
    p.setPen(QPen(hair.darker(115), max(1.0, r * 0.075), Qt.SolidLine, Qt.RoundCap))
    p.setBrush(Qt.NoBrush)
    for i, (x, y) in enumerate(ex):
        d = 1 if (not front or i == 1) else -1         # +1: the outer end is to the right
        if eyes == "fierce":
            # frowning: the inner end low
            p.drawLine(QPointF(x - r * 0.17 * d, y - r * 0.22), QPointF(x + r * 0.17 * d, y - r * 0.36))
        else:
            br = QPainterPath(QPointF(x - r * 0.16 * d, y - r * 0.27))
            br.quadTo(QPointF(x, y - r * 0.37), QPointF(x + r * 0.17 * d, y - r * 0.3))
            p.drawPath(br)
    for i, (x, y) in enumerate(ex):
        if eyes == "hurt":
            # >< squeezed shut
            d = 1 if (not front or i == 0) else -1
            p.setPen(QPen(QColor("#3a2a22"), 1.5, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin))
            p.setBrush(Qt.NoBrush)
            w_ = r * 0.15
            p.drawPolyline(QPolygonF([QPointF(x - w_ * d, y - w_), QPointF(x + w_ * d, y), QPointF(x - w_ * d, y + w_)]))
            continue
        if closed:
            p.setPen(QPen(QColor("#3a2a22"), 1.3, Qt.SolidLine, Qt.RoundCap))
            p.drawArc(QRectF(x - r * 0.16, y - r * 0.08, r * 0.32, r * 0.2), 200 * 16, 140 * 16)
        else:
            w, h = r * 0.16, r * 0.21
            if not front:
                w *= 0.82
            d = 1 if (not front or i == 1) else -1
            # white of the eye peeking at the sides, then the iris
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(255, 255, 255, 230))
            p.drawEllipse(QPointF(x, y + h * 0.05), w * 1.18, h * 0.95)
            iris = QColor(P.get("eye_c", "#5a3b2a"))
            g = QLinearGradient(x, y - h, x, y + h)
            g.setColorAt(0, iris.darker(190))
            g.setColorAt(0.55, iris)
            g.setColorAt(1, iris.lighter(150))
            p.setBrush(g)
            p.drawEllipse(QPointF(x, y), w, h)
            p.setBrush(QColor("#1e1612"))
            p.drawEllipse(QPointF(x, y + h * 0.05), w * 0.5, h * 0.55)
            p.setBrush(QColor(255, 255, 255))
            p.drawEllipse(QPointF(x + w * 0.38 * d, y - h * 0.4), w * 0.4, w * 0.4)
            p.setBrush(QColor(255, 255, 255, 200))
            p.drawEllipse(QPointF(x - w * 0.32 * d, y + h * 0.42), w * 0.18, w * 0.18)
            # upper lid: a thick line with a little flick at the outer corner
            p.setPen(QPen(QColor("#2b211c"), max(1.2, r * 0.085), Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin))
            p.setBrush(Qt.NoBrush)
            lid = QPainterPath(QPointF(x - w * 1.2 * d, y - h * 0.45))
            lid.quadTo(QPointF(x, y - h * 1.3), QPointF(x + w * 1.25 * d, y - h * 0.55))
            lid.lineTo(x + w * 1.5 * d, y - h * 0.78)
            p.drawPath(lid)
    # blush, nose, mouth
    p.setPen(Qt.NoPen)
    for x, y in ([(-r * 0.56, r * 0.52), (r * 0.56, r * 0.52)] if front else [(r * 0.4, r * 0.54)]):
        g = QRadialGradient(QPointF(x, y), r * 0.22)
        g.setColorAt(0, QColor(240, 120, 120, 110))
        g.setColorAt(1, QColor(240, 120, 120, 0))
        p.setBrush(g)
        p.drawEllipse(QPointF(x, y), r * 0.22, r * 0.14)
    nx = 0 if front else r * 0.9
    p.setBrush(skin.darker(118))
    p.drawEllipse(QPointF(nx, r * 0.42), r * 0.05, r * 0.04)
    mx_ = 0 if front else r * 0.66
    if talk:
        mp = QPainterPath(QPointF(mx_ - r * 0.12, r * 0.6))
        mp.quadTo(QPointF(mx_, r * 0.57), QPointF(mx_ + r * 0.12, r * 0.6))
        mp.quadTo(QPointF(mx_ + r * 0.06, r * 0.78), QPointF(mx_, r * 0.78))
        mp.quadTo(QPointF(mx_ - r * 0.06, r * 0.78), QPointF(mx_ - r * 0.12, r * 0.6))
        p.setPen(pen("#7a3d32", 0.9))
        p.setBrush(QColor("#9e3b35"))
        p.drawPath(mp)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#e8857a"))
        p.drawEllipse(QPointF(mx_, r * 0.73), r * 0.06, r * 0.035)
    else:
        p.setPen(QPen(QColor("#7a3d32"), 1.1, Qt.SolidLine, Qt.RoundCap))
        p.setBrush(Qt.NoBrush)
        mp = QPainterPath(QPointF(mx_ - r * 0.12, r * 0.6))
        mp.quadTo(QPointF(mx_ - r * 0.06, r * 0.67), QPointF(mx_, r * 0.62))
        mp.quadTo(QPointF(mx_ + r * 0.06, r * 0.67), QPointF(mx_ + r * 0.12, r * 0.6))
        p.drawPath(mp)


def _beard(p, P, r, front):
    c = QColor(P["hair_c"])
    p.setPen(pen(_ol(c).name(), 0.9))
    p.setBrush(c)
    path = QPainterPath()
    if front:
        path.moveTo(-r * 0.86, r * 0.25)
        path.quadTo(QPointF(-r * 0.7, r * 1.12), QPointF(0, r * 1.12))
        path.quadTo(QPointF(r * 0.7, r * 1.12), QPointF(r * 0.86, r * 0.25))
        path.quadTo(QPointF(r * 0.55, r * 0.62), QPointF(r * 0.2, r * 0.54))
        path.quadTo(QPointF(0, r * 0.5), QPointF(-r * 0.2, r * 0.54))
        path.quadTo(QPointF(-r * 0.55, r * 0.62), QPointF(-r * 0.86, r * 0.25))
    else:
        path.moveTo(-r * 0.05, r * 0.3)
        path.quadTo(QPointF(r * 0.35, r * 1.15), QPointF(r * 0.85, r * 0.85))
        path.quadTo(QPointF(r * 0.95, r * 0.6), QPointF(r * 0.6, r * 0.55))
        path.quadTo(QPointF(r * 0.3, r * 0.6), QPointF(-r * 0.05, r * 0.3))
    p.drawPath(path)
    p.setPen(QPen(QColor("#7a3d32"), 1.1, Qt.SolidLine, Qt.RoundCap))
    p.setBrush(Qt.NoBrush)
    mx_ = 0 if front else r * 0.66
    p.drawArc(QRectF(mx_ - r * 0.13, r * 0.5, r * 0.26, r * 0.16), 200 * 16, 140 * 16)


def head_side(p, P, r, eyes="open", blink=False, talk=False, part="all"):
    """Profile, facing right."""
    hair = QColor(P["hair_c"])
    skin = QColor(P["skin"])
    style = P.get("hair", "short")
    hol = _ol(hair)
    if part in ("all", "back"):
        _hair_back_side(p, P, style, r, hair, hol)
    if part == "back":
        return
    _head_side_rest(p, P, r, eyes, blink, talk)


def _hair_back_side(p, P, style, r, hair, hol):
    p.setPen(pen(hol.name(), 1.1))
    p.setBrush(_hair_brush(hair, r, -r * 0.2))
    if style == "long":
        path = QPainterPath(QPointF(-r * 1.0, -r * 0.3))
        path.quadTo(QPointF(-r * 1.25, r * 0.8), QPointF(-r * 0.95, r * 1.6))
        path.quadTo(QPointF(-r * 0.5, r * 1.75), QPointF(r * 0.05, r * 1.45))
        path.lineTo(r * 0.1, r * 0.2)
        path.closeSubpath()
        p.drawPath(path)
    elif style == "pony":
        path = QPainterPath(QPointF(-r * 0.85, -r * 0.45))
        path.quadTo(QPointF(-r * 1.65, -r * 0.2), QPointF(-r * 1.45, r * 0.75))
        path.quadTo(QPointF(-r * 1.35, r * 1.25), QPointF(-r * 1.0, r * 1.35))
        path.quadTo(QPointF(-r * 1.15, r * 0.6), QPointF(-r * 0.75, -r * 0.05))
        path.closeSubpath()
        p.drawPath(path)
        p.setBrush(QColor("#ef6f8f"))
        p.drawEllipse(QPointF(-r * 0.98, -r * 0.35), r * 0.13, r * 0.13)
        p.setBrush(_hair_brush(hair, r, -r * 0.2))
    elif style == "pigtails":
        p.save()
        p.translate(-r * 0.9, r * 0.3)
        p.rotate(18)
        p.drawEllipse(QRectF(-r * 0.36, -r * 0.3, r * 0.72, r * 1.25))
        p.restore()
    elif style == "bun":
        p.drawEllipse(QPointF(-r * 0.55, -r * 0.92), r * 0.42, r * 0.4)
    elif style == "curly":
        for i in range(8):
            a = math.pi * (0.55 + i * 0.16)
            p.drawEllipse(QPointF(math.cos(a) * r * 0.95 - r * 0.1, math.sin(a) * r * 0.92), r * 0.36, r * 0.36)


def _head_side_rest(p, P, r, eyes, blink, talk):
    hair = QColor(P["hair_c"])
    skin = QColor(P["skin"])
    style = P.get("hair", "short")
    hol = _ol(hair)
    p.setPen(pen(hol.name(), 1.1))
    p.setBrush(_hair_brush(hair, r, -r * 0.2))
    p.drawEllipse(QPointF(-r * 0.1, -r * 0.08), r * 1.02, r * 1.0)
    # face (with a small nose)
    p.setPen(pen(_ol(skin).name(), 1.0))
    g = QRadialGradient(QPointF(r * 0.2, -r * 0.1), r * 1.3)
    g.setColorAt(0, skin.lighter(106))
    g.setColorAt(1, skin.darker(104))
    p.setBrush(g)
    face_path = QPainterPath()
    face_path.addEllipse(QPointF(r * 0.08, r * 0.1), r * 0.86, r * 0.86)
    nose = QPainterPath()
    nose.addEllipse(QPointF(r * 0.9, r * 0.36), r * 0.12, r * 0.11)
    p.drawPath(face_path.united(nose))
    # front hair over the forehead, the rest of the cap behind the ear
    path = QPainterPath(QPointF(-r * 0.6, r * 0.5))
    path.cubicTo(QPointF(-r * 1.2, -r * 0.8), QPointF(r * 0.2, -r * 1.45), QPointF(r * 0.92, -r * 0.2))
    if style in ("bun", "pony"):
        path.quadTo(QPointF(r * 0.55, -r * 0.5), QPointF(r * 0.05, -r * 0.5))
    else:
        path.quadTo(QPointF(r * 0.75, -r * 0.05), QPointF(r * 0.55, -r * 0.18))
        path.quadTo(QPointF(r * 0.3, -r * 0.3), QPointF(r * 0.1, -r * 0.2))
    path.quadTo(QPointF(-r * 0.15, -r * 0.1), QPointF(-r * 0.2, r * 0.35))
    path.closeSubpath()
    p.save()
    p.setClipPath(face_path)
    p.setPen(Qt.NoPen)
    sh_c = QColor(skin).darker(118)
    sh_c.setAlpha(150)
    p.setBrush(sh_c)
    p.drawPath(path.translated(r * 0.04, r * 0.1))
    p.restore()
    p.setPen(pen(hol.name(), 1.1))
    p.setBrush(_hair_brush(hair, r, -r * 0.2))
    p.drawPath(path)
    _hair_strands(p, hair, r, [((-r * 0.2, -r * 0.95), (r * 0.4, -r * 0.8), (r * 0.75, -r * 0.3)),
                               ((-r * 0.6, -r * 0.8), (-r * 0.85, -r * 0.2), (-r * 0.55, r * 0.3))])
    p.setPen(pen(hol.name(), 1.1))
    p.setBrush(_hair_brush(hair, r, -r * 0.2))
    if style == "long":
        p.drawRoundedRect(QRectF(-r * 0.3, -r * 0.1, r * 0.4, r * 1.2), r * 0.2, r * 0.2)
    else:
        p.setPen(pen(_ol(skin).name(), 0.9))
        p.setBrush(skin)
        p.drawEllipse(QPointF(-r * 0.1, r * 0.18), r * 0.16, r * 0.21)
    _hair_shine(p, hair, r, -r * 0.1, -r * 0.1, side=True)
    _face_features(p, P, r, eyes, blink, talk, front=False)
    if P.get("beard"):
        _beard(p, P, r, False)
    draw_head_acc(p, P, r, "side")


def head_back(p, P, r):
    hair = QColor(P["hair_c"])
    skin = QColor(P["skin"])
    style = P.get("hair", "short")
    hol = _ol(hair)
    if style in ("short", "bun", "pony"):
        p.setPen(pen(_ol(skin).name(), 0.9))
        p.setBrush(skin)
        for s in (-1, 1):
            p.drawEllipse(QPointF(s * r * 0.97, r * 0.16), r * 0.17, r * 0.22)
    p.setPen(pen(hol.name(), 1.1))
    p.setBrush(_hair_brush(hair, r))
    if style == "long":
        p.drawRoundedRect(QRectF(-r * 1.08, -r * 0.5, r * 2.16, r * 2.15), r * 0.7, r * 0.6)
    if style == "pigtails":
        for s in (-1, 1):
            p.save()
            p.translate(s * r * 1.12, r * 0.3)
            p.rotate(-s * 14)
            p.drawEllipse(QRectF(-r * 0.36, -r * 0.3, r * 0.72, r * 1.25))
            p.restore()
    if style == "curly":
        for i in range(10):
            a = math.tau * i / 10
            p.drawEllipse(QPointF(math.cos(a) * r * 0.85, math.sin(a) * r * 0.85), r * 0.36, r * 0.36)
    p.drawEllipse(QPointF(0, 0), r * 1.03, r * 1.0)
    if style == "bun":
        p.drawEllipse(QPointF(0, -r * 1.0), r * 0.44, r * 0.42)
    if style == "pony":
        path = QPainterPath(QPointF(-r * 0.22, r * 0.2))
        path.quadTo(QPointF(-r * 0.35, r * 1.2), QPointF(0, r * 1.55))
        path.quadTo(QPointF(r * 0.35, r * 1.2), QPointF(r * 0.22, r * 0.2))
        path.closeSubpath()
        p.drawPath(path)
        p.setBrush(QColor("#ef6f8f"))
        p.drawEllipse(QPointF(0, r * 0.25), r * 0.14, r * 0.12)
    p.setPen(QPen(hol, 0.9))
    p.setBrush(Qt.NoBrush)
    for dx in (-0.4, 0.0, 0.4):
        path = QPainterPath(QPointF(r * dx * 0.6, -r * 0.85))
        path.quadTo(QPointF(r * dx * 1.2, -r * 0.2), QPointF(r * dx * 1.3, r * 0.6))
        p.drawPath(path)
    _hair_shine(p, hair, r, 0.0, 0.0)
    draw_head_acc(p, P, r, "back")


def draw_head_acc(p, P, r, view):
    acc = P.get("acc", "none")
    front, back = view == "front", view == "back"
    if acc == "glasses" and not back:
        p.setPen(QPen(QColor("#2b211c"), 1.2))
        p.setBrush(QColor(255, 255, 255, 50))
        if front:
            for x in (-r * 0.36, r * 0.36):
                p.drawRoundedRect(QRectF(x - r * 0.27, r * 0.2 - r * 0.22, r * 0.54, r * 0.44), r * 0.16, r * 0.16)
            p.drawLine(QPointF(-r * 0.09, r * 0.16), QPointF(r * 0.09, r * 0.16))
        else:
            p.drawRoundedRect(QRectF(r * 0.28, r * 0.2 - r * 0.22, r * 0.46, r * 0.44), r * 0.14, r * 0.14)
            p.drawLine(QPointF(r * 0.28, r * 0.14), QPointF(-r * 0.12, r * 0.08))
    elif acc == "hat":
        col = QColor(P.get("hat_c", "#e46f5b"))
        p.setPen(pen(_ol(col).name(), 1.1))
        p.setBrush(col)
        ox = 0 if (front or back) else -r * 0.08
        path = QPainterPath(QPointF(ox - r * 1.02, -r * 0.3))
        path.cubicTo(QPointF(ox - r * 1.05, -r * 1.45), QPointF(ox + r * 1.05, -r * 1.45), QPointF(ox + r * 1.02, -r * 0.3))
        path.closeSubpath()
        p.drawPath(path)
        p.setBrush(col.darker(112))
        p.drawRoundedRect(QRectF(ox - r * 1.06, -r * 0.48, r * 2.12, r * 0.26), 3, 3)
        p.setPen(QPen(col.darker(125), 0.8))
        for k in range(-4, 5):
            p.drawLine(QPointF(ox + k * r * 0.22, -r * 0.46), QPointF(ox + k * r * 0.22, -r * 0.24))
        p.setPen(pen(_ol(col).name(), 1.0))
        p.setBrush(QColor("#fbf3e6"))
        p.drawEllipse(QPointF(ox, -r * 1.22), r * 0.2, r * 0.2)
    elif acc == "bow":
        p.setPen(pen("#b8455f", 1.0))
        p.setBrush(QColor("#ef6f8f"))
        cx, cy = (r * 0.55, -r * 0.82) if front else ((-r * 0.55, -r * 0.82) if back else (-r * 0.3, -r * 0.95))
        p.drawPolygon(poly((cx, cy), (cx - r * 0.45, cy - r * 0.28), (cx - r * 0.42, cy + r * 0.28)))
        p.drawPolygon(poly((cx, cy), (cx + r * 0.45, cy - r * 0.28), (cx + r * 0.42, cy + r * 0.28)))
        p.drawEllipse(QPointF(cx, cy), r * 0.13, r * 0.13)
    elif acc == "headphones":
        p.setPen(QPen(QColor("#3a3a44"), 2.6))
        p.setBrush(Qt.NoBrush)
        p.drawArc(QRectF(-r * 1.04, -r * 1.14, r * 2.08, r * 1.9), 20 * 16, 140 * 16)
        p.setPen(pen("#2a4a6a", 1.0))
        p.setBrush(QColor("#5e9bd6"))
        if front or back:
            for x in (-r * 1.02, r * 1.02):
                p.drawRoundedRect(QRectF(x - r * 0.2, -r * 0.12, r * 0.4, r * 0.58), 3, 3)
        else:
            p.drawRoundedRect(QRectF(-r * 0.38, -r * 0.12, r * 0.46, r * 0.62), 3, 3)


# ---- bodies ----------------------------------------------------------------------------------------
def _torso_path(top, bot, sw, hw, cx=0.0):
    path = QPainterPath(QPointF(cx - sw / 2 + 4, top))
    path.lineTo(cx + sw / 2 - 4, top)
    path.quadTo(QPointF(cx + sw / 2, top), QPointF(cx + sw / 2, top + 5))
    path.lineTo(cx + hw / 2, bot - 3)
    path.quadTo(QPointF(cx + hw / 2, bot), QPointF(cx + hw / 2 - 3, bot))
    path.lineTo(cx - hw / 2 + 3, bot)
    path.quadTo(QPointF(cx - hw / 2, bot), QPointF(cx - hw / 2, bot - 3))
    path.lineTo(cx - sw / 2, top + 5)
    path.quadTo(QPointF(cx - sw / 2, top), QPointF(cx - sw / 2 + 4, top))
    path.closeSubpath()
    return path


def _cloth_brush(color, x0, x1):
    c = QColor(color)
    g = QLinearGradient(x0, 0, x1, 0)
    g.setColorAt(0, c.lighter(108))
    g.setColorAt(0.55, c)
    g.setColorAt(1, c.darker(114))
    return g


def _torso_fb(p, P, top, bot, sw, hw, back=False, leg=0.0, seated=False):
    """Front / back view torso with the outfit."""
    outfit = P.get("outfit", "shirt")
    shirt = QColor(P["shirt"])
    path = _torso_path(top, bot, sw, hw)
    if outfit == "dress":
        skirt_bot = bot + (leg * 0.5 if not seated else 8)
        fl = hw * 0.45 if not seated else hw * 0.3
        sk = QPainterPath(QPointF(-hw / 2 - 1, bot - (bot - top) * 0.28))
        sk.lineTo(hw / 2 + 1, bot - (bot - top) * 0.28)
        sk.quadTo(QPointF(hw / 2 + fl * 0.6, bot), QPointF(hw / 2 + fl, skirt_bot))
        sk.quadTo(QPointF(0, skirt_bot + 3), QPointF(-hw / 2 - fl, skirt_bot))
        sk.quadTo(QPointF(-hw / 2 - fl * 0.6, bot), QPointF(-hw / 2 - 1, bot - (bot - top) * 0.28))
        sk.closeSubpath()
        p.setPen(pen(_ol(shirt).name(), 1.0))
        p.setBrush(_cloth_brush(shirt.name(), -hw, hw))
        p.drawPath(sk)
        p.setPen(QPen(QColor(255, 255, 255, 170), 1.4))
        p.drawLine(QPointF(-hw / 2 - fl + 3, skirt_bot - 3), QPointF(hw / 2 + fl - 3, skirt_bot - 3))
    p.setPen(pen(_ol(shirt).name(), 1.0))
    p.setBrush(_cloth_brush(shirt.name(), -sw / 2, sw / 2))
    p.drawPath(path)
    p.save()
    p.setClipPath(path)
    # the shadow of the head across the shoulders, a soft fold at the waist
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(0, 0, 0, 34))
    p.drawEllipse(QPointF(0, top - 1), sw * 0.3, 5.5)
    p.setPen(QPen(QColor(0, 0, 0, 30), 1.2, Qt.SolidLine, Qt.RoundCap))
    p.setBrush(Qt.NoBrush)
    for s_ in (-1, 1):
        p.drawLine(QPointF(s_ * hw * 0.28, bot - (bot - top) * 0.28), QPointF(s_ * hw * 0.2, bot - 2))
    if outfit == "stripes":
        p.setPen(QPen(QColor(255, 255, 255, 190), 2.4))
        y = top + 5
        while y < bot:
            p.drawLine(QPointF(-sw, y), QPointF(sw, y))
            y += 6
    elif outfit == "hoodie":
        p.setPen(pen(_ol(shirt).name(), 0.9))
        p.setBrush(shirt.darker(108))
        if back:
            p.drawRoundedRect(QRectF(-sw * 0.36, top - 2, sw * 0.72, (bot - top) * 0.42), 6, 6)
        else:
            p.drawRoundedRect(QRectF(-hw * 0.38, bot - (bot - top) * 0.36, hw * 0.76, (bot - top) * 0.26), 4, 4)
        p.setBrush(shirt.darker(118))
        p.drawRect(QRectF(-sw, bot - 3.5, sw * 2, 3.5))
    elif outfit == "overalls":
        pc = QColor(P["pants"])
        p.setPen(pen(_ol(pc).name(), 1.0))
        p.setBrush(_cloth_brush(pc.name(), -sw / 2, sw / 2))
        if not back:
            p.drawRoundedRect(QRectF(-hw * 0.36, top + (bot - top) * 0.36, hw * 0.72, (bot - top) * 0.7), 3, 3)
        p.drawRect(QRectF(-sw, bot - (bot - top) * 0.3, sw * 2, (bot - top) * 0.4))
        p.setPen(QPen(pc, 2.6))
        for s in (-1, 1):
            p.drawLine(QPointF(s * sw * 0.26, top), QPointF(s * hw * 0.3, top + (bot - top) * 0.4))
        if not back:
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#f2c94c"))
            for s in (-1, 1):
                p.drawEllipse(QPointF(s * hw * 0.3, top + (bot - top) * 0.4), 1.6, 1.6)
            p.setBrush(pc.darker(115))
            p.drawRoundedRect(QRectF(-hw * 0.18, top + (bot - top) * 0.52, hw * 0.36, (bot - top) * 0.2), 2, 2)
    elif outfit == "suit":
        p.setBrush(shirt.darker(120))
        p.setPen(Qt.NoPen)
        p.drawRect(QRectF(-sw, bot - 4, sw * 2, 4))
    p.restore()
    # neckline / collar / tie
    if not back:
        if outfit == "suit":
            p.setPen(pen("#c9c9c9", 0.9))
            p.setBrush(QColor("#ffffff"))
            p.drawPolygon(poly((-sw * 0.22, top), (0, top + (bot - top) * 0.3), (-sw * 0.05, top - 1)))
            p.drawPolygon(poly((sw * 0.22, top), (0, top + (bot - top) * 0.3), (sw * 0.05, top - 1)))
            p.setPen(pen("#7a1f18", 0.8))
            p.setBrush(QColor("#c0392b"))
            p.drawPolygon(poly((-2, top + 2), (2, top + 2), (3.4, top + (bot - top) * 0.62), (0, top + (bot - top) * 0.75),
                               (-3.4, top + (bot - top) * 0.62)))
        elif outfit == "hoodie":
            p.setPen(QPen(QColor(255, 255, 255, 220), 1.1))
            for s in (-1, 1):
                p.drawLine(QPointF(s * 3, top + 2), QPointF(s * 3.5, top + (bot - top) * 0.32))
        else:
            p.setPen(QPen(_ol(shirt), 1.0))
            p.setBrush(Qt.NoBrush)
            p.drawArc(QRectF(-sw * 0.2, top - 4, sw * 0.4, 8), 200 * 16, 140 * 16)


def _legs_fb(p, P, hip, foot_y, hw, lw, lifts=(0.0, 0.0), back=False, spread=1.0):
    outfit = P.get("outfit", "shirt")
    col = QColor(P["skin"]) if outfit == "dress" else QColor(P["pants"])
    sc = shoe_color(P)
    for i, s in enumerate((-1, 1)):
        x = s * hw * 0.24 * spread
        fy = foot_y - lifts[i]
        _limb(p, (x, hip), (x, (hip + fy) / 2), (x, fy - 3), col, lw)
        if outfit != "dress":
            p.setPen(QPen(col.darker(125), 1.0))
            p.drawLine(QPointF(x - lw * 0.5, fy - lw * 0.75), QPointF(x + lw * 0.5, fy - lw * 0.75))
        if outfit == "dress":
            p.setPen(Qt.NoPen)
        _shoe(p, x, fy + 1, lw * 1.25, lw * 0.62, sc, True)
        if back:
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(0, 0, 0, 30))
            p.drawRect(QRectF(x - lw * 0.55, fy - lw * 0.5, lw * 1.1, 2))


def _draw_fb(p, P, pose, t, back, prop, seat, blink, talk, held=None):
    """Front (facing the viewer) or back view. Feet (or the seat) at (0, 0).
    held(p, x, y): draws what is in the arms / on the lap, between the body and the arms."""
    d = person_dims(P["role"])
    leg, torso, r, lw, aw, sw, hw, neck = (d[k] for k in ("leg", "torso", "r", "lw", "aw", "sw", "hw", "neck"))
    ph = t * 7.5
    seated = (pose in SEATED_POSES and seat > 0) or pose == "floor"
    crouch = pose in ("crouch", "feed", "kneel", "pet")
    hug = prop == "hug" and not seated
    lap = seated and prop in ("lap", "hug")
    bob = 0.0
    lifts = (0.0, 0.0)
    if pose in ("walk", "run", "dance"):
        amp = 4.5 if pose == "walk" else 7.5
        s = math.sin(ph if pose != "dance" else t * 6)
        lifts = (max(0.0, s) * amp, max(0.0, -s) * amp)
        bob = abs(s) * (1.2 if pose == "walk" else 2.2)
    else:
        bob = 0.5 * math.sin(t * 1.6)
    if seated:
        hip = 0.0
    elif crouch:
        hip = -leg * 0.55
    else:
        hip = -leg - bob
    top = hip - torso
    # legs
    if seated and not back:
        col = QColor(P["skin"]) if P.get("outfit") == "dress" else QColor(P["pants"])
        if pose == "floor":
            for s in (-1, 1):
                _limb(p, (s * hw * 0.22, -2), (s * (hw * 0.5 + 6), 2), (s * (hw * 0.5 + 12), 5), col, lw)
                _shoe(p, s * (hw * 0.5 + 13), 9, lw * 1.2, lw * 0.6, shoe_color(P), True)
        else:
            drop = clamp(seat, 6.0, leg * 0.72)
            for s in (-1, 1):
                x = s * hw * 0.24
                p.setPen(pen(_ol(col).name(), 1.0))
                p.setBrush(col)
                p.drawRoundedRect(QRectF(x - lw * 0.6, -3, lw * 1.2, 9), lw * 0.5, lw * 0.5)
                _limb(p, (x, 5), (x, 5 + drop * 0.5), (x, drop - 2), col, lw * 0.95)
                _shoe(p, x, drop + 2, lw * 1.25, lw * 0.62, shoe_color(P), True)
    elif crouch:
        col = QColor(P["skin"]) if P.get("outfit") == "dress" else QColor(P["pants"])
        for s in (-1, 1):
            _limb(p, (s * hw * 0.25, hip), (s * hw * 0.62, hip + 4), (s * hw * 0.42, -3), col, lw)
            _shoe(p, s * hw * 0.42, 1, lw * 1.25, lw * 0.62, shoe_color(P), not back)
    elif not seated:
        _legs_fb(p, P, hip, 0.0, hw, lw, lifts, back)
    # arms behind the body (back view: hands busy in front)
    sh_y = top + 6
    sx = sw / 2 - aw * 0.45
    busy = pose in ("cook", "work", "eat", "feed", "crouch", "pet") or prop in BUSY_PROPS
    arm_pts = []
    if hug:
        # cradling something against the chest
        arm_pts = [((-sx, sh_y), (-sx - 5, sh_y + torso * 0.52), (-3, sh_y + torso * 0.52)),
                   ((sx, sh_y), (sx + 5, sh_y + torso * 0.5), (3, sh_y + torso * 0.46))]
    elif lap:
        # hands on the cat in the lap, one of them stroking slowly
        s_ = math.sin(t * 2.6)
        arm_pts = [((-sx, sh_y), (-sx - 3, sh_y + torso * 0.55), (-5, sh_y + torso * 0.98)),
                   ((sx, sh_y), (sx + 3, sh_y + torso * 0.55), (5 + 4 * s_, sh_y + torso * 0.93 - 2 * abs(s_)))]
    elif pose in ("walk", "run"):
        a = math.sin(ph) * (3.0 if pose == "walk" else 5.0)
        arm_pts = [((-sx, sh_y), (-sx - 3, sh_y + torso * 0.45), (-sx - 1, sh_y + torso * 0.82 + a)),
                   ((sx, sh_y), (sx + 3, sh_y + torso * 0.45), (sx + 1, sh_y + torso * 0.82 - a))]
    elif pose == "wave":
        w = 4 * math.sin(t * 9)
        arm_pts = [((-sx, sh_y), (-sx - 3, sh_y + torso * 0.45), (-sx - 1, sh_y + torso * 0.82)),
                   ((sx, sh_y), (sx + 10, sh_y - 4), (sx + 8 + w, sh_y - torso * 0.55))]
    elif pose == "heart":
        # arms curved over the head into a heart
        arm_pts = [((-sx, sh_y), (-sx - 9, sh_y - torso * 0.55), (-1.5, sh_y - torso * 1.05)),
                   ((sx, sh_y), (sx + 9, sh_y - torso * 0.55), (1.5, sh_y - torso * 1.05))]
    elif pose == "clap":
        k = abs(math.sin(t * 9))
        arm_pts = [((-sx, sh_y), (-sx - 4, sh_y + torso * 0.35), (-1.5 - 5 * k, sh_y + torso * 0.25)),
                   ((sx, sh_y), (sx + 4, sh_y + torso * 0.35), (1.5 + 5 * k, sh_y + torso * 0.25))]
    elif pose == "dance":
        k = math.sin(t * 6)
        arm_pts = [((-sx, sh_y), (-sx - 6, sh_y - torso * 0.3 * k), (-sx - 4, sh_y - torso * 0.7 * k)),
                   ((sx, sh_y), (sx + 6, sh_y + torso * 0.3 * k), (sx + 4, sh_y + torso * 0.7 * k))]
    elif pose == "stretch":
        w_ = 2 * math.sin(t * 3)
        arm_pts = [((-sx, sh_y), (-sx - 5, sh_y - torso * 0.4), (-sx + 3 + w_, sh_y - torso * 0.92)),
                   ((sx, sh_y), (sx + 5, sh_y - torso * 0.4), (sx - 3 - w_, sh_y - torso * 0.92))]
    elif pose == "reach":
        arm_pts = [((-sx, sh_y), (-sx - 3, sh_y + torso * 0.45), (-sx - 1, sh_y + torso * 0.82)),
                   ((sx, sh_y), (sx + 4, sh_y - torso * 0.4), (sx + 2, sh_y - torso * 0.85))]
    elif pose == "wand":
        arm_pts = [((-sx, sh_y), (-sx - 3, sh_y + torso * 0.45), (-sx - 1, sh_y + torso * 0.82)),
                   ((sx, sh_y), (sx + 10, sh_y + 4), (sx + 18, sh_y + torso * 0.2))]
    elif busy:
        hy = sh_y + torso * (0.5 if seated else 0.55)
        if crouch:
            hy = sh_y + torso * 0.85
        if pose == "eat":
            k = (math.sin(t * 2.4) + 1) / 2
            arm_pts = [((-sx, sh_y), (-sx - 2, sh_y + torso * 0.5), (-5, hy)),
                       ((sx, sh_y), (sx + 2, sh_y + torso * 0.4), (lerp(5, 2, k), lerp(hy, top - r * 0.2, k)))]
        else:
            jit = 1.2 * math.sin(t * 12) if pose == "work" else 0.0
            sx_ = 5 * math.sin(t * 3.2) if pose == "pet" else 0.0
            arm_pts = [((-sx, sh_y), (-sx - 2, sh_y + torso * 0.5), (-5, hy + jit)),
                       ((sx, sh_y), (sx + 2, sh_y + torso * 0.5), (5 + sx_, hy - jit + abs(sx_) * 0.3))]
    elif seated:
        arm_pts = [((-sx, sh_y), (-sx - 2, sh_y + torso * 0.5), (-hw * 0.3, sh_y + torso * 0.92)),
                   ((sx, sh_y), (sx + 2, sh_y + torso * 0.5), (hw * 0.3, sh_y + torso * 0.92))]
    else:
        arm_pts = [((-sx, sh_y), (-sx - 3, sh_y + torso * 0.45), (-sx - 1, sh_y + torso * 0.85)),
                   ((sx, sh_y), (sx + 3, sh_y + torso * 0.45), (sx + 1, sh_y + torso * 0.85))]
    inward = (busy and not (pose in ("walk", "run"))) or hug or lap
    if back and held is not None:
        held(p, 0.0, 3.0 if seated else sh_y + torso * 0.66)
    if back and inward:
        for a, b, c in arm_pts:
            _arm(p, P, a, b, c, aw, 0.92, show_hand=False)
    # body
    hx, hy = 0.0, top - neck - r * 0.92
    if not back:
        p.save()
        p.translate(hx, hy)
        head_front(p, P, r, part="back")
        p.restore()
    if P.get("outfit") == "hoodie" and not back:
        hood = QColor(P["shirt"]).darker(112)
        p.setPen(pen(_ol(hood).name(), 0.9))
        p.setBrush(hood)
        p.drawEllipse(QPointF(0, top + 1), sw * 0.36, 5)
    _torso_fb(p, P, top, hip + (2 if not seated else 0), sw, hw, back, leg, seated)
    # neck & head
    if back:
        if not inward:
            for a, b, c in arm_pts:
                _arm(p, P, a, b, c, aw)
        p.save()
        p.translate(hx, hy)
        head_back(p, P, r)
        p.restore()
        return
    skin = QColor(P["skin"])
    p.setPen(pen(_ol(skin).name(), 0.9))
    p.setBrush(skin.darker(106))
    p.drawRoundedRect(QRectF(-r * 0.22, top - neck - 2, r * 0.44, neck + 4), 2, 2)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(0, 0, 0, 40))
    p.drawRect(QRectF(-r * 0.22, top - neck - 2, r * 0.44, 2.4))
    if held is not None:
        held(p, 0.0, 3.0 if seated else sh_y + torso * 0.66)
    for a, b, c in arm_pts:
        _arm(p, P, a, b, c, aw)
    if prop and prop not in ("hug", "lap"):
        if pose == "wand":
            draw_prop(p, "wand", arm_pts[1][2][0], arm_pts[1][2][1], t)
        elif busy:
            draw_prop(p, prop, 0, arm_pts[0][2][1] - 2, t, front=True)
        else:
            draw_prop(p, prop, arm_pts[1][2][0], arm_pts[1][2][1], t)
    p.save()
    p.translate(hx, hy)
    if pose == "doze":
        p.rotate(8)
    head_front(p, P, r, "closed" if pose == "doze" else "open", blink, talk, part="front")
    p.restore()


def _draw_side(p, P, pose, t, prop, seat, blink, talk, held=None):
    """Side view facing right; feet (or the seat) at (0, 0)."""
    d = person_dims(P["role"])
    leg, torso, r, lw, aw, sw, hw, neck = (d[k] for k in ("leg", "torso", "r", "lw", "aw", "sw", "hw", "neck"))
    shirt, pants, skin = P["shirt"], P["pants"], P["skin"]
    legc = skin if P.get("outfit") == "dress" else pants
    sc = shoe_color(P)
    ph = t * 7.5
    hip = -leg
    lean = 0.0
    seated = (pose in SEATED_POSES and seat > 0) or pose == "floor"
    hug = prop == "hug" and not seated
    lap = seated and prop in ("lap", "hug")
    if pose in ("crouch", "feed", "pet"):
        hip = -leg * 0.55
        lean = 16 if pose != "pet" else 22
    if seated:
        hip = 0.0
    if pose == "kneel":
        hip = -leg * 0.45
    if pose in ("walk", "run"):
        amp = 0.42 if pose == "walk" else 0.7
        for k in (1, 0):
            a = math.sin(ph + k * math.pi) * amp
            fx, fy = math.sin(a) * leg, -leg + math.cos(a) * leg
            kx = fx * 0.5 + (3 if math.sin(ph + k * math.pi) < 0 else 1)
            ky = hip + leg * 0.5
            col = QColor(legc) if k == 0 else QColor(legc).darker(115)
            _limb(p, (0, hip), (kx, ky), (fx, min(0, fy) - 2), col, lw)
            _shoe(p, fx + 1, min(0, fy) + 1, lw * 1.4, lw * 0.62, sc if k == 0 else QColor(sc).darker(115).name(), False)
    elif seated and pose == "floor":
        for k in (1, 0):
            col = QColor(legc) if k == 0 else QColor(legc).darker(115)
            _limb(p, (0, -2), (leg * 0.35, -1 - k * 2), (leg * 0.62, -2 - k * 2), col, lw)
            _shoe(p, leg * 0.66, -k * 2 + 1, lw * 1.2, lw * 0.62, sc, False)
    elif seated:
        drop = clamp(seat, 6.0, leg * 0.72)
        for k in (1, 0):
            col = QColor(legc) if k == 0 else QColor(legc).darker(115)
            knee = (leg * 0.5, -2)
            _limb(p, (0, 0), (leg * 0.28, -1), knee, col, lw)
            _limb(p, knee, (leg * 0.53, drop * 0.5), (leg * 0.55, drop - 2), col, lw)
            _shoe(p, leg * 0.55 + 1, drop + 1, lw * 1.4, lw * 0.62, sc, False)
    elif pose in ("crouch", "feed", "kneel", "pet"):
        for k in (1, 0):
            col = QColor(legc) if k == 0 else QColor(legc).darker(115)
            _limb(p, (0, hip), (leg * 0.45, hip + 2 - k * 3), (leg * 0.2 - k * 8, -2), col, lw)
            _shoe(p, leg * 0.2 - k * 8 + 1, 1, lw * 1.4, lw * 0.62, sc, False)
    else:
        for k, dx in ((1, -3), (0, 3)):
            col = QColor(legc) if k == 0 else QColor(legc).darker(115)
            _limb(p, (0, hip), (dx * 0.6, hip * 0.5), (dx, -2), col, lw)
            _shoe(p, dx + 1, 1, lw * 1.4, lw * 0.62, sc, False)
    bob = 1.2 * abs(math.sin(ph)) if pose in ("walk", "run") else 0.5 * math.sin(t * 1.6)
    head_x = math.sin(math.radians(lean)) * (torso + r)
    head_y = hip - bob - torso - neck - r * 0.92 + (1 - math.cos(math.radians(lean))) * torso
    p.save()
    p.translate(head_x, head_y)
    if pose == "doze":
        p.rotate(10)
    head_side(p, P, r, part="back")
    p.restore()
    p.save()
    p.translate(0, hip - bob)
    p.rotate(lean)
    top = -torso
    tw = sw * 0.66
    sh = (tw * 0.12, top + 6)
    # back arm
    if pose in ("walk", "run"):
        a = -math.sin(ph) * (0.6 if pose == "walk" else 0.9)
        hand = (sh[0] + math.sin(a) * torso * 0.75, sh[1] + math.cos(a) * torso * 0.75)
        _arm(p, P, sh, (sh[0] + math.sin(a) * torso * 0.35 - 1, sh[1] + torso * 0.38), hand, aw, 0.88)
    elif pose in ("cook", "work", "eat"):
        _arm(p, P, sh, (sh[0] + torso * 0.35, sh[1] + torso * 0.4), (sh[0] + torso * 0.72, sh[1] + torso * 0.42), aw, 0.88)
    elif hug:
        _arm(p, P, sh, (sh[0] + torso * 0.25, sh[1] + torso * 0.58), (sh[0] + torso * 0.62, sh[1] + torso * 0.46), aw, 0.88)
    # torso (+ skirt)
    _side_torso(p, P, top, torso, tw, seated, leg)
    if held is not None:
        if seated:
            held(p, leg * 0.3, bob)
        else:
            held(p, tw * 0.42, top + torso * 0.66)
    # front arm & prop
    hx, hy = sh[0] + 2, sh[1] + torso * 0.72
    el = None
    if hug:
        hx, hy = sh[0] + torso * 0.66, sh[1] + torso * 0.5
        el = (sh[0] + torso * 0.2, sh[1] + torso * 0.64)
    elif lap:
        s_ = math.sin(t * 2.6)
        hx, hy = sh[0] + torso * (0.62 + 0.18 * s_), sh[1] + torso * 0.86 - 2 * abs(s_)
    elif pose == "pet":
        s_ = math.sin(t * 3.2)
        hx, hy = sh[0] + torso * (0.86 + 0.22 * s_), sh[1] + torso * 0.98 - 2.5 * abs(math.cos(t * 3.2))
    elif pose in ("walk", "run"):
        a = math.sin(ph) * (0.6 if pose == "walk" else 0.9)
        hx, hy = sh[0] + math.sin(a) * torso * 0.75, sh[1] + math.cos(a) * torso * 0.75
    elif pose in ("crouch", "feed"):
        hx, hy = sh[0] + torso * 0.85, sh[1] + torso * 0.85
    elif pose in ("reach", "stretch", "heart"):
        hx, hy = sh[0] + torso * 0.35, sh[1] - torso * 0.8
    elif pose == "clap":
        k = abs(math.sin(t * 9))
        hx, hy = sh[0] + torso * (0.55 + 0.12 * k), sh[1] + torso * 0.25
    elif pose == "dance":
        k = math.sin(t * 6)
        hx, hy = sh[0] + torso * 0.3, sh[1] - torso * 0.6 * k
    elif pose == "wave":
        hx, hy = sh[0] + torso * 0.35 + 5 * math.sin(t * 9), sh[1] - torso * 0.75
    elif pose in ("cook", "work", "eat"):
        hx, hy = sh[0] + torso * 0.8, sh[1] + torso * 0.35
        if pose == "eat":
            k = (math.sin(t * 2.4) + 1) / 2
            hx, hy = lerp(hx, sh[0] + torso * 0.45, k), lerp(hy, sh[1] - torso * 0.15, k)
        if pose == "work":
            hy += 1.5 * math.sin(t * 12)
    elif pose == "wand":
        hx, hy = sh[0] + torso * 0.7, sh[1] + torso * 0.1
    elif pose in ("sit", "doze", "toilet") or pose == "floor":
        hx, hy = sh[0] + torso * 0.55, sh[1] + torso * 0.62
    if el is None:
        el = ((sh[0] + hx) / 2 - 2, (sh[1] + hy) / 2 + 3)
    _arm(p, P, sh, el, (hx, hy), aw)
    if prop and prop not in ("hug", "lap"):
        draw_prop(p, prop, hx, hy, t)
    p.restore()
    sk_c = QColor(skin)
    p.setPen(pen(_ol(sk_c).name(), 0.9))
    p.setBrush(sk_c.darker(106))
    p.drawRoundedRect(QRectF(head_x - r * 0.2, hip - bob - torso - neck - 2, r * 0.4, neck + 4), 2, 2)
    p.save()
    p.translate(head_x, head_y)
    if pose == "doze":
        p.rotate(10)
    head_side(p, P, r, "closed" if pose == "doze" else "open", blink, talk, part="front")
    p.restore()


def _side_torso(p, P, top, torso, tw, seated, leg):
    shirt, pants = P["shirt"], P["pants"]
    outfit = P.get("outfit", "shirt")
    shirt_c = QColor(shirt)
    if outfit == "dress":
        fl = 7 if not seated else 3
        sk = QPainterPath(QPointF(-tw / 2, top + torso * 0.7))
        sk.lineTo(tw / 2, top + torso * 0.7)
        sk.lineTo(tw / 2 + fl + (leg * 0.25 if seated else 0), 2 + (leg * 0.45 if not seated else 6))
        sk.lineTo(-tw / 2 - fl, 2 + (leg * 0.45 if not seated else 6))
        sk.closeSubpath()
        p.setPen(pen(_ol(shirt_c).name(), 1.0))
        p.setBrush(_cloth_brush(shirt, -tw, tw))
        p.drawPath(sk)
    if outfit == "hoodie":
        p.setPen(pen(_ol(shirt_c).name(), 0.9))
        p.setBrush(shirt_c.darker(110))
        p.drawEllipse(QPointF(-tw * 0.42, top + 3), tw * 0.32, 5.5)
    body = QPainterPath()
    body.addRoundedRect(QRectF(-tw / 2, top, tw, torso + 2), 8, 8)
    p.setPen(pen(_ol(shirt_c).name(), 1.0))
    p.setBrush(_cloth_brush(shirt, -tw / 2, tw / 2))
    p.drawPath(body)
    p.save()
    p.setClipPath(body)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(0, 0, 0, 30))
    p.drawEllipse(QPointF(tw * 0.1, top - 1), tw * 0.42, 5.0)
    p.drawRect(QRectF(-tw / 2, top, tw * 0.18, torso + 2))
    if outfit == "stripes":
        p.setPen(QPen(QColor(255, 255, 255, 190), 2.4))
        y = top + 5
        while y < 2:
            p.drawLine(QPointF(-tw, y), QPointF(tw, y))
            y += 6
    elif outfit == "overalls":
        pc = QColor(pants)
        p.setPen(pen(_ol(pc).name(), 1.0))
        p.setBrush(pc)
        p.drawRect(QRectF(-tw, top + torso * 0.42, tw * 2, torso))
        p.setPen(QPen(pc, 2.4))
        p.drawLine(QPointF(tw * 0.1, top), QPointF(tw * 0.25, top + torso * 0.45))
    elif outfit == "suit":
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#ffffff"))
        p.drawPolygon(poly((tw * 0.2, top), (tw * 0.5, top), (tw * 0.5, top + torso * 0.35)))
        p.setBrush(QColor("#c0392b"))
        p.drawPolygon(poly((tw * 0.42, top + 2), (tw * 0.52, top + 2), (tw * 0.52, top + torso * 0.62),
                           (tw * 0.4, top + torso * 0.55)))
    elif outfit == "hoodie":
        p.setPen(pen(_ol(shirt_c).name(), 0.9))
        p.setBrush(shirt_c.darker(108))
        p.drawRoundedRect(QRectF(tw * 0.05, top + torso * 0.62, tw * 0.45, torso * 0.24), 3, 3)
    p.restore()


RIG_DEFAULT = dict(lean=0.0, fl=(4.0, 0.0), bl=(-4.0, 0.0), fa=(10.0, 20.0), ba=(-8.0, 15.0), head=0.0, hipx=0.0,
                   grounded=True, eyes="open", talk=False, prop=None, lift=0.0)


def _draw_side_rig(p, P, rig, t, blink):
    """Side view facing right, driven by joint angles (the fighting games): legs and arms as
    (upper angle from straight down, + forward; joint bend) in degrees, a torso lean, a head tilt."""
    R = dict(RIG_DEFAULT)
    R.update(rig)
    d = person_dims(P["role"])
    leg, torso, r, lw, aw, sw, neck = (d[k] for k in ("leg", "torso", "r", "lw", "aw", "sw", "neck"))
    shirt, pants, skin = P["shirt"], P["pants"], P["skin"]
    legc = skin if P.get("outfit") == "dress" else pants
    sc = shoe_color(P)
    L1, L2 = leg * 0.52, leg * 0.5

    def leg_pts(a1, a2, hip):
        r1, r2 = math.radians(a1), math.radians(a1 + a2)
        knee = (hip[0] + L1 * math.sin(r1), hip[1] + L1 * math.cos(r1))
        foot = (knee[0] + L2 * math.sin(r2), knee[1] + L2 * math.cos(r2))
        return knee, foot

    hip0 = (R["hipx"], 0.0)
    kf, ff = leg_pts(R["fl"][0], R["fl"][1], hip0)
    kb, fb = leg_pts(R["bl"][0], R["bl"][1], hip0)
    if R["grounded"]:
        hy = -max(ff[1], fb[1])                 # the lower foot on the ground
    else:
        hy = -leg - R["lift"]
    hip = (R["hipx"], hy)
    kf, ff = leg_pts(R["fl"][0], R["fl"][1], hip)
    kb, fb = leg_pts(R["bl"][0], R["bl"][1], hip)
    # back leg, back arm, torso, front leg, head, front arm
    col_b = QColor(legc).darker(115)
    _limb(p, hip, kb, (fb[0], fb[1] - 2), col_b, lw)
    _shoe(p, fb[0] + 1, fb[1] + 1, lw * 1.4, lw * 0.62, QColor(sc).darker(115).name(), False)
    lean = R["lean"]
    lr = math.radians(lean)
    top = -torso
    tw = sw * 0.66
    sh = (tw * 0.12, top + 6)
    U, F = torso * 0.42, torso * 0.4

    def arm_pts(s1, s2):
        r1, r2 = math.radians(s1), math.radians(s1 + s2)
        el = (sh[0] + U * math.sin(r1), sh[1] + U * math.cos(r1))
        hd = (el[0] + F * math.sin(r2), el[1] + F * math.cos(r2))
        return el, hd

    # head position: the neck top rotated with the torso
    ny = -torso - neck - r * 0.92
    head_x = hip[0] + math.sin(lr) * (-ny)
    head_y = hip[1] + math.cos(lr) * ny
    p.save()
    p.translate(head_x, head_y)
    p.rotate(R["head"])
    head_side(p, P, r, part="back")
    p.restore()
    p.save()
    p.translate(*hip)
    p.rotate(lean)
    el, hd = arm_pts(*R["ba"])
    _arm(p, P, sh, el, hd, aw, 0.88)
    if R.get("prop2"):
        draw_prop(p, R["prop2"], hd[0], hd[1], t)
    _side_torso(p, P, top, torso, tw, False, leg)
    p.restore()
    col_f = QColor(legc)
    _limb(p, hip, kf, (ff[0], ff[1] - 2), col_f, lw)
    _shoe(p, ff[0] + 1, ff[1] + 1, lw * 1.4, lw * 0.62, sc, False)
    sk_c = QColor(skin)
    p.save()
    p.translate(*hip)
    p.rotate(lean)
    p.setPen(pen(_ol(sk_c).name(), 0.9))
    p.setBrush(sk_c.darker(106))
    p.drawRoundedRect(QRectF(-r * 0.2, -torso - neck - 2, r * 0.4, neck + 4), 2, 2)
    p.restore()
    p.save()
    p.translate(head_x, head_y)
    p.rotate(R["head"])
    head_side(p, P, r, R["eyes"], blink and R["eyes"] == "open", R["talk"], part="front")
    p.restore()
    p.save()
    p.translate(*hip)
    p.rotate(lean)
    el, hd = arm_pts(*R["fa"])
    _arm(p, P, sh, el, hd, aw)
    if R.get("prop"):
        draw_prop(p, R["prop"], hd[0], hd[1], t)
    p.restore()


def draw_person(p, P, pose, t, front=False, prop=None, seat=0.0, blink=False, back=False, view=None, talk=False,
                held=None, rig=None):
    """Person with feet (or seat) at (0, 0). view: front / back / side (side faces right)."""
    if view is None:
        view = "front" if front else ("back" if back else "side")
    hs = float(P.get("height", 1.0) or 1.0)
    p.save()
    if abs(hs - 1.0) > 1e-3:
        p.scale(hs, hs)
        seat = seat / hs
    if pose == "sleep":
        _draw_sleep_lump(p, P)
    elif rig is not None and view == "side":
        _draw_side_rig(p, P, rig, t, blink)
    elif view == "side":
        _draw_side(p, P, pose, t, prop, seat, blink, talk, held)
    else:
        _draw_fb(p, P, pose, t, view == "back", prop, seat, blink, talk, held)
    p.restore()


def _draw_sleep_lump(p, P):
    d = person_dims(P["role"])
    r = d["r"]
    p.setPen(pen(OUT, 1.2, 200))
    p.setBrush(QColor(P.get("_blanket", "#e7a5a0")))
    p.drawRoundedRect(QRectF(-r * 0.6, -r * 1.1, d["leg"] + d["torso"] + 6, r * 1.4), r * 0.6, r * 0.6)
    p.save()
    p.translate(-r * 0.9, -r * 0.75)
    p.rotate(-70)
    head_front(p, dict(P, acc="none"), r * 0.95, "closed")
    p.restore()


def person_preview(P, size=56):
    """Small standing portrait (front view) for the settings page."""
    pm = QPixmap(size, size)
    pm.fill(Qt.transparent)
    p = QPainter(pm)
    p.setRenderHint(QPainter.Antialiasing)
    k = size / 128.0
    p.translate(size / 2, size - 3)
    p.scale(k, k)
    _draw_fb(p, P, "stand", 0.0, False, None, 0.0, False, False)
    p.end()
    return pm


def wand_tip(t, hx, hy):
    """Feather end of the wand relative to the hand."""
    return hx + 34 + 10 * math.sin(t * 3.1), hy + 22 + 14 * math.sin(t * 4.7 + 1)


def draw_prop(p, prop, x, y, t, front=False):
    if prop == "book":
        if front:
            p.setPen(pen("#9c3f32", 1.0))
            p.setBrush(QColor("#e46f5b"))
            p.drawRoundedRect(QRectF(x - 10, y - 8, 20, 13), 1.5, 1.5)
            p.setPen(QPen(QColor("#f6e3b5"), 1.4))
            p.drawLine(QPointF(x - 6, y - 4), QPointF(x + 6, y - 4))
            p.setPen(QPen(QColor(0, 0, 0, 60), 1))
            p.drawLine(QPointF(x, y - 8), QPointF(x, y + 5))
        else:
            p.setPen(pen("#9c3f32", 1.0))
            p.setBrush(QColor("#e46f5b"))
            p.drawRect(QRectF(x - 9, y - 7, 18, 12))
            p.setBrush(QColor("#fff7e8"))
            p.drawRect(QRectF(x - 8, y - 6, 7.5, 10))
            p.drawRect(QRectF(x + 0.5, y - 6, 7.5, 10))
    elif prop == "laptop":
        p.setPen(pen("#7d8090", 1.0))
        p.setBrush(QColor("#c9ccd6"))
        if front:
            p.drawRoundedRect(QRectF(x - 14, y - 14, 28, 17), 2, 2)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#ffffff"))
            p.drawEllipse(QPointF(x, y - 6), 2.4, 2.4)
            p.setBrush(QColor("#9ea2b0"))
            p.drawRect(QRectF(x - 16, y + 2, 32, 3))
        else:
            p.drawRoundedRect(QRectF(x - 13, y - 13, 26, 16), 2, 2)
            p.setBrush(QColor("#ffffff"))
            p.drawEllipse(QPointF(x, y - 5), 2.2, 2.2)
    elif prop == "phone":
        p.setPen(pen("#111", 1.0))
        p.setBrush(QColor("#2d2d36"))
        p.drawRoundedRect(QRectF(x - 4, y - 8, 8, 13), 1.5, 1.5)
        if front:
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#7cc3f0"))
            p.drawRoundedRect(QRectF(x - 3, y - 7, 6, 10), 1, 1)
    elif prop == "toy":
        p.setPen(pen("#8a6a40", 1.0))
        p.setBrush(QColor("#c99b6a"))
        p.drawEllipse(QPointF(x, y - 2), 7, 8)
        p.drawEllipse(QPointF(x - 5, y - 9), 3, 3)
        p.drawEllipse(QPointF(x + 5, y - 9), 3, 3)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#f1e2c8"))
        p.drawEllipse(QPointF(x, y), 3.4, 2.6)
        p.setBrush(QColor("#2b211c"))
        p.drawEllipse(QPointF(x - 2, y - 4), 1, 1)
        p.drawEllipse(QPointF(x + 2, y - 4), 1, 1)
    elif prop == "ball":
        p.setPen(pen("#9c4a3a", 1.0))
        p.setBrush(QColor("#e46f5b"))
        p.drawEllipse(QPointF(x + 4, y), 6, 6)
        p.setPen(QPen(QColor("#ffffff"), 1.4))
        p.drawArc(QRectF(x - 2, y - 6, 12, 12), 30 * 16, 120 * 16)
    elif prop == "pan":
        p.setPen(pen("#222", 1.1))
        p.setBrush(QColor("#3a3a44"))
        if front:
            p.drawEllipse(QRectF(x - 11, y - 4, 22, 8))
            p.drawLine(QPointF(x + 10, y), QPointF(x + 20, y + 3))
        else:
            p.drawLine(QPointF(x, y), QPointF(x + 10, y + 1))
            p.drawEllipse(QRectF(x + 10, y - 3, 18, 7))
    elif prop == "can":
        p.setPen(pen("#4a7a44", 1.1))
        p.setBrush(QColor("#7bbf6a"))
        p.drawRoundedRect(QRectF(x - 2, y - 8, 12, 12), 2, 2)
        p.drawLine(QPointF(x + 10, y - 6), QPointF(x + 18, y + 2))
        p.setPen(QPen(QColor(110, 180, 240, 200), 1.2))
        for i in range(3):
            k = (t * 2 + i / 3) % 1
            p.drawPoint(QPointF(x + 19 + i, y + 3 + 12 * k))
    elif prop == "stick":
        # a squeeze-tube treat (猫条) held out, the open end towards the cat
        p.save()
        p.translate(x, y)
        p.rotate(-12)
        p.setPen(pen("#b84a6a", 0.9))
        p.setBrush(QColor("#ff9ab8"))
        p.drawRoundedRect(QRectF(-2, -2.6, 16, 5.2), 2, 2)
        p.setBrush(QColor("#ffe082"))
        p.drawRect(QRectF(3, -2.6, 4, 5.2))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#e8b27a"))
        p.drawEllipse(QPointF(15.5, 0), 2.2, 1.8)
        p.restore()
    elif prop == "dish":
        p.setPen(pen("#b9b2a6", 1.0))
        p.setBrush(QColor("#ffffff"))
        p.drawEllipse(QPointF(x + 2, y - 2), 9, 3.4)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#e8743b"))
        p.drawEllipse(QPointF(x + 2, y - 3.5), 5.5, 2.4)
        p.setBrush(QColor("#7bbf6a"))
        p.drawEllipse(QPointF(x, y - 4.5), 1.4, 0.9)
        p.setPen(QPen(QColor(255, 255, 255, 140), 0.9))
        p.setBrush(Qt.NoBrush)
        for i in range(2):
            k = (t * 0.6 + i / 2) % 1.0
            p.drawLine(QPointF(x + i * 3, y - 6 - k * 6), QPointF(x + 1 + i * 3, y - 9 - k * 6))
    elif prop == "plates":
        p.setPen(pen("#b9b2a6", 1.0))
        p.setBrush(QColor("#f4f1ea"))
        for k in range(3):
            p.drawEllipse(QPointF(x + 2, y - 2 - k * 1.6), 8, 3)
    elif prop == "scoop":
        p.setPen(pen("#5f8f86", 1.0))
        p.setBrush(QColor("#f2c94c"))
        p.drawRoundedRect(QRectF(x + 2, y - 2, 9, 6), 2, 2)
        p.setPen(pen("#d4a92e", 2.0))
        p.drawLine(QPointF(x, y), QPointF(x + 4, y + 1))
    elif prop == "food":
        p.setPen(pen("#b08a2a", 1.1))
        p.setBrush(QColor("#f2c94c"))
        p.drawRoundedRect(QRectF(x - 3, y - 12, 14, 18), 2, 2)
        p.setPen(pen("#c9a43c", 1))
        p.drawLine(QPointF(x, y - 6), QPointF(x + 8, y - 6))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#e46f5b"))
        p.drawEllipse(QPointF(x + 4, y - 1), 2.2, 2.2)
    elif prop == "pencil":
        p.setPen(pen("#c9a43c", 2.2))
        p.drawLine(QPointF(x - 3, y + 2), QPointF(x + 6, y - 7))
        if front:
            p.setPen(pen("#9a8a7a", 0.8))
            p.setBrush(QColor("#ffffff"))
            p.drawRect(QRectF(x - 12, y + 1, 18, 7))
    elif prop == "coat":
        p.setPen(pen("#8a6a40", 1.1))
        p.setBrush(QColor("#c99b6a"))
        p.drawPolygon(poly((x - 4, y - 4), (x + 8, y), (x + 10, y + 34), (x - 6, y + 34)))
    elif prop == "pillow":
        p.save()
        p.translate(x + 6, y - 8)
        p.rotate(-30)
        p.setPen(pen("#b9a98f", 1.0))
        p.setBrush(QColor("#fbf8f1"))
        path = QPainterPath(QPointF(-11, -7))
        path.quadTo(QPointF(0, -4), QPointF(11, -7))
        path.quadTo(QPointF(8, 0), QPointF(11, 7))
        path.quadTo(QPointF(0, 4), QPointF(-11, 7))
        path.quadTo(QPointF(-8, 0), QPointF(-11, -7))
        p.drawPath(path)
        p.restore()
    elif prop == "yarn":
        p.setPen(pen("#b8455f", 1.0))
        p.setBrush(QColor("#ef7f9f"))
        p.drawEllipse(QPointF(x + 3, y - 3), 6, 6)
    elif prop == "wand":
        p.setPen(pen("#8a5c3d", 1.8))
        p.drawLine(QPointF(x, y), QPointF(x + 30, y - 18))
        tx, ty = wand_tip(t, x, y)
        p.setPen(pen("#666", 0.8))
        path = QPainterPath(QPointF(x + 30, y - 18))
        path.quadTo(QPointF(x + 36, (y - 18 + ty) / 2), QPointF(tx, ty))
        p.setBrush(Qt.NoBrush)
        p.drawPath(path)
        p.setPen(pen("#c74a6b", 1))
        p.setBrush(QColor("#ff9cc0"))
        p.drawEllipse(QPointF(tx, ty), 4, 2.6)
        p.setBrush(QColor("#7fd0f0"))
        p.drawEllipse(QPointF(tx + 3, ty + 2), 3.4, 2)


def _bubble_lines(text, fm, max_w):
    lines, cur = [], ""
    for ch in text:
        if fm.horizontalAdvance(cur + ch) > max_w and cur:
            lines.append(cur)
            cur = ch
        else:
            cur += ch
    if cur:
        lines.append(cur)
    return lines[:3] or [""]


def bubble_rect(text, x, y, font, max_w=150):
    """Where draw_bubble would put the bubble body (without lift)."""
    fm = QFontMetricsF(font)
    lines = _bubble_lines(text, fm, max_w)
    tw = max(fm.horizontalAdvance(s) for s in lines)
    w, h = tw + 16, fm.height() * len(lines) + 8
    return QRectF(x - w / 2, y - 8 - h, w, h)


def draw_bubble(p, text, x, y, font, alpha=1.0, style=None, max_w=150, lift=0.0, shift=0.0):
    """Small speech bubble whose tail points at (x, y); lift / shift move the body (to clear other bubbles)."""
    style = style or {"bg": "#fffaf3", "border": "#d9b99b", "text": "#4a3b36"}
    fm = QFontMetricsF(font)
    lines = _bubble_lines(text, fm, max_w)
    r = bubble_rect(text, x, y, font, max_w).translated(shift, -lift)
    h = r.height()
    p.save()
    p.setOpacity(alpha)
    p.setPen(QPen(QColor(style["border"]), 1.1))
    p.setBrush(QColor(style["bg"]))
    path = QPainterPath()
    path.addRoundedRect(r, min(10, h / 2), min(10, h / 2))
    tw = 5 if lift < 8 else 3.5
    bx = clamp(x, r.left() + 10, r.right() - 10)
    tail = QPainterPath(QPointF(bx - tw, r.bottom() - 1))
    tail.lineTo(x, y - 1)
    tail.lineTo(bx + tw, r.bottom() - 1)
    tail.closeSubpath()
    p.drawPath(path.united(tail))
    p.setFont(font)
    p.setPen(QColor(style["text"]))
    p.drawText(r, Qt.AlignCenter, "\n".join(lines))
    p.restore()
    return r


def now_hour():
    lt = time.localtime()
    return lt.tm_hour + lt.tm_min / 60.0 + lt.tm_sec / 3600.0


def draw_sleeper(p, P, hx, hy, bx, by, blanket):
    """Someone asleep in bed: the head on the pillow at (hx, hy), the quilt over the body towards (bx, by)."""
    if P.get("acc") in ("hat", "headphones", "glasses"):
        P = dict(P, acc="none")
    d = person_dims(P["role"])
    r = d["r"] * 0.95
    ang = math.degrees(math.atan2(by - hy, bx - hx))
    length = math.hypot(bx - hx, by - hy)
    bl = QColor(blanket)
    p.save()
    p.translate((hx + bx) / 2, (hy + by) / 2)
    p.rotate(ang)
    p.setPen(pen(bl.darker(140).name(), 1.1, 220))
    g = QLinearGradient(0, -r, 0, r)
    g.setColorAt(0, bl.lighter(112))
    g.setColorAt(1, bl.darker(108))
    p.setBrush(g)
    p.drawRoundedRect(QRectF(-length / 2 + r * 0.2, -r * 0.85, length + 4, r * 1.6), r * 0.7, r * 0.7)
    p.setPen(QPen(QColor(255, 255, 255, 120), 1.2))
    p.drawLine(QPointF(-length / 2 + r * 1.2, -r * 0.3), QPointF(length / 2 - 4, -r * 0.4))
    p.setPen(pen(bl.darker(130).name(), 1.0, 200))
    p.setBrush(bl.lighter(125))
    p.drawRoundedRect(QRectF(-length / 2 + r * 0.6, -r * 0.9, r * 1.0, r * 1.7), r * 0.4, r * 0.4)
    p.restore()
    p.save()
    p.translate(hx, hy - r * 0.35)
    p.rotate(-14 if bx > hx else (14 if bx < hx else 0))
    head_front(p, P, r, "closed")
    p.restore()


# ================================================================================== the garden (户外)
SEASON_OVERRIDE = None


def season(day=None):
    """spring / summer / autumn / winter for the date (northern hemisphere)."""
    if SEASON_OVERRIDE:
        return SEASON_OVERRIDE
    import datetime
    m = (day or datetime.date.today()).month
    return {12: "winter", 1: "winter", 2: "winter", 3: "spring", 4: "spring", 5: "spring",
            6: "summer", 7: "summer", 8: "summer"}.get(m, "autumn")


CANOPY = {"spring": ("#8fd07a", "#5c9e55", "#3f6e3c"), "summer": ("#6fb35f", "#3f7d3d", "#2f5e2e"),
          "autumn": ("#f2b04a", "#d0612e", "#8a3f22"), "winter": None}


def _canopy(p, sx, sy, it, t):
    sw = 1.5 * math.sin(t * 0.7 + it.x)
    se = season()
    blobs = [(-32, -16, 30), (30, -20, 32), (0, -42, 38), (-22, -56, 28), (22, -60, 28), (0, -12, 30), (2, -76, 24)]
    if se == "winter":
        # bare branches
        p.setPen(QPen(QColor("#7a5035"), 3.0, Qt.SolidLine, Qt.RoundCap))
        for dx, dy, r in blobs:
            p.drawLine(QPointF(sx, sy - 6), QPointF(sx + dx * 0.9 + sw, sy + dy * 0.9))
        p.setPen(QPen(QColor("#7a5035"), 1.4, Qt.SolidLine, Qt.RoundCap))
        for dx, dy, r in blobs:
            ex, ey = sx + dx * 0.9 + sw, sy + dy * 0.9
            for k in (-1, 1):
                p.drawLine(QPointF(ex, ey), QPointF(ex + k * r * 0.35, ey - r * 0.4))
        return
    hi, lo, ol = CANOPY[se]
    rnd = random.Random(int(it.x * 7 + it.y))
    for i, (dx, dy, r) in enumerate(blobs):
        p.setPen(pen(ol, 1.1, 220))
        g = QRadialGradient(QPointF(sx + dx - r * 0.3 + sw, sy + dy - r * 0.4), r * 1.4)
        if se == "autumn":
            c1 = ("#f6c453", "#f29a3e", "#e8743b")[i % 3]
            c2 = ("#d98a2b", "#c9542a", "#b2402a")[i % 3]
            g.setColorAt(0, QColor(c1))
            g.setColorAt(1, QColor(c2))
        else:
            g.setColorAt(0, QColor(hi))
            g.setColorAt(1, QColor(lo))
        p.setBrush(g)
        p.drawEllipse(QPointF(sx + dx + sw, sy + dy), r, r * 0.86)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 255, 255, 40))
    for dx, dy, r in blobs[:4]:
        p.drawEllipse(QPointF(sx + dx - r * 0.3 + sw, sy + dy - r * 0.35), r * 0.45, r * 0.3)
    if se == "spring":
        for _ in range(26):
            dx, dy, r = rnd.choice(blobs)
            a = rnd.uniform(0, math.tau)
            k = rnd.uniform(0, 0.85)
            x, y = sx + dx + sw + math.cos(a) * r * k, sy + dy + math.sin(a) * r * 0.86 * k
            p.setBrush(QColor("#ffd1df"))
            p.drawEllipse(QPointF(x, y), 2.6, 2.6)
            p.setBrush(QColor("#f590b0"))
            p.drawEllipse(QPointF(x, y), 0.9, 0.9)
        return
    if se == "summer":
        for dx, dy in ((-24, -22), (30, -32), (6, -56), (-8, -4), (18, -10)):
            p.setPen(pen("#9c3a2e", 0.8))
            p.setBrush(QColor("#e4574a"))
            p.drawEllipse(QPointF(sx + dx + sw, sy + dy), 3.4, 3.4)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(255, 255, 255, 150))
            p.drawEllipse(QPointF(sx + dx + sw - 1, sy + dy - 1), 1, 1)


def _flowers_row(p, sx, sy, it, t):
    cols = ["#ef6f8f", "#f2c94c", "#b48ae0", "#ffffff", "#ef9a74"]
    horiz = it.rot % 2 == 0
    for i in range(9):
        a = i - 4
        x = sx + (a * 9 if horiz else (i % 2) * 6 - 3)
        y = sy - 3 + (((i % 2) * 3) if horiz else a * 9 * KY * 0.9)
        sway = 1.2 * math.sin(t * 1.5 + i)
        p.setPen(pen("#3f7a46", 1.0, 220))
        p.drawLine(QPointF(x, y + 6), QPointF(x + sway, y))
        p.setBrush(QColor("#6fb35f"))
        p.drawEllipse(QPointF(x + 3, y + 4), 3, 1.6)
        c = QColor(cols[i % len(cols)])
        p.setPen(pen(c.darker(140).name(), 0.7))
        p.setBrush(c)
        for k in range(5):
            ang = k * math.tau / 5
            p.drawEllipse(QPointF(x + sway + math.cos(ang) * 2.4, y - 1 + math.sin(ang) * 2.2), 2, 2)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#f6d35a"))
        p.drawEllipse(QPointF(x + sway, y - 1), 1.3, 1.3)


def _swing_seat(p, sx, sy, it, t):
    amp = it.state.get("swing", 0.0)
    a = math.radians(24 * amp * math.sin(t * 2.4))
    L = 64
    bx, by = sx + math.sin(a) * L, sy + math.cos(a) * L
    p.setPen(pen("#6b5a4e", 1.3))
    p.drawLine(QPointF(sx - 12, sy), QPointF(bx - 12, by))
    p.drawLine(QPointF(sx + 12, sy), QPointF(bx + 12, by))
    p.setPen(pen("#9c3a2e", 1.0))
    p.setBrush(QColor("#e46f5b"))
    p.drawRoundedRect(QRectF(bx - 16, by - 3, 32, 7), 2.5, 2.5)
    p.setPen(QPen(QColor(255, 255, 255, 110), 1))
    p.drawLine(QPointF(bx - 13, by - 1.5), QPointF(bx + 13, by - 1.5))


def _bucket(p, sx, sy, it, t):
    p.setPen(pen("#2f5f8f", 1.0))
    p.setBrush(QColor("#5e9bd6"))
    p.drawPolygon(poly((sx - 6, sy - 10), (sx + 6, sy - 10), (sx + 4, sy), (sx - 4, sy)))
    p.setBrush(Qt.NoBrush)
    p.drawArc(QRectF(sx - 6, sy - 15, 12, 10), 0, 180 * 16)
    p.setPen(pen("#b08a2a", 1.0))
    p.setBrush(QColor("#f2c94c"))
    p.drawEllipse(QPointF(sx + 16, sy - 2), 5, 2.6)
    p.drawLine(QPointF(sx + 16, sy - 2), QPointF(sx + 22, sy - 10))


def _feeder_roof(p, sx, sy, it, t):
    p.setPen(pen("#7a3a22", 1.1))
    p.setBrush(QColor("#c26a45"))
    p.drawPolygon(poly((sx - 22, sy), (sx, sy - 18), (sx + 22, sy)))
    p.setPen(QPen(QColor(255, 255, 255, 80), 1.2))
    p.drawLine(QPointF(sx - 18, sy - 2), QPointF(sx - 2, sy - 15))


def _feeder_birds(p, sx, sy, it, t):
    if not it.state.get("birds", True):
        return
    for i, (dx, col) in enumerate(((-8, "#8a6a4a"), (9, "#5e7fae"))):
        hop = abs(math.sin(t * 3 + i * 2)) * 3
        x, y = sx + dx, sy - 4 - hop
        p.setPen(pen(OUT, 0.8))
        p.setBrush(QColor(col))
        p.drawEllipse(QPointF(x, y), 4.6, 3.6)
        p.drawEllipse(QPointF(x + (3 if i else -3), y - 3), 2.6, 2.6)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#f2c94c"))
        d = 1 if i else -1
        p.drawPolygon(poly((x + d * 5, y - 3.5), (x + d * 7.5, y - 3), (x + d * 5, y - 2)))


def _pond_stones(p, sx, sy, it, t):
    for a in range(0, 360, 24):
        r = math.radians(a)
        x = sx + math.cos(r) * 78
        y = sy + math.sin(r) * 54 * KY
        p.setPen(pen("#7d7468", 0.9))
        g = QRadialGradient(QPointF(x - 2, y - 2), 9)
        g.setColorAt(0, QColor("#e2dbcf"))
        g.setColorAt(1, QColor("#b9b0a2"))
        p.setBrush(g)
        p.drawEllipse(QPointF(x, y), 8 + (a % 3), 4.5)
    p.setPen(pen("#3f7a46", 1.0))
    p.setBrush(QColor("#6fb35f"))
    for dx, dy in ((-30, -4), (24, 6), (8, -9)):
        p.drawEllipse(QPointF(sx + dx, sy + dy), 9, 3.6)
    p.setBrush(QColor("#f39ab3"))
    p.drawEllipse(QPointF(sx - 30, sy - 6), 2.6, 2.2)


def _koi(p, sx, sy, it, t):
    p.setPen(Qt.NoPen)
    for i, col in enumerate(("#f39c4b", "#ffffff", "#ef5d7d")):
        a = t * (0.35 + 0.1 * i) + i * 2.1
        x = sx + math.cos(a) * (46 - i * 9)
        y = sy + math.sin(a) * (13 - i * 2)
        d = -math.sin(a)
        p.setBrush(QColor(col))
        p.drawEllipse(QPointF(x, y), 6, 3)
        p.drawPolygon(poly((x - (6 if d > 0 else -6), y), (x - (11 if d > 0 else -11), y - 3),
                           (x - (11 if d > 0 else -11), y + 3)))
    p.setBrush(QColor(255, 255, 255, 90))
    k = (t * 0.4) % 1.0
    p.setPen(QPen(QColor(255, 255, 255, int(150 * (1 - k))), 1))
    p.setBrush(Qt.NoBrush)
    p.drawEllipse(QPointF(sx + 20, sy - 4), 10 * k + 2, 4 * k + 1)


def _smoke(p, sx, sy, it, t):
    if not it.state.get("on"):
        return
    p.setPen(Qt.NoPen)
    for i in range(4):
        k = (t * 0.5 + i / 4.0) % 1.0
        p.setBrush(QColor(220, 220, 220, int(150 * (1 - k))))
        p.drawEllipse(QPointF(sx + 8 * math.sin(t + i * 2) + 10 * k, sy - 8 - 40 * k), 4 + 6 * k, 3 + 5 * k)
    p.setBrush(QColor(255, 140, 60, 170))
    p.drawEllipse(QPointF(sx, sy + 2), 12, 3)


def _laundry(p, sx, sy, it, t):
    sw = math.sin(t * 1.6) * 2
    items = [(-38, "#ffffff", "shirt"), (-13, "#5e9bd6", "towel"), (12, "#f2c94c", "shirt"), (36, "#ef8f80", "sock")]
    horiz = it.rot % 2 == 0
    for dx, col, kind in items:
        x = sx + (dx if horiz else 0)
        y = sy - (0 if horiz else dx * KY)
        c = QColor(col)
        p.setPen(pen(c.darker(150).name(), 0.9))
        p.setBrush(c)
        p.save()
        p.translate(x, y)
        p.rotate(sw)
        if kind == "shirt":
            p.drawPolygon(poly((-8, 0), (8, 0), (12, 5), (8, 7), (7, 21), (-7, 21), (-8, 7), (-12, 5)))
        elif kind == "towel":
            p.drawRect(QRectF(-7, 0, 14, 22))
            p.setPen(QPen(QColor(255, 255, 255, 180), 1.4))
            p.drawLine(QPointF(-7, 17), QPointF(7, 17))
        else:
            p.drawPolygon(poly((-3, 0), (3, 0), (3, 10), (7, 13), (5, 16), (-3, 12)))
        p.setPen(pen("#c99a6a", 1.4))
        p.drawLine(QPointF(-3, -1), QPointF(-3, 3))
        p.restore()


def _cat_roof(p, sx, sy, it, t):
    p.setPen(pen("#4a3022", 1.2))
    p.setBrush(QColor("#7b5a43"))
    p.drawPolygon(poly((sx - 34, sy + 6), (sx, sy - 20), (sx + 34, sy + 6), (sx + 30, sy + 10), (sx, sy - 14),
                       (sx - 30, sy + 10)))
    p.setPen(QPen(QColor(255, 255, 255, 60), 1))
    for k in range(1, 4):
        p.drawLine(QPointF(sx - 34 + k * 8, sy + 6 - k * 6.5), QPointF(sx - 30 + k * 8, sy + 9 - k * 6))
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#f2c94c"))
    p.drawEllipse(QPointF(sx, sy - 3), 3, 3)


def _lantern(p, sx, sy, it, t):
    on = it.state.get("on")
    p.setPen(pen("#2a2a33", 1.1))
    p.setBrush(QColor("#fff2b8") if on else QColor("#e8e1cf"))
    p.drawRoundedRect(QRectF(sx - 6, sy - 16, 12, 16), 3, 3)
    p.setBrush(QColor("#3a3a44"))
    p.drawPolygon(poly((sx - 8, sy - 16), (sx + 8, sy - 16), (sx, sy - 23)))
    if on:
        g = QRadialGradient(QPointF(sx, sy - 8), 16)
        g.setColorAt(0, QColor(255, 236, 170, 150))
        g.setColorAt(1, QColor(255, 236, 170, 0))
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        p.drawEllipse(QPointF(sx, sy - 8), 16, 16)


def _picnic(p, sx, sy, it, t):
    p.setPen(pen("#8a6a40", 0.9))
    p.setBrush(QColor("#c99a6a"))
    p.drawRoundedRect(QRectF(sx - 10, sy - 12, 20, 12), 3, 3)
    p.setBrush(Qt.NoBrush)
    p.drawArc(QRectF(sx - 8, sy - 20, 16, 14), 0, 180 * 16)
    p.setPen(pen("#9c3a2e", 0.8))
    p.setBrush(QColor("#e46f5b"))
    p.drawEllipse(QPointF(sx + 18, sy - 2), 4, 4)
    p.setPen(pen("#9a8a7a", 0.8))
    p.setBrush(QColor("#ffffff"))
    p.drawRoundedRect(QRectF(sx - 26, sy - 6, 8, 6), 1.5, 1.5)


def p_tree(it):
    return [C(0, 0, 0, 12, 96, "#8a5c3d", "#7a5035"), B(0, -4, 64, 42, 4, 70, "#8a5c3d"), Fn(_canopy, 0, 0, 92)]


def p_flower_bed(it):
    return [B(-44, -14, 0, 44, 14, 10, "#b07a50", "#6b4a35", r=2), Fr(-40, 2, 40, 7, "#c08a5c", outline=False),
            Fn(_flowers_row, 0, 0, 12)]


def p_bench(it):
    c = "#b07a50"
    return [B(-40, -10, 0, -36, 10, 22, "#4f4a46"), B(36, -10, 0, 40, 10, 22, "#4f4a46"),
            B(-46, -12, 22, 46, 12, 26, c, "#c99a6a", r=1.5), Tl([(-44, -4), (44, -4)], 26.1, "#9c6a42", 0.8),
            Tl([(-44, 4), (44, 4)], 26.1, "#9c6a42", 0.8), B(-46, 9, 30, 46, 12, 38, c, "#c99a6a", r=1.5),
            B(-46, 9, 42, 46, 12, 52, c, "#c99a6a", r=1.5), B(-40, 10, 26, -37, 12, 52, "#4f4a46"),
            B(37, 10, 26, 40, 12, 52, "#4f4a46"),
            B(-48, -12, 26, -44, 12, 38, "#4f4a46", r=1.5), B(44, -12, 26, 48, 12, 38, "#4f4a46", r=1.5)]


def p_swing(it):
    return [B(-46, -4, 0, -40, 4, 104, "#a8714b", "#c08a5c"), B(40, -4, 0, 46, 4, 104, "#a8714b", "#c08a5c"),
            B(-46, -4, 104, 46, 4, 110, "#a8714b", "#c08a5c", r=1.5), B(-50, -14, 0, -36, -8, 4, "#8a5c3d"),
            B(36, -14, 0, 50, -8, 4, "#8a5c3d"), Fn(_swing_seat, 0, 0, 102, True)]


def p_sandbox(it):
    w = "#c99a6a"
    return [B(-40, -40, 0, 40, 40, 4, "#ead6a6", "#f0dfb2"), B(-42, -42, 0, 42, -38, 10, w, "#d9ad80"),
            B(-42, 38, 0, 42, 42, 10, w, "#d9ad80"), B(-42, -42, 0, -38, 42, 10, w, "#d9ad80"),
            B(38, -42, 0, 42, 42, 10, w, "#d9ad80"), E(-14, 12, 4.2, 12, 8, "#e2c98f", None), Fn(_bucket, 12, 10, 4)]


def p_bird_feeder(it):
    return [C(0, 0, 0, 3, 70, "#8a5c3d"), B(-14, -14, 70, 14, 14, 74, "#c99a6a", "#d9b48a", r=1.5),
            E(0, 0, 74.2, 9, 9, "#d8b06a", None), B(-2, -2, 74, 2, 2, 92, "#8a5c3d"), Fn(_feeder_roof, 0, 0, 92),
            Fn(_feeder_birds, 0, 0, 74, True)]


def p_pond(it):
    return [E(0, 0, 0.3, 76, 52, "#5ea9d6", "#3d7fa8"), E(0, 2, 0.6, 62, 40, "#79bde3", None),
            E(-18, -8, 0.8, 22, 10, "#9fd2ee", None), Fn(_pond_stones, 0, 0, 0), Fn(_koi, 0, 0, 1, True)]


def p_bbq(it):
    return [C(-12, -6, 0, 2, 40, "#3a3a44"), C(12, -6, 0, 2, 40, "#3a3a44"), C(0, 10, 0, 2, 40, "#3a3a44"),
            C(0, 0, 40, 22, 14, "#3a3a44", "#55555f"), E(0, 0, 54.3, 18, 18, "#d9572f", "#555560"),
            Tl([(-14, -4), (14, -4)], 54.6, "#9a9aa4", 1.0), Tl([(-14, 4), (14, 4)], 54.6, "#9a9aa4", 1.0),
            Fn(_smoke, 0, 0, 56, True)]


def p_clothesline(it):
    return [B(-64, -3, 0, -58, 3, 92, "#a8714b", "#c08a5c"), B(58, -3, 0, 64, 3, 92, "#a8714b", "#c08a5c"),
            B(-68, -3, 86, -54, 3, 90, "#a8714b"), B(54, -3, 86, 68, 3, 90, "#a8714b"), Fn(_line, 0, 0, 86),
            Fn(_laundry, 0, 0, 86, True)]


def _line(p, sx, sy, it, t):
    p.setPen(QPen(QColor("#e9e2d6"), 1.2))
    if it.rot % 2 == 0:
        p.drawLine(QPointF(sx - 60, sy), QPointF(sx + 60, sy))
    else:
        p.drawLine(QPointF(sx, sy - 60 * KY), QPointF(sx, sy + 60 * KY))


def p_cat_house(it):
    return [B(-26, -22, 0, 26, 22, 34, "#e46f5b", "#ef8f80", r=2),
            Fc([(-9, 0), (9, 0), (9, 16), (5, 22), (0, 24), (-5, 22), (-9, 16)], "#4a2e24"),
            Fr(-20, 2, -14, 30, "#f29a88", outline=False), Fr(14, 2, 20, 30, "#f29a88", outline=False),
            Fn(_cat_roof, 0, 0, 34), Fn(_name_plate, 0, -22.2, 27, face="front")]


def _name_plate(p, sx, sy, it, t):
    p.setPen(pen("#8a6248", 0.8))
    p.setBrush(QColor("#fbf3e6"))
    p.drawRoundedRect(QRectF(sx - 8, sy - 4, 16, 6), 2, 2)
    p.setPen(QPen(QColor("#c74a6b"), 1))
    p.drawLine(QPointF(sx - 4, sy - 1), QPointF(sx + 4, sy - 1))


def p_picnic(it):
    parts = []
    for i in range(5):
        for j in range(4):
            col = "#e46f5b" if (i + j) % 2 else "#fbf3e6"
            parts.append(B(-50 + i * 20, -36 + j * 18, 0, -30 + i * 20, -18 + j * 18, 0.8, col, col, alpha=255))
    parts.append(Fn(_picnic, 0, 6, 1))
    return parts


def p_garden_lamp(it):
    return [C(0, 0, 0, 6, 4, "#3a3a44"), C(0, 0, 4, 2, 76, "#3a3a44"), Fn(_lantern, 0, 0, 96)]


CATALOG.update({
    "tree": dict(name="大树", group="户外", w=96, d=96, h=170, block=(30, 30), parts=p_tree, sig=lambda it: season(),
                 spots=[S("scratch", 0, -24, 0, face=(0, 1)), S("perch", 34, 0, 70), S("sleep", -12, 6, 108)]),
    "flower_bed": dict(name="花坛", group="户外", w=88, d=28, h=26, parts=p_flower_bed,
                       spots=[S("water", -10, -42, 0, "person", face=(0, 1)), S("nibble", 40, -26, 0)]),
    "bench": dict(name="长椅", group="户外", w=96, d=26, h=52, parts=p_bench,
                  spots=[S("sit", -26, -2, 26, "person", face=(0, -1)), S("sit", 4, -2, 26, "person", face=(0, -1)),
                         S("perch", 34, 0, 26)]),
    "swing": dict(name="秋千", group="户外", w=100, d=34, h=110, parts=p_swing,
                  spots=[S("swing", 0, 0, 34, "person", face=(0, -1), kid=True), S("watch", 44, -44, 0)]),
    "sandbox": dict(name="沙坑", group="户外", w=84, d=84, h=10, parts=p_sandbox, walk=True,
                    spots=[S("play", -14, -6, 4, "person", face=(0, -1)), S("play", 30, 20, 4)]),
    "bird_feeder": dict(name="鸟食台", group="户外", w=30, d=30, h=95, parts=p_bird_feeder,
                        spots=[S("watch_birds", 0, -64, 0, face=(0, 1))]),
    "pond": dict(name="小池塘", group="户外", w=156, d=108, h=2, parts=p_pond, flat=True, block=(150, 104),
                 spots=[S("watch_pond", 0, -66, 0, face=(0, 1))]),
    "bbq": dict(name="烧烤架", group="户外", w=46, d=46, h=56, parts=p_bbq,
                spots=[S("bbq", 0, -40, 0, "person", face=(0, 1)), S("beg", 44, -38, 0)]),
    "clothesline": dict(name="晾衣架", group="户外", w=136, d=12, h=92, parts=p_clothesline,
                        spots=[S("hang", -10, -30, 0, "person", face=(0, 1)), S("bat", 40, -24, 0)]),
    "cat_house": dict(name="户外猫屋", group="户外", w=52, d=44, h=56, parts=p_cat_house,
                      spots=[S("sleep", 0, 0, 44)]),
    "picnic": dict(name="野餐垫", group="户外", w=100, d=72, h=1, parts=p_picnic, flat=True, walk=True,
                   spots=[S("play", -26, -6, 0, "person", face=(0, -1)), S("play", 26, 4, 0, "person", face=(0, -1)),
                          S("sleep", 0, 26, 0)]),
    "garden_lamp": dict(name="庭院灯", group="户外", w=16, d=16, h=100, parts=p_garden_lamp, spots=[],
                        sig=lambda it: bool(it.state.get("on"))),
})
GROUPS.append("户外")
_RAW_LAYOUT += [
    ("tree", 2, 150, 340, 0), ("tree", 2, 1185, 90, 0), ("pond", 2, 240, 110, 0), ("cat_house", 2, 55, 440, 0),
    ("flower_bed", 2, 420, 456, 0), ("flower_bed", 2, 760, 456, 0), ("swing", 2, 430, 300, 0),
    ("bird_feeder", 2, 300, 225, 0), ("bench", 2, 560, 50, 0), ("picnic", 2, 620, 230, 0),
    ("sandbox", 2, 960, 150, 0), ("bbq", 2, 1000, 430, 0), ("clothesline", 2, 1180, 300, 0),
    ("garden_lamp", 2, 720, 26, 0), ("garden_lamp", 2, 1228, 450, 0), ("flowers", 2, 900, 26, 0),
]


# ---- garden shell -------------------------------------------------------------------------
def draw_yard_extras(p):
    """Stepping-stone path from the gate to the front door, and the step outside the gate."""
    x0, x1 = GATE
    sr = srect(x0, x1, -ENTRY_D, -16, 0)
    p.setPen(pen(OUT, 1.1, 180))
    p.setBrush(vgrad(sr, "#a69d90", "#8a8276"))
    p.drawRect(sr)
    fill_rect(p, frect(x0, -ENTRY_D, x1, 0), QColor("#cdc5b8"), OUT, 1.0)
    ax, ay = GATE_IN
    bx, by = YARD_DOOR
    n = 11
    for i in range(n + 1):
        u = i / n
        x, y = lerp(ax, bx, u), lerp(ay - 14, by + 20, u)
        x += 10 * math.sin(u * 5)
        sx, sy = iso(x, y, 0.4)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(0, 0, 0, 30))
        p.drawEllipse(QPointF(sx + 1, sy + 1.5), 15, 11 * KY)
        p.setPen(pen("#9c9488", 1.0))
        g = QRadialGradient(QPointF(sx - 4, sy - 2), 16)
        g.setColorAt(0, QColor("#ebe5d9"))
        g.setColorAt(1, QColor("#cfc7b9"))
        p.setBrush(g)
        p.drawEllipse(QPointF(sx, sy), 15, 11 * KY)


def draw_facade(p):
    """Garden view: the front of the house along the far edge, a hedge on the right."""
    h = WALL_H
    wall = srect(0, PW, PD, 0, h)
    p.setPen(Qt.NoPen)
    p.setBrush(vgrad(wall, "#f0dcbc", "#f8ead2"))
    p.drawRect(wall)
    p.setPen(QPen(QColor("#e2cba8"), 1.2))
    z = 12
    while z < h:
        p.drawLine(ipt(0, PD, z), ipt(PW, PD, z))
        z += 12
    sk = srect(0, PW, PD, 0, 10)
    p.setPen(Qt.NoPen)
    p.setBrush(vgrad(sk, "#c9b08c", "#b39a78"))
    p.drawRect(sk)
    # roof edge with tiles
    roof = srect(-14, PW + 14, PD, h, h + 20)
    p.setPen(pen("#7a3326", 1.2))
    p.setBrush(vgrad(roof, "#c9604a", "#a9483a"))
    p.drawRect(roof)
    p.setPen(QPen(QColor(120, 40, 30, 150), 1))
    x = roof.left()
    while x < roof.right():
        p.drawArc(QRectF(x, roof.top() + 6, 14, 12), 180 * 16, 180 * 16)
        x += 14
    p.setPen(QPen(QColor(255, 255, 255, 70), 1.4))
    p.drawLine(QPointF(roof.left(), roof.top() + 1.5), QPointF(roof.right(), roof.top() + 1.5))
    # front door with an awning and a step
    x0, x1 = ENTRANCE
    door = srect(x0 + 14, x1 - 14, PD, 0, 98)
    p.setPen(pen("#5e3b26", 1.3))
    p.setBrush(vgrad(door, "#b27a52", "#94603e"))
    p.drawRect(door)
    mid = (x0 + x1) / 2
    p.setPen(pen("#6b4430", 1.0))
    p.setBrush(QColor("#8d5a3a"))
    p.drawRect(srect(x0 + 22, mid - 3, PD, 10, 88))
    p.drawRect(srect(mid + 3, x1 - 22, PD, 10, 88))
    p.setBrush(QColor("#bfe0f2"))
    p.drawRoundedRect(srect(x0 + 26, mid - 7, PD, 62, 82), 3, 3)
    p.drawRoundedRect(srect(mid + 7, x1 - 26, PD, 62, 82), 3, 3)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#f2c94c"))
    p.drawEllipse(ipt(mid + 9, PD, 46), 2.6, 3.2)
    box(p, x0 + 2, PD - 26, 98, x1 - 2, PD, 106, "#7fb7a4", top="#9fd3c7", radius=2)
    p.setPen(QPen(QColor(255, 255, 255, 150), 2))
    for k in range(6):
        xx = x0 + 6 + k * (x1 - x0 - 12) / 5
        p.drawLine(ipt(xx, PD - 26, 98), ipt(xx, PD - 26, 102))
    box(p, x0 + 6, PD - 18, 0, x1 - 6, PD, 6, "#c9c1b4", top="#d9d2c4")
    # house number & a lamp beside the door
    p.setPen(pen("#6b4430", 1.0))
    p.setBrush(QColor("#fbf3e6"))
    p.drawRoundedRect(srect(x1 - 6, x1 + 14, PD, 64, 76), 3, 3)
    p.setPen(QPen(QColor("#6b4430"), 1.4))
    c = srect(x1 - 6, x1 + 14, PD, 64, 76).center()
    p.drawLine(QPointF(c.x() - 3, c.y() - 3), QPointF(c.x() - 3, c.y() + 3))
    p.drawEllipse(QPointF(c.x() + 3, c.y()), 2.2, 3)
    # hedge along the right edge
    hedge = frect(PW - 20, 0, PW, PD, 56)
    front = srect(PW - 20, PW, 0, 0, 56)
    p.setPen(pen("#3f6e3c", 1.2))
    p.setBrush(QColor("#5f9f55"))
    p.drawRect(QRectF(hedge.left(), hedge.top(), hedge.width(), front.bottom() - hedge.top()))
    p.setPen(Qt.NoPen)
    y = 6
    while y < PD:
        sx, sy = iso(PW - 10, y, 56)
        p.setBrush(QColor("#6fb063"))
        p.drawEllipse(QPointF(sx, sy), 11, 6)
        p.setBrush(QColor(255, 255, 255, 40))
        p.drawEllipse(QPointF(sx - 3, sy - 2), 4, 2)
        y += 18
    p.setBrush(vgrad(front, "#5a9a50", "#3f7a3a"))
    p.drawRect(front)
    p.setPen(pen(OUT, 1.2, 150))
    p.drawLine(ipt(0, PD, 0), ipt(PW - 20, PD, 0))


def draw_garden_rot(p, se=None):
    """(v26) The garden on its side, beside the house in the all view (ROT set): the lawn with its stepping
    stones, the house wall against the house, the fence along the far edge (seen face-on) and along the street
    side (seen end-on, with the gate), the pavement outside."""
    W, Hh = ROT[4], ROT[5]
    uf = iso(0, 0)[0]                                   # the front fence (y = 0)
    uh = iso(0, PD)[0]                                  # the house wall
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#9fc276"))
    p.drawRect(QRectF(0, 0, W, Hh))
    pv = QRectF(uf, 0, W - uf, Hh) if uf > uh else QRectF(0, 0, uf, Hh)
    p.setBrush(hgrad(pv, "#d9d1c3", "#c8bfaf"))
    p.drawRect(pv)
    p.setPen(QPen(QColor(150, 140, 125, 90), 1))
    y = 18.0
    while y < Hh:
        p.drawLine(QPointF(pv.left(), y), QPointF(pv.right(), y))
        y += 26
    draw_base(p, 2)
    if se:
        draw_ground_season(p, se)
    # the house: its wall, a soft shadow on the grass, the doorstep of the front door
    p.setPen(Qt.NoPen)
    sd = 1 if uf > uh else -1                           # from the house towards the street
    va, vb = sorted((iso(0, 0)[1], iso(PW, 0)[1]))
    g = QLinearGradient(uh, 0, uh + 26 * sd, 0)
    g.setColorAt(0, QColor(60, 40, 20, 70))
    g.setColorAt(1, QColor(60, 40, 20, 0))
    p.setBrush(g)
    p.drawRect(QRectF(min(uh, uh + 26 * sd), va, 26, vb - va))
    wall = QRectF(0, 0, uh, Hh) if sd > 0 else QRectF(uh, 0, W - uh, Hh)
    p.setBrush(hgrad(wall, "#e8d2ae", "#f4e3c6") if sd > 0 else hgrad(wall, "#f4e3c6", "#e8d2ae"))
    p.drawRect(wall)
    p.setPen(QPen(QColor("#c9b08c"), 1.4))
    p.drawLine(QPointF(uh, 0), QPointF(uh, Hh))
    x0, x1 = ENTRANCE
    fill_rect(p, frect(x0 + 4, PD - 24, x1 - 4, PD), QColor("#cfc7b9"), OUT, 1.0, radius=2)
    fill_rect(p, frect(x0 + 14, PD - 18, x1 - 14, PD - 4), QColor("#b0574a"), None, radius=2)
    # the front fence (y = 0), seen end-on: a slim strip, open at the gate
    h = 30.0
    gx0, gx1 = GATE
    for xa, xb in ((0, gx0 - 4), (gx1 + 4, PW)):
        ta, tb = iso(xa, 0, 0), iso(xb, 0, 0)
        top, bot = min(ta[1], tb[1]) - h, max(ta[1], tb[1])
        r = QRectF(ta[0] - 3, top, 6, bot - top)
        p.setPen(pen("#9a8a76", 1.0))
        p.setBrush(hgrad(r, "#f1ece2", "#ddd3c3"))
        p.drawRect(r)
    for x in (gx0 - 4, gx1 + 4):
        sx, sy = iso(x, 0, 0)
        p.setPen(pen("#9a8a76", 1.0))
        p.setBrush(QColor("#fbf7ef"))
        p.drawRoundedRect(QRectF(sx - 5, sy - 44, 10, 44), 2, 2)
        p.setBrush(QColor("#e2dccf"))
        p.drawEllipse(QPointF(sx, sy - 46), 5, 4)
    # the far edge: the side fence (x = 0) or the hedge (x = PW), whichever is further away (higher up)
    if iso(0, 0)[1] < iso(PW, 0)[1]:
        _rot_pickets(p)
    else:
        _rot_hedge(p)


def _rot_pickets(p):
    """The side fence (x = 0) of the turned garden, seen from the front."""
    h = 30.0
    a, b = iso(0, PD, 0), iso(0, 0, 0)
    ua, ub = sorted((a[0], b[0]))
    v = a[1]
    p.setPen(pen("#d9d0c2", 3.0))
    for z in (9, 21):
        p.drawLine(QPointF(ua, v - z), QPointF(ub, v - z))
    u = ua + 6
    while u < ub - 2:
        top = v - h
        p.setPen(pen("#9a8a76", 0.9))
        p.setBrush(QColor("#fbf7ef"))
        p.drawPolygon(poly((u - 2.8, v), (u + 2.8, v), (u + 2.8, top), (u, top - 5), (u - 2.8, top)))
        u += 12


def _rot_hedge(p):
    """The hedge (x = PW - 20 .. PW) of the turned garden, seen from the front."""
    a, b = iso(PW - 20, PD, 0), iso(PW, 0, 0)
    ua, ub = sorted((a[0], b[0]))
    va, vb = sorted((a[1], b[1]))
    r = QRectF(ua, va - 56, ub - ua, vb - va + 56)
    p.setPen(pen("#3f6e3c", 1.2))
    p.setBrush(vgrad(r, "#6fb063", "#3f7a3a"))
    p.drawRoundedRect(r, 6, 6)
    p.setPen(Qt.NoPen)
    u = r.left() + 8
    while u < r.right() - 4:
        p.setBrush(QColor("#7cbc6e"))
        p.drawEllipse(QPointF(u, r.top() + 3), 10, 6)
        p.setBrush(QColor(255, 255, 255, 40))
        p.drawEllipse(QPointF(u - 3, r.top() + 1), 4, 2)
        u += 17


def draw_garden_rot_front(p):
    """(v26) The near edge of the turned garden (in front of everything): the hedge or the side fence."""
    if iso(0, 0)[1] < iso(PW, 0)[1]:
        _rot_hedge(p)
    else:
        _rot_pickets(p)


def draw_fence(p):
    """Garden view: low picket fence along the near edge, open at the gate; a fence strip on the left."""
    h = 30
    gx0, gx1 = GATE
    p.setPen(pen("#d9d0c2", 3.0))
    for z in (9, 21):
        p.drawLine(ipt(0, 0, z), ipt(gx0 - 4, 0, z))
        p.drawLine(ipt(gx1 + 4, 0, z), ipt(PW, 0, z))
    x = 6.0
    while x < PW - 4:
        if not (gx0 - 4 < x < gx1 + 4):
            a = iso(x - 2.8, 0, 0)
            b = iso(x + 2.8, 0, 0)
            c = iso(x + 2.8, 0, h)
            d = iso(x, 0, h + 5)
            e = iso(x - 2.8, 0, h)
            p.setPen(pen("#9a8a76", 0.9))
            p.setBrush(QColor("#fbf7ef"))
            p.drawPolygon(poly(a, b, c, d, e))
            p.setPen(QPen(QColor(0, 0, 0, 20), 1))
            p.drawLine(QPointF(b[0] - 1, b[1]), QPointF(c[0] - 1, c[1]))
        x += 12
    # the left fence, seen end-on: a slim strip of rails and picket tops
    top = iso(0, PD, h)[1]
    bot = iso(0, 0, 0)[1]
    r = QRectF(OX - 5, top, 6, bot - top)
    p.setPen(pen("#9a8a76", 1.0))
    p.setBrush(vgrad(r, "#f1ece2", "#ddd3c3"))
    p.drawRect(r)
    for x in (gx0 - 4, gx1 + 4):
        box(p, x - 4, -4, 0, x + 4, 4, 44, "#fbf7ef", top="#e2dccf")
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#e2dccf"))
        p.drawEllipse(ipt(x, 0, 47), 4.5, 3.5)


def draw_facade_windows(p, hour, lit):
    for side, a, b in FLOORS[2]["windows"]:
        if side != "S":
            continue
        r = srect(a, b, PD, 40, 110)
        if is_dark(hour):
            col = QColor("#ffd88a") if lit else QColor("#2b3358")
        else:
            col = QColor("#bfe0f2")
        p.setPen(Qt.NoPen)
        p.setBrush(vgrad(r, col.lighter(108), col.darker(106)))
        p.drawRect(r)
        if not is_dark(hour):
            p.setPen(QPen(QColor(255, 255, 255, 150), 3))
            p.drawLine(QPointF(r.left() + 10, r.bottom() - 8), QPointF(r.left() + 30, r.top() + 8))
        p.setBrush(Qt.NoBrush)
        p.setPen(QPen(QColor("#ffffff"), 4))
        p.drawRect(r)
        p.drawLine(QPointF(r.center().x(), r.top()), QPointF(r.center().x(), r.bottom()))
        # shutters
        for x0_, x1_ in ((a - 16, a - 4), (b + 4, b + 16)):
            sr = srect(x0_, x1_, PD, 40, 110)
            p.setPen(pen("#4f7f70", 1.0))
            p.setBrush(QColor("#7fb7a4"))
            p.drawRect(sr)
            p.setPen(QPen(QColor(255, 255, 255, 90), 1))
            yy = sr.top() + 5
            while yy < sr.bottom() - 2:
                p.drawLine(QPointF(sr.left() + 2, yy), QPointF(sr.right() - 2, yy))
                yy += 5
        # flower box under the window
        box(p, a - 2, PD - 10, 26, b + 2, PD, 38, "#a8714b", top="#6b4a35")
        p.setPen(Qt.NoPen)
        for i, c in enumerate(("#ef6f8f", "#f2c94c", "#ffffff", "#b48ae0", "#ef6f8f", "#f2c94c")):
            x = a + (b - a) * (i + 0.5) / 6
            p.setBrush(QColor("#6fb35f"))
            p.drawEllipse(ipt(x + 3, PD - 5, 40), 3.6, 2.4)
            p.setBrush(QColor(c))
            p.drawEllipse(ipt(x, PD - 5, 43), 3.6, 3.2)


def yard_volume():
    path = QPainterPath()
    if ROT is not None:
        path.addRect(QRectF(0, 0, ROT[4], ROT[5]))
        return path
    top = iso(0, PD, WALL_H + 20)[1]
    bot = iso(0, -ENTRY_D, 0)[1] + 16
    path.addRect(QRectF(OX - 8, top, PW + 16, bot - top))
    return path


def draw_weather(p, t, kind):
    """Rain / snow falling over the garden."""
    if kind not in ("rain", "snow"):
        return
    region = yard_volume()
    p.save()
    p.setClipPath(region)
    p.fillPath(region, QColor(70, 90, 120, 45 if kind == "rain" else 25))
    rnd = 7
    W, Hh = int(PANEL_W), int(PANEL_H)
    if kind == "rain":
        p.setPen(QPen(QColor(215, 230, 255, 210), 1.7))
        for i in range(240):
            rnd = (rnd * 1103515245 + 12345) & 0x7fffffff
            x = rnd % W
            y0 = (rnd >> 8) % Hh
            y = (y0 + t * 520) % Hh
            p.drawLine(QPointF(x, y), QPointF(x - 5, y + 18))
    else:
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(255, 255, 255, 220))
        for i in range(120):
            rnd = (rnd * 1103515245 + 12345) & 0x7fffffff
            x = (rnd % W) + 14 * math.sin(t + i)
            y0 = (rnd >> 8) % Hh
            y = (y0 + t * 60) % Hh
            p.drawEllipse(QPointF(x, y), 2.2, 2.2)
    p.restore()


def draw_butterfly(p, sx, sy, t, col):
    f = abs(math.sin(t * 12))
    p.setPen(pen(OUT, 0.8))
    p.setBrush(QColor(col))
    for d in (-1, 1):
        p.drawEllipse(QPointF(sx + d * 4 * f, sy - 2), 4 * f + 1, 3.4)
        p.drawEllipse(QPointF(sx + d * 3 * f, sy + 2), 3 * f + 0.8, 2.4)
    p.setPen(pen("#3a2a22", 1.2))
    p.drawLine(QPointF(sx, sy - 3), QPointF(sx, sy + 3))


# ---- castle shelf with plush toys (original soft-toy designs) -----------------------------------
def _plush_eyes(p, x, y, gap):
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#2b211c"))
    p.drawEllipse(QPointF(x - gap, y), 1.3, 1.5)
    p.drawEllipse(QPointF(x + gap, y), 1.3, 1.5)
    p.setBrush(QColor(255, 255, 255, 220))
    p.drawEllipse(QPointF(x - gap + 0.4, y - 0.6), 0.45, 0.45)
    p.drawEllipse(QPointF(x + gap + 0.4, y - 0.6), 0.45, 0.45)


def _plush_smile(p, x, y, w=3.0):
    p.setPen(pen("#5a4036", 0.9))
    p.setBrush(Qt.NoBrush)
    p.drawArc(QRectF(x - w, y - 1.5, 2 * w, 3), 200 * 16, 140 * 16)


def draw_bunny(p, x, y, s=1.0, color="#fbf8f2"):
    """Soft bunny with long floppy ears, sitting; (x, y) = bottom centre."""
    p.save()
    p.translate(x, y)
    p.scale(s, s)
    body, inner = QColor(color), QColor("#f3c6cf")
    p.setPen(pen(shade(color, 0.72).name(), 1.0))
    p.setBrush(body)
    for d in (-1, 1):                      # floppy ears hanging down the sides
        path = QPainterPath(QPointF(d * 4, -22))
        path.cubicTo(QPointF(d * 13, -24), QPointF(d * 14, -10), QPointF(d * 10, -5))
        path.cubicTo(QPointF(d * 8, -3), QPointF(d * 6, -12), QPointF(d * 4, -18))
        path.closeSubpath()
        p.drawPath(path)
    p.drawEllipse(QRectF(-8, -12, 16, 13))           # body
    p.drawEllipse(QPointF(-4, -1), 3.4, 2.2)         # feet
    p.drawEllipse(QPointF(4, -1), 3.4, 2.2)
    p.drawEllipse(QPointF(0, -18), 7.5, 6.8)         # head
    p.setPen(Qt.NoPen)
    p.setBrush(inner)
    p.drawEllipse(QPointF(-3.2, -1.2), 1.5, 1.0)
    p.drawEllipse(QPointF(3.2, -1.2), 1.5, 1.0)
    _plush_eyes(p, 0, -19, 2.6)
    p.setBrush(QColor("#d98a96"))
    p.drawEllipse(QPointF(0, -16.6), 1.0, 0.7)
    p.restore()


def draw_duck(p, x, y, s=1.0):
    p.save()
    p.translate(x, y)
    p.scale(s, s)
    p.setPen(pen("#c9a43c", 1.0))
    p.setBrush(QColor("#f6d65a"))
    p.drawEllipse(QRectF(-9, -13, 18, 13))           # round body
    p.drawEllipse(QPointF(0, -17), 6.5, 6.0)          # head
    p.setBrush(QColor("#f2c94c"))
    p.drawEllipse(QPointF(-8, -7), 3, 4.5)            # wings
    p.drawEllipse(QPointF(8, -7), 3, 4.5)
    p.setPen(pen("#c46a2b", 0.9))
    p.setBrush(QColor("#f39c4b"))
    p.drawRoundedRect(QRectF(-4.2, -15.6, 8.4, 3.4), 1.6, 1.6)   # flat beak
    p.drawEllipse(QPointF(-4, 0), 3, 1.4)            # feet
    p.drawEllipse(QPointF(4, 0), 3, 1.4)
    _plush_eyes(p, 0, -19, 2.4)
    p.setPen(pen("#ffffff", 0.8, 200))
    p.drawLine(QPointF(-1, -27), QPointF(0, -23))   # little tuft
    p.restore()


def draw_bear(p, x, y, s=1.0, color="#f7f3ec"):
    p.save()
    p.translate(x, y)
    p.scale(s, s)
    fur, muzzle = QColor(color), QColor("#e8d9c4")
    p.setPen(pen(shade(color, 0.7).name(), 1.0))
    p.setBrush(fur)
    p.drawEllipse(QPointF(-6, -24), 2.8, 2.8)         # ears
    p.drawEllipse(QPointF(6, -24), 2.8, 2.8)
    p.drawEllipse(QRectF(-8, -13, 16, 13))
    p.drawEllipse(QPointF(-9, -8), 2.6, 4)            # arms
    p.drawEllipse(QPointF(9, -8), 2.6, 4)
    p.drawEllipse(QPointF(-4, -1), 3.2, 2.2)
    p.drawEllipse(QPointF(4, -1), 3.2, 2.2)
    p.drawEllipse(QPointF(0, -18), 7.5, 7)
    p.setPen(Qt.NoPen)
    p.setBrush(muzzle)
    p.drawEllipse(QPointF(0, -15.5), 3.6, 2.6)
    p.drawEllipse(QPointF(0, -6), 4.2, 4)            # tummy
    _plush_eyes(p, 0, -19.5, 2.8)
    p.setBrush(QColor("#3a2a22"))
    p.drawEllipse(QPointF(0, -16.4), 1.2, 0.9)
    _plush_smile(p, 0, -14.6, 1.6)
    p.restore()


def draw_reindeer(p, x, y, s=1.0):
    """Little reindeer plush: warm brown, cream muzzle and chest ruff, short soft branched antlers."""
    p.save()
    p.translate(x, y)
    p.scale(s, s)
    fur, dark, cream, antler = QColor("#9a6a45"), QColor("#6e4a33"), QColor("#f1e2c8"), QColor("#e6d2ad")
    p.setPen(pen("#a88a5c", 1.0))
    p.setBrush(antler)
    for d in (-1, 1):                                  # short, rounded, branched antlers
        path = QPainterPath(QPointF(d * 2.5, -26))
        path.cubicTo(QPointF(d * 3.5, -31), QPointF(d * 5.5, -33), QPointF(d * 7.5, -35))
        path.lineTo(d * 9.0, -34)
        path.cubicTo(QPointF(d * 7.5, -32), QPointF(d * 6.5, -31), QPointF(d * 6.8, -30))
        path.lineTo(d * 10.0, -31)
        path.lineTo(d * 10.4, -29.4)
        path.cubicTo(QPointF(d * 7.5, -28), QPointF(d * 5.5, -26.5), QPointF(d * 4.6, -24.5))
        path.closeSubpath()
        p.drawPath(path)
    p.setPen(pen("#5a3a28", 1.0))
    p.setBrush(dark)
    for dx in (-5, -2, 2, 5):                          # legs with darker hooves
        p.drawRoundedRect(QRectF(dx - 1.5, -7, 3, 7), 1.2, 1.2)
    p.setBrush(fur)
    p.drawEllipse(QRectF(-8, -15, 16, 10.5))           # body
    for d in (-1, 1):                                  # ears
        p.save()
        p.translate(d * 6.8, -23.5)
        p.rotate(d * 60)
        p.drawEllipse(QRectF(-1.8, -4, 3.6, 7))
        p.restore()
    p.setPen(Qt.NoPen)
    p.setBrush(cream)
    path = QPainterPath(QPointF(-5, -15))                # fluffy chest ruff
    for k in range(5):
        path.quadTo(QPointF(-4 + k * 2.5, -11 - (k % 2) * 1.5), QPointF(-3 + k * 2.5, -14))
    path.lineTo(5, -16)
    path.closeSubpath()
    p.drawPath(path)
    p.setPen(pen("#5a3a28", 1.0))
    p.setBrush(fur)
    p.drawEllipse(QPointF(0, -21.5), 6.2, 5.8)         # head
    p.setBrush(cream)
    p.drawEllipse(QPointF(0, -18.2), 3.8, 2.8)         # muzzle
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#3a2a22"))
    p.drawEllipse(QPointF(0, -19.6), 1.5, 1.0)         # dark nose
    _plush_eyes(p, 0, -23, 2.7)
    p.setBrush(QColor(242, 140, 140, 110))
    p.drawEllipse(QPointF(-4.4, -20.2), 1.3, 0.85)
    p.drawEllipse(QPointF(4.4, -20.2), 1.3, 0.85)
    p.restore()


draw_moose = draw_reindeer


def _tower_roof(p, sx, sy, it, t):
    p.setPen(pen("#9c4f6b", 1.2))
    g = QLinearGradient(sx - 22, 0, sx + 22, 0)
    g.setColorAt(0, QColor("#f2a9c0"))
    g.setColorAt(1, QColor("#d47898"))
    p.setBrush(g)
    p.drawPolygon(poly((sx - 22, sy + 4), (sx, sy - 36), (sx + 22, sy + 4)))
    p.setPen(QPen(QColor(255, 255, 255, 120), 1))
    for k in (1, 2):
        y = sy + 4 - k * 12
        w = 22 * (1 - k * 12 / 40.0)
        p.drawArc(QRectF(sx - w, y - 3, 2 * w, 6), 200 * 16, 140 * 16)
    p.setPen(pen("#8a6a50", 1.2))
    p.drawLine(QPointF(sx, sy - 36), QPointF(sx, sy - 48))
    p.setPen(pen(OUT, 0.8))
    p.setBrush(QColor("#f2c94c"))
    p.drawPolygon(poly((sx, sy - 48), (sx + 10, sy - 44.5), (sx, sy - 41)))


def _tower_window(p, sx, sy, it, t):
    p.setPen(pen("#9c4f6b", 1.0))
    p.setBrush(QColor("#6a4a7a"))
    p.drawRoundedRect(QRectF(sx - 4, sy - 12, 8, 12), 4, 4)
    p.setPen(QPen(QColor(255, 236, 170, 200), 1))
    p.drawLine(QPointF(sx, sy - 11), QPointF(sx, sy - 1))


# the family's plush toys: (name, kind, colour)
PLUSHIES = [("snow ball", "bear", "#f7f3ec"), ("avocado", "duck", None), ("兔兔", "bunny", "#fbf8f2"),
            ("baby dragon", "bunny", "#d6d7dd"), ("禾宝", "reindeer", None)]
# where they sit on the castle shelves: (u, z) in item coordinates
PLUSH_SPOTS = [(-13, 6), (13, 6), (-13, 38), (13, 38), (0, 70)]


def draw_plush(p, kind, x, y, s, color=None):
    if kind == "bunny":
        draw_bunny(p, x, y, s, color or "#fbf8f2")
    elif kind == "bear":
        draw_bear(p, x, y, s, color or "#f7f3ec")
    elif kind == "duck":
        draw_duck(p, x, y, s)
    else:
        draw_moose(p, x, y, s)


def _shelf_toys(p, sx, sy, it, t):
    if it.rot in (2, 3):
        return
    ox, oy = iso(0, 0, 0)
    off = it.state.get("plush_off", ())
    for (name, kind, col), (u, z) in zip(PLUSHIES, PLUSH_SPOTS):
        if name in off:
            continue
        dx, dy = rot_vec(it.rot, u, -10)
        x, y = iso(dx, dy, z)
        draw_plush(p, kind, sx + x - ox, sy + y - oy, 1.0 if z < 60 else 1.1, col)


def plush_positions(it):
    """[(name, x, y, scale)] panel position of each plush's bottom centre on a castle shelf."""
    out = []
    for (name, kind, col), (u, z) in zip(PLUSHIES, PLUSH_SPOTS):
        dx, dy = rot_vec(it.rot, u, -10)
        out.append((name,) + iso(it.x + dx, it.y + dy, z) + (1.0 if z < 60 else 1.1,))
    return out


def draw_name_tag(p, text, x, y, font):
    """Small pill with a name, its bottom centre at (x, y)."""
    fm = QFontMetricsF(font)
    w = fm.horizontalAdvance(text) + 16
    h = fm.height() + 4
    r = QRectF(x - w / 2, y - h, w, h)
    p.setFont(font)
    p.setPen(QPen(QColor("#d99ab3"), 1.2))
    p.setBrush(QColor(255, 247, 250, 240))
    p.drawRoundedRect(r, h / 2, h / 2)
    p.setPen(QColor("#8a4a63"))
    p.drawText(r, Qt.AlignCenter, text)


def p_castle(it):
    wall, trim = "#fbe3ec", "#f6cfdc"
    parts = [C(-44, 0, 0, 15, 104, wall, trim), C(44, 0, 0, 15, 104, wall, trim),
             B(-32, -14, 0, 32, 14, 96, wall, trim, r=2)]
    for u in (-32, -16, 0, 16):
        parts.append(B(u, -14, 96, u + 8, 14, 104, wall, trim, r=1))
    for z0, z1 in ((6, 32), (38, 64), (70, 92)):
        parts.append(Fc([(-27, z0), (27, z0), (27, z1 - 6), (20, z1 - 1), (0, z1 + 2), (-20, z1 - 1), (-27, z1 - 6)],
                        "#ecc3d3"))
        parts.append(Fr(-29, z0 - 3, 29, z0, "#d99ab3"))
    for u in (-44, 44):
        parts.append(E(u, 0, 104.2, 11, 11, "#f3c6d6", None))
    parts += [Fn(_tower_roof, -44, 0, 104), Fn(_tower_roof, 44, 0, 104),
              Fn(_tower_window, -44, -15, 80, face="front"), Fn(_tower_window, 44, -15, 80, face="front"),
              Fn(_shelf_toys, 0, 0, 0)]
    return parts


def held_anchor(P, pose, view, seat):
    """Where a carried toy sits (its bottom centre) relative to the person's feet / seat, before scaling."""
    d = person_dims(P.get("role", "adult"))
    leg, torso = d["leg"], d["torso"]
    seated = (pose in SEATED_POSES and seat > 0) or pose == "floor"
    if seated:
        hip = 0.0
    elif pose in ("crouch", "feed", "kneel"):
        hip = -leg * 0.55
    else:
        hip = -leg
    if view == "side":
        return torso * 0.34, hip - torso * 0.1 + (4 if seated else 0)
    if view == "back":
        return torso * 0.3, hip - torso * 0.45
    return 0.0, hip - torso * 0.04 + (5 if seated else 0)


CATALOG["castle"] = dict(name="城堡玩具架", group="卧室", w=124, d=34, h=150, parts=p_castle,
                         sig=lambda it: tuple(it.state.get("plush_off", ())),
                         spots=[S("perch", -8, 0, 104), S("bat", -46, -36, 0, face=(0, 1)),
                                S("play", 34, -48, 0, "person", face=(0, 1))])
_RAW_LAYOUT.append(("castle", 1, 300, 456, 0))

configure(False)


def draw_footprints(p, level, prints):
    p.setPen(Qt.NoPen)
    for (x, y, age) in prints:
        sx, sy = iso(x, y, 0)
        p.setBrush(QColor(170, 180, 200, int(110 * max(0.0, 1 - age / 90.0) * min(1.0, level * 2))))
        p.drawEllipse(QPointF(sx, sy), 2.2, 1.1)


def draw_snow_cover(p, level, prints=(), t=0.0):
    """Snow lying on the garden (level 0..1), with footprints; a white cap on the roof edge."""
    if level <= 0.02:
        return
    a = int(235 * min(1.0, level * 1.4))
    ground = QPolygonF([ipt(0, 0, 0), ipt(PW, 0, 0), ipt(PW, PD, 0), ipt(0, PD, 0)])
    p.save()
    path = QPainterPath()
    path.addPolygon(ground)
    p.setClipPath(path)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(250, 252, 255, int(a * 0.75)))
    p.drawPolygon(ground)
    rnd = random.Random(7)
    for _ in range(90):
        x, y = rnd.uniform(0, PW), rnd.uniform(0, PD)
        sx, sy = iso(x, y, 0)
        r = rnd.uniform(10, 34) * (0.5 + level)
        p.setBrush(QColor(255, 255, 255, int(a * rnd.uniform(0.3, 0.7))))
        p.drawEllipse(QPointF(sx, sy), r, r * 0.42)
    p.restore()
    roof = srect(-14, PW + 14, PD, WALL_H + 18, WALL_H + 20 + 6 * level)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 255, 255, a))
    p.drawRoundedRect(roof, 3, 3)


def draw_umbrella(p, x, y, col, t, r=22.0):
    """An open umbrella whose canopy is centred at (x, y)."""
    p.save()
    p.translate(x, y)
    p.rotate(3 * math.sin(t * 2.2))
    c = QColor(col)
    p.setPen(QPen(QColor("#5a4a40"), 1.4))
    p.drawLine(QPointF(0, 0), QPointF(0, r * 1.25))
    path = QPainterPath(QPointF(-r, 2))
    path.quadTo(QPointF(-r * 0.9, -r * 0.75), QPointF(0, -r * 0.8))
    path.quadTo(QPointF(r * 0.9, -r * 0.75), QPointF(r, 2))
    for k in range(4):
        x1 = r - (k + 1) * r / 2
        path.quadTo(QPointF(x1 + r / 4, -3), QPointF(x1, 2))
    p.setPen(pen(c.darker(150).name(), 1.0))
    g = QLinearGradient(-r, 0, r, 0)
    g.setColorAt(0, c.lighter(115))
    g.setColorAt(1, c.darker(108))
    p.setBrush(g)
    p.drawPath(path)
    p.setPen(QPen(c.darker(130), 0.8))
    for xx in (-r * 0.5, 0, r * 0.5):
        p.drawLine(QPointF(0, -r * 0.8), QPointF(xx, 2))
    p.setBrush(QColor("#5a4a40"))
    p.drawEllipse(QPointF(0, -r * 0.82), 1.4, 1.4)
    p.restore()


def draw_scarf(p, x, y, w, col, t, facing=1):
    """A scarf round the neck at (x, y); the end hangs and swings a little."""
    c = QColor(col)
    p.setPen(pen(c.darker(140).name(), 0.9))
    p.setBrush(c)
    p.drawRoundedRect(QRectF(x - w / 2, y - 2.5, w, 5.5), 2.5, 2.5)
    sw = 1.5 * math.sin(t * 3)
    tail = QPainterPath(QPointF(x + facing * w * 0.2, y + 2))
    tail.lineTo(x + facing * (w * 0.2 + 4) + sw, y + 13)
    tail.lineTo(x + facing * (w * 0.2 - 1) + sw, y + 13.5)
    tail.lineTo(x + facing * (w * 0.2 - 4), y + 2)
    tail.closeSubpath()
    p.drawPath(tail)
    p.setPen(QPen(QColor(255, 255, 255, 140), 1.0))
    p.drawLine(QPointF(x - w / 2 + 2, y), QPointF(x + w / 2 - 2, y))


# ---- seasons & holidays ------------------------------------------------------------------------------------
LEAF_COLS = ("#e8743b", "#f2b04a", "#c9542a", "#d98a2b")


def _leaf(p, x, y, rot, col, s=1.0):
    p.save()
    p.translate(x, y)
    p.rotate(rot)
    p.scale(s, s)
    path = QPainterPath(QPointF(-4, 0))
    path.quadTo(QPointF(0, -3), QPointF(4, 0))
    path.quadTo(QPointF(0, 3), QPointF(-4, 0))
    p.setPen(QPen(QColor(col).darker(140), 0.6))
    p.setBrush(QColor(col))
    p.drawPath(path)
    p.restore()


def draw_ground_season(p, se):
    """Static seasonal touches on the garden ground (cached with the background): fallen leaves, petals."""
    if se not in ("autumn", "spring"):
        return
    rnd = random.Random(11)
    for _ in range(140 if se == "autumn" else 70):
        x, y = rnd.uniform(10, PW - 10), rnd.uniform(6, PD - 20)
        sx, sy = iso(x, y, 0)
        if se == "autumn":
            _leaf(p, sx, sy, rnd.uniform(0, 360), rnd.choice(LEAF_COLS), rnd.uniform(0.8, 1.3))
        else:
            p.setPen(Qt.NoPen)
            p.setBrush(QColor(255, 200, 218, 220))
            p.drawEllipse(QPointF(sx, sy), 1.8, 1.3)


def draw_falling(p, se, t, trees):
    """Leaves (autumn) or blossom petals (spring) drifting down from the garden trees; every frame."""
    if se not in ("autumn", "spring"):
        return
    for ti, (tx, ty) in enumerate(trees):
        for i in range(7):
            ph = (t * 0.09 + i / 7.0 + ti * 0.31) % 1.0
            x = tx + math.sin(i * 2.3 + ti) * 50 + math.sin(t * 1.3 + i) * 10 + ph * 20
            z = 150 * (1 - ph)
            y = ty - 8 - i * 3
            sx, sy = iso(x, y, z)
            if se == "autumn":
                _leaf(p, sx, sy, t * 120 + i * 50, LEAF_COLS[(i + ti) % 4], 1.1)
            else:
                p.setPen(Qt.NoPen)
                p.setBrush(QColor(255, 196, 214, 230))
                p.drawEllipse(QPointF(sx, sy), 2.0 + math.sin(t * 5 + i) * 0.6, 1.4)


def _holiday_lantern(p, x, y, r, t, col="#e0322b", glow=False):
    sw = 2 * math.sin(t * 1.5 + x)
    p.setPen(QPen(QColor("#6b4a35"), 1.0))
    p.drawLine(QPointF(x, y - r - 8), QPointF(x + sw * 0.3, y - r))
    if glow:
        g = QRadialGradient(QPointF(x + sw, y), r * 2.4)
        g.setColorAt(0, QColor(255, 180, 90, 120))
        g.setColorAt(1, QColor(255, 180, 90, 0))
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        p.drawEllipse(QPointF(x + sw, y), r * 2.4, r * 2.4)
    p.setPen(pen(QColor(col).darker(150).name(), 1.0))
    p.setBrush(QColor(col))
    p.drawEllipse(QPointF(x + sw, y), r, r * 0.85)
    p.setPen(QPen(QColor(col).darker(130), 0.8))
    p.drawLine(QPointF(x + sw, y - r * 0.85), QPointF(x + sw, y + r * 0.85))
    p.setBrush(QColor("#f2c14e"))
    p.setPen(Qt.NoPen)
    p.drawRect(QRectF(x + sw - r * 0.35, y - r * 0.95, r * 0.7, 2.5))
    p.drawRect(QRectF(x + sw - r * 0.35, y + r * 0.75, r * 0.7, 2.5))
    p.setPen(QPen(QColor("#f2c14e"), 1.0))
    for k in (-2, 0, 2):
        p.drawLine(QPointF(x + sw + k, y + r * 0.85 + 2), QPointF(x + sw + k, y + r * 0.85 + 8))


def draw_holiday(p, kind, t, dark):
    """Decorations on the front of the house (the garden view) for a holiday."""
    if not kind:
        return
    x0, x1 = ENTRANCE
    mid = (x0 + x1) / 2
    h = WALL_H
    if kind in ("christmas", "newyear"):
        cols = ("#e53935", "#fdd835", "#43a047", "#1e88e5", "#fb8c00")
        x = 10.0
        i = 0
        while x < PW - 10:
            sx, sy = iso(x, PD, h - 4 - 5 * (0.5 + 0.5 * math.sin(x * 0.07)))
            on = (int(t * 2) + i) % 3 != 0
            c = QColor(cols[i % len(cols)])
            if not on:
                c = c.darker(170)
            elif dark:
                g = QRadialGradient(QPointF(sx, sy + 2), 9)
                cc = QColor(c)
                cc.setAlpha(110)
                g.setColorAt(0, cc)
                cc.setAlpha(0)
                g.setColorAt(1, cc)
                p.setPen(Qt.NoPen)
                p.setBrush(g)
                p.drawEllipse(QPointF(sx, sy + 2), 9, 9)
            p.setPen(Qt.NoPen)
            p.setBrush(c)
            p.drawEllipse(QPointF(sx, sy + 2), 2.2, 3.0)
            x += 26
            i += 1
        if kind == "christmas":
            cx, cy = iso(mid, PD, 82)
            p.setPen(QPen(QColor("#2e7d32"), 5))
            p.setBrush(Qt.NoBrush)
            p.drawEllipse(QPointF(cx, cy), 11, 11)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#e53935"))
            for a in range(0, 360, 60):
                p.drawEllipse(QPointF(cx + math.cos(math.radians(a)) * 11, cy + math.sin(math.radians(a)) * 11), 1.8, 1.8)
            p.drawPolygon(QPolygonF([QPointF(cx - 6, cy + 10), QPointF(cx, cy + 6), QPointF(cx + 6, cy + 10),
                                     QPointF(cx, cy + 14)]))
        else:
            sx, sy = iso(mid, PD, h - 22)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#c62828"))
            r = QRectF(sx - 70, sy - 10, 140, 18)
            p.drawRoundedRect(r, 4, 4)
            p.setPen(QColor("#ffd54f"))
            f = QFont()
            f.setPixelSize(12)
            f.setBold(True)
            p.setFont(f)
            p.drawText(r, Qt.AlignCenter, "新年快乐")
    elif kind == "spring":
        for side in (-1, 1):
            sx, sy = iso(mid + side * (x1 - x0) / 2 + side * 14, PD, 118)
            _holiday_lantern(p, sx, sy, 11, t, glow=dark)
            # 春联
            cx, top = iso(mid + side * ((x1 - x0) / 2 - 7), PD, 96)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#d32f2f"))
            p.drawRect(QRectF(cx - 5, top, 10, 70))
            p.setBrush(QColor("#ffd54f"))
            for k in range(4):
                p.drawEllipse(QPointF(cx, top + 9 + k * 16), 2.4, 2.4)
        cx, cy = iso(mid, PD, 70)
        p.save()
        p.translate(cx, cy)
        p.rotate(45)
        p.setBrush(QColor("#d32f2f"))
        p.drawRect(QRectF(-8, -8, 16, 16))
        p.restore()
        p.setPen(QColor("#ffd54f"))
        f = QFont()
        f.setPixelSize(11)
        f.setBold(True)
        p.setFont(f)
        p.drawText(QRectF(cx - 8, cy - 8, 16, 16), Qt.AlignCenter, "福")
    elif kind == "midautumn":
        for k, xx in enumerate((x0 - 40, x0 - 10, x1 + 10, x1 + 40)):
            sx, sy = iso(xx, PD, 120 - (k % 2) * 8)
            _holiday_lantern(p, sx, sy, 8, t, ("#ef6c00", "#e53935", "#f9a825", "#e53935")[k], glow=dark)
    elif kind == "halloween":
        for side in (-1, 1):
            sx, sy = iso(mid + side * ((x1 - x0) / 2 + 20), PD - 22, 0)
            if dark:
                g = QRadialGradient(QPointF(sx, sy - 8), 26)
                g.setColorAt(0, QColor(255, 160, 40, 120))
                g.setColorAt(1, QColor(255, 160, 40, 0))
                p.setPen(Qt.NoPen)
                p.setBrush(g)
                p.drawEllipse(QPointF(sx, sy - 8), 26, 26)
            p.setPen(pen("#a4511a", 1.0))
            p.setBrush(QColor("#f57c00"))
            for dx in (-5, 0, 5):
                p.drawEllipse(QPointF(sx + dx, sy - 9), 6, 9)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#5d8a3a"))
            p.drawRect(QRectF(sx - 1.2, sy - 21, 2.4, 5))
            p.setBrush(QColor("#ffe082") if dark else QColor("#4e2a12"))
            p.drawPolygon(QPolygonF([QPointF(sx - 6, sy - 11), QPointF(sx - 3, sy - 14), QPointF(sx - 1, sy - 11)]))
            p.drawPolygon(QPolygonF([QPointF(sx + 1, sy - 11), QPointF(sx + 3, sy - 14), QPointF(sx + 6, sy - 11)]))
            p.drawChord(QRectF(sx - 6, sy - 9, 12, 6), 180 * 16, 180 * 16)
        # a bat or two fluttering near the roof
        for i in range(2):
            bx = PW * (0.3 + 0.4 * i) + math.sin(t * 0.7 + i * 3) * 60
            sx, sy = iso(bx, PD, h + 30 + 10 * math.sin(t * 1.3 + i))
            fl = 4 * math.sin(t * 14 + i)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#37304a"))
            path = QPainterPath(QPointF(sx - 9, sy - fl))
            path.quadTo(QPointF(sx - 4, sy - 2), QPointF(sx, sy + 1))
            path.quadTo(QPointF(sx + 4, sy - 2), QPointF(sx + 9, sy - fl))
            path.quadTo(QPointF(sx + 4, sy + 3), QPointF(sx, sy + 3))
            path.quadTo(QPointF(sx - 4, sy + 3), QPointF(sx - 9, sy - fl))
            p.drawPath(path)


def holiday_now(names=()):
    """Which decorations to put up today: christmas / newyear / halloween / spring / midautumn / None."""
    import datetime
    d = datetime.date.today()
    md = (d.month, d.day)
    text = " ".join(names).lower()
    if any(k in text for k in ("春节", "spring festival", "chinese new year", "lunar new year", "元宵", "lantern")):
        return "spring"
    if any(k in text for k in ("中秋", "mid-autumn", "mid autumn")):
        return "midautumn"
    if (12, 18) <= md <= (12, 29):
        return "christmas"
    if md >= (12, 30) or md <= (1, 2):
        return "newyear"
    if (10, 24) <= md <= (10, 31):
        return "halloween"
    return None


# ---- (v26) more places to land on the bigger surfaces, so cats can hop around the room freely -------------------
EXTRA_PERCHES = {
    "bed": [(-28, -10, 34), (28, -10, 34), (-28, 30, 34), (28, 30, 34)],
    "kid_bed": [(-14, -10, 34), (14, 30, 34)],
    "sofa": [(-44, -6, 33), (0, -6, 33), (-46, 18, 60), (0, 18, 60)],
    "table": [(-44, -4, 53), (48, 4, 53)],
    "desk": [(-26, -20, 52)],
    "counter": [(-18, -4, 58)],
    "wardrobe": [(-28, 0, 132), (28, 0, 132)],
    "tv": [(24, -4, 32)],
    "side_cabinet": [(-18, 0, 53)],
    "shoe_cabinet": [(-25, 0, 44), (25, 0, 44)],
    "bench": [(-34, 0, 26)],
}
for _t, _pts in EXTRA_PERCHES.items():
    if _t in CATALOG:
        CATALOG[_t]["spots"] = list(CATALOG[_t]["spots"]) + [S("perch", u, v, h, auto=True) for u, v, h in _pts]


# ---- (v26) room lights: a ceiling light where a room has no floor lamp, a switch on the wall of every room -------
def switch_pos(f, room):
    """(x, y, z) of a room's light switch: low on the back wall, near the room's left corner (out of the way)."""
    lab, x0, y0, x1, y1, st = rooms(f)[room]
    if y1 >= PD - 0.5:
        return x0 + 24.0, PD, 66.0
    return x0 + 18.0, y1, IN_H - 9.0                 # on the cut-down wall at the back of the room


def switch_rect(f, room):
    x, y, z = switch_pos(f, room)
    sx, sy = iso(x, y, z)
    return QRectF(sx - 6, sy - 8, 12, 16)


def draw_switch(p, f, room, on):
    r = switch_rect(f, room)
    p.setPen(pen("#9a8a76", 1.0))
    p.setBrush(QColor("#fbf8f2"))
    p.drawRoundedRect(r, 2, 2)
    k = r.adjusted(3.5, 3, -3.5, -3)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#d9d2c4"))
    p.drawRoundedRect(k, 1.5, 1.5)
    half = QRectF(k.left(), k.top() if on else k.center().y(), k.width(), k.height() / 2)
    p.setBrush(QColor("#f2b84b") if on else QColor("#a99f90"))
    p.drawRoundedRect(half, 1.2, 1.2)


def ceiling_pos(f, room):
    lab, x0, y0, x1, y1, st = rooms(f)[room]
    return (x0 + x1) / 2, (max(y0, 0.0) + y1) / 2, 124.0


def draw_ceiling_light(p, f, room, on):
    x, y, z = ceiling_pos(f, room)
    top = iso(x, y, z + 46)
    sx, sy = iso(x, y, z)
    p.setPen(QPen(QColor("#6b5a4a"), 1.2))
    p.drawLine(QPointF(top[0], top[1]), QPointF(sx, sy - 8))
    shade = QPainterPath(QPointF(sx - 15, sy + 2))
    shade.quadTo(QPointF(sx - 13, sy - 10), QPointF(sx, sy - 10))
    shade.quadTo(QPointF(sx + 13, sy - 10), QPointF(sx + 15, sy + 2))
    shade.closeSubpath()
    p.setPen(pen("#8a6248", 1.0))
    p.setBrush(QColor("#f6e4c4") if on else QColor("#e8dccb"))
    p.drawPath(shade)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#fff3b0") if on else QColor("#d7d0c4"))
    p.drawEllipse(QPointF(sx, sy + 2.5), 5, 3)
