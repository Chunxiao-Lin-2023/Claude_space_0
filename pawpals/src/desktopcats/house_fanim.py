"""Fighting animation (v22): key-framed moves for the family (joint-angle rigs drawn by house_art._draw_side_rig),
fight poses for the cats (extra art.POSES), per-fighter screen transforms (squash & stretch, recoil, spin, knock-down,
flash, after-images, blinking) and stateless particle bursts that host and guests draw alike from the synced fx list.

The battle engines call `animate(b, fi)` once a frame instead of picking a pose; it sets on the agent:
  a.pose / a.rig (people), a.pose / a.fu (cats: progress of the move 0..1), a.fanim (the transform).
"""
import math
import random

from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import QColor, QPainterPath, QPen, QPolygonF

from . import art
from . import house_games as HG
from .art import P as QP, STAND, CROUCH, ARCH, DANGLE, SLEEP, LOAF, blend


def smooth(u):
    u = max(0.0, min(1.0, u))
    return u * u * (3 - 2 * u)


def lerp(a, b, k):
    return a + (b - a) * k


# ====================================================================================================== cat poses
def _paw(q, key, px, py, lift=0.0):
    """Put a leg's paw at (px, py), bending the knee sensibly."""
    L = q[key]
    sx, sy = L[0], L[1]
    mx, my = (sx + px) / 2, (sy + py) / 2
    dx, dy = px - sx, py - sy
    n = math.hypot(dx, dy) or 1.0
    bend = max(0.0, 26 - n) * 0.5 + lift
    L[2], L[3] = mx - dy / n * bend * 0.3, my + dx / n * bend * 0.3
    L[4], L[5] = px, py


def _fu(c):
    return float(getattr(c, "fu", 0.0) or 0.0) if c is not None else 0.0


def _fk(c):
    return int(getattr(c, "fk", 0) or 0) if c is not None else 0


def cat_ready(t, c):
    q = QP(CROUCH)
    b = math.sin(t * 6) * 1.2
    q.update(by=66 + b, cy=68 + b, hpy=63, hpx=46, hx=104, hy=50 + b * 0.6, hrot=-4, eyes="big", ear=0.35)
    q["tail"] = [40, 60, 28, 50, 24, 36 + 3 * math.sin(t * 4), 32, 28 + 4 * math.sin(t * 4 + 1)]
    return q


def cat_swat(t, c):
    """One paw: wind up, strike forward-down, recover. fk picks the near / far paw."""
    u = _fu(c)
    q = cat_ready(t, c)
    key = "nf" if _fk(c) % 2 == 0 else "ff"
    cx, cy = q["cx"], q["cy"]
    if u < 0.35:
        k = smooth(u / 0.35)
        px, py = lerp(cx + 8, cx + 2, k), lerp(86, cy - 16, k)
    elif u < 0.55:
        k = smooth((u - 0.35) / 0.2)
        px, py = lerp(cx + 2, cx + 34, k), lerp(cy - 16, cy + 8, k)
    else:
        k = smooth((u - 0.55) / 0.45)
        px, py = lerp(cx + 34, cx + 8, k), lerp(cy + 8, 86, k)
    _paw(q, key, px, py)
    q["bx"] += 4 * math.sin(u * math.pi)
    q["cx"] += 5 * math.sin(u * math.pi)
    q["hx"] += 6 * math.sin(u * math.pi)
    q["hrot"] = -8 * math.sin(u * math.pi)
    q["eyes"] = "big" if u < 0.4 else "squint"
    q["mouth"] = "open" if 0.3 < u < 0.7 else "w"
    return q


def cat_leap(t, c):
    """Stretched out flying forward, both front paws reaching (pounce, air attacks, the big kick)."""
    u = _fu(c)
    q = art.pose_run(0, None, freeze=math.pi / 2)
    cx, cy = q["cx"], q["cy"]
    reach = 30 + 8 * math.sin(u * math.pi)
    _paw(q, "nf", cx + reach, cy + 2)
    _paw(q, "ff", cx + reach - 6, cy + 8)
    _paw(q, "nh", q["hpx"] - 28, q["hpy"] + 10)
    _paw(q, "fh", q["hpx"] - 22, q["hpy"] + 14)
    q["brx"] += 3
    q["tail"] = [40, 52, 22, 50, 8, 46, -4, 44]
    q.update(eyes="big", ear=0.6, mouth="open", hrot=-6)
    return q


def cat_upper(t, c):
    """Rearing up, both paws clawing upward (升龙爪 / ↑J)."""
    u = _fu(c)
    q = QP(STAND)
    k = smooth(min(1.0, u * 2.5))
    q["rot"] = -48 * k
    q["pvx"], q["pvy"] = 47, 86
    cx, cy = q["cx"], q["cy"]
    sw = math.sin(u * 14)
    _paw(q, "nf", cx + 18 + 4 * sw, cy - 22 - 6 * k)
    _paw(q, "ff", cx + 14 - 4 * sw, cy - 16 - 6 * k)
    q.update(eyes="squint" if 0.2 < u < 0.7 else "big", mouth="open", ear=0.7, hrot=-10)
    q["tail"] = [40, 52, 30, 64, 20, 76, 12, 86]
    return q


def cat_sweep(t, c):
    """Low to the ground, one paw sweeping along the floor."""
    u = _fu(c)
    q = QP(CROUCH)
    q.update(by=76, cy=78, hpy=72, hy=70, hx=106, eyes="squint", ear=0.5)
    k = smooth(min(1.0, u * 2))
    _paw(q, "nf", lerp(q["cx"] + 6, q["cx"] + 38, k), 88)
    q["tail"] = [38, 70, 24, 80, 12, 86, 2, 88]
    return q


def cat_slam(t, c):
    """Butt first, falling: body upright, legs splayed (屁股压 / air spike)."""
    q = QP(DANGLE)
    w = math.sin(t * 18)
    for key, k in (("nf", 1.0), ("ff", -1.0)):
        q[key][4] += 6 * k
        q[key][5] -= 10
    q.update(eyes="squint", mouth="open", ear=0.8, rot=180 + 6 * w, pvx=75, pvy=55)
    return q


def cat_ball(t, c):
    q = QP(SLEEP)
    q.update(eyes="closed", ear=0.4, hy=74, hx=96, hrot=30)
    return q


def cat_hiss(t, c):
    q = QP(ARCH)
    q.update(eyes="wide", mouth="open", ear=1.0)
    q["tail"][6] += 2 * math.sin(t * 30)
    return q


def cat_block(t, c):
    q = QP(ARCH)
    q.update(eyes="squint", mouth="w", ear=0.9, hx=100, hy=48)
    _paw(q, "nf", q["cx"] + 12, q["cy"] - 6)
    return q


def cat_hit(t, c):
    """Flinching back: head jerked up, eyes screwed shut, ears flat; heavier when fk = 1."""
    u = _fu(c)
    heavy = _fk(c) == 1
    q = QP(STAND)
    k = (1 - smooth(u)) * (1.6 if heavy else 1.0)
    q["bx"] -= 4 * k
    q["cx"] -= 6 * k
    q["hx"] -= 10 * k
    q["hy"] -= 4 * k
    q["hrot"] = 18 * k
    q["by"] += 2 * k
    _paw(q, "nf", q["cx"] + 6, q["cy"] + 18 - 8 * k)
    q.update(eyes="squint", mouth="open", ear=0.95)
    q["tail"] = [40, 52, 30, 40, 26, 30 - 4 * k, 32, 22 - 6 * k]
    return q


def cat_tumble(t, c):
    """Knocked into the air: curled, legs flailing (the spin comes from the transform)."""
    q = QP(DANGLE)
    w = math.sin(t * 22)
    for key, k in (("nf", 1.0), ("ff", -1.0), ("nh", -1.0), ("fh", 1.0)):
        q[key][4] += 6 * w * k
        q[key][5] -= 4
    q.update(eyes="squint", mouth="open", ear=0.9, pvx=75, pvy=55)
    return q


def cat_down(t, c):
    q = QP(SLEEP)
    q.update(eyes="squint", ear=0.9, hrot=26, mouth="open")
    q["tail"] = [36, 79, 20, 86, 6, 88, -6, 88]
    return q


def cat_getup(t, c):
    u = _fu(c)
    return blend(QP(CROUCH), cat_ready(t, c), smooth(u))


def cat_dash(t, c):
    q = art.pose_run(0, None, freeze=math.pi / 2)
    q["brx"] += 4
    q.update(eyes="squint", ear=0.9, hrot=-4)
    q["tail"] = [40, 52, 22, 52, 6, 52, -8, 52]
    return q


def cat_grab(t, c):
    """Both paws holding on to something in front, then rearing back to fling it."""
    u = _fu(c)
    q = cat_ready(t, c)
    k = smooth(u)
    _paw(q, "nf", q["cx"] + 26 - 20 * k, q["cy"] - 4 - 26 * k)
    _paw(q, "ff", q["cx"] + 22 - 18 * k, q["cy"] - 26 * k)
    q["rot"] = -24 * k
    q["pvx"], q["pvy"] = 50, 86
    q.update(eyes="big", mouth="open", ear=0.5)
    return q


def cat_frenzy(t, c):
    """A flurry of paws (九命连环爪)."""
    q = cat_ready(t, c)
    s = math.sin(t * 40)
    _paw(q, "nf", q["cx"] + 26 + 6 * s, q["cy"] - 6 + 10 * s)
    _paw(q, "ff", q["cx"] + 22 - 6 * s, q["cy"] - 2 - 10 * s)
    q.update(eyes="squint", mouth="open", ear=0.8)
    return q


CAT_POSES = {"f_ready": cat_ready, "f_swat": cat_swat, "f_leap": cat_leap, "f_upper": cat_upper,
             "f_sweep": cat_sweep, "f_slam": cat_slam, "f_ball": cat_ball, "f_hiss": cat_hiss, "f_block": cat_block,
             "f_hit": cat_hit, "f_tumble": cat_tumble, "f_down": cat_down, "f_getup": cat_getup, "f_dash": cat_dash,
             "f_grab": cat_grab, "f_frenzy": cat_frenzy}
art.POSES.update(CAT_POSES)
for _k in ("f_hit", "f_tumble", "f_slam", "f_ball", "f_dash", "f_leap", "f_upper"):
    art.BLEND_DUR[_k] = 0.05
for _k in ("f_swat", "f_sweep", "f_frenzy", "f_grab"):
    art.BLEND_DUR[_k] = 0.06


# ====================================================================================================== people
STANCE = dict(lean=6, fl=(22, -34), bl=(-18, -22), fa=(55, 88), ba=(42, 96), eyes="fierce")
R = {
    "stance": STANCE,
    "jab_w": dict(STANCE, fa=(35, 125), lean=2),
    "jab": dict(STANCE, fa=(93, 0), ba=(40, 100), lean=14, fl=(30, -26), bl=(-24, -12), talk=True),
    "cross_w": dict(STANCE, ba=(20, 120), lean=0),
    "cross": dict(STANCE, ba=(95, 0), fa=(35, 105), lean=20, fl=(32, -24), bl=(-28, -6), talk=True),
    "kick_w": dict(STANCE, fl=(78, -100), lean=-4, fa=(60, 70), ba=(-20, 60)),
    "kick": dict(STANCE, fl=(98, 0), bl=(-6, 0), lean=-18, fa=(40, 80), ba=(-40, 60), talk=True),
    "up_w": dict(STANCE, fl=(42, -76), bl=(-26, -54), fa=(15, 40), ba=(30, 80), lean=10),
    "up": dict(STANCE, fl=(10, -12), bl=(-12, -6), fa=(172, 0), ba=(40, 90), lean=-8, talk=True),
    "sweep_w": dict(STANCE, fl=(40, -90), bl=(-50, -80), lean=24, fa=(30, 40), ba=(-30, 40)),
    "sweep": dict(STANCE, fl=(86, -4), bl=(-58, -100), lean=34, fa=(-20, 30), ba=(-50, 20), talk=True),
    "air1": dict(grounded=False, fl=(50, -70), bl=(18, -80), fa=(95, 0), ba=(50, 90), lean=8, eyes="fierce",
                 talk=True),
    "air2": dict(grounded=False, fl=(30, -50), bl=(40, -90), fa=(40, 100), ba=(95, 0), lean=12, eyes="fierce",
                 talk=True),
    "air3_w": dict(grounded=False, fl=(40, -60), bl=(10, -70), fa=(175, 10), ba=(165, 20), lean=-10, eyes="fierce"),
    "air3": dict(grounded=False, fl=(30, -40), bl=(0, -50), fa=(60, 0), ba=(50, 10), lean=26, eyes="fierce",
                 talk=True),
    "block": dict(fl=(26, -42), bl=(-22, -32), fa=(38, 112), ba=(32, 118), lean=-4, eyes="fierce", head=4),
    "dash": dict(fl=(62, -44), bl=(-52, -34), fa=(-45, 30), ba=(-65, 20), lean=32, eyes="fierce"),
    "rise": dict(grounded=False, fl=(44, -84), bl=(12, -64), fa=(140, 20), ba=(110, 30), lean=0),
    "fall": dict(grounded=False, fl=(12, -14), bl=(-12, -20), fa=(100, 10), ba=(80, 10), lean=0),
    "hit": dict(lean=-16, head=-12, eyes="hurt", fa=(-30, 40), ba=(-50, 30), fl=(16, -12), bl=(-10, -6)),
    "hit2": dict(lean=-32, head=-22, eyes="hurt", talk=True, fa=(-80, 20), ba=(-105, 20), fl=(36, -18),
                 bl=(-26, -12)),
    "tumble": dict(grounded=False, fl=(62, -64), bl=(-32, -44), fa=(150, 40), ba=(-150, 30), eyes="hurt",
                   talk=True),
    "down": dict(fl=(6, 0), bl=(-4, 0), fa=(160, 0), ba=(140, 0), eyes="hurt", lean=0),
    "crouch": dict(fl=(45, -90), bl=(-35, -80), fa=(40, 60), ba=(20, 70), lean=18, eyes="fierce"),
    "grab": dict(STANCE, fa=(88, 6), ba=(84, 14), lean=14),
    "lift": dict(STANCE, fa=(172, 0), ba=(166, 6), lean=-18, fl=(24, -20), bl=(-26, -10), talk=True),
    "throw_w": dict(STANCE, fa=(200, -30), ba=(40, 80), lean=-12),
    "throw": dict(STANCE, fa=(92, 4), ba=(-20, 50), lean=20, fl=(30, -20), bl=(-30, -6), talk=True),
    "charge": dict(fl=(55, -40), bl=(-45, -30), fa=(85, 10), ba=(70, 20), lean=30, eyes="fierce", talk=True,
                   prop="pillow"),
    "spin": dict(STANCE, fa=(90, 0), ba=(90, 0), lean=0, prop="pan", talk=True),
    "pole": dict(STANCE, fa=(128, 0), ba=(110, 10), lean=10, fl=(34, -24), bl=(-26, -8), prop="stick", talk=True),
    "vac": dict(fl=(34, -18), bl=(-30, -14), fa=(70, 4), ba=(64, 14), lean=-10, eyes="fierce"),
    "bounce": dict(grounded=False, fl=(70, -110), bl=(50, -120), fa=(160, 10), ba=(150, 20), lean=0, talk=True),
    "kneel": dict(fl=(60, -110), bl=(-70, -100), fa=(70, 50), ba=(40, 60), lean=10, prop="phone"),
    "wand": dict(STANCE, fa=(170, 0), ba=(140, 20), lean=-6, prop="wand", talk=True, eyes="closed"),
    "slide": dict(fl=(84, -2), bl=(66, -30), fa=(-60, 30), ba=(-80, 20), lean=-46, eyes="fierce"),
    "scoop": dict(fl=(45, -100), bl=(-40, -90), fa=(25, 5), ba=(15, 15), lean=40),
    "place": dict(fl=(40, -100), bl=(-40, -90), fa=(40, 10), ba=(30, 20), lean=34),
    "cheer": dict(fa=(170, 10), ba=(160, 10), fl=(6, 0), bl=(-6, 0), talk=True, eyes="closed"),
}


def mix(a, b, k):
    """Blend two rigs."""
    out = dict(b if k >= 0.5 else a)
    for key in ("lean", "head", "hipx", "lift"):
        out[key] = lerp(a.get(key, 0.0), b.get(key, 0.0), k)
    for key in ("fl", "bl", "fa", "ba"):
        av = a.get(key, (0.0, 0.0))
        bv = b.get(key, (0.0, 0.0))
        out[key] = (lerp(av[0], bv[0], k), lerp(av[1], bv[1], k))
    return out


def keys(u, frames):
    """frames: [(u, rig), ...] sorted; the rig at progress u (eased between key frames)."""
    if u <= frames[0][0]:
        return dict(frames[0][1])
    for (u0, r0), (u1, r1) in zip(frames, frames[1:]):
        if u <= u1:
            return mix(r0, r1, smooth((u - u0) / max(1e-6, u1 - u0)))
    return dict(frames[-1][1])


def run_rig(t, lean=14):
    ph = t * 13
    s = math.sin(ph)
    return dict(fl=(40 * s, -30 - 30 * max(0.0, -s)), bl=(-40 * s, -30 - 30 * max(0.0, s)),
                fa=(-50 * s, 70), ba=(50 * s, 70), lean=lean, eyes="fierce")


def stance_rig(t):
    r = dict(STANCE)
    b = math.sin(t * 5)
    r["fl"] = (22 + 2 * b, -34 - 4 * b)
    r["bl"] = (-18 - 2 * b, -22 - 4 * b)
    r["fa"] = (55 + 3 * b, 88)
    return r


# ====================================================================================================== bursts
def burst(b, kind, x, y, z, n=10, col="#ffffff", col2=None, spd=260.0, ang=90.0, spread=360.0, g=600.0,
          dur=0.5, size=4.0, side=True):
    """A particle burst: drawn from its age alone, so guests see the same thing (no particle state)."""
    b.add_fx("burst", None, x=x, y=y, z=z, kind=kind, n=n, col=col, col2=col2 or col, spd=spd, ang=ang,
             spread=spread, g=g, dur=dur, size=size, side=side, seed=random.randint(1, 1 << 20))


def draw_burst(p, e, iso):
    age = e["age"]
    dur = e.get("dur", 0.5)
    u = age / max(0.01, dur)
    if u >= 1:
        return
    rnd = random.Random(e.get("seed", 1))
    kind = e.get("kind", "spark")
    n = int(e.get("n", 10))
    c1, c2 = QColor(e.get("col", "#ffffff")), QColor(e.get("col2", e.get("col", "#ffffff")))
    side = e.get("side", True)
    g = e.get("g", 600.0)
    size = e.get("size", 4.0)
    x0, y0, z0 = e.get("x", 0.0), e.get("y", 0.0), e.get("z", 0.0)
    a_fade = max(0.0, 1 - u) ** 1.2
    for i in range(n):
        ang = math.radians(e.get("ang", 90.0) + rnd.uniform(-0.5, 0.5) * e.get("spread", 360.0))
        sp = e.get("spd", 260.0) * rnd.uniform(0.45, 1.0)
        life = rnd.uniform(0.6, 1.0)
        a = min(age, dur * life)
        if age > dur * life:
            continue
        drag = 1.0 / (1.0 + 2.5 * a)
        if side:
            vx, vz, vy = math.cos(ang) * sp, math.sin(ang) * sp, 0.0
        else:
            vx, vy, vz = math.cos(ang) * sp, math.sin(ang) * sp * 0.6, rnd.uniform(0.2, 0.9) * sp * 0.8
        px = x0 + vx * a * drag
        py = y0 + vy * a * drag
        pz = z0 + vz * a * drag - 0.5 * g * a * a
        if pz < 0 and not side:
            pz = 0.0
        sx, sy = iso(px, py, pz)
        col = QColor(c1 if i % 2 == 0 else c2)
        al = a_fade * (1 - a / (dur * life)) ** 0.5
        col.setAlphaF(max(0.0, min(1.0, al)))
        if kind == "spark":
            # a short streak along the motion
            ex = vx * drag * 0.03
            ez = (vz * drag - g * a) * 0.03
            p.setPen(QPen(col, max(1.0, size * 0.6), Qt.SolidLine, Qt.RoundCap))
            p.drawLine(QPointF(sx, sy), QPointF(sx - ex, sy + ez))
        elif kind in ("dust", "smoke"):
            r = size * (1.0 + 2.2 * a / dur)
            p.setPen(Qt.NoPen)
            col.setAlphaF(max(0.0, al * (0.55 if kind == "dust" else 0.45)))
            p.setBrush(col)
            p.drawEllipse(QPointF(sx, sy), r, r * (0.75 if kind == "dust" else 1.0))
        elif kind == "rock":
            p.setPen(Qt.NoPen)
            p.setBrush(col)
            s = size * rnd.uniform(0.6, 1.2)
            rot = a * rnd.uniform(6, 14)
            pts = [QPointF(sx + math.cos(rot + k * 2.1) * s, sy + math.sin(rot + k * 2.1) * s) for k in range(3)]
            p.drawPolygon(QPolygonF(pts))
        elif kind == "feather":
            p.save()
            p.translate(sx + 6 * math.sin(a * 9 + i), sy)
            p.rotate(30 * math.sin(a * 7 + i))
            p.setPen(Qt.NoPen)
            p.setBrush(col)
            p.drawEllipse(QPointF(0, 0), size * 1.4, size * 0.5)
            p.restore()
        elif kind == "star":
            p.setPen(Qt.NoPen)
            p.setBrush(col)
            s = size * (1.2 - 0.5 * u)
            pts = []
            for k in range(10):
                rr = s if k % 2 == 0 else s * 0.45
                aa = -math.pi / 2 + k * math.pi / 5 + a * 4
                pts.append(QPointF(sx + math.cos(aa) * rr, sy + math.sin(aa) * rr))
            p.drawPolygon(QPolygonF(pts))
        elif kind == "glow":
            p.setPen(Qt.NoPen)
            p.setBrush(col)
            r = size * (1 - 0.6 * u)
            p.drawEllipse(QPointF(sx, sy), r, r)
            hl = QColor(255, 255, 255)
            hl.setAlphaF(max(0.0, al * 0.8))
            p.setBrush(hl)
            p.drawEllipse(QPointF(sx, sy), r * 0.45, r * 0.45)
        elif kind == "drop":
            p.setPen(Qt.NoPen)
            p.setBrush(col)
            p.drawEllipse(QPointF(sx, sy), size * 0.7, size)
        else:
            p.setPen(Qt.NoPen)
            p.setBrush(col)
            p.drawEllipse(QPointF(sx, sy), size, size)


def draw_slash(p, e, iso):
    """A crescent blade of light (claw swipes, kicks, spatula arcs)."""
    u = e["age"] / max(0.01, e.get("dur", 0.22))
    if u >= 1:
        return
    sx, sy = iso(e.get("x", 0), e.get("y", 0), e.get("z", 0))
    r = e.get("r", 40.0)
    a0 = e.get("a0", -60.0)
    sweep = e.get("sweep", 140.0)
    face = e.get("face", 1)
    col = QColor(e.get("col", "#ffffff"))
    span = sweep * smooth(min(1.0, u * 2.2))
    start = a0
    p.save()
    p.translate(sx, sy)
    if face < 0:
        p.scale(-1, 1)
    path = QPainterPath()
    rect_o = QRectF(-r, -r, 2 * r, 2 * r)
    rect_i = QRectF(-r * 0.72, -r * 0.82, 2 * r * 0.72, 2 * r * 0.82)
    path.arcMoveTo(rect_o, -start)
    path.arcTo(rect_o, -start, -span)
    path.arcTo(rect_i, -(start + span), span)
    path.closeSubpath()
    al = (1 - u) ** 1.3
    col.setAlphaF(max(0.0, min(1.0, 0.9 * al)))
    p.setPen(Qt.NoPen)
    p.setBrush(col)
    p.drawPath(path)
    wh = QColor(255, 255, 255)
    wh.setAlphaF(max(0.0, min(1.0, al)))
    p.setPen(QPen(wh, 2.0))
    p.setBrush(Qt.NoBrush)
    p.drawArc(rect_o, int(-start * 16), int(-span * 16))
    p.restore()


def slash(b, fi, r=40.0, a0=-70.0, sweep=150.0, col=None, dz=0.5, dx=18.0, dur=0.22):
    b.add_fx("blade", None, x=fi.x + getattr(fi, "face", 1) * dx, y=fi.a.y,
             z=getattr(fi, "z", 0.0) + getattr(fi, "hgt", 60) * dz, r=r, a0=a0, sweep=sweep,
             col=col or HG.CHARS.get(getattr(fi, "char", "calico"), {}).get("color", "#ffffff"),
             face=getattr(fi, "face", 1), dur=dur)


# ====================================================================================================== events
def on_hit(b, att, o, dmg, heavy=False, launch=False, side=True):
    """Sparks out of the victim, away from the attacker; a ring and debris for the big ones."""
    s = 1 if att is None or o.x >= att.x else -1
    col = HG.CHARS.get(getattr(att, "char", None), {}).get("color", "#ffd34c") if att is not None else "#ffd34c"
    z = getattr(o, "z", 0.0) + getattr(o, "hgt", 60) * 0.55
    ang = 0 if s > 0 else 180
    if launch:
        ang = 60 if s > 0 else 120
    burst(b, "spark", o.x, o.a.y, z, n=8 + int(dmg), col="#fff6c8", col2=col, spd=420 if heavy else 300,
          ang=ang, spread=110, g=500, dur=0.32, size=3.2, side=side)
    if heavy:
        burst(b, "glow", o.x, o.a.y, z, n=10, col=col, col2="#ffffff", spd=200, ang=ang, spread=200, g=200,
              dur=0.45, size=5, side=side)
        b.add_fx("ringz", None, x=o.x, y=o.a.y, z=z, r=46, col=col, dur=0.3)
    o.flash = 0.12 if heavy else 0.08


def on_block(b, o, parry=False, side=True):
    z = getattr(o, "z", 0.0) + getattr(o, "hgt", 60) * 0.6
    if parry:
        burst(b, "star", o.x, o.a.y, z, n=10, col="#ffd34c", col2="#ffffff", spd=240, g=0, dur=0.5, size=6,
              side=side)
        b.add_fx("ringz", None, x=o.x, y=o.a.y, z=z, r=60, col="#ffd34c", dur=0.35)
    else:
        burst(b, "spark", o.x + getattr(o, "face", 1) * 10, o.a.y, z, n=8, col="#bfe0ff", col2="#ffffff", spd=260,
              ang=90, spread=180, g=400, dur=0.25, size=2.6, side=side)


def on_land(b, fi, hard=False, side=True):
    burst(b, "dust", fi.x, fi.a.y, getattr(fi, "z", 0.0) + 2, n=8 if hard else 5, col="#d9c9b0", col2="#bfae96",
          spd=160 if hard else 100, ang=90, spread=170, g=0, dur=0.45, size=5 if hard else 4, side=side)


def on_dash(b, fi, side=True):
    d = getattr(fi, "face", 1)
    burst(b, "dust", fi.x - d * 10, fi.a.y, getattr(fi, "z", 0.0) + 2, n=6, col="#d9c9b0", spd=140,
          ang=180 if d > 0 else 0, spread=50, g=0, dur=0.4, size=4, side=side)


def on_ko(b, o, side=True):
    z = getattr(o, "z", 0.0) + 40
    burst(b, "star", o.x, o.a.y, z, n=12, col="#ffd34c", col2="#ffffff", spd=300, g=200, dur=0.8, size=7, side=side)
    burst(b, "spark", o.x, o.a.y, z, n=18, col="#ffffff", col2="#ffcf3a", spd=520, g=300, dur=0.45, size=3.5,
          side=side)
    b.add_fx("ringz", None, x=o.x, y=o.a.y, z=z, r=90, col="#ffffff", dur=0.4)


def on_wall(b, fi, side=True):
    burst(b, "rock", fi.x, fi.a.y, getattr(fi, "z", 0.0) + 30, n=8, col="#9d9587", col2="#c9c0ae", spd=260,
          ang=90, spread=160, g=900, dur=0.6, size=4, side=side)
    b.add_fx("stars", fi)


SKILL_FX = {
    # name: (kind, colour 1, colour 2, n, speed, gravity, size)
    "pounce": ("spark", "#f29a3a", "#ffffff", 8, 240, 0, 3),
    "upclaw": ("glow", "#ffe08a", "#f29a3a", 12, 260, -200, 5),
    "shadow": ("smoke", "#7a5aa8", "#4a3a6a", 14, 160, -60, 9),
    "roll": ("dust", "#c9b294", "#a8876a", 10, 120, 0, 6),
    "buttslam": ("rock", "#8d8576", "#b9ae9a", 16, 360, 1000, 5),
    "hiss": ("glow", "#b38ae0", "#7a5aa8", 10, 220, 0, 5),
    "charge": ("feather", "#ffffff", "#f7e8ef", 10, 180, 120, 4),
    "liftup": ("star", "#ffd34c", "#ffffff", 8, 200, 100, 5),
    "slipper": ("spark", "#5e9bd6", "#ffffff", 6, 200, 0, 3),
    "spatula": ("drop", "#f2c94c", "#e8a33a", 14, 280, 500, 3),
    "pole": ("spark", "#c7a27a", "#ffffff", 8, 320, 0, 3),
    "vacuum": ("glow", "#bfe0ff", "#e4639b", 16, -260, 0, 4),
    "plush": ("star", "#f7b8cf", "#ffffff", 6, 180, 0, 4),
    "bounce": ("dust", "#e8473f", "#ffffff", 10, 200, 0, 5),
    "rccar": ("smoke", "#9a9a9a", "#666666", 8, 80, -60, 6),
}


def on_skill(b, fi, name, side=True):
    spec = SKILL_FX.get(name)
    if spec is None:
        return
    kind, c1, c2, n, spd, g, size = spec
    z = getattr(fi, "z", 0.0) + getattr(fi, "hgt", 60) * 0.5
    d = getattr(fi, "face", 1)
    ang = 0 if d > 0 else 180
    spread = 360 if name in ("shadow", "buttslam", "hiss", "liftup", "vacuum", "rccar", "bounce") else 120
    burst(b, kind, fi.x, fi.a.y, z, n=n, col=c1, col2=c2, spd=spd, ang=ang, spread=spread, g=g, dur=0.6,
          size=size, side=side)


# ====================================================================================================== animate
def _set(a, **kw):
    for k, v in kw.items():
        setattr(a, k, v)


def animate(b, fi):
    """Pose and transform for one fighter in a side-view game (brawl / race), from its state."""
    a = fi.a
    st = fi.st
    t = getattr(a, "t", 0.0)
    cat = a.is_cat
    face = getattr(fi, "face", 1)
    tr = dict(rot=0.0, pz=0.0, sx=1.0, sy=1.0, dx=0.0, dy=0.0, fl=0.0, gh=0, op=1.0)
    fl = getattr(fi, "flash", 0.0)
    if fl > 0:
        tr["fl"] = min(1.0, fl / 0.1)
    if fi.inv > 0 and st not in ("down", "ko", "getup", "super", "dash") and int(t * 16) % 2:
        tr["op"] = 0.55
    hgt = getattr(fi, "hgt", 60)
    u = fi.t / max(0.01, fi.dur) if fi.dur and fi.dur < 50 else 0.0
    pose, rig, fu, fk = None, None, 0.0, 0
    data = fi.data or {}
    sk = data.get("sk") if st in ("skill", "super", "throwing") else None
    # landing squash
    land = getattr(fi, "land_t", 0.0)
    if land > 0:
        k = land / 0.14
        tr["sx"], tr["sy"] = 1 + 0.16 * k, 1 - 0.18 * k
    if b.phase in ("travel", "count"):
        if cat:
            pose = "f_ready" if b.phase == "count" else "stand"
        else:
            rig = stance_rig(t) if b.phase == "count" else None
            pose = "rig" if rig else "stand"
    elif st in ("idle", "over") or (st == "run" and b.game != "race" and abs(fi.vx) < 20):
        if cat:
            pose = "f_ready" if st != "over" else "stand"
        else:
            rig = stance_rig(t)
    elif st == "run":
        if cat:
            pose = "run"
        else:
            pose = "run"
        tr["rot"] = 4 * face
    elif st == "air":
        if cat:
            pose = "jump"
        else:
            rig = R["rise"] if fi.vz > 0 else R["fall"]
        if fi.vz > 300:
            tr["sx"], tr["sy"] = 0.9, 1.12
    elif st == "atk":
        mv = data.get("mv", "j1")
        su = {"j1": 0.06, "j2": 0.06, "j3": 0.09, "uj": 0.08, "dj": 0.08}.get(mv, 0.05)
        tt = fi.t
        if cat:
            fu = min(1.0, tt / max(0.01, su * 2 + 0.12))
            pose = {"j1": "f_swat", "j2": "f_swat", "j3": "f_leap", "uj": "f_upper", "dj": "f_sweep",
                    "aj1": "f_swat", "aj2": "f_swat", "aj3": "f_slam"}.get(mv, "f_swat")
            fk = 1 if mv in ("j2", "aj2") else 0
            if mv == "j3":
                tr["rot"] = -10 * face * math.sin(min(1.0, tt / 0.3) * math.pi)
        else:
            wk = {"j1": ("jab_w", "jab"), "j2": ("cross_w", "cross"), "j3": ("kick_w", "kick"),
                  "uj": ("up_w", "up"), "dj": ("sweep_w", "sweep"), "aj1": ("air1", "air1"),
                  "aj2": ("air2", "air2"), "aj3": ("air3_w", "air3")}.get(mv, ("jab_w", "jab"))
            base = stance_rig(t) if fi.ground else R["rise"]
            rig = keys(tt, [(0.0, base), (su * 0.8, R[wk[0]]), (su + 0.04, R[wk[1]]), (su + 0.16, R[wk[1]]),
                            (su + 0.36, base)])
        if tt < su:
            tr["sx"], tr["sy"] = 1.05, 0.95            # wind-up squash
    elif st == "block":
        pose, rig = ("f_block", None) if cat else (None, R["block"])
    elif st == "dash":
        pose, rig = ("f_dash", None) if cat else (None, R["dash"])
        tr["gh"] = 3
        tr["sx"], tr["sy"] = 1.12, 0.92
    elif st == "hit":
        heavy = fi.dur >= 0.45
        if cat:
            pose, fu, fk = "f_hit", u, 1 if heavy else 0
        else:
            rig = keys(u, [(0.0, R["hit2" if heavy else "hit"]), (0.7, R["hit2" if heavy else "hit"]),
                           (1.0, stance_rig(t))])
        shake = (1 - u) * (5 if heavy else 3)
        tr["dx"] = shake * math.sin(t * 70)
        tr["rot"] = -face * (12 if heavy else 7) * (1 - u)
    elif st in ("juggle", "grabbed", "fall"):
        pose, rig = ("f_tumble", None) if cat else (None, R["tumble"])
        spin = getattr(fi, "spin", 0.0)
        tr["rot"] = spin
        tr["pz"] = hgt * 0.5
    elif st in ("down", "ko"):
        if cat:
            pose = "f_down"
        else:
            rig = R["down"]
            tr["rot"] = -90 * face
            tr["dy"] = -4
        if st == "ko" and not fi.ground:
            tr["rot"] = getattr(fi, "spin", 0.0) if cat else tr["rot"] + getattr(fi, "spin", 0.0)
            tr["pz"] = hgt * 0.5 if cat else 0.0
    elif st == "getup":
        style = data.get("gu", 0)
        if cat:
            pose, fu = "f_getup", u
            if style == 1:
                tr["rot"] = -360 * face * smooth(u)
                tr["pz"] = hgt * 0.45
        else:
            rig = keys(u, [(0.0, R["down"]), (0.5, R["crouch"]), (1.0, stance_rig(t))])
            if style == 1:
                tr["rot"] = face * (-90 - 270 * smooth(u))  # backward roll up
                tr["pz"] = hgt * 0.35 * (1 - abs(0.5 - u) * 2)
            else:
                tr["rot"] = -90 * face * (1 - smooth(min(1.0, u * 1.6)))
                tr["dy"] = -18 * math.sin(u * math.pi)    # kip-up hop
    elif st == "throwing":
        if cat:
            pose, fu = "f_grab", min(1.0, fi.t / 0.4)
        else:
            rig = keys(fi.t, [(0.0, R["grab"]), (0.22, R["lift"]), (0.34, R["throw"]), (0.42, R["throw"])])
    elif st == "skill" and sk == "toss":
        pose, rig = ("f_swat", None) if cat else (None, keys(fi.t, [(0, R["throw_w"]), (0.12, R["throw"]),
                                                                    (0.25, R["throw"])]))
        fu = min(1.0, fi.t / 0.25)
    elif st == "skill" and sk == "tele":
        pose, rig = ("f_hiss", None) if cat else (None, R["throw_w"])
        k = min(1.0, fi.t / 0.7)
        tr["sx"], tr["sy"] = 1 + 0.06 * k, 1 - 0.06 * k
    elif st in ("skill", "super"):
        pose, rig, fu, fk, tr2 = skill_anim(b, fi, sk, t)
        tr.update(tr2)
    elif st == "slide":
        pose, rig = ("belly", None) if cat else (None, R["slide"])
        tr["gh"] = 2
    elif st == "trip":
        pose, rig = ("f_tumble", None) if cat else (None, R["hit2"])
        tr["rot"] = -face * 30
    elif st == "finish":
        pose, rig = ("happy", None) if cat else (None, R["cheer"])
    else:
        pose = pose or ("f_ready" if cat else "stand")
    if b.game == "race" and (getattr(fi, "boost", 0) > 0 or getattr(fi, "sprint", 0) > 0 or getattr(fi, "ram", 0) > 0):
        tr["gh"] = max(tr["gh"], 2)
    # write to the agent
    if cat:
        a.set_pose(pose or "f_ready")
        a.fu, a.fk = fu, fk
        a.running = st in ("run", "dash")
    else:
        if rig is not None:
            a.pose, a.rig = "rig", rig
        else:
            a.pose, a.rig = pose or "stand", None
        a.view = "side"
        a.prop = rig.get("prop") if rig else None
        a.seat = 0.0
    a.fanim = tr


def skill_anim(b, fi, sk, t):
    """(cat pose, person rig, fu, fk, transform) for a skill / super in progress."""
    tt = fi.t
    face = getattr(fi, "face", 1)
    hgt = getattr(fi, "hgt", 60)
    tr = {}
    cat = fi.a.is_cat
    u = tt / max(0.01, fi.dur) if fi.dur < 50 else 0.0
    if cat:
        if sk in ("pounce",):
            return "f_leap", None, u, 0, dict(gh=3, rot=-8 * face)
        if sk in ("upclaw",):
            return "f_upper", None, u, 0, dict(gh=2)
        if sk == "shadow":
            return "f_swat", None, max(0.0, (tt - 0.28) / 0.25), 0, dict(gh=2)
        if sk == "roll":
            return "f_ball", None, u, 0, dict(rot=face * tt * 900, pz=24, gh=2)
        if sk in ("buttslam", "s_mountain"):
            if fi.vz > 0:
                return "jump", None, u, 0, dict(sx=0.9, sy=1.1)
            return "f_slam", None, u, 0, dict(gh=2)
        if sk == "hiss":
            return "f_hiss", None, u, 0, dict(sx=1.08, sy=1.08)
        if sk == "s_nine":
            return "f_frenzy", None, u, 0, dict(gh=3)
        return "f_swat", None, (tt * 3) % 1.0, int(tt * 6) % 2, {}
    # people
    R_ = R
    if sk == "charge":
        rg = dict(R_["charge"])
        rr = run_rig(t, 30)
        rg["fl"], rg["bl"] = rr["fl"], rr["bl"]
        return None, rg, u, 0, dict(gh=3)
    if sk == "liftup":
        return None, keys(tt, [(0, R_["grab"]), (0.35, R_["grab"]), (0.5, R_["lift"]), (0.75, R_["lift"])]), u, 0, {}
    if sk in ("slipper", "plush"):
        return None, keys(tt, [(0, R_["throw_w"]), (0.12, R_["throw"]), (0.3, R_["throw"])]), u, 0, {}
    if sk == "spatula":
        # spinning: flip to and fro quickly
        fi.a.facing = 1 if int(tt * 14) % 2 == 0 else -1
        return None, R_["spin"], u, 0, dict(gh=1)
    if sk == "pole":
        return None, keys(tt, [(0, R_["crouch"]), (0.12, R_["pole"]), (0.4, R_["pole"])]), u, 0, {}
    if sk in ("vacuum", "s_clean"):
        rg = dict(R_["vac"])
        rg["lean"] = -10 - 4 * math.sin(t * 30)
        return None, rg, u, 0, dict(dx=1.2 * math.sin(t * 50))
    if sk == "bounce":
        return None, R_["bounce"], u, 0, dict(sx=0.92 if fi.vz > 0 else 1.0, sy=1.08 if fi.vz > 0 else 1.0)
    if sk == "rccar":
        return None, R_["kneel"], u, 0, {}
    if sk == "s_sofa":
        rg = keys(tt, [(0, R_["crouch"]), (0.25, R_["lift"]), (0.45, R_["lift"]), (0.6, R_["throw"]), (0.75, R_["throw"])])
        rg["prop"] = None
        return None, rg, u, 0, {}
    if sk == "s_rain":
        return None, R_["wand"], u, 0, {}
    return None, R_["throw"], u, 0, {}


def animate_top(b, fi):
    """The top-down games (bomb / shoot / melee): their own poses stay; add flash, recoil and blinking."""
    a = fi.a
    t = getattr(a, "t", 0.0)
    tr = dict(rot=0.0, pz=0.0, sx=1.0, sy=1.0, dx=0.0, dy=0.0, fl=0.0, gh=0, op=1.0)
    fl = getattr(fi, "flash", 0.0)
    if fl > 0:
        tr["fl"] = min(1.0, fl / 0.1)
    if fi.inv > 0 and fi.st not in ("ko", "roll") and int(t * 16) % 2:
        tr["op"] = 0.55
    st = fi.st
    face = 1 if getattr(fi, "fx", 1.0) >= 0 else -1
    if st in ("hit", "stun"):
        u = fi.t / max(0.01, fi.dur)
        tr["dx"] = (1 - u) * 4 * math.sin(t * 70)
        tr["rot"] = -face * 9 * (1 - u)
    elif st == "down":
        tr["rot"] = -70 * face if not a.is_cat else 0.0
    elif st == "roll":
        tr["rot"] = face * min(1.0, fi.t / max(0.01, fi.dur)) * 360
        tr["pz"] = 18
        tr["gh"] = 2
    elif st == "jump" or (fi.z > 4 and st not in ("ko",)):
        tr["sx"], tr["sy"] = 0.94, 1.06
    elif st == "charge":
        k = min(1.0, fi.t / 0.6)
        tr["sx"], tr["sy"] = 1 + 0.06 * k, 1 - 0.06 * k
    elif st == "trapped":
        tr["dx"] = 1.5 * math.sin(t * 30)
    a.fanim = tr
