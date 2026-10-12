# -*- coding: utf-8 -*-
"""Art: colours, geometry, poses and all QPainter drawing (cats, accessories, toys, effects)."""

import math
import random
from collections import OrderedDict

from PySide6.QtCore import Qt, QPointF, QRectF
from PySide6.QtGui import (QBrush, QColor, QFont, QLinearGradient, QPainter, QPainterPath, QPen,
                           QPixmap, QRadialGradient, QTransform)

CAT_W, CAT_H = 150.0, 100.0     # drawing space of one cat (units)
GROUND = 92.0                   # y of the ground line in cat units
TOP = 62                        # px above the cat reserved for speech bubbles (two lines)
LW = 1.9                        # outline width (cat units)
PI = math.pi
STRIDE_WALK = 19.4              # cat units travelled per walk cycle (paws stay planted)
STRIDE_RUN = 72.0               # cat units travelled per gallop cycle

# ==========================================================================
# 2. Colours & geometry helpers
# ==========================================================================
DEFAULT_COLORS = {
    "calico": dict(
        base="#fcf8f1", belly="#ffffff", back="#f3ece1", outline="#5a463e",
        orange="#ee9646", black="#3f3634",
        eye_hi="#f7d669", eye_lo="#d48f1f", nose="#f0909b", earin="#f6b7b9", muzzle="#ffffff",
        pad="#f3a3ab"),
    "tabby": dict(
        base="#a38c6b", belly="#ebe0c9", back="#7b674a", outline="#3c3024",
        stripe="#3a2e23", eye_hi="#d3e57a", eye_lo="#6f9a35", nose="#c27a6c",
        earin="#e8aaa3", muzzle="#f2eadb", pad="#c9857c"),
}
# coats for cats that only visit the garden (no patches or stripes: their pattern is plain)
VISITOR_COLORS = {
    "v_black": dict(stripe="#3b3537", base="#3b3537", belly="#4a4345", back="#2f2a2c", outline="#1d1a1b", eye_hi="#f2d35c",
                    eye_lo="#c79a1e", nose="#6b4a50", earin="#7a5a60", muzzle="#4f4749", pad="#5c4a4e"),
    "v_ginger": dict(stripe="#c9752e", base="#f0a25a", belly="#fbe3c4", back="#de8a3e", outline="#7a4a22", eye_hi="#cfe27a",
                     eye_lo="#7f9e35", nose="#e48a7c", earin="#f6b7a9", muzzle="#fff2e0", pad="#e9998c"),
    "v_gray": dict(stripe="#6c7580", base="#9aa3ad", belly="#d9dee3", back="#7f8892", outline="#3f454c", eye_hi="#9fd6f0",
                   eye_lo="#4f8fb8", nose="#c98a94", earin="#e5b1b8", muzzle="#eef1f4", pad="#c9949c"),
    "v_white": dict(stripe="#f5f3ee", base="#fbfbf8", belly="#ffffff", back="#efeee9", outline="#6d6560", eye_hi="#8fd0f5",
                    eye_lo="#e2b33a", nose="#f2a0aa", earin="#f7c2c6", muzzle="#ffffff", pad="#f3a8b0"),
}
DEFAULT_COLORS.update(VISITOR_COLORS)
COLORS = {k: dict(v) for k, v in DEFAULT_COLORS.items()}
# user-editable colours: key -> label (the "eye" key drives both eye_hi and eye_lo)
COLOR_KEYS = {
    "calico": [("base", "白色毛"), ("orange", "橘色斑"), ("black", "黑色斑"), ("eye", "眼睛")],
    "tabby": [("base", "底色"), ("back", "背部"), ("stripe", "条纹"), ("belly", "肚子"), ("eye", "眼睛")],
}


def apply_colors(overrides):
    """Rebuild COLORS from defaults + {kind: {key: '#rrggbb'}} overrides."""
    for kind, base in DEFAULT_COLORS.items():
        c = dict(base)
        for k, v in (overrides or {}).get(kind, {}).items():
            if k in ("eye", "eye2") and v:
                col = QColor(v)
                c[k + "_hi"] = col.lighter(125).name()
                c[k + "_lo"] = col.darker(135).name()
            elif k in c:
                c[k] = v
        COLORS[kind] = c


def color_value(kind, key):
    c = COLORS[kind]
    if key in ("eye", "eye2"):
        return QColor(c.get(key + "_hi", c["eye_hi"])).darker(110).name()
    return c[key]


def qc(h, a=255):
    c = QColor(h)
    c.setAlpha(int(a))
    return c


def shade(h, f, a=255):
    c = QColor(h)
    return QColor(int(min(255, c.red() * f)), int(min(255, c.green() * f)),
                  int(min(255, c.blue() * f)), int(a))


def clamp(v, lo, hi):
    return lo if v < lo else hi if v > hi else v


def lerp(a, b, t):
    return a + (b - a) * t


def ell(cx, cy, rx, ry):
    p = QPainterPath()
    p.addEllipse(QPointF(cx, cy), rx, ry)
    return p


def rot_ell(cx, cy, rx, ry, deg):
    t = QTransform()
    t.translate(cx, cy)
    t.rotate(deg)
    return t.map(ell(0, 0, rx, ry))


def blob(cx, cy, rx, ry, seed):
    """Organic fur patch: a wobbly ellipse."""
    n = 10
    pts = []
    for i in range(n):
        a = 2 * PI * i / n
        f = 1 + 0.13 * math.sin(3 * a + seed * 1.7) + 0.07 * math.cos(5 * a + seed)
        pts.append(QPointF(cx + rx * f * math.cos(a), cy + ry * f * math.sin(a)))
    path = QPainterPath()
    path.moveTo((pts[-1] + pts[0]) / 2)
    for i in range(n):
        path.quadTo(pts[i], (pts[i] + pts[(i + 1) % n]) / 2)
    path.closeSubpath()
    return path


def round_tri(a, b, tip, k=0.8):
    """Triangle a-b-tip with a rounded tip (ears)."""
    pa = QPointF(lerp(a[0], tip[0], k), lerp(a[1], tip[1], k))
    pb = QPointF(lerp(b[0], tip[0], k), lerp(b[1], tip[1], k))
    path = QPainterPath(QPointF(*a))
    path.lineTo(pa)
    path.quadTo(QPointF(*tip), pb)
    path.lineTo(QPointF(*b))
    path.closeSubpath()
    return path


def curve_path(pts):
    path = QPainterPath(QPointF(pts[0], pts[1]))
    path.cubicTo(QPointF(pts[2], pts[3]), QPointF(pts[4], pts[5]), QPointF(pts[6], pts[7]))
    return path


def _split(P, t):
    """de Casteljau split of a cubic (4 (x, y) points) at t -> (left, right)."""
    a, b, c, d = P
    ab = (lerp(a[0], b[0], t), lerp(a[1], b[1], t))
    bc = (lerp(b[0], c[0], t), lerp(b[1], c[1], t))
    cd = (lerp(c[0], d[0], t), lerp(c[1], d[1], t))
    abc = (lerp(ab[0], bc[0], t), lerp(ab[1], bc[1], t))
    bcd = (lerp(bc[0], cd[0], t), lerp(bc[1], cd[1], t))
    m = (lerp(abc[0], bcd[0], t), lerp(abc[1], bcd[1], t))
    return [a, ab, abc, m], [m, bcd, cd, d]


def sub_cubic(pts, t0, t1):
    P = [(pts[0], pts[1]), (pts[2], pts[3]), (pts[4], pts[5]), (pts[6], pts[7])]
    left, _ = _split(P, t1)
    _, mid = _split(left, t0 / t1 if t1 > 0 else 0)
    path = QPainterPath(QPointF(*mid[0]))
    path.cubicTo(QPointF(*mid[1]), QPointF(*mid[2]), QPointF(*mid[3]))
    return path


def cubic_at(pts, t):
    """Point and unit normal of a cubic at parameter t."""
    u = 1 - t
    x = u ** 3 * pts[0] + 3 * u * u * t * pts[2] + 3 * u * t * t * pts[4] + t ** 3 * pts[6]
    y = u ** 3 * pts[1] + 3 * u * u * t * pts[3] + 3 * u * t * t * pts[5] + t ** 3 * pts[7]
    dx = 3 * u * u * (pts[2] - pts[0]) + 6 * u * t * (pts[4] - pts[2]) + 3 * t * t * (pts[6] - pts[4])
    dy = 3 * u * u * (pts[3] - pts[1]) + 6 * u * t * (pts[5] - pts[3]) + 3 * t * t * (pts[7] - pts[5])
    n = math.hypot(dx, dy) or 1.0
    return x, y, -dy / n, dx / n


def quad_at(L, t):
    u = 1 - t
    x = u * u * L[0] + 2 * u * t * L[2] + t * t * L[4]
    y = u * u * L[1] + 2 * u * t * L[3] + t * t * L[5]
    dx = 2 * u * (L[2] - L[0]) + 2 * t * (L[4] - L[2])
    dy = 2 * u * (L[3] - L[1]) + 2 * t * (L[5] - L[3])
    n = math.hypot(dx, dy) or 1.0
    return x, y, -dy / n, dx / n


# ==========================================================================
# 3. Poses  (facing right; coordinates in cat units, ground at y = 92)
# ==========================================================================
XK = ("bx", "cx", "hpx", "hx", "pvx")
YK = ("by", "cy", "hpy", "hy", "pvy")
LK = ("nf", "ff", "nh", "fh", "tail")
LEGS = ("nf", "ff", "nh", "fh")

STAND = dict(
    bx=67, by=58, brx=28, bry=14.5, brot=0,
    cx=88, cy=57, cr=13.5,
    hpx=45, hpy=59, hprx=15.5, hpry=15.5,
    hx=104, hy=38, hrot=0, hs=1.1,
    nf=[88, 63, 89, 76, 90, 88], ff=[81, 63, 80, 76, 81, 88],
    nh=[47, 66, 38, 79, 43, 88], fh=[53, 66, 45, 79, 50, 88],
    tail=[40, 52, 25, 44, 19, 26, 28, 14], tw=8.5,
    ear=0.0, rot=0.0, pvx=75, pvy=10, lookx=0.0, looky=0.0, blush=0.0,
    eyes="open", mouth="w", tail_front=False, bowl=False, acc_h=None, acc_b=None,
)


def P(base, **kw):
    q = dict(base)
    for k in LK:
        q[k] = list(q[k])
    q.update(kw)
    return q


def shift(q, dx, dy):
    q = dict(q)
    for k in XK:
        q[k] = q[k] + dx
    for k in YK:
        q[k] = q[k] + dy
    for k in LK:
        q[k] = [v + (dx if i % 2 == 0 else dy) for i, v in enumerate(q[k])]
    return q


SIT = P(STAND, bx=66, by=65, brx=15, bry=20, brot=-14, cx=77, cy=58, cr=14,
        hpx=55, hpy=76, hprx=19, hpry=14, hx=84, hy=33,
        nf=[80, 63, 82, 76, 84, 88], ff=[73, 65, 75, 77, 77, 88],
        nh=[58, 82, 66, 87, 73, 88], fh=[62, 82, 69, 87, 76, 88],
        tail=[41, 80, 31, 88.5, 63, 89.5, 79, 84], tail_front=True)

CROUCH = P(STAND, bx=66, by=71, brx=29, bry=13, brot=4, cx=87, cy=74, cr=11.5,
           hpx=46, hpy=70, hprx=16, hpry=15, hx=102, hy=61,
           nf=[88, 78, 96, 84, 100, 88], ff=[82, 78, 88, 85, 94, 88],
           nh=[46, 74, 35, 84, 44, 88], fh=[52, 74, 41, 84, 50, 88],
           tail=[38, 66, 26, 70, 16, 80, 8, 84], eyes="big", ear=0.15)

SLEEP = P(STAND, bx=70, by=77, brx=31, bry=13, brot=0, cx=90, cy=79, cr=11,
          hpx=48, hpy=77, hprx=18, hpry=14, hx=101, hy=71, hrot=14, hs=1.05,
          nf=[92, 83, 102, 87, 111, 88], ff=[86, 83, 95, 87, 103, 89],
          nh=[50, 85, 58, 88, 66, 89], fh=[55, 85, 62, 88, 70, 89],
          tail=[36, 79, 30, 88, 74, 88.5, 100, 85.5], tail_front=True, eyes="sleep", ear=0.2)

LOAF = P(SLEEP, bx=70, by=76, brx=28, bry=14, cx=88, cy=77, cr=12,
         hpx=50, hpy=76, hprx=17, hpry=14, hx=99, hy=57, hrot=0, hs=1.1,
         nf=[90, 85, 95, 88, 99, 89], ff=[85, 85, 90, 88, 94, 89],
         nh=[50, 86, 56, 88, 62, 89], fh=[54, 86, 60, 88, 66, 89],
         tail=[40, 79, 32, 87.5, 72, 88.5, 90, 85.5], eyes="half", ear=0.0)

STRETCH = P(STAND, bx=63, by=63, brx=28, bry=12.5, brot=15, cx=86, cy=72, cr=11.5,
            hpx=43, hpy=54, hprx=15, hpry=14.5, hx=99, hy=59, hrot=6,
            nf=[90, 76, 106, 85, 121, 88], ff=[86, 77, 101, 86, 113, 88],
            nh=[45, 61, 41, 76, 45, 88], fh=[51, 61, 47, 76, 51, 88],
            tail=[35, 48, 27, 36, 29, 22, 38, 16], eyes="closed", mouth="yawn", ear=0.25)

BELLY = P(STAND, bx=71, by=79, brx=29, bry=12, brot=180, cx=91, cy=77, cr=11,
          hpx=50, hpy=78, hprx=15, hpry=13, hx=108, hy=73, hrot=-30,
          nf=[83, 70, 86, 58, 80, 52], ff=[89, 72, 93, 60, 87, 54],
          nh=[53, 71, 57, 58, 50, 52], fh=[59, 73, 63, 60, 57, 54],
          tail=[42, 84, 28, 91, 18, 89, 11, 83], eyes="happy", blush=1.0, ear=0.3)

ARCH = P(STAND, bx=69, by=48, brx=25, bry=15, brot=0, cx=87, cy=57, cr=12.5,
         hpx=50, hpy=57, hprx=15, hpry=15, hx=104, hy=52, hrot=6,
         nf=[87, 63, 89, 76, 90, 88], ff=[82, 63, 83, 76, 84, 88],
         nh=[50, 64, 48, 77, 50, 88], fh=[56, 64, 54, 77, 56, 88],
         tail=[42, 46, 36, 34, 38, 18, 41, 6], tw=12.5, eyes="wide", mouth="open", ear=0.75)

DANGLE = P(STAND, bx=75, by=57, brx=13, bry=21, brot=0, cx=75, cy=45, cr=12,
           hpx=75, hpy=70, hprx=14, hpry=13, hx=75, hy=24, hrot=0,
           nf=[69, 45, 67, 54, 66, 63], ff=[81, 45, 83, 54, 84, 63],
           nh=[70, 74, 69, 83, 68, 91], fh=[80, 74, 81, 83, 82, 91],
           tail=[75, 78, 73, 91, 84, 97, 92, 90], eyes="wide", mouth="open", ear=0.55)


def gait(p, A, lift, stance=0.62):
    """Foot trajectory: planted (sliding back at body speed) then an arcing swing forward."""
    p %= 1.0
    if p < stance:
        return A * (1 - 2 * p / stance), 0.0
    s = (p - stance) / (1 - stance)
    return -A + 2 * A * s * s * (3 - 2 * s), lift * math.sin(PI * s)


def phase_of(c, t, rate):
    return c.gait if c is not None else t * rate


def add_tail_wave(q, t, amp=1.0, speed=2.2):
    q["tail"][4] += 2.5 * amp * math.sin(t * speed - 0.7)
    q["tail"][6] += 4.0 * amp * math.sin(t * speed)
    q["tail"][7] += 1.2 * amp * math.sin(t * speed * 2)


def pose_stand(t, c):
    q = P(STAND)
    add_tail_wave(q, t, 0.8, 1.4)
    b = 0.35 * math.sin(t * 2.4)
    q["by"] += b
    q["cy"] += b
    return q


def walk_legs(q, ph, A=6.0, lift=4.8, offsets=(("nh", 0.0), ("nf", 0.25), ("fh", 0.5), ("ff", 0.75))):
    for key, off in offsets:
        dx, up = gait(ph + off, A, lift)
        sw = up / lift if lift else 0
        L = q[key]
        L[4] += dx
        L[5] -= up
        if key in ("nf", "ff"):
            L[2] += dx * 0.45 - 2.0 * sw
            L[3] -= up * 0.6
        else:
            L[2] += dx * 0.45 - 3.0 * sw
            L[3] -= up * 0.35


def pose_walk(t, c):
    q = P(STAND)
    ph = phase_of(c, t, 1.76)
    ws = getattr(c, "walk_scale", 1.0) if c is not None else 1.0
    walk_legs(q, ph, A=6.0 * ws, lift=4.8 * min(ws, 1.3))      # (v26: house cats take bigger, clearer steps)
    w = 2 * PI * ph
    bob = 0.75 * math.cos(2 * w)
    for k in ("by", "cy", "hpy"):
        q[k] += bob
    for key in LEGS:
        q[key][1] += bob
    q["tail"][1] += bob
    q["brot"] = 1.1 * math.sin(w)
    q["hy"] += 0.9 * math.cos(2 * w + 0.9)
    q["hrot"] = 1.8 * math.sin(w + 0.5)
    add_tail_wave(q, t, 1.0, 2.6)
    return q


def pose_run(t, c, freeze=None):
    ph = 2 * PI * phase_of(c, t, 2.4) if freeze is None else freeze
    e, co = math.sin(ph), math.cos(ph)
    air = max(0.0, e)
    q = P(STAND)
    q.update(brx=29 + 2.5 * e, bry=13.5 - 1.0 * e, by=56 - 3 * air, brot=-3 * co,
             cx=90 + 3 * e, cy=56 - 2 * air, hpx=44 - 3 * e, hpy=58 - 2.5 * air,
             hx=108 + 2 * e, hy=42 - 2 * air + 1.2 * co, ear=0.45)

    def front(ph2, back):
        e2, c2 = math.sin(ph2), math.cos(ph2)
        sx, sy = q["cx"] - 2 - back, q["cy"] + 6
        px = 93 + 16 * e2 - back
        py = 86 - 6 * max(0.0, e2) - 6 * max(0.0, -c2) * (1 - max(0.0, e2))
        return [sx, sy, (sx + px) / 2 - 2 - 4 * max(0.0, -e2), (sy + py) / 2 + 1, px, py]

    def hind(ph2, back):
        e2 = math.sin(ph2)
        hx, hy = q["hpx"] + 2 - back, q["hpy"] + 6
        px = 44 - 17 * e2 - back
        py = 86 - 5 * max(0.0, e2) - 4 * max(0.0, -e2)
        return [hx, hy, (hx + px) / 2 - 6 + 4 * e2, (hy + py) / 2 + 3, px, py]

    q["nf"], q["ff"] = front(ph, 0), front(ph - 0.55, 6)
    q["nh"], q["fh"] = hind(ph - 0.3, 0), hind(ph - 0.85, -5)
    q["tail"] = [40, 52, 26, 47 + 1.5 * e, 14, 44 + 3 * e, 4, 40 + 5 * math.sin(ph + 1)]
    return q


def jump_info(c):
    """(progress 0..1, nose-up angle in degrees) of the leap a cat is in."""
    if c is None:
        return 0.5, 0.0
    ji = getattr(c, "jump_info", None)
    if ji is not None:
        return ji
    if getattr(c, "airborne", False) and hasattr(c, "valt"):
        sc = getattr(c, "sc", 1.0) or 1.0
        ang = math.degrees(math.atan2(c.valt / sc, abs(getattr(c, "vx", 0.0)) / sc + 160.0))
        return (0.3 if c.valt > 0 else 0.75), ang
    return 0.5, 0.0


def pose_jump(t, c):
    """A leap in three beats: push-off (nose up, front paws reaching, hind legs straight behind),
    a stretched glide over the top, and the drop (nose down, front paws reaching for the landing,
    hind legs tucked)."""
    k, ang = jump_info(c)
    ang = max(-50.0, min(55.0, ang))
    up = ang / 55.0 if ang > 0 else ang / 50.0
    q = pose_run(0, c, freeze=PI / 2)
    if up > 0:
        f = up
        for key in ("nf", "ff"):
            L = q[key]
            L[2] += 3 * f
            L[3] -= 6 * f
            L[4] += 6 * f
            L[5] -= 14 * f
        for key in ("nh", "fh"):
            L = q[key]
            L[2] -= 3 * f
            L[4] -= 8 * f
            L[5] += 3 * f
        q["hy"] -= 3 * f
    else:
        f = -up
        for key in ("nf", "ff"):
            L = q[key]
            L[2] += 2 * f
            L[3] += 4 * f
            L[4] -= 2 * f
            L[5] += 6 * f
        for key in ("nh", "fh"):
            L = q[key]
            L[2] += 7 * f
            L[3] -= 4 * f
            L[4] += 16 * f
            L[5] -= 10 * f
        q["hy"] += 2 * f
    # the tail streams out behind, a little above the body on the way down
    tl = q["tail"]
    for i in (3, 5, 7):
        tl[i] += (i - 1) * 1.6 * up
    stretch = 1.0 - abs(up)
    q["brx"] += 2.0 * stretch
    q["rot"] = -ang * 0.72
    q["pvx"], q["pvy"] = 70.0, 60.0
    q["ear"] = 0.35 + 0.25 * abs(up)
    q["eyes"] = "big" if k < 0.8 else "wide"
    return q


def pose_sit(t, c):
    q = P(SIT)
    s = math.sin(t * 1.3)
    q["tail"][6] += 2.5 * s
    q["tail"][7] -= 3.5 * max(0.0, s)
    b = 0.45 * math.sin(t * 2.2)
    q["by"] += b
    q["cy"] += b * 0.8
    q["hy"] += b * 0.5
    q["hrot"] = 4 * math.sin(t * 0.55)
    return q


def pose_loaf(t, c):
    q = P(LOAF)
    b = 0.5 * math.sin(t * 2.0)
    q["bry"] += b * 0.6
    q["hy"] += b * 0.4
    q["tail"][6] += 2 * math.sin(t * 0.9)
    q["hrot"] = 3 * math.sin(t * 0.4)
    return q


def pose_stretch(t, c):
    q = P(STRETCH)
    q["tail"][6] += 2 * math.sin(t * 2)
    return q


def pose_belly(t, c):
    q = P(BELLY)
    w = math.sin(t * 3.2)
    for key, k in (("nf", 1.0), ("ff", -0.8), ("nh", -1.0), ("fh", 0.9)):
        q[key][4] += 1.6 * w * k
        q[key][5] += 1.0 * w * k
    q["hrot"] += 5 * math.sin(t * 1.6)
    q["tail"][6] += 3 * math.sin(t * 1.4)
    return q


def pose_arch(t, c):
    q = P(ARCH)
    q["tail"][6] += 1.2 * math.sin(t * 20)
    return q


def pose_groom(t, c):
    q = pose_sit(t, c)
    w = math.sin(t * 6)
    q.update(nf=[80, 62, 92, 64, 95, 49 + 2 * w], hx=83, hy=34 + 0.8 * w, hrot=-10,
             eyes="closed", mouth="tongue")
    return q


def pose_greet(t, c):
    q = pose_sit(t, c)
    w = math.sin(t * 9)
    q.update(nf=[80, 61, 97, 50, 108 + 3 * w, 31 - 2 * math.cos(t * 9)], hrot=-6,
             eyes="happy", mouth="open", blush=1.0, ear=0.1)
    return q


def pose_swat(t, c):
    q = pose_sit(t, c)
    s = 0.5 + 0.5 * math.sin(t * 11)
    s = s * s * (3 - 2 * s)
    q.update(nf=[80, 61, 92 + 4 * s, 64 - 6 * s, 96 + 14 * s, 72 - 24 * s], eyes="big", ear=0.3, hrot=-4)
    return q


def pose_happy(t, c):
    q = pose_sit(t, c)
    q.update(hrot=7 * math.sin(t * 2.4), eyes="happy", blush=1.0, ear=0.25)
    return q


def pose_nuzzle(t, c):
    q = pose_sit(t, c)
    q.update(hx=93, hy=39, hrot=16 + 4 * math.sin(t * 3), eyes="happy", blush=1.0, ear=0.2)
    return q


def pose_groom_other(t, c):
    q = pose_sit(t, c)
    q.update(hx=95, hy=41 + 1.2 * math.sin(t * 7), hrot=22, eyes="closed", mouth="tongue")
    return q


def pose_beg(t, c):
    q = pose_sit(t, c)
    q.update(hrot=10, eyes="big", blush=0.4, mouth="open" if math.sin(t * 3) > 0.2 else "w")
    return q


def pose_yawn(t, c):
    q = pose_sit(t, c)
    q.update(hrot=-16, hy=32, eyes="closed", mouth="yawn", ear=0.25)
    return q


def pose_sleep(t, c):
    q = P(SLEEP)
    b = math.sin(t * 2 * PI * 0.25)
    q["bry"] += 0.8 * b
    q["hpry"] += 0.5 * b
    q["hy"] -= 0.4 * b
    return q


def pose_eat(t, c):
    q = shift(P(STAND), -14, 0)
    q.update(hx=96, hy=65 + 1.3 * math.sin(t * 9), hrot=24, eyes="closed", bowl=True)
    add_tail_wave(q, t, 0.7, 1.2)
    return q


def pose_crouch(t, c):
    q = P(CROUCH)
    if c is not None and c.state in ("stalk", "hunt"):
        walk_legs(q, c.gait, A=4.5, lift=2.5)
        q["tail"][7] += 2 * math.sin(t * 3)
        return q
    w = 1.6 * math.sin(t * 14)
    for k in ("bx", "hpx"):
        q[k] += w
    q["nh"][0] += w
    q["fh"][0] += w
    q["tail"][5] += 4 * math.sin(t * 9)
    q["tail"][7] += 4 * math.sin(t * 9 + 1)
    return q


def pose_land(t, c):
    q = P(CROUCH)
    q.update(eyes="wide", ear=0.4)
    return q


def pose_dangle(t, c):
    q = P(DANGLE)
    s = math.sin(t * 5)
    for key in ("nf", "ff"):
        q[key][4] += 1.5 * s
    for key in ("nh", "fh"):
        q[key][4] -= 1.5 * s
    q["tail"][6] += 3 * s
    q["rot"] = c.swing * c.facing if (c is not None and c.state == "dragged") else 0.0
    return q


def pose_pant(t, c):
    q = pose_sit(t, c)
    q.update(eyes="half", mouth="tongue", ear=0.2, hrot=-4 + 2 * math.sin(t * 9))
    q["by"] += 0.6 * math.sin(t * 9)
    q["cy"] += 0.6 * math.sin(t * 9)
    return q


def pose_annoyed(t, c):
    q = pose_run(t, c)
    q["eyes"] = "squint"
    q["mouth"] = "open"
    return q


def pose_cradle(t, c):
    """Held in someone's arms: curled up, head up, looking around (eyes half shut when content)."""
    q = pose_loaf(t, c)
    content = c is not None and getattr(c, "src", None) is not None and c.src.stats.get("mood", 60) > 55
    q.update(hy=q["hy"] - 5, hx=q["hx"] - 2, hrot=-8 + 5 * math.sin(t * 0.7),
             eyes="happy" if content and math.sin(t * 0.4) > 0.2 else "open", ear=0.05)
    q["tail"][6] += 3 * math.sin(t * 1.1)
    return q


def pose_wriggle(t, c):
    """Had enough of being held: squirming, legs pedalling."""
    q = P(DANGLE)
    s = math.sin(t * 15)
    for key, k in (("nf", 1.0), ("ff", -1.0), ("nh", -1.0), ("fh", 1.0)):
        q[key][4] += 4 * s * k
        q[key][5] -= 3 * max(0.0, s * k)
    q["tail"][6] += 6 * math.sin(t * 9)
    q.update(rot=9 * s, pvx=75, pvy=55, eyes="squint", mouth="open", ear=0.7)
    return q


def pose_kick(t, c):
    """On its back, front paws hugging the hand and hind legs bunny-kicking it."""
    q = P(BELLY)
    w = math.sin(t * 17)
    for key, k in (("nh", 1.0), ("fh", -1.0)):
        q[key][2] += 4 * w * k
        q[key][4] += 7 * w * k
        q[key][5] -= 4 * max(0.0, w * k)
    for key in ("nf", "ff"):
        q[key][4] += 6
        q[key][5] -= 4
    q.update(eyes="squint", mouth="open", blush=0.0, ear=0.6)
    q["hrot"] += 8 * math.sin(t * 9)
    q["tail"][6] += 5 * math.sin(t * 12)
    return q


def pose_grumpy(t, c):
    """Woken up / bothered: ears back, eyes narrowed, the tail tip flicking."""
    q = pose_sit(t, c)
    q.update(eyes="squint", ear=0.85, hrot=-4, mouth="w")
    q["tail"][6] += 5 * math.sin(t * 13)
    q["tail"][7] += 3 * math.sin(t * 13 + 1)
    return q


def pose_lick(t, c):
    """Licking a treat held out: neck stretched up and forward, tongue going."""
    q = pose_sit(t, c)
    w = math.sin(t * 10)
    q.update(hx=q["hx"] + 6, hy=q["hy"] - 3, hrot=-14 + 3 * w, eyes="happy", blush=0.8,
             mouth="tongue" if w > -0.3 else "w", ear=0.05)
    q["tail"][6] += 3 * math.sin(t * 2)
    return q


POSES = {
    "lick": pose_lick,
    "grumpy": pose_grumpy,
    "cradle": pose_cradle, "wriggle": pose_wriggle, "kick": pose_kick,
    "stand": pose_stand, "walk": pose_walk, "run": pose_run, "jump": pose_jump,
    "sit": pose_sit, "loaf": pose_loaf, "stretch": pose_stretch, "belly": pose_belly,
    "arch": pose_arch, "groom": pose_groom, "greet": pose_greet, "swat": pose_swat,
    "happy": pose_happy, "nuzzle": pose_nuzzle, "groom_other": pose_groom_other,
    "beg": pose_beg, "yawn": pose_yawn, "sleep": pose_sleep, "eat": pose_eat,
    "crouch": pose_crouch, "land": pose_land, "dangle": pose_dangle, "annoyed": pose_annoyed,
    "pant": pose_pant,
}
BLEND_DUR = {"stretch": 0.55, "belly": 0.55, "sleep": 0.45, "loaf": 0.4, "run": 0.14,
             "walk": 0.16, "jump": 0.1, "annoyed": 0.12, "arch": 0.08, "dangle": 0.12}
SIT_POSES = ("sit", "happy", "greet", "beg", "groom", "yawn", "swat", "nuzzle", "groom_other", "pant")
CALM_POSES = ("sit", "loaf", "sleep", "stand", "happy", "beg", "groom", "eat", "land", "belly",
              "nuzzle", "groom_other", "yawn", "pant")
RUN_POSES = ("run", "annoyed", "jump")


def blend(a, b, t):
    if t >= 1:
        return b
    out = {}
    for k, vb in b.items():
        va = a.get(k, vb)
        if isinstance(vb, list):
            out[k] = [lerp(x, y, t) for x, y in zip(va, vb)]
        elif isinstance(vb, (int, float)) and not isinstance(vb, bool):
            out[k] = lerp(va, vb, t)
        else:
            out[k] = vb if t > 0.5 else va
    return out


# ==========================================================================
# 4. Drawing
# ==========================================================================
def shade_overlay(p, rect, top=38, bottom=48):
    g = QLinearGradient(0, rect.top(), 0, rect.bottom())
    g.setColorAt(0.0, QColor(255, 255, 255, top))
    g.setColorAt(0.5, QColor(255, 255, 255, 0))
    g.setColorAt(1.0, QColor(40, 20, 10, bottom))
    p.fillRect(rect.adjusted(-2, -2, 2, 2), g)


def fill_with_outline(p, shapes, brush, C, alpha=255, ow=LW):
    """Silhouette technique: stroke all sub-shapes with a 2*ow outline first, then fill them.
    Internal seams vanish and only the outer contour keeps an outline - no path booleans."""
    p.setPen(QPen(qc(C["outline"], alpha), 2 * ow, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin))
    p.setBrush(qc(C["outline"], alpha))
    for s in shapes:
        p.drawPath(s)
    p.setPen(Qt.NoPen)
    p.setBrush(brush)
    for s in shapes:
        p.drawPath(s)


LEG_W0, LEG_W1 = 9.8, 7.2


def leg_shapes(L):
    """Tapered limb (thick at the hip, slimmer at the paw) along a quadratic curve."""
    n = 8
    left, right = [], []
    for i in range(n + 1):
        t = i / n
        x, y, nx, ny = quad_at(L, t)
        w = lerp(LEG_W0, LEG_W1, t) / 2
        left.append(QPointF(x + nx * w, y + ny * w))
        right.append(QPointF(x - nx * w, y - ny * w))
    poly = QPainterPath(left[0])
    for pt in left[1:]:
        poly.lineTo(pt)
    for pt in reversed(right):
        poly.lineTo(pt)
    poly.closeSubpath()
    lift = clamp((86.5 - L[5]) / 6.0, 0.0, 1.0)
    paw = rot_ell(L[4] + 1.2, L[5] - 0.1, 5.4, 3.8, 24 * lift)
    hip = ell(L[0], L[1], LEG_W0 / 2, LEG_W0 / 2)
    return [hip, poly, paw], lift


def leg_outline(p, shapes, C, alpha=255, ow=LW):
    p.setPen(QPen(qc(C["outline"], alpha), 2 * ow, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin))
    p.setBrush(qc(C["outline"], alpha))
    for s in shapes:
        p.drawPath(s)


def leg_fill(p, L, shapes, lift, C, kind, far):
    f = 0.84 if far else 1.0
    g = QLinearGradient(0, min(L[1], L[5]) - 5, 0, max(L[1], L[5]) + 5)
    g.setColorAt(0, shade(C["base"], f * 1.04))
    g.setColorAt(1, shade(C["base"], f * 0.9))
    p.setPen(Qt.NoPen)
    p.setBrush(QBrush(g))
    p.drawPath(shapes[0])
    p.drawPath(shapes[1])
    p.setBrush(shade(C["belly"] if kind == "calico" else C["base"], f))
    p.drawPath(shapes[2])
    if kind == "tabby":
        p.setPen(QPen(qc(C["stripe"], 165), 2.3, Qt.SolidLine, Qt.FlatCap))
        for t in (0.45, 0.62, 0.79):
            x, y, nx, ny = quad_at(L, t)
            w = lerp(LEG_W0, LEG_W1, t) / 2 - 0.4
            p.drawLine(QPointF(x - nx * w, y - ny * w), QPointF(x + nx * w, y + ny * w))
        p.setPen(Qt.NoPen)
        p.setBrush(qc(C["belly"], 140))
        p.drawPath(ell(L[4] + 1.2, L[5] + 0.6, 4.8, 2.6))
    if far:
        return
    if L[5] < L[1] - 10:        # paw pointing up (belly-up): show the toe beans
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(C["pad"]))
        p.drawPath(ell(L[4] + 1.2, L[5] - 0.4, 2.0, 1.3))
        for dx in (-1.9, 0.0, 1.9):
            p.drawPath(ell(L[4] + 1.2 + dx, L[5] - 2.3, 0.75, 0.7))
    elif lift < 0.25 and L[5] - L[1] > 10:
        p.setPen(QPen(qc(C["outline"], 120), 0.8, Qt.SolidLine, Qt.RoundCap))
        for dx in (2.6, 5.0):
            p.drawLine(QPointF(L[4] + dx, L[5] + 1.2), QPointF(L[4] + dx, L[5] + 3.2))


def leg_pen(color, w):
    return QPen(QBrush(color), w, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin)


def draw_tail(p, q, C, kind):
    T = q["tail"]
    curve = curve_path(T)
    tw = q["tw"]
    p.strokePath(curve, leg_pen(QColor(C["outline"]), tw + 2 * LW))
    base = C["orange"] if kind == "calico" else C["base"]
    p.strokePath(curve, leg_pen(QColor(base), tw))
    if kind == "calico":
        p.strokePath(sub_cubic(T, 0.7, 1.0), leg_pen(QColor(C["black"]), tw))
    else:
        p.setPen(QPen(qc(C["stripe"], 205), 2.8, Qt.SolidLine, Qt.FlatCap))
        h = tw / 2 - 0.2
        for f in (0.16, 0.3, 0.44, 0.58, 0.72):
            x, y, nx, ny = cubic_at(T, f)
            p.drawLine(QPointF(x - nx * h, y - ny * h), QPointF(x + nx * h, y + ny * h))
        p.strokePath(sub_cubic(T, 0.85, 1.0), leg_pen(qc(C["stripe"], 235), tw))
    p.strokePath(sub_cubic(T, 0.05, 0.8).translated(-0.6, -1.4),
                 leg_pen(QColor(255, 255, 255, 40), tw * 0.35))


def body_parts(q):
    return [rot_ell(q["bx"], q["by"], q["brx"], q["bry"], q["brot"]),
            ell(q["cx"], q["cy"], q["cr"], q["cr"]),
            ell(q["hpx"], q["hpy"], q["hprx"], q["hpry"])]


def draw_body(p, q, C, kind):
    parts = body_parts(q)
    clip = parts[0].united(parts[1]).united(parts[2])
    r = clip.boundingRect()
    if kind == "tabby":
        g = QLinearGradient(0, r.top(), 0, r.bottom())
        g.setColorAt(0.0, QColor(C["back"]))
        g.setColorAt(0.45, QColor(C["base"]))
        g.setColorAt(1.0, shade(C["base"], 1.08))
        brush = QBrush(g)
    else:
        brush = QBrush(QColor(C["base"]))
    fill_with_outline(p, parts, brush, C)
    long_u = q["brx"] >= q["bry"]
    p.save()
    p.setClipPath(clip, Qt.IntersectClip)
    p.save()
    p.translate(q["bx"], q["by"])
    p.rotate(q["brot"])
    rx, ry = q["brx"], q["bry"]
    if kind == "calico":
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(C["orange"]))
        if long_u:
            p.drawPath(blob(-0.3 * rx, -0.38 * ry, 0.55 * rx, 0.66 * ry, 1))
            p.setBrush(QColor(C["black"]))
            p.drawPath(blob(0.42 * rx, -0.62 * ry, 0.3 * rx, 0.45 * ry, 2))
        else:
            p.drawPath(blob(-0.45 * rx, -0.25 * ry, 0.7 * rx, 0.5 * ry, 1))
            p.setBrush(QColor(C["black"]))
            p.drawPath(blob(-0.55 * rx, -0.75 * ry, 0.45 * rx, 0.3 * ry, 2))
    else:
        p.setPen(QPen(qc(C["stripe"], 200), 3.1, Qt.SolidLine, Qt.RoundCap))
        p.setBrush(Qt.NoBrush)
        path = QPainterPath()
        if long_u:
            u = -rx + 3
            while u < rx - 2:
                path.moveTo(u - 1.5, -ry - 3)
                path.quadTo(QPointF(u + 2.5, -0.1 * ry), QPointF(u - 0.5, 0.42 * ry))
                u += 6.6
        else:
            v = -ry + 4
            while v < ry - 3:
                path.moveTo(-rx - 3, v - 1.5)
                path.quadTo(QPointF(-0.1 * rx, v + 2.5), QPointF(0.45 * rx, v - 0.5))
                v += 6.6
        p.drawPath(path)
        p.setPen(Qt.NoPen)
        p.setBrush(qc(C["belly"], 235))
        if long_u:
            p.drawPath(ell(0, ry * 0.8, rx * 0.8, ry * 0.42))
        else:
            p.drawPath(ell(rx * 0.75, 0, rx * 0.42, ry * 0.8))
    p.restore()
    p.save()
    p.translate(q["hpx"], q["hpy"])
    if kind == "calico":
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(C["orange"]))
        p.drawPath(blob(-2, -6, 0.8 * q["hprx"], 0.6 * q["hpry"], 3))
        p.setBrush(QColor(C["black"]))
        p.drawPath(blob(-0.55 * q["hprx"], 0.15 * q["hpry"], 4.5, 4, 4))
    else:
        p.setPen(QPen(qc(C["stripe"], 185), 2.8, Qt.SolidLine, Qt.RoundCap))
        p.setBrush(Qt.NoBrush)
        for rr in (5.5, 10.5):
            p.drawArc(QRectF(3 - rr, 2 - rr, 2 * rr, 2 * rr), 70 * 16, 200 * 16)
    p.restore()
    p.setPen(Qt.NoPen)
    p.setBrush(qc(C["belly"], 240 if kind == "tabby" else 255))
    p.drawPath(ell(q["cx"] + 3, q["cy"] + 3.5, q["cr"] * 0.78, q["cr"] * 0.9))
    shade_overlay(p, r)
    p.setPen(QPen(qc(C["outline"], 55), 1.2))
    p.setBrush(Qt.NoBrush)
    p.drawArc(QRectF(q["hpx"] - q["hprx"], q["hpy"] - q["hpry"], 2 * q["hprx"], 2 * q["hpry"]),
              -10 * 16, 100 * 16)
    p.restore()


def draw_eye(p, x, y, sx, C, look, style):
    lx, ly = look
    ink = QColor("#2a1f1c")
    if style in ("open", "big", "wide", "half"):
        rx, ry = {"big": (4.7, 5.6), "wide": (4.8, 5.5)}.get(style, (4.4, 5.2))
        rx *= sx
        p.save()
        if style == "half":
            p.setClipRect(QRectF(x - 8, y - 0.6, 16, 10), Qt.IntersectClip)
        p.setPen(Qt.NoPen)
        p.setBrush(ink)
        p.drawPath(ell(x, y, rx + 0.6, ry + 0.6))
        g = QRadialGradient(QPointF(x, y + 1.5), ry * 1.1)
        g.setColorAt(0, QColor(C["eye_hi"]))
        g.setColorAt(1, QColor(C["eye_lo"]))
        p.setBrush(g)
        p.drawPath(ell(x, y, rx - 0.4, ry - 0.4))
        p.setBrush(QColor("#1b1210"))
        cx, cy = x + lx * 1.1 * sx, y + ly * 1.0
        if style == "big":
            p.drawPath(ell(cx, cy, 3.0 * sx, 4.0))
        elif style == "wide":
            p.drawPath(ell(cx, cy, 1.6 * sx, 1.8))
        else:
            p.drawPath(ell(cx, cy, 1.5 * sx, 3.6))
        p.setBrush(QColor(255, 255, 255, 245))
        hr = 1.8 if style == "big" else 1.35
        p.drawPath(ell(x + 1.3 * sx, y - 2.0 + (1.6 if style == "half" else 0), hr * sx, hr))
        p.drawPath(ell(x - 1.4 * sx, y + 2.2, 0.75 * sx, 0.75))
        p.restore()
        if style == "half":
            p.setPen(QPen(ink, 1.5, Qt.SolidLine, Qt.RoundCap))
            p.drawLine(QPointF(x - rx - 0.4, y - 0.4), QPointF(x + rx + 0.4, y - 0.4))
        return
    p.setPen(QPen(ink, 1.5, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin))
    p.setBrush(Qt.NoBrush)
    w = 3.8 * sx
    path = QPainterPath()
    if style == "closed":
        path.moveTo(x - w, y + 0.5)
        path.quadTo(x, y + 3.4, x + w, y + 0.5)
    elif style == "sleep":
        path.moveTo(x - w, y + 1.2)
        path.quadTo(x, y + 3.2, x + w, y + 1.2)
        path.moveTo(x - w + 0.6, y + 2.0)
        path.lineTo(x - w - 0.6, y + 3.2)
    elif style == "happy":
        path.moveTo(x - w, y + 1.8)
        path.quadTo(x, y - 3.6, x + w, y + 1.8)
    elif style == "squint":
        d = 1 if sx > 0.95 else -1
        path.moveTo(x + d * 3, y - 2.8)
        path.lineTo(x - d * 2.6, y)
        path.lineTo(x + d * 3, y + 2.8)
    p.drawPath(path)


_HEAD_CACHE = {}


def head_parts(e):
    key = round(e, 2)
    hit = _HEAD_CACHE.get(key)
    if hit is None:
        parts = [round_tri((-16, -5), (-4.5, -14.5), (-15.5 - 3.5 * e, -27 + 8 * e)),
                 round_tri((3.5, -15), (16.5, -5.5), (17.5 + 3.5 * e, -27 + 8 * e)),
                 ell(0, 0, 17.5, 15.5), ell(-9, 6, 9.5, 7.5), ell(9.5, 6, 9.5, 7.5)]
        clip = parts[0]
        for x in parts[1:]:
            clip = clip.united(x)
        hit = (parts, clip)
        if len(_HEAD_CACHE) > 200:
            _HEAD_CACHE.clear()
        _HEAD_CACHE[key] = hit
    return hit


HEAD_BOX = QRectF(-30, -50, 62, 72)
BODY_BOX = QRectF(-49, -35, 98, 70)
BOWL_BOX = QRectF(102, 74, 41, 22)


def draw_head(p, q, C, kind, cache=None, F=None):
    p.save()
    p.translate(q["hx"], q["hy"])
    p.rotate(q["hrot"])
    p.scale(q["hs"], q["hs"])
    if cache is None:
        head_content(p, q, C, kind)
    else:
        key = ("head", kind, round(q["ear"] * 20), q["eyes"], q["mouth"], round(q["blush"] * 4),
               round(q["lookx"] * 2), round(q["looky"] * 2), q.get("acc_h"))
        draw_layer(p, cache, key, HEAD_BOX, F * q["hs"], lambda pp: head_content(pp, q, C, kind))
    p.restore()


def head_content(p, q, C, kind):
    e = q["ear"]
    parts, shape = head_parts(e)
    r = shape.boundingRect()
    if kind == "tabby":
        g = QLinearGradient(0, r.top(), 0, r.bottom())
        g.setColorAt(0, QColor(C["back"]))
        g.setColorAt(0.55, QColor(C["base"]))
        g.setColorAt(1, shade(C["base"], 1.06))
        brush = QBrush(g)
    else:
        brush = QBrush(QColor(C["base"]))
    fx = 2.0
    fill_with_outline(p, parts, brush, C)
    p.save()
    p.setClipPath(shape, Qt.IntersectClip)
    p.setPen(Qt.NoPen)
    if kind == "calico":
        p.setBrush(QColor(C["orange"]))
        p.drawPath(blob(-14, -11, 13.5, 17, 5))
        p.setBrush(QColor(C["black"]))
        p.drawPath(blob(16, -15, 10, 11.5, 6))
    else:
        p.setBrush(QColor(C["muzzle"]))
        p.drawPath(ell(fx + 0.5, 8.0, 8.0, 5.2))
        p.drawPath(ell(fx - 6.3, 1.5, 4.0, 2.4))
        p.drawPath(ell(fx + 7.8, 1.5, 4.0, 2.4))
        p.setPen(QPen(qc(C["stripe"], 200), 1.9, Qt.SolidLine, Qt.RoundCap))
        for x0, x1 in ((-3.5, -2.5), (1.5, 1.8), (6.5, 5.5)):
            p.drawLine(QPointF(fx + x0, -15.5), QPointF(fx + x1, -8.5))
        for a, b in (((-17, 1.5), (-11.5, 2.8)), ((-17.5, 5.5), (-11.5, 6.0)),
                     ((14.5, 2.2), (19, 1.0)), ((14.5, 5.8), (19.5, 6.2))):
            p.drawLine(QPointF(*a), QPointF(*b))
        p.setPen(Qt.NoPen)
    g2 = QLinearGradient(0, -26, 0, -8)
    g2.setColorAt(0, shade(C["earin"], 1.05))
    g2.setColorAt(1, shade(C["earin"], 0.9))
    p.setBrush(g2)
    p.drawPath(round_tri((-13.5, -7.5), (-6.5, -13), (-14 - 2.8 * e, -23.5 + 7 * e), 0.75))
    p.drawPath(round_tri((5.5, -13.5), (13.5, -8), (15.3 + 2.8 * e, -23.5 + 7 * e), 0.75))
    p.setPen(QPen(QColor(255, 255, 255, 150), 0.7, Qt.SolidLine, Qt.RoundCap))
    p.drawLine(QPointF(-11, -10), QPointF(-12.5, -16))
    p.drawLine(QPointF(10.5, -10.5), QPointF(12.5, -16.5))
    p.setPen(Qt.NoPen)
    rg = QRadialGradient(QPointF(-4, -10), 22)
    rg.setColorAt(0, QColor(255, 255, 255, 45))
    rg.setColorAt(1, QColor(255, 255, 255, 0))
    p.setBrush(rg)
    p.drawRect(QRectF(-30, -32, 60, 50))
    lo = QLinearGradient(0, 4, 0, 14)
    lo.setColorAt(0, QColor(40, 20, 10, 0))
    lo.setColorAt(1, QColor(40, 20, 10, 30))
    p.setBrush(lo)
    p.drawRect(QRectF(-30, 4, 60, 12))
    p.restore()
    if q["blush"] > 0.01:
        p.setPen(Qt.NoPen)
        for bx in (fx - 9.5, fx + 10.5):
            rg = QRadialGradient(QPointF(bx, 5), 4)
            rg.setColorAt(0, QColor(255, 130, 150, int(150 * q["blush"])))
            rg.setColorAt(1, QColor(255, 130, 150, 0))
            p.setBrush(rg)
            p.drawPath(ell(bx, 5, 4.2, 2.6))
    look = (q["lookx"], q["looky"])
    C2 = dict(C, eye_hi=C["eye2_hi"], eye_lo=C["eye2_lo"]) if "eye2_hi" in C else C
    draw_eye(p, fx - 6.6, -1.5, 0.88, C2, look, q["eyes"])
    draw_eye(p, fx + 6.6, -1.5, 1.0, C, look, q["eyes"])
    nx, ny = fx + 0.3, 4.6
    nose = QPainterPath(QPointF(nx - 2.3, ny - 1.1))
    nose.quadTo(QPointF(nx, ny - 1.9), QPointF(nx + 2.3, ny - 1.1))
    nose.quadTo(QPointF(nx + 0.6, ny + 1.6), QPointF(nx, ny + 1.6))
    nose.quadTo(QPointF(nx - 0.6, ny + 1.6), QPointF(nx - 2.3, ny - 1.1))
    p.setPen(QPen(shade(C["nose"], 0.7), 0.7))
    p.setBrush(QColor(C["nose"]))
    p.drawPath(nose)
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 255, 255, 140))
    p.drawPath(ell(nx - 0.8, ny - 0.8, 0.8, 0.45))
    mouth = q["mouth"]
    mpen = QPen(qc(C["outline"], 220), 1.05, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin)
    y0 = ny + 1.6
    if mouth in ("w", "tongue"):
        path = QPainterPath(QPointF(nx, y0))
        path.lineTo(nx, y0 + 1.2)
        path.moveTo(nx - 3.2, y0 + 1.8)
        path.quadTo(QPointF(nx - 1.6, y0 + 3.3), QPointF(nx, y0 + 1.2))
        path.quadTo(QPointF(nx + 1.6, y0 + 3.3), QPointF(nx + 3.2, y0 + 1.8))
        p.setPen(mpen)
        p.setBrush(Qt.NoBrush)
        p.drawPath(path)
        if mouth == "tongue":
            p.setPen(QPen(shade("#f08a99", 0.75), 0.6))
            p.setBrush(QColor("#f59aa6"))
            p.drawPath(ell(nx + 0.4, y0 + 3.6, 1.5, 1.9))
    else:
        big = mouth == "yawn"
        w, h = (3.4, 5.4) if big else (2.4, 3.0)
        path = QPainterPath(QPointF(nx - w, y0 + 1.0))
        path.quadTo(QPointF(nx, y0 - 0.2), QPointF(nx + w, y0 + 1.0))
        path.quadTo(QPointF(nx + w * 0.9, y0 + h + 1), QPointF(nx, y0 + h + 1.2))
        path.quadTo(QPointF(nx - w * 0.9, y0 + h + 1), QPointF(nx - w, y0 + 1.0))
        p.setPen(mpen)
        p.setBrush(QColor("#7d2e39"))
        p.drawPath(path)
        p.save()
        p.setClipPath(path, Qt.IntersectClip)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#f58c9c"))
        p.drawPath(ell(nx, y0 + h + 1.0, w * 0.8, h * 0.45))
        p.restore()
        if big:
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("white"))
            for sx in (-1, 1):
                fang = QPainterPath(QPointF(nx + sx * (w - 1.4), y0 + 0.8))
                fang.lineTo(nx + sx * (w - 0.4), y0 + 0.9)
                fang.lineTo(nx + sx * (w - 0.9), y0 + 2.4)
                fang.closeSubpath()
                p.drawPath(fang)
    p.setPen(QPen(qc(C["outline"], 105), 0.75, Qt.SolidLine, Qt.RoundCap))
    p.setBrush(Qt.NoBrush)
    for dy, ex, ey in ((-0.6, 22.5, 3.5), (0.6, 23.5, 7.5), (1.6, 21.5, 11.2)):
        w = QPainterPath(QPointF(fx + 9, 7 + dy))
        w.quadTo(QPointF(fx + 15, 6 + dy), QPointF(fx + ex - 2, ey))
        p.drawPath(w)
    for dy, ex, ey in ((-0.4, -19.5, 4.2), (0.8, -20.5, 8.2)):
        w = QPainterPath(QPointF(fx - 7, 7 + dy))
        w.quadTo(QPointF(fx - 12, 6 + dy), QPointF(ex, ey))
        p.drawPath(w)
    if q.get("acc_h"):
        draw_head_acc(p, q["acc_h"], e, fx)


def draw_bowl_back(p):
    p.setPen(Qt.NoPen)
    p.setBrush(QColor("#2f5f9e"))
    p.drawPath(ell(122, 80, 16.5, 3.6))
    rnd = random.Random(7)
    for _ in range(16):
        x = 109 + rnd.random() * 26
        y = 78.5 + rnd.random() * 2.6
        g = QRadialGradient(QPointF(x - 0.5, y - 0.6), 2.2)
        g.setColorAt(0, QColor("#d98a46"))
        g.setColorAt(1, QColor("#8a4a1c"))
        p.setBrush(g)
        p.drawPath(ell(x, y, 2.0, 1.5))


def draw_bowl_front(p):
    body = QPainterPath(QPointF(104, 80))
    body.quadTo(QPointF(122, 86.5), QPointF(140, 80))
    body.lineTo(135, 91.5)
    body.quadTo(QPointF(122, 94), QPointF(109, 91.5))
    body.closeSubpath()
    g = QLinearGradient(104, 0, 140, 0)
    g.setColorAt(0, QColor("#5d9be0"))
    g.setColorAt(0.45, QColor("#8fc0f2"))
    g.setColorAt(1, QColor("#3f7cc4"))
    p.setPen(QPen(QColor("#2b4f80"), LW, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin))
    p.setBrush(g)
    p.drawPath(body)
    p.setBrush(Qt.NoBrush)
    p.drawPath(ell(122, 80, 18, 4.2))
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 255, 255, 170))
    p.drawPath(ell(122, 88.3, 2.0, 1.6))
    for dx, dy in ((-2.6, -1.4), (-0.9, -2.4), (0.9, -2.4), (2.6, -1.4)):
        p.drawPath(ell(122 + dx, 88.3 + dy, 0.75, 0.75))


class LayerCache:
    """Small LRU of pre-rendered QPixmaps (body, head and bowl layers)."""

    def __init__(self, cap=110):
        self.cap = cap
        self.d = OrderedDict()

    def get(self, key):
        pm = self.d.get(key)
        if pm is not None:
            self.d.move_to_end(key)
        return pm

    def put(self, key, pm):
        self.d[key] = pm
        while len(self.d) > self.cap:
            self.d.popitem(last=False)

    def clear(self):
        self.d.clear()


def draw_layer(p, cache, key, box, F, fn):
    key = key + (round(F, 2),)
    pm = cache.get(key)
    if pm is None:
        pm = QPixmap(int(math.ceil(box.width() * F)), int(math.ceil(box.height() * F)))
        pm.fill(Qt.transparent)
        pp = QPainter(pm)
        pp.setRenderHint(QPainter.Antialiasing)
        pp.scale(F, F)
        pp.translate(-box.left(), -box.top())
        fn(pp)
        pp.end()
        cache.put(key, pm)
    p.drawPixmap(QRectF(box.left(), box.top(), pm.width() / F, pm.height() / F), pm, QRectF(pm.rect()))


def body_rel(q):
    def qs(v):
        return round(v * 2) / 2
    bx, by = q["bx"], q["by"]
    return dict(bx=0.0, by=0.0, brx=qs(q["brx"]), bry=qs(q["bry"]), brot=float(round(q["brot"])),
                cx=qs(q["cx"] - bx), cy=qs(q["cy"] - by), cr=qs(q["cr"]),
                hpx=qs(q["hpx"] - bx), hpy=qs(q["hpy"] - by), hprx=qs(q["hprx"]), hpry=qs(q["hpry"]))


def draw_cat(p, q, kind, cache=None, F=None, head=True):
    """Draw one cat facing right in cat units. With a cache, torso / head / bowl are blitted
    from pre-rendered layers (they only translate and rotate between frames)."""
    C = COLORS[kind]
    p.save()
    if cache is not None:
        p.setRenderHint(QPainter.SmoothPixmapTransform)
    if q["rot"]:
        p.translate(q["pvx"], q["pvy"])
        p.rotate(q["rot"])
        p.translate(-q["pvx"], -q["pvy"])
    legs = {k: leg_shapes(q[k]) for k in LEGS}
    for key in ("fh", "ff"):
        shapes, lift = legs[key]
        leg_outline(p, shapes, C)
        leg_fill(p, q[key], shapes, lift, C, kind, True)
    if not q["tail_front"]:
        draw_tail(p, q, C, kind)
    for key in ("nh", "nf"):
        leg_outline(p, legs[key][0], C)
    if cache is None:
        draw_body(p, q, C, kind)
    else:
        rel = body_rel(q)
        p.save()
        p.translate(q["bx"], q["by"])
        draw_layer(p, cache, ("body", kind) + tuple(rel.values()), BODY_BOX, F,
                   lambda pp: draw_body(pp, rel, C, kind))
        p.restore()
    acc_b = q.get("acc_b")
    if acc_b in BEHIND_LEGS:
        draw_body_acc(p, acc_b, q)
    if q["tail_front"]:
        draw_tail(p, q, C, kind)
    for key in ("nh", "nf"):
        shapes, lift = legs[key]
        leg_outline(p, shapes, C, 55, LW * 0.75)
        leg_fill(p, q[key], shapes, lift, C, kind, False)
    if acc_b and acc_b not in BEHIND_LEGS:
        draw_body_acc(p, acc_b, q)
    if q["bowl"]:
        if cache is None:
            draw_bowl_back(p)
        else:
            draw_layer(p, cache, ("bowlb",), BOWL_BOX, F, draw_bowl_back)
    if head:
        draw_head(p, q, C, kind, cache, F)
    if q["bowl"]:
        if cache is None:
            draw_bowl_front(p)
        else:
            draw_layer(p, cache, ("bowlf",), BOWL_BOX, F, draw_bowl_front)
    p.restore()


# ---- effect sprites ---------------------------------------------------------
def heart_path(s):
    path = QPainterPath(QPointF(0, s * 0.35))
    path.cubicTo(QPointF(-s * 1.1, -s * 0.35), QPointF(-s * 0.45, -s * 1.05), QPointF(0, -s * 0.45))
    path.cubicTo(QPointF(s * 0.45, -s * 1.05), QPointF(s * 1.1, -s * 0.35), QPointF(0, s * 0.35))
    path.translate(0, s * 0.2)
    return path


TEXT_FX = {"z": ("z", "#7286dd"), "note": ("♪", "#e2779a"), "q": ("?", "#e09a3c"), "ex": ("!", "#e2574c")}


def draw_particle(p, pt, font):
    kind, life, mx = pt["kind"], pt["life"], pt["max"]
    fade = 1.0 - max(0.0, (life / mx - 0.6) / 0.4)
    grow = min(1.0, life / 0.15)
    p.save()
    p.translate(pt["x"], pt["y"])
    p.setOpacity(max(0.0, fade))
    if kind == "heart":
        s = 7 * grow * pt.get("size", 1.0)
        g = QLinearGradient(0, -s, 0, s)
        g.setColorAt(0, QColor("#ff8aa5"))
        g.setColorAt(1, QColor("#ec3f68"))
        p.setPen(QPen(QColor("#b52a4c"), 1.1))
        p.setBrush(g)
        p.drawPath(heart_path(s))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(255, 255, 255, 190))
        p.drawPath(ell(-s * 0.42, -s * 0.38, s * 0.18, s * 0.13))
    elif kind in TEXT_FX:
        txt, col = TEXT_FX[kind]
        f = QFont(font)
        f.setBold(True)
        if kind == "z":
            f.setPixelSize(int(10 + 8 * life / mx))
            f.setItalic(True)
        else:
            f.setPixelSize(int(17 * (0.6 + 0.4 * grow)))
        path = QPainterPath()
        path.addText(-4, 5, f, txt)
        p.setPen(QPen(QColor(255, 255, 255, 230), 2.6, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin))
        p.setBrush(Qt.NoBrush)
        p.drawPath(path)
        p.fillPath(path, QColor(col))
    elif kind == "drop":
        path = QPainterPath(QPointF(0, -6))
        path.cubicTo(QPointF(1, -3), QPointF(4, 0), QPointF(0, 3.5))
        path.cubicTo(QPointF(-4, 0), QPointF(-1, -3), QPointF(0, -6))
        g = QLinearGradient(0, -6, 0, 4)
        g.setColorAt(0, QColor("#c8ecff"))
        g.setColorAt(1, QColor("#5fb4f2"))
        p.setPen(QPen(QColor("#3a86c2"), 0.9))
        p.setBrush(g)
        p.drawPath(path)
    elif kind == "mail":
        s = 1.0 * (0.6 + 0.4 * grow)
        p.scale(s, s)
        p.rotate(-8 + 6 * math.sin(life * 7))
        p.setPen(QPen(QColor("#b0672a"), 1.0, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin))
        p.setBrush(QColor("#fff7e8"))
        p.drawRoundedRect(QRectF(-8, -5.5, 16, 11), 1.5, 1.5)
        flap = QPainterPath(QPointF(-8, -5.5))
        flap.lineTo(0, 1.2)
        flap.lineTo(8, -5.5)
        p.setBrush(Qt.NoBrush)
        p.drawPath(flap)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#e2577f"))
        p.drawPath(heart_path(2.2).translated(0, 1.6))
    elif kind == "sparkle":
        s = 6 * grow
        path = QPainterPath(QPointF(0, -s))
        for a, b in (((0.22, -0.22), (s, 0)), ((0.22, 0.22), (0, s)),
                     ((-0.22, 0.22), (-s, 0)), ((-0.22, -0.22), (0, -s))):
            path.quadTo(QPointF(a[0] * s, a[1] * s), QPointF(*b))
        p.rotate(life * 120)
        p.setPen(QPen(QColor("#e0a20f"), 0.8))
        p.setBrush(QColor("#ffd84d"))
        p.drawPath(path)
    p.restore()


# ==========================================================================
# 5. Accessories (head ones are drawn in head-local coordinates, inside the head layer)
# ==========================================================================
def _pen(c, w=1.2):
    return QPen(QColor(c), w, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin)


def _poly(pts):
    path = QPainterPath(QPointF(*pts[0]))
    for pt in pts[1:]:
        path.lineTo(QPointF(*pt))
    path.closeSubpath()
    return path


def _star(cx, cy, r, inner=0.45):
    path = QPainterPath()
    for k in range(10):
        a = -PI / 2 + k * PI / 5
        rr = r if k % 2 == 0 else r * inner
        pt = QPointF(cx + rr * math.cos(a), cy + rr * math.sin(a))
        if k == 0:
            path.moveTo(pt)
        else:
            path.lineTo(pt)
    path.closeSubpath()
    return path


BODY_ACC = {"bell", "scarf", "bowtie", "bandana", "cape", "tie", "pearls", "lei", "bib", "raincoat",
            "backpack", "ribbon", "tag", "sweater", "wings", "medal", "sailor"}
BEHIND_LEGS = {"cape", "raincoat", "wings", "backpack", "sweater"}


def _gold(y0, y1):
    g = QLinearGradient(0, y0, 0, y1)
    g.setColorAt(0, QColor("#fff0a0"))
    g.setColorAt(1, QColor("#e0a21a"))
    return QBrush(g)


def draw_head_acc(p, name, e=0.0, fx=2.0):
    p.save()
    if name == "bow":
        p.setPen(_pen("#b23a6a", 1.0))
        p.setBrush(QColor("#ff7fae"))
        p.drawPath(rot_ell(5.2, -17.2, 4.4, 2.8, -28))
        p.drawPath(rot_ell(12.8, -14.8, 4.4, 2.8, 28))
        p.setBrush(QColor("#ff5c97"))
        p.drawPath(ell(9, -16, 1.8, 1.8))
    elif name == "flower":
        cx, cy = -9.5, -15.5
        p.setPen(_pen("#d16a8f", 0.8))
        p.setBrush(QColor("#ffd3e2"))
        for k in range(5):
            a = 2 * PI * k / 5 - PI / 2
            p.drawPath(ell(cx + 2.6 * math.cos(a), cy + 2.6 * math.sin(a), 2.3, 2.3))
        p.setBrush(QColor("#ffd34a"))
        p.drawPath(ell(cx, cy, 1.5, 1.5))
    elif name == "beanie":
        path = QPainterPath(QPointF(-15.5, -7))
        path.cubicTo(QPointF(-15, -26), QPointF(15, -26), QPointF(15.5, -7))
        path.closeSubpath()
        p.setPen(_pen("#8f2f2f", 1.3))
        p.setBrush(QColor("#e05a5a"))
        p.drawPath(path)
        p.setPen(_pen("#c44646", 0.8))
        for x in (-9, -4, 1, 6, 11):
            p.drawLine(QPointF(x, -9), QPointF(x * 0.75, -20))
        p.setPen(_pen("#8f2f2f", 1.1))
        p.setBrush(QColor("#f4f1ec"))
        p.drawRoundedRect(QRectF(-16.8, -10.5, 33.6, 5.2), 2.6, 2.6)
        p.drawPath(ell(0, -25, 3.6, 3.6))
    elif name == "crown":
        pts = [(-7.5, -13), (-8.8, -22.5), (-4, -17.5), (0, -24.5), (4, -17.5), (8.8, -22.5), (7.5, -13)]
        p.setPen(_pen("#9a6a0c", 1.0))
        p.setBrush(_gold(-25, -13))
        p.drawPath(_poly(pts))
        for (x, y), col in (((-4, -15), "#e2574c"), ((0, -15.3), "#4f8fd6"), ((4, -15), "#e2574c")):
            p.setBrush(QColor(col))
            p.drawPath(ell(x, y, 1.2, 1.2))
        p.setBrush(QColor("#fff3b0"))
        for x, y in ((-8.8, -22.5), (0, -24.5), (8.8, -22.5)):
            p.drawPath(ell(x, y, 1.1, 1.1))
    elif name == "party":
        cone = _poly([(-7, -14), (3, -35), (8, -14)])
        p.setPen(_pen("#2d5f9e", 1.1))
        p.setBrush(QColor("#6fb3ff"))
        p.drawPath(cone)
        p.save()
        p.setClipPath(cone)
        p.setPen(_pen("#ffd34a", 2.2))
        for k in range(-3, 4):
            p.drawLine(QPointF(-10, -16 + k * 6), QPointF(12, -24 + k * 6))
        p.restore()
        p.setPen(_pen("#c58a10", 0.9))
        p.setBrush(QColor("#ff8fb3"))
        p.drawPath(ell(3, -35, 2.8, 2.8))
    elif name == "straw":
        p.setPen(_pen("#a5803b", 1.1))
        p.setBrush(QColor("#f0d18a"))
        p.drawPath(ell(0, -13.5, 23, 4.8))
        dome = QPainterPath(QPointF(-11, -13.5))
        dome.cubicTo(QPointF(-10, -26), QPointF(10, -26), QPointF(11, -13.5))
        dome.closeSubpath()
        p.setBrush(QColor("#ecc777"))
        p.drawPath(dome)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#d9534f"))
        p.drawRect(QRectF(-10.6, -17.8, 21.2, 3.6))
    elif name == "headphones":
        band = QPainterPath(QPointF(-18, -3))
        band.cubicTo(QPointF(-19, -29), QPointF(19, -29), QPointF(18, -3))
        p.strokePath(band, _pen("#444a57", 3.2))
        p.strokePath(band, _pen("#8a93a6", 1.0))
        p.setPen(_pen("#444a57", 1.1))
        p.setBrush(QColor("#ff8fb3"))
        p.drawRoundedRect(QRectF(-22, -8, 6.8, 12.5), 3, 3)
        p.drawRoundedRect(QRectF(15.2, -8, 6.8, 12.5), 3, 3)
    elif name == "glasses":
        p.setPen(_pen("#111111", 1.0))
        p.drawLine(QPointF(fx - 1.6, -2.3), QPointF(fx + 1.6, -2.3))
        p.drawLine(QPointF(fx - 11.5, -2.5), QPointF(-17.5, -4))
        p.drawLine(QPointF(fx + 11.8, -2.5), QPointF(18.5, -4))
        p.setBrush(QColor(25, 25, 35, 238))
        for x in (fx - 6.6, fx + 6.6):
            p.drawPath(ell(x, -1.5, 5.4, 4.4))
        p.setPen(_pen("#ffffff", 0.9))
        for x in (fx - 6.6, fx + 6.6):
            p.drawLine(QPointF(x - 2.8, -3.2), QPointF(x - 0.8, -4.4))
    elif name == "santa":
        hat = QPainterPath(QPointF(-15, -9))
        hat.cubicTo(QPointF(-12, -30), QPointF(6, -32), QPointF(21, -21))
        hat.quadTo(QPointF(12, -17), QPointF(15, -9))
        hat.closeSubpath()
        p.setPen(_pen("#8f2020", 1.2))
        p.setBrush(QColor("#d93b3b"))
        p.drawPath(hat)
        p.setPen(_pen("#c9c2b8", 1.0))
        p.setBrush(QColor("#ffffff"))
        p.drawRoundedRect(QRectF(-16.8, -12.5, 33.6, 6), 3, 3)
        p.drawPath(ell(21, -20.5, 3.4, 3.4))
    elif name == "beret":
        p.setPen(_pen("#7a1f24", 1.1))
        g = QLinearGradient(0, -24, 0, -10)
        g.setColorAt(0, QColor("#e0565c"))
        g.setColorAt(1, QColor("#b8333a"))
        p.setBrush(QBrush(g))
        p.drawPath(rot_ell(-1.5, -16.5, 15.5, 6.2, -12))
        p.setBrush(QColor("#b8333a"))
        p.drawPath(ell(-3.5, -23.3, 1.4, 1.6))
    elif name == "tophat":
        p.translate(1, -14)
        p.rotate(-7)
        p.setPen(_pen("#141217", 1.1))
        p.setBrush(QColor("#2d2a33"))
        p.drawPath(ell(0, 0, 15.5, 3.4))
        g = QLinearGradient(-9, 0, 10, 0)
        g.setColorAt(0, QColor("#3d3945"))
        g.setColorAt(0.4, QColor("#56505f"))
        g.setColorAt(1, QColor("#2a2730"))
        p.setBrush(QBrush(g))
        p.drawRect(QRectF(-9, -24, 18, 23.5))
        p.drawPath(ell(0, -24, 9, 2.2))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#c0392b"))
        p.drawRect(QRectF(-8.9, -6.2, 17.8, 3.8))
    elif name == "wizard":
        p.setPen(_pen("#3b2470", 1.1))
        p.setBrush(QColor("#5a3aa8"))
        p.drawPath(ell(1, -12.5, 19, 4.2))
        cone = QPainterPath(QPointF(-12, -13))
        cone.cubicTo(QPointF(-6, -26), QPointF(-2, -38), QPointF(10, -47))
        cone.cubicTo(QPointF(8, -36), QPointF(12, -24), QPointF(14, -13))
        cone.closeSubpath()
        g = QLinearGradient(-12, 0, 14, 0)
        g.setColorAt(0, QColor("#7b55d6"))
        g.setColorAt(1, QColor("#4f2f9a"))
        p.setBrush(QBrush(g))
        p.drawPath(cone)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#ffd84d"))
        for x, y, r in ((-2, -20, 2.4), (5, -31, 1.8), (2, -15.5, 1.3)):
            p.drawPath(_star(x, y, r))
    elif name == "chef":
        p.setPen(_pen("#9b958c", 1.0))
        p.setBrush(QColor("#ffffff"))
        for x, y, r in ((-7, -27, 7.0), (7, -27, 7.0), (0, -31, 8.0)):
            p.drawPath(ell(x, y, r, r * 0.92))
        p.drawRoundedRect(QRectF(-11, -24, 22, 10.5), 2, 2)
        p.setPen(_pen("#d8d2c8", 0.8))
        for x in (-5, 0, 5):
            p.drawLine(QPointF(x, -22.5), QPointF(x, -15))
    elif name == "cap":
        p.setPen(_pen("#1f3f80", 1.1))
        p.setBrush(QColor("#2f6bd6"))
        p.drawPath(rot_ell(15, -11, 10.5, 3.0, 8))
        dome = QPainterPath(QPointF(-15.5, -9))
        dome.cubicTo(QPointF(-15, -27), QPointF(15, -27), QPointF(15.5, -9))
        dome.closeSubpath()
        g = QLinearGradient(0, -26, 0, -9)
        g.setColorAt(0, QColor("#5b8ff0"))
        g.setColorAt(1, QColor("#2f6bd6"))
        p.setBrush(QBrush(g))
        p.drawPath(dome)
        p.setPen(_pen("#ffffff", 1.4))
        p.drawLine(QPointF(-14, -11.5), QPointF(14.5, -11.5))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#ffffff"))
        p.drawPath(ell(0, -22.5, 1.8, 1.3))
    elif name == "cowboy":
        p.setPen(_pen("#5c3714", 1.1))
        p.setBrush(QColor("#a5692e"))
        brim = QPainterPath(QPointF(-23, -16))
        brim.cubicTo(QPointF(-14, -9), QPointF(14, -9), QPointF(24, -16))
        brim.cubicTo(QPointF(18, -11), QPointF(-16, -11), QPointF(-23, -16))
        p.drawPath(brim)
        crown = QPainterPath(QPointF(-11, -13))
        crown.cubicTo(QPointF(-12, -27), QPointF(-6, -29), QPointF(0, -25))
        crown.cubicTo(QPointF(6, -29), QPointF(12, -27), QPointF(11, -13))
        crown.closeSubpath()
        g = QLinearGradient(0, -29, 0, -12)
        g.setColorAt(0, QColor("#c98a49"))
        g.setColorAt(1, QColor("#9c6129"))
        p.setBrush(QBrush(g))
        p.drawPath(crown)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#5c3714"))
        p.drawRect(QRectF(-10.6, -16.5, 21.2, 2.6))
    elif name == "halo":
        g = QRadialGradient(QPointF(1, -33), 16)
        g.setColorAt(0, QColor(255, 236, 140, 110))
        g.setColorAt(1, QColor(255, 236, 140, 0))
        p.setPen(Qt.NoPen)
        p.setBrush(QBrush(g))
        p.drawPath(ell(1, -33, 16, 8))
        p.setBrush(Qt.NoBrush)
        p.setPen(_pen("#d79a16", 3.4))
        p.drawPath(ell(1, -33, 10.5, 3.0))
        p.setPen(_pen("#fff0a0", 1.6))
        p.drawPath(ell(1, -33, 10.5, 3.0))
    elif name == "horns":
        p.setPen(_pen("#7a1414", 1.0))
        for x, lean in ((-8, -1), (9, 1)):
            h = QPainterPath(QPointF(x - 3.4, -14))
            h.quadTo(QPointF(x - 3 + lean, -22), QPointF(x + 2.5 * lean, -26))
            h.quadTo(QPointF(x + 1.5 + lean, -20), QPointF(x + 3.4, -14.5))
            h.closeSubpath()
            g = QLinearGradient(0, -26, 0, -14)
            g.setColorAt(0, QColor("#ff6b5e"))
            g.setColorAt(1, QColor("#c22a2a"))
            p.setBrush(QBrush(g))
            p.drawPath(h)
    elif name == "bunny":
        for x, rot in ((-6.5, -14), (8.5, 12)):
            p.setPen(_pen("#b9aeb2", 1.0))
            p.setBrush(QColor("#ffffff"))
            p.drawPath(rot_ell(x, -32, 4.6, 12.5, rot))
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#ffc2d4"))
            p.drawPath(rot_ell(x, -31, 2.2, 9.0, rot))
        band = QPainterPath(QPointF(-16, -8))
        band.cubicTo(QPointF(-14, -23), QPointF(14, -23), QPointF(16.5, -8))
        p.strokePath(band, _pen("#c2577f", 3.2))
        p.strokePath(band, _pen("#ff8fb3", 1.8))
    elif name == "flowercrown":
        arc = QPainterPath(QPointF(-17, -8))
        arc.cubicTo(QPointF(-14, -21), QPointF(14, -21), QPointF(17.5, -8))
        p.strokePath(arc, _pen("#5f9a3a", 2.0))
        cols = ("#ff8fb3", "#ffd34a", "#9fd0ff", "#ff8fb3", "#c9a3ff", "#ffd34a", "#9fd0ff")
        for i, col in enumerate(cols):
            pt = arc.pointAtPercent(0.06 + i * 0.147)
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#79b84a"))
            p.drawPath(rot_ell(pt.x() + 2.2, pt.y() + 0.8, 2.2, 1.0, 30))
            p.setPen(_pen(QColor(col).darker(150).name(), 0.6))
            p.setBrush(QColor(col))
            for k in range(5):
                a = 2 * PI * k / 5
                p.drawPath(ell(pt.x() + 1.6 * math.cos(a), pt.y() + 1.6 * math.sin(a), 1.4, 1.4))
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#fff3b0"))
            p.drawPath(ell(pt.x(), pt.y(), 0.9, 0.9))
    elif name == "leaf":
        p.translate(2, -17)
        p.rotate(-35)
        leaf = QPainterPath(QPointF(0, 0))
        leaf.cubicTo(QPointF(-5, -4), QPointF(-4, -11), QPointF(0, -14))
        leaf.cubicTo(QPointF(4, -11), QPointF(5, -4), QPointF(0, 0))
        g = QLinearGradient(-4, 0, 4, 0)
        g.setColorAt(0, QColor("#8bcf55"))
        g.setColorAt(1, QColor("#4f9a2f"))
        p.setPen(_pen("#3a6f22", 0.9))
        p.setBrush(QBrush(g))
        p.drawPath(leaf)
        p.setPen(_pen("#3a6f22", 0.7))
        p.drawLine(QPointF(0, 1.5), QPointF(0, -11))
    elif name == "sakura":
        cx, cy = -9.5, -14.5
        p.setPen(_pen("#d9779a", 0.7))
        p.setBrush(QColor("#ffc9da"))
        for k in range(5):
            a = 2 * PI * k / 5 - PI / 2
            p.save()
            p.translate(cx + 2.8 * math.cos(a), cy + 2.8 * math.sin(a))
            p.rotate(math.degrees(a) + 90)
            petal = QPainterPath(QPointF(0, 2))
            petal.cubicTo(QPointF(-3, 0), QPointF(-2.4, -3), QPointF(-0.7, -3.2))
            petal.lineTo(0, -2.2)
            petal.lineTo(0.7, -3.2)
            petal.cubicTo(QPointF(2.4, -3), QPointF(3, 0), QPointF(0, 2))
            p.drawPath(petal)
            p.restore()
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#e2577f"))
        p.drawPath(ell(cx, cy, 1.1, 1.1))
    elif name == "roundglasses":
        p.setPen(_pen("#5a3d1e", 1.1))
        p.setBrush(QColor(200, 230, 255, 70))
        for x in (fx - 6.6, fx + 6.6):
            p.drawPath(ell(x, -1.5, 5.0, 5.0))
        p.setBrush(Qt.NoBrush)
        p.drawArc(QRectF(fx - 2.2, -4.5, 4.4, 3.5), 20 * 16, 140 * 16)
        p.drawLine(QPointF(fx - 11.6, -2.5), QPointF(-17.5, -4))
        p.drawLine(QPointF(fx + 11.6, -2.5), QPointF(18.5, -4))
        p.setPen(_pen("#ffffff", 0.8))
        for x in (fx - 6.6, fx + 6.6):
            p.drawArc(QRectF(x - 3.6, -5.1, 7.2, 7.2), 100 * 16, 60 * 16)
    elif name == "monocle":
        x = fx + 6.6
        p.setPen(_pen("#9a6a0c", 1.3))
        p.setBrush(QColor(220, 240, 255, 60))
        p.drawPath(ell(x, -1.5, 5.6, 5.6))
        chain = QPainterPath(QPointF(x + 3.5, 3))
        chain.quadTo(QPointF(x + 6, 10), QPointF(x + 1, 15))
        p.setBrush(Qt.NoBrush)
        p.setPen(QPen(QColor("#d7a72a"), 0.8, Qt.DotLine, Qt.RoundCap))
        p.drawPath(chain)
        p.setPen(_pen("#ffffff", 0.9))
        p.drawArc(QRectF(x - 4, -5.5, 8, 8), 100 * 16, 60 * 16)
    elif name == "rainhat":
        p.setPen(_pen("#9a7a0c", 1.1))
        brim = QPainterPath(QPointF(-22, -7))
        brim.cubicTo(QPointF(-14, -15), QPointF(14, -16), QPointF(21, -11))
        brim.cubicTo(QPointF(14, -10), QPointF(-12, -9), QPointF(-22, -7))
        p.setBrush(QColor("#f5c518"))
        p.drawPath(brim)
        dome = QPainterPath(QPointF(-13, -11.5))
        dome.cubicTo(QPointF(-12, -27), QPointF(12, -27), QPointF(13, -12.5))
        dome.closeSubpath()
        g = QLinearGradient(0, -26, 0, -11)
        g.setColorAt(0, QColor("#ffe36e"))
        g.setColorAt(1, QColor("#f0b90b"))
        p.setBrush(QBrush(g))
        p.drawPath(dome)
        p.setPen(_pen("#d9a30b", 0.8))
        p.drawLine(QPointF(0, -24.5), QPointF(0, -12))
    elif name == "earmuffs":
        band = QPainterPath(QPointF(-14, -15))
        band.cubicTo(QPointF(-12, -29), QPointF(13, -29), QPointF(15, -15))
        p.strokePath(band, _pen("#6b4a8a", 2.6))
        p.strokePath(band, _pen("#a985cf", 1.2))
        for x in (-14, 15):
            g = QRadialGradient(QPointF(x - 1, -16), 7)
            g.setColorAt(0, QColor("#ffffff"))
            g.setColorAt(1, QColor("#e7d3f5"))
            p.setPen(_pen("#a58ab8", 0.9))
            p.setBrush(QBrush(g))
            p.drawPath(blob(x, -15, 6.2, 6.0, 9 + x))
    elif name == "star":
        p.setPen(_pen("#c58a10", 0.9))
        p.setBrush(_gold(-20, -10))
        p.drawPath(_star(-10, -15, 4.4))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(255, 255, 255, 200))
        p.drawPath(ell(-11, -16.3, 0.9, 0.7))
    elif name == "cherry":
        p.setPen(_pen("#4f7a2a", 1.0))
        stem = QPainterPath(QPointF(-12.5, -9.5))
        stem.quadTo(QPointF(-10, -16), QPointF(-6, -19))
        stem.moveTo(-7, -9.5)
        stem.quadTo(QPointF(-7, -15), QPointF(-6, -19))
        p.setBrush(Qt.NoBrush)
        p.drawPath(stem)
        for x in (-12.5, -7):
            g = QRadialGradient(QPointF(x - 0.8, -9.4), 3.4)
            g.setColorAt(0, QColor("#ff6b6b"))
            g.setColorAt(1, QColor("#b5121b"))
            p.setPen(_pen("#7a0d12", 0.8))
            p.setBrush(QBrush(g))
            p.drawPath(ell(x, -8, 2.7, 2.7))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#79b84a"))
        p.drawPath(rot_ell(-4.2, -18.6, 2.6, 1.1, -25))
    p.restore()


def back_frame(q, f=0.32):
    """A point on the upper back (between the shoulder blades) and the angle of the back there."""
    nx, ny = neck_point(q)
    vx, vy = q["bx"] - nx, q["by"] - ny
    n = math.hypot(vx, vy) or 1.0
    vx, vy = vx / n, vy / n
    px, py = vy, -vx                      # perpendicular, pointing away from the belly
    if py > 0:
        px, py = -px, -py
    ax = nx + f * n * vx + 8.5 * px
    ay = ny + f * n * vy + 8.5 * py
    return ax, ay, math.degrees(math.atan2(-vy, -vx))


def neck_point(q):
    a = math.radians(q["hrot"])
    x0, y0 = -3.0 * q["hs"], 17.0 * q["hs"]
    return (q["hx"] + x0 * math.cos(a) - y0 * math.sin(a),
            q["hy"] + x0 * math.sin(a) + y0 * math.cos(a))


def draw_body_acc(p, name, q):
    nx, ny = neck_point(q)
    p.save()
    arc = QPainterPath(QPointF(nx - 11, ny - 3))
    arc.quadTo(QPointF(nx - 1, ny + 4.5), QPointF(nx + 10, ny - 2))
    if name == "bell":
        p.strokePath(arc, _pen("#7a1f1b", 5.4))
        p.strokePath(arc, _pen("#d9413a", 3.4))
        g = QRadialGradient(QPointF(nx - 0.3, ny + 3.8), 3.4)
        g.setColorAt(0, QColor("#fff2a6"))
        g.setColorAt(1, QColor("#d79a16"))
        p.setPen(_pen("#9a6a0c", 0.9))
        p.setBrush(QBrush(g))
        p.drawPath(ell(nx + 0.5, ny + 5.0, 2.8, 2.8))
        p.drawLine(QPointF(nx + 0.5, ny + 5.6), QPointF(nx + 0.5, ny + 7.4))
    elif name == "scarf":
        p.strokePath(arc, _pen("#283f73", 8.0))
        p.strokePath(arc, _pen("#4f7fd9", 6.0))
        tail = rot_ell(nx - 6.5, ny + 7.5, 2.8, 6.5, 14)
        p.setPen(_pen("#283f73", 1.1))
        p.setBrush(QColor("#4f7fd9"))
        p.drawPath(tail)
        p.setPen(_pen("#ffffff", 1.1))
        for t in (0.25, 0.5, 0.75):
            pt = arc.pointAtPercent(t)
            p.drawLine(QPointF(pt.x() - 0.6, pt.y() - 2.4), QPointF(pt.x() + 0.6, pt.y() + 2.4))
        p.drawLine(QPointF(nx - 8.6, ny + 6.0), QPointF(nx - 4.6, ny + 7.0))
    elif name == "bowtie":
        cx, cy = nx + 1, ny + 3.6
        p.setPen(_pen("#3a2f86", 1.0))
        p.setBrush(QColor("#6b5bd6"))
        p.drawPath(_poly([(cx - 6.2, cy - 3.6), (cx - 6.2, cy + 3.6), (cx, cy)]))
        p.drawPath(_poly([(cx + 6.2, cy - 3.6), (cx + 6.2, cy + 3.6), (cx, cy)]))
        p.setBrush(QColor("#8d7ff0"))
        p.drawPath(ell(cx, cy, 1.8, 1.8))
    elif name == "bandana":
        tri = _poly([(nx - 11, ny - 2.5), (nx + 10, ny - 1.5), (nx - 1.5, ny + 10.5)])
        p.setPen(_pen("#8a2a25", 1.1))
        p.setBrush(QColor("#e5534b"))
        p.drawPath(tri)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(255, 255, 255, 220))
        for x, y in ((-6, 0.5), (0, 1.5), (5, 0), (-2.5, 5.5)):
            p.drawPath(ell(nx + x, ny + y, 0.9, 0.9))
    elif name == "tie":
        cx, cy = nx + 1, ny + 2.6
        p.strokePath(arc, _pen("#e9e4dc", 2.2))
        p.setPen(_pen("#1d2b52", 0.9))
        p.setBrush(QColor("#2f4a8a"))
        p.drawPath(_poly([(cx - 2.2, cy - 1.6), (cx + 2.2, cy - 1.6), (cx + 1.4, cy + 1.6), (cx - 1.4, cy + 1.6)]))
        tie = _poly([(cx - 1.4, cy + 1.6), (cx + 1.4, cy + 1.6), (cx + 3.4, cy + 11), (cx, cy + 14.5),
                     (cx - 3.4, cy + 11)])
        p.drawPath(tie)
        p.save()
        p.setClipPath(tie)
        p.setPen(_pen("#e2b33a", 1.0))
        for k in range(4):
            p.drawLine(QPointF(cx - 5, cy + 3 + k * 3.2), QPointF(cx + 5, cy + 6 + k * 3.2))
        p.restore()
    elif name == "pearls":
        low = QPainterPath(QPointF(nx - 11, ny - 2))
        low.quadTo(QPointF(nx - 1, ny + 6.5), QPointF(nx + 10, ny - 1))
        p.setPen(_pen("#b9b2a6", 0.6))
        for k in range(10):
            pt = low.pointAtPercent(k / 9)
            g = QRadialGradient(QPointF(pt.x() - 0.5, pt.y() - 0.5), 1.8)
            g.setColorAt(0, QColor("#ffffff"))
            g.setColorAt(1, QColor("#e6dccd"))
            p.setBrush(QBrush(g))
            p.drawPath(ell(pt.x(), pt.y(), 1.45, 1.45))
    elif name == "lei":
        cols = ("#ff7fae", "#ffd34a", "#ff9a3c", "#c9a3ff", "#ff7fae", "#9fd0ff", "#ffd34a", "#ff9a3c")
        low = QPainterPath(QPointF(nx - 12, ny - 2.5))
        low.quadTo(QPointF(nx - 1, ny + 8), QPointF(nx + 11, ny - 1.5))
        for k, col in enumerate(cols):
            pt = low.pointAtPercent(k / (len(cols) - 1))
            p.setPen(_pen(QColor(col).darker(150).name(), 0.6))
            p.setBrush(QColor(col))
            for j in range(5):
                a = 2 * PI * j / 5 + k
                p.drawPath(ell(pt.x() + 1.7 * math.cos(a), pt.y() + 1.7 * math.sin(a), 1.5, 1.5))
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#fff3b0"))
            p.drawPath(ell(pt.x(), pt.y(), 0.8, 0.8))
    elif name == "bib":
        bib = QPainterPath(QPointF(nx - 10, ny - 2.5))
        bib.quadTo(QPointF(nx - 1, ny + 1.5), QPointF(nx + 9.5, ny - 1.8))
        bib.cubicTo(QPointF(nx + 10, ny + 9), QPointF(nx + 3, ny + 13), QPointF(nx - 1, ny + 13))
        bib.cubicTo(QPointF(nx - 6, ny + 13), QPointF(nx - 11, ny + 8), QPointF(nx - 10, ny - 2.5))
        p.setPen(_pen("#d9534f", 1.3))
        p.setBrush(QColor("#ffffff"))
        p.drawPath(bib)
        fish = QPainterPath(QPointF(nx - 4, ny + 6.5))
        fish.quadTo(QPointF(nx, ny + 3.5), QPointF(nx + 3, ny + 6.5))
        fish.quadTo(QPointF(nx, ny + 9.5), QPointF(nx - 4, ny + 6.5))
        p.setPen(_pen("#4f8fd6", 0.8))
        p.setBrush(QColor("#9fd0ff"))
        p.drawPath(fish)
        p.drawPath(_poly([(nx + 3, ny + 6.5), (nx + 5.5, ny + 4.6), (nx + 5.5, ny + 8.4)]))
    elif name in ("cape", "raincoat"):
        bx, by, brx, bry = q["bx"], q["by"], q["brx"], q["bry"]
        long = name == "raincoat"
        cape = QPainterPath(QPointF(nx - 4, ny - 4))
        cape.cubicTo(QPointF(bx, by - bry - 7), QPointF(bx - brx * 0.8, by - bry * 0.7),
                     QPointF(bx - brx * (1.08 if long else 1.02), by + bry * (0.75 if long else 0.45)))
        cape.quadTo(QPointF(bx - brx * 0.3, by + bry * (0.45 if long else 0.15)), QPointF(nx - 2, ny + 6))
        cape.closeSubpath()
        g = QLinearGradient(bx - brx, by - bry, nx, ny)
        if long:
            g.setColorAt(0, QColor(240, 186, 20, 245))
            g.setColorAt(1, QColor(255, 222, 90, 245))
            p.setPen(_pen("#a07c08", 1.2))
        else:
            g.setColorAt(0, QColor(110, 66, 190, 235))
            g.setColorAt(1, QColor(160, 110, 230, 235))
            p.setPen(_pen("#4b2a85", 1.2))
        p.setBrush(QBrush(g))
        p.drawPath(cape)
        if long:
            p.strokePath(arc, _pen("#a07c08", 3.0))
            p.strokePath(arc, _pen("#ffd94a", 1.8))
            p.setPen(_pen("#a07c08", 0.7))
            p.setBrush(QColor("#ffffff"))
            for t in (0.35, 0.65):
                pt = arc.pointAtPercent(t)
                p.drawPath(ell(pt.x(), pt.y() + 2.4, 1.0, 1.0))
        else:
            p.strokePath(arc, _pen("#d9b23a", 2.2))
    elif name == "backpack":
        ax, ay, ang = back_frame(q, 0.62)
        p.translate(ax, ay)
        p.rotate(ang)
        p.setPen(_pen("#7a2a1f", 1.1))
        p.setBrush(QColor("#e05a4a"))
        p.drawRoundedRect(QRectF(-9, -9, 17, 12), 3.5, 3.5)
        p.setBrush(QColor("#c94434"))
        p.drawRoundedRect(QRectF(-9, -9, 17, 5.5), 2.5, 2.5)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#ffd34a"))
        p.drawPath(ell(-0.5, -3.8, 1.2, 1.2))
        p.setPen(_pen("#7a2a1f", 1.5))
        strap = QPainterPath(QPointF(6, -2))
        strap.quadTo(QPointF(10, 4), QPointF(8, 10))
        p.setBrush(Qt.NoBrush)
        p.drawPath(strap)
    elif name == "ribbon":
        p.strokePath(arc, _pen("#b23a6a", 4.6))
        p.strokePath(arc, _pen("#ff8fb3", 3.0))
        cx, cy = nx - 5, ny + 2.4
        p.setPen(_pen("#b23a6a", 0.9))
        p.setBrush(QColor("#ff7fae"))
        p.drawPath(rot_ell(cx - 3.6, cy - 0.6, 3.8, 2.4, -20))
        p.drawPath(rot_ell(cx + 3.6, cy - 0.6, 3.8, 2.4, 20))
        p.drawPath(_poly([(cx - 1, cy + 0.5), (cx - 3.4, cy + 6.5), (cx - 0.6, cy + 5.2)]))
        p.drawPath(_poly([(cx + 1, cy + 0.5), (cx + 3.2, cy + 6.5), (cx + 0.4, cy + 5.4)]))
        p.setBrush(QColor("#ff5c97"))
        p.drawPath(ell(cx, cy, 1.6, 1.6))
    elif name == "tag":
        p.strokePath(arc, _pen("#4a2e1a", 3.4))
        p.strokePath(arc, _pen("#8b5a2b", 2.0))
        cx, cy = nx + 0.5, ny + 5.6
        p.setPen(_pen("#9a6a0c", 0.9))
        p.setBrush(_gold(cy - 3.5, cy + 3.5))
        p.drawPath(ell(cx, cy, 3.3, 3.3))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#c0533a"))
        p.drawPath(heart_path(1.5).translated(cx, cy))
    elif name == "sweater":
        bx, by, brx, bry = q["bx"], q["by"], q["brx"], q["bry"]
        torso = rot_ell(bx, by, brx + 0.6, bry + 0.6, q["brot"]).united(
            ell(q["cx"], q["cy"], q["cr"] + 0.6, q["cr"] + 0.6))
        p.save()
        p.setClipPath(torso)
        p.translate(bx, by)
        p.rotate(q["brot"])
        long_u = brx >= bry
        g = QLinearGradient(0, -bry, 0, bry)
        g.setColorAt(0, QColor("#7fb3e8"))
        g.setColorAt(1, QColor("#5a93d6"))
        p.setPen(Qt.NoPen)
        p.setBrush(QBrush(g))
        if long_u:
            p.drawRect(QRectF(-brx * 0.35, -bry - 3, brx * 1.6 + 30, 2 * bry + 30))
            p.setBrush(QColor("#ffffff"))
            p.drawRect(QRectF(-brx * 0.05, -bry - 3, 3.2, 2 * bry + 30))
            p.setPen(_pen("#4a7fc0", 0.7))
            for k in range(7):
                x = -brx * 0.3 + 5 + k * 5
                p.drawLine(QPointF(x, -bry - 2), QPointF(x, bry + 14))
        else:
            p.drawRect(QRectF(-brx - 30, -bry - 30, 2 * brx + 60, bry * 1.25 + 30))
            p.setBrush(QColor("#ffffff"))
            p.drawRect(QRectF(-brx - 30, -bry * 0.2, 2 * brx + 60, 3.2))
            p.setPen(_pen("#4a7fc0", 0.7))
            for k in range(6):
                x = -brx + 4 + k * 5
                p.drawLine(QPointF(x, -bry - 30), QPointF(x, bry * 0.25))
        p.restore()
        p.strokePath(arc, _pen("#3e6fae", 4.2))
        p.strokePath(arc, _pen("#7fb3e8", 2.6))
    elif name == "wings":
        ax, ay, ang = back_frame(q, 0.5)
        p.translate(ax, ay)
        p.rotate(ang)
        for dx, dy, alpha in ((5, -1.5, 200), (0, 0, 255)):
            w = QPainterPath(QPointF(dx + 3, dy + 1))
            w.cubicTo(QPointF(dx + 2, dy - 13), QPointF(dx - 14, dy - 20), QPointF(dx - 25, dy - 14))
            w.cubicTo(QPointF(dx - 21, dy - 11), QPointF(dx - 20, dy - 8), QPointF(dx - 17, dy - 7))
            w.cubicTo(QPointF(dx - 14, dy - 4), QPointF(dx - 12, dy - 3), QPointF(dx - 9, dy - 2.5))
            w.cubicTo(QPointF(dx - 6, dy + 0.5), QPointF(dx - 2, dy + 1.5), QPointF(dx + 3, dy + 1))
            g = QLinearGradient(dx - 20, dy - 16, dx, dy)
            g.setColorAt(0, QColor(236, 242, 255, alpha))
            g.setColorAt(1, QColor(255, 255, 255, alpha))
            p.setPen(_pen("#9aa6bb", 1.0))
            p.setBrush(QBrush(g))
            p.drawPath(w)
            p.setPen(_pen("#c3cbda", 0.7))
            for k in (0.25, 0.45, 0.65):
                p.drawLine(QPointF(dx - 25 * k, dy - 2 - 4 * k), QPointF(dx - 25 * k - 3, dy - 9 - 6 * k))
    elif name == "medal":
        cx, cy = nx + 1, ny + 9.5
        p.setPen(_pen("#1d3f8a", 0.8))
        p.setBrush(QColor("#3b6fd6"))
        p.drawPath(_poly([(nx - 6, ny - 1), (nx - 2, ny - 1), (cx + 1, cy - 2), (cx - 1.5, cy - 2)]))
        p.setBrush(QColor("#e05a4a"))
        p.drawPath(_poly([(nx + 3, ny - 1), (nx + 7, ny - 1), (cx + 1.5, cy - 2), (cx - 1, cy - 2)]))
        p.setPen(_pen("#9a6a0c", 0.9))
        p.setBrush(_gold(cy - 4, cy + 4))
        p.drawPath(ell(cx, cy, 3.8, 3.8))
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#fff3b0"))
        p.drawPath(_star(cx, cy, 2.0))
    elif name == "sailor":
        col = _poly([(nx - 12, ny - 3), (nx + 10.5, ny - 2), (nx + 5, ny + 6), (nx - 1, ny + 3.5), (nx - 8, ny + 7)])
        p.setPen(_pen("#1d2b52", 1.0))
        p.setBrush(QColor("#2f4a8a"))
        p.drawPath(col)
        p.save()
        p.setClipPath(col)
        p.setPen(_pen("#ffffff", 0.9))
        p.drawLine(QPointF(nx - 11, ny - 0.8), QPointF(nx + 9, ny + 0.2))
        p.restore()
        p.setPen(_pen("#8a1f1f", 0.8))
        p.setBrush(QColor("#d93b3b"))
        p.drawPath(_poly([(nx - 3, ny + 2.5), (nx + 1, ny + 2.5), (nx + 0.5, ny + 9), (nx - 1, ny + 7.5),
                          (nx - 2.5, ny + 9)]))
    p.restore()


def accessory_preview(name, size=40, kind="calico"):
    """Icon of a cat wearing one accessory (for menus / settings)."""
    pm = QPixmap(size, size)
    pm.fill(Qt.transparent)
    p = QPainter(pm)
    p.setRenderHint(QPainter.Antialiasing)
    body = name in BODY_ACC
    q = P(SIT, acc_h=None if body else name, acc_b=name if body else None, eyes="open")
    if body:
        p.scale(size / 62, size / 62)
        p.translate(-44, 4)
    else:
        p.scale(size / 66, size / 66)
        p.translate(-52, 16)
    draw_cat(p, q, kind)
    p.end()
    return pm


def night_tint(p, rect, strength=1.0):
    """Darken/blue-shift only where something is already drawn."""
    p.save()
    p.setCompositionMode(QPainter.CompositionMode_SourceAtop)
    p.fillRect(rect, QColor(18, 24, 70, int(52 * strength)))
    p.restore()


# ==========================================================================
# 6. Toys and critters
# ==========================================================================
def draw_yarn(p, cx, cy, r, angle, color="#f08bb4", trail_dir=1):
    base = QColor(color)
    # loose thread lying on the floor
    th = QPainterPath(QPointF(cx - trail_dir * r * 0.55, cy + r * 0.82))
    th.cubicTo(QPointF(cx - trail_dir * (r + 8), cy + r * 1.05), QPointF(cx - trail_dir * (r + 14), cy + r * 0.7),
               QPointF(cx - trail_dir * (r + 22), cy + r * 0.98))
    p.strokePath(th, _pen(base.darker(150).name(), 1.6))
    g = QRadialGradient(QPointF(cx - r * 0.35, cy - r * 0.4), r * 1.4)
    g.setColorAt(0, base.lighter(130))
    g.setColorAt(0.6, base)
    g.setColorAt(1, base.darker(130))
    p.setPen(_pen(base.darker(190).name(), 1.6))
    p.setBrush(QBrush(g))
    p.drawEllipse(QPointF(cx, cy), r, r)
    p.save()
    p.setClipPath(ell(cx, cy, r - 0.6, r - 0.6))
    p.translate(cx, cy)
    p.rotate(math.degrees(angle))
    p.setPen(_pen(base.darker(140).name(), 1.0))
    p.setBrush(Qt.NoBrush)
    for k in range(5):
        p.save()
        p.rotate(k * 36)
        p.drawEllipse(QPointF(0, r * 0.15 * (k % 2 * 2 - 1)), r * 0.95, r * 0.38)
        p.restore()
    p.setPen(_pen(base.lighter(125).name(), 0.8))
    for k in range(3):
        p.drawArc(QRectF(-r * 0.7 + k * 2, -r * 0.7, r * 1.4, r * 1.4), (30 + k * 50) * 16, 70 * 16)
    p.restore()


BOX_W, BOX_RIM, BOX_FLOOR_PAD = 112.0, 44.0, 4.0     # cat units


def draw_box_back(p, x0, rim, floor):
    w = BOX_W
    p.setPen(_pen("#6b4a2b", 1.6))
    p.setBrush(QColor("#c18a50"))
    p.drawPath(_poly([(x0 + 10, rim), (x0 + w - 10, rim), (x0 + w - 18, rim - 20), (x0 + 18, rim - 20)]))
    g = QLinearGradient(0, rim, 0, rim + 18)
    g.setColorAt(0, QColor("#5e3f22"))
    g.setColorAt(1, QColor("#7a5530"))
    p.setBrush(QBrush(g))
    p.drawRect(QRectF(x0 + 4, rim, w - 8, floor - rim - 6))


def draw_box_front(p, x0, rim, floor):
    w = BOX_W
    p.setPen(_pen("#6b4a2b", 1.6))
    p.setBrush(QColor("#c99558"))
    p.drawPath(_poly([(x0, rim + 2), (x0 - 16, rim - 14), (x0 + 8, rim - 6), (x0 + 12, rim + 2)]))
    p.drawPath(_poly([(x0 + w, rim + 2), (x0 + w + 16, rim - 14), (x0 + w - 8, rim - 6), (x0 + w - 12, rim + 2)]))
    g = QLinearGradient(0, rim, 0, floor)
    g.setColorAt(0, QColor("#ddb07a"))
    g.setColorAt(1, QColor("#c38c52"))
    p.setBrush(QBrush(g))
    p.drawRect(QRectF(x0, rim, w, floor - rim))
    p.setBrush(QColor("#b98349"))
    p.drawPath(_poly([(x0 + 3, rim), (x0 + w - 3, rim), (x0 + w - 9, rim + 13), (x0 + 9, rim + 13)]))
    p.setPen(Qt.NoPen)
    p.setBrush(QColor(255, 240, 200, 110))
    p.drawRect(QRectF(x0 + w / 2 - 6, rim + 13, 12, floor - rim - 13))
    p.setBrush(QColor(110, 70, 40, 120))
    cx, cy = x0 + w * 0.25, rim + 27
    p.drawPath(ell(cx, cy, 3.6, 3.0))
    for dx, dy in ((-3.6, -3.4), (-1.2, -4.8), (1.2, -4.8), (3.6, -3.4)):
        p.drawPath(ell(cx + dx, cy + dy, 1.2, 1.3))


def draw_laser(p, cx, cy, t):
    r = 5.0 + 0.6 * math.sin(t * 30)
    g = QRadialGradient(QPointF(cx, cy), r * 3.2)
    g.setColorAt(0, QColor(255, 60, 60, 200))
    g.setColorAt(0.35, QColor(255, 30, 30, 90))
    g.setColorAt(1, QColor(255, 0, 0, 0))
    p.setPen(Qt.NoPen)
    p.setBrush(QBrush(g))
    p.drawEllipse(QPointF(cx, cy), r * 3.2, r * 3.2)
    p.setBrush(QColor(255, 235, 235))
    p.drawEllipse(QPointF(cx, cy), r * 0.45, r * 0.45)


def draw_wand(p, ax, ay, fx, fy, t, sc=1.0):
    p.setPen(_pen("#8a5a2b", 3.0 * sc))
    p.drawLine(QPointF(ax, ay), QPointF(ax - 18 * sc, ay - 22 * sc))
    p.setPen(_pen("#5c5c5c", 1.0 * sc))
    rope = QPainterPath(QPointF(ax, ay))
    rope.quadTo(QPointF((ax + fx) / 2, (ay + fy) / 2 + 10 * sc), QPointF(fx, fy))
    p.strokePath(rope, _pen("#6b6b6b", 1.0 * sc))
    p.save()
    p.translate(fx, fy)
    ang = math.degrees(math.atan2(fy - ay, fx - ax)) - 90
    p.rotate(ang + 12 * math.sin(t * 7))
    p.scale(sc, sc)
    for i, col in enumerate(("#ff7fae", "#7fd3ff", "#ffd34a")):
        feather = QPainterPath(QPointF(0, 0))
        dx = (i - 1) * 4
        feather.cubicTo(QPointF(dx - 7, 10), QPointF(dx - 4, 24), QPointF(dx, 30))
        feather.cubicTo(QPointF(dx + 4, 24), QPointF(dx + 7, 10), QPointF(0, 0))
        p.setPen(_pen(QColor(col).darker(140).name(), 0.8))
        p.setBrush(QColor(col))
        p.drawPath(feather)
    p.setPen(_pen("#ffffff", 0.7))
    p.drawLine(QPointF(0, 0), QPointF(0, 27))
    p.restore()


def draw_butterfly(p, t, color="#ff9a3c"):
    flap = 0.25 + 0.75 * abs(math.sin(t * 13))
    base = QColor(color)
    p.setPen(_pen(base.darker(170).name(), 0.9))
    for side in (-1, 1):
        p.save()
        p.scale(side * flap, 1)
        p.setBrush(base)
        p.drawPath(rot_ell(6, -4, 6.5, 4.6, -25))
        p.setBrush(base.lighter(125))
        p.drawPath(rot_ell(4.5, 4, 4.4, 3.2, 25))
        p.setBrush(QColor(255, 255, 255, 170))
        p.drawPath(ell(7, -5, 1.4, 1.1))
        p.restore()
    p.setPen(_pen("#3a2e23", 1.6))
    p.drawLine(QPointF(0, -6), QPointF(0, 6))
    p.setPen(_pen("#3a2e23", 0.7))
    p.drawLine(QPointF(0, -6), QPointF(-3, -11))
    p.drawLine(QPointF(0, -6), QPointF(3, -11))


def draw_bird(p, t, color="#5b9bd5"):
    flap = math.sin(t * 16)
    base = QColor(color)
    p.setPen(_pen(base.darker(170).name(), 1.0))
    p.setBrush(base)
    p.drawPath(ell(0, 0, 9, 6))
    p.drawPath(ell(8, -3, 4.6, 4.3))
    p.setBrush(QColor("#fff4e0"))
    p.drawPath(ell(1, 2.5, 5.5, 2.6))
    p.setBrush(QColor("#f2a03a"))
    p.drawPath(_poly([(12, -3.5), (16, -2.2), (12, -1.4)]))
    p.setBrush(QColor("#1b1210"))
    p.setPen(Qt.NoPen)
    p.drawPath(ell(9.3, -4, 0.9, 0.9))
    p.setPen(_pen(base.darker(170).name(), 1.0))
    p.setBrush(base.darker(115))
    p.drawPath(_poly([(-3, -2), (4, -2), (0, -2 - 10 * flap)]))
    p.drawPath(_poly([(-9, 0), (-15, -3), (-14, 2)]))


def draw_bug(p, t, flying=False):
    if flying:
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(255, 255, 255, 150))
        w = 0.4 + 0.6 * abs(math.sin(t * 25))
        p.drawPath(rot_ell(-3, -5, 5 * w, 2.4, -30))
        p.drawPath(rot_ell(3, -5, 5 * w, 2.4, 30))
    p.setPen(_pen("#2a1f1c", 0.7))
    for k in (-1, 0, 1):
        s = 1.2 * math.sin(t * 18 + k)
        p.drawLine(QPointF(k * 2.5, 2), QPointF(k * 3.2 - 1 + s, 5))
    p.setPen(_pen("#5a1010", 1.0))
    p.setBrush(QColor("#e33b2e"))
    p.drawPath(ell(0, 0, 5.6, 4.4))
    p.setBrush(QColor("#1b1210"))
    p.drawPath(ell(5.6, 0.4, 2.4, 2.2))
    p.setPen(_pen("#1b1210", 0.7))
    p.drawLine(QPointF(0, -4.2), QPointF(0, 4.2))
    p.setPen(Qt.NoPen)
    for x, y in ((-2.6, -1.6), (2.4, -1.8), (-2.2, 1.8), (2.6, 1.6)):
        p.drawPath(ell(x, y, 1.0, 1.0))
