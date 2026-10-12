"""灵宝: the plush toys come along to a fight as little floating spirits (v22).

Each fighter can bring one of the five plushies. It floats behind their shoulder and acts on its own (no extra keys):
  兔兔         治愈     heals its owner now and then (泡泡堂: frees them from yarn; 赛跑: helps them up after a trip)
  baby dragon  小火球   spits a small homing fireball at the nearest opponent (泡泡堂: burns a box open)
  avocado      泡泡盾   wraps its owner in a bubble that stops the next hit (泡泡堂: the next blast)
  snow ball    冰冻雪花 throws a snowflake that slows the nearest opponent down for a moment
  禾宝         鹿角加速 its owner runs a little faster all the time (格斗: the 怒气 meter fills faster too)

Everything here works through the game's own hit / speed hooks, so each game only needs to call pal_block() where
a hit lands, multiply its run speed by pal_speed(), and draw with draw_pals().
"""
import math
import random

from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import QColor, QPainterPath, QPen, QPolygonF, QRadialGradient

from . import house_art as H
from . import house_fanim as FA

PALS = {
    "兔兔": dict(kind="bunny", color="#fbf8f2", icon="🐰", skill="治愈", cd=12.0, glow="#ffb3c8",
               desc="时不时给主人回血（泡泡堂：把主人从毛线里救出来；赛跑：摔倒马上扶起来）"),
    "baby dragon": dict(kind="bunny", color="#d6d7dd", icon="🐲", skill="小火球", cd=7.0, glow="#ff9a4a",
                        desc="朝最近的对手吐一个会追踪的小火球（泡泡堂：烧开一个箱子）"),
    "avocado": dict(kind="duck", color=None, icon="🦆", skill="泡泡盾", cd=15.0, glow="#9fe0a0",
                    desc="给主人套一个泡泡，挡下一次攻击（泡泡堂：挡一次爆炸；赛跑：挡一次绊倒）"),
    "snow ball": dict(kind="bear", color="#f7f3ec", icon="⛄", skill="冰冻雪花", cd=10.0, glow="#a8dcff",
                      desc="丢一片雪花，让最近的对手慢下来 2 秒"),
    "禾宝": dict(kind="reindeer", color=None, icon="🦌", skill="鹿角加速", cd=0.0, glow="#ffd27a",
               desc="主人一直跑得快一点（格斗：怒气涨得更快）"),
}
PAL_NAMES = list(PALS)
# (v23) per game: some help a lot more in one game than another (tuned by AI-vs-AI runs: the side with a pal
# should win a little more often, ~55-60 %, not every time)
CD_GAME = {("avocado", "bomb"): 30.0, ("avocado", "brawl"): 30.0, ("avocado", "shoot"): 24.0, ("avocado", "melee"): 24.0,
           ("兔兔", "bomb"): 22.0, ("baby dragon", "bomb"): 4.0, ("baby dragon", "brawl"): 8.5, ("snow ball", "brawl"): 9.0,
           ("兔兔", "brawl"): 13.0, ("兔兔", "fish"): 18.0, ("baby dragon", "soccer"): 10.0,
           ("baby dragon", "volley"): 15.0, ("baby dragon", "fish"): 9.0, ("avocado", "volley"): 26.0,
           ("兔兔", "volley"): 20.0, ("snow ball", "volley"): 8.0, ("snow ball", "fish"): 7.0,
           ("snow ball", "soccer"): 14.0}


def cd_of(name, game):
    return CD_GAME.get((name, game), PALS[name]["cd"])
SIDE_GAMES = ("brawl", "race", "volley")


# ======================================================================================================= set-up
def assign(b, wanted):
    """wanted: {uid: name / "?" (random) / "" (none)}. Random picks avoid doubles while there are enough."""
    used = {n for n in wanted.values() if n in PALS}
    for fi in b.fighters:
        fi.pal = None
        fi.pal_cd = 0.0
        fi.pal_t = 0.0          # time since it last acted (drives the little cast animation)
        fi.pal_shield = False
        fi.slow_t = 0.0
        w = wanted.get(fi.uid, "?" if fi.ctrl.startswith("ai:") else "?")
        if b.mode == "train" or not _pals_allowed(b):
            w = ""
        if w == "?":
            free = [n for n in PAL_NAMES if n not in used] or PAL_NAMES
            w = random.choice(free)
            used.add(w)
        if w in PALS:
            fi.pal = w
            fi.pal_cd = cd_of(w, b.game) * random.uniform(0.4, 0.7)
            fi.pal_t = 9.0
    b.pal_shots = []


# ======================================================================================================= geometry
def body_pos(b, fi):
    """Middle of a fighter's body (x, y, z)."""
    if b.game in SIDE_GAMES:
        return fi.x, fi.a.y, fi.z + getattr(fi, "hgt", 60) * 0.55
    return fi.a.x, fi.a.y, fi.z + (18 if fi.a.is_cat else 34)


def pal_pos(b, fi, t):
    """Where the spirit floats: behind the owner's shoulder, bobbing."""
    a = fi.a
    bob = 5 * math.sin(t * 3.1 + hash(fi.uid) % 7)
    sway = 4 * math.sin(t * 1.7 + hash(fi.uid) % 5)
    if b.game in SIDE_GAMES:
        face = getattr(fi, "face", 1) or 1
        h = getattr(fi, "hgt", 46 if a.is_cat else 96)
        return fi.x - face * 34 + sway, a.y, fi.z + h + 16 + bob
    d = 1 if getattr(fi, "fx", 1.0) >= 0 else -1
    return a.x - d * 30 + sway, a.y - 8, fi.z + (54 if a.is_cat else 104) + bob


def _alive(b, o):
    if b.game == "race":
        return o.place is None
    if b.game == "bomb":
        return o.alive() and getattr(o, "trapped", 0) <= 0
    return o.alive() and o.st not in ("ko",)


def nearest_foe(b, fi, reach=900.0):
    best, bd = None, reach
    x0, y0, z0 = body_pos(b, fi)
    for o in b.fighters:
        if o is fi or not _alive(b, o) or (o.team == fi.team and b.mode != "ffa"):
            continue
        x, y, z = body_pos(b, o)
        d = math.hypot(x - x0, (y - y0) * 1.5, (z - z0) * 0.5)
        if b.game == "race":
            # the one just ahead on the course
            d = (o.prog - fi.prog) * 3000 if o.prog > fi.prog else 1e9
        if d < bd:
            best, bd = o, d
    return best


# ======================================================================================================= hooks
def speed(b, fi):
    k = 1.0
    if getattr(fi, "slow_t", 0.0) > 0:
        k *= 0.6
    if getattr(fi, "pal", None) == "禾宝":
        k *= 1.1
    return k


def block(b, o):
    """The bubble shield: True when it swallowed this hit."""
    if not getattr(o, "pal_shield", False):
        return False
    o.pal_shield = False
    x, y, z = body_pos(b, o)
    FA.burst(b, "drop", x, y, z, n=14, col="#c8f0ff", col2="#ffffff", spd=240, g=300, dur=0.5, size=3,
             side=b.game in SIDE_GAMES)
    b.add_fx("ringz", None, x=x, y=y, z=z, r=50, col="#9fe0a0", dur=0.35)
    b.add_fx("text", o, text="泡泡挡住了！", small=True)
    b.sound("block")
    o.inv = max(o.inv, 0.3)
    return True


# ======================================================================================================= per frame
def step(b, dt):
    if not hasattr(b, "pal_shots"):
        return
    side = b.game in SIDE_GAMES
    for fi in b.fighters:
        fi.slow_t = max(0.0, getattr(fi, "slow_t", 0.0) - dt)
        if not getattr(fi, "pal", None):
            continue
        fi.pal_t += dt
        fi.pal_cd = max(0.0, fi.pal_cd - dt)
        name = fi.pal
        if name == "禾宝":
            if b.game == "brawl":
                fi.meter = min(100.0, fi.meter + dt * 1.4)
            continue
        if fi.pal_cd > 0 or not _ready(b, fi):
            continue
        if act(b, fi, name, side):
            fi.pal_cd = cd_of(name, b.game)
            fi.pal_t = 0.0
            b.add_fx("text", fi, text=PALS[name]["icon"] + " " + PALS[name]["skill"], small=True)
    step_shots(b, dt, side)


def _ready(b, fi):
    if b.game == "race":
        return fi.place is None
    if b.game == "bomb":
        return fi.alive()
    return fi.alive() and fi.st not in ("ko",)


def _pals_allowed(b):
    from . import house_games as HG
    return HG.GAMES.get(b.game, {}).get("pals", True)


def act(b, fi, name, side):
    """Do the thing. False when there was nothing to do (it tries again shortly)."""
    px, py, pz = pal_pos(b, fi, b.t)
    hook = getattr(b, "pal_act", None)
    if hook is not None:
        r = hook(fi, name, px, py, pz)       # (v24) a game's own version of this pal's trick
        if r is not None:
            return r
    if name == "兔兔":
        if b.game == "bomb":
            if getattr(fi, "trapped", 0) > 0 and fi.trapped < 3.6:
                b.free(fi, "兔兔把我救出来了！")
                _hearts(b, fi, side)
                return True
            fi.pal_cd = 0.3
            return False
        if b.game == "race":
            if fi.trip > 0.15 or fi.slip > 0.2:
                fi.trip = min(fi.trip, 0.08)
                fi.slip = 0.0
                _hearts(b, fi, side)
                return True
            fi.pal_cd = 0.2
            return False
        if fi.hp < fi.maxhp * 0.9:
            fi.hp = min(float(fi.maxhp), fi.hp + fi.maxhp * 0.1)
            _hearts(b, fi, side)
            return True
        fi.pal_cd = 1.0
        return False
    if name == "avocado":
        if b.game == "race":
            fi.shield = max(fi.shield, 3.0)
        else:
            if fi.pal_shield:
                fi.pal_cd = 1.0
                return False
            fi.pal_shield = True
        x, y, z = body_pos(b, fi)
        FA.burst(b, "glow", x, y, z, n=10, col="#9fe0a0", col2="#ffffff", spd=140, g=0, dur=0.5, size=4, side=side)
        return True
    if name == "baby dragon" and b.game == "bomb":
        cell = _box_near(b, fi)
        if cell is None:
            fi.pal_cd = 1.5
            return False
        from . import house_bomb as BM
        b.pal_shots.append({"k": "fire", "x": px, "y": py, "z": pz, "to": None, "cell": list(cell),
                            "tx": BM.cx(cell[0]), "ty": BM.cy(cell[1]), "tz": 20.0, "own": fi.uid, "t": 0.0})
        b.sound("whoosh")
        return True
    if name in ("baby dragon", "snow ball"):
        o = nearest_foe(b, fi, 700 if b.game != "race" else 1e9)
        if o is None:
            fi.pal_cd = 0.8
            return False
        b.pal_shots.append({"k": "fire" if name == "baby dragon" else "snow", "x": px, "y": py, "z": pz,
                            "to": o.uid, "own": fi.uid, "t": 0.0})
        b.sound("whoosh")
        return True
    return False


def _hearts(b, fi, side):
    x, y, z = body_pos(b, fi)
    FA.burst(b, "glow", x, y, z + 10, n=10, col="#ff8fb0", col2="#ffffff", spd=90, ang=90, spread=120, g=-120,
             dur=0.8, size=4, side=side)
    b.add_fx("text", fi, text="❤", small=True)


def _box_near(b, fi):
    from . import house_bomb as BM
    c0, r0 = int((fi.a.x - BM.X0) // BM.CW), int((fi.a.y - BM.Y0) // BM.CH)
    best, bd = None, 99
    for c in range(max(0, c0 - 4), min(BM.COLS, c0 + 5)):
        for r in range(max(0, r0 - 4), min(BM.ROWS, r0 + 5)):
            if b.grid[c][r] == "soft":
                d = abs(c - c0) + abs(r - r0)
                if d < bd:
                    best, bd = (c, r), d
    return best


def step_shots(b, dt, side):
    keep = []
    for s in b.pal_shots:
        s["t"] += dt
        if s["t"] > 3.0:
            continue
        o = None
        if s.get("to"):
            o = next((f for f in b.fighters if f.uid == s["to"]), None)
            if o is None or not _alive(b, o):
                continue
            tx, ty, tz = body_pos(b, o)
        else:
            tx, ty, tz = s["tx"], s["ty"], s["tz"]
        dx, dy, dz = tx - s["x"], ty - s["y"], tz - s["z"]
        d = math.sqrt(dx * dx + dy * dy + dz * dz)
        sp = 560.0 * dt
        if d <= max(18.0, sp):
            land(b, s, o, side)
            continue
        s["x"] += dx / d * sp
        s["y"] += dy / d * sp
        s["z"] += dz / d * sp + math.sin(s["t"] * 9) * 1.5
        keep.append(s)
    b.pal_shots = keep


def land(b, s, o, side):
    own = next((f for f in b.fighters if f.uid == s["own"]), None)
    x, y, z = s["x"], s["y"], s["z"]
    hook = getattr(b, "pal_land", None)
    if hook is not None and o is not None and hook(own, o, s["k"], x, y, z):
        return
    if s["k"] == "fire":
        FA.burst(b, "spark", x, y, z, n=12, col="#ffcf3a", col2="#ff6a3a", spd=260, g=300, dur=0.35, size=3,
                 side=side)
        FA.burst(b, "smoke", x, y, z, n=4, col="#8a8078", spd=60, g=-100, dur=0.5, size=6, side=side)
        if o is None:                                   # 泡泡堂: the box
            c, r = s["cell"]
            if b.grid[c][r] == "soft":
                from . import house_bomb as BM
                b.grid[c][r] = None
                b.add_fx("poof", None, x=BM.cx(c), y=BM.cy(r), z=20)
                k = b.hidden_items.pop((c, r), None)
                if k:
                    b.cell_items.append({"c": c, "r": r, "k": k, "safe": 0.5})
            return
        if b.game == "race":
            if o.shield <= 0:
                o.trip = max(o.trip, 0.35)
                o.flash = 0.1
            return
        if b.game == "bomb":
            o.slow_t = max(o.slow_t, 1.2)
            o.flash = 0.1
            return
        if block(b, o):
            return
        if b.game == "brawl":
            b.apply_hit(own, o, 4.0, (150, 140), 0.25, key="pal", unblockable=False,
                        from_x=x)
        else:
            b.hit(own, o, 4.0, 120, 0.25, False, (o.a.x - x + 0.1, o.a.y - y), proj=True)
    else:
        FA.burst(b, "star", x, y, z, n=10, col="#d8f0ff", col2="#ffffff", spd=200, g=100, dur=0.6, size=4,
                 side=side)
        if o is not None:
            if b.game in ("brawl", "shoot", "melee") and block(b, o):
                return
            o.slow_t = max(getattr(o, "slow_t", 0.0), 2.0)
            o.flash = 0.08
            b.add_fx("text", o, text="❄ 变慢了", small=True)
            if b.game in ("brawl", "shoot", "melee"):
                if b.game == "brawl":
                    b.apply_hit(own, o, 3.0, (60, 60), 0.15, key="pal", from_x=x)
                else:
                    b.hit(own, o, 3.0, 60, 0.15, False, (o.a.x - x + 0.1, o.a.y - y), proj=True)


# ======================================================================================================= network
def to_net(b):
    return {"pl": [[fi.pal or "", round(getattr(fi, "pal_t", 9.0), 1), bool(getattr(fi, "pal_shield", False)),
                    round(getattr(fi, "slow_t", 0.0), 1)] for fi in b.fighters],
            "ps": [[s["k"], round(s["x"]), round(s["y"]), round(s["z"])] for s in getattr(b, "pal_shots", [])]}


def from_net(b, d):
    for fi, r in zip(b.fighters, d.get("pl") or []):
        try:
            fi.pal = r[0] or None
            fi.pal_t, fi.pal_shield, fi.slow_t = float(r[1]), bool(r[2]), float(r[3])
        except (TypeError, ValueError, IndexError):
            fi.pal = None
    b.pal_shots = [{"k": r[0], "x": r[1], "y": r[2], "z": r[3], "t": 0.0} for r in d.get("ps") or []]


# ======================================================================================================= drawing
def draw_pals(p, b, t):
    from .house_art import iso
    for fi in b.fighters:
        a = fi.a
        if a.f != b.f or a.traveling is not None:
            continue
        # the bubble shield / frost on the owner, even without a pal of their own
        x, y, z = body_pos(b, fi)
        sx, sy = iso(x, y, z)
        rr = 30 if a.is_cat else 46
        if getattr(fi, "pal_shield", False):
            g = QRadialGradient(QPointF(sx - rr * 0.3, sy - rr * 0.4), rr * 1.2)
            g.setColorAt(0, QColor(255, 255, 255, 90))
            g.setColorAt(0.8, QColor(160, 230, 170, 50))
            g.setColorAt(1, QColor(120, 210, 140, 110))
            p.setPen(QPen(QColor(150, 220, 160, 190), 1.6))
            p.setBrush(g)
            w = 1 + 0.03 * math.sin(t * 5)
            p.drawEllipse(QPointF(sx, sy), rr * w, rr * 1.12 / w)
            p.setPen(QPen(QColor(255, 255, 255, 200), 2, Qt.SolidLine, Qt.RoundCap))
            p.drawArc(QRectF(sx - rr * 0.7, sy - rr * 0.85, rr * 1.0, rr * 1.0), 100 * 16, 50 * 16)
        if getattr(fi, "slow_t", 0.0) > 0:
            p.setPen(QPen(QColor(170, 220, 255, 200), 1.6))
            for k in range(3):
                ang = t * 2 + k * 2.1
                fx_, fy_ = sx + math.cos(ang) * rr * 0.8, sy + math.sin(ang) * rr * 0.4 + rr * 0.6
                for j in range(3):
                    aa = j * math.pi / 3
                    p.drawLine(QPointF(fx_ - 4 * math.cos(aa), fy_ - 4 * math.sin(aa)),
                               QPointF(fx_ + 4 * math.cos(aa), fy_ + 4 * math.sin(aa)))
        name = getattr(fi, "pal", None)
        if not name or name not in PALS:
            continue
        spec = PALS[name]
        px, py, pz = pal_pos(b, fi, t)
        sx, sy = iso(px, py, pz)
        cast = max(0.0, 1 - getattr(fi, "pal_t", 9.0) / 0.4)
        # aura
        glow = QColor(spec["glow"])
        g = QRadialGradient(QPointF(sx, sy - 12), 26 + 10 * cast)
        glow.setAlpha(int(110 + 100 * cast))
        g.setColorAt(0, glow)
        glow.setAlpha(0)
        g.setColorAt(1, glow)
        p.setPen(Qt.NoPen)
        p.setBrush(g)
        p.drawEllipse(QPointF(sx, sy - 12), 26 + 10 * cast, 26 + 10 * cast)
        # a few sparkles drifting off
        for k in range(3):
            u = (t * 0.8 + k / 3.0) % 1.0
            c = QColor(255, 255, 255, int(200 * (1 - u)))
            p.setBrush(c)
            p.drawEllipse(QPointF(sx + 10 * math.sin(k * 2.3 + t), sy + 4 + 18 * u), 1.6 * (1 - u) + 0.5,
                          1.6 * (1 - u) + 0.5)
        p.save()
        p.translate(sx, sy)
        face = getattr(fi, "face", None)
        if face is None:
            face = 1 if getattr(fi, "fx", 1.0) >= 0 else -1
        if face < 0:
            p.scale(-1, 1)
        s = 1.05 + 0.25 * cast
        p.rotate(6 * math.sin(t * 2.3))
        if name == "baby dragon":
            _dragon_wings(p, t, s)
        _blit_plush(p, name, s)
        p.restore()
    for s in getattr(b, "pal_shots", []):
        sx, sy = iso(s["x"], s["y"], s["z"])
        if s["k"] == "fire":
            g = QRadialGradient(QPointF(sx, sy), 11)
            g.setColorAt(0, QColor(255, 250, 200, 255))
            g.setColorAt(0.4, QColor(255, 170, 60, 230))
            g.setColorAt(1, QColor(230, 70, 40, 0))
            p.setPen(Qt.NoPen)
            p.setBrush(g)
            p.drawEllipse(QPointF(sx, sy), 11, 11)
        else:
            p.setPen(QPen(QColor(220, 240, 255), 2, Qt.SolidLine, Qt.RoundCap))
            rot = t * 6
            for j in range(3):
                aa = rot + j * math.pi / 3
                p.drawLine(QPointF(sx - 7 * math.cos(aa), sy - 7 * math.sin(aa)),
                           QPointF(sx + 7 * math.cos(aa), sy + 7 * math.sin(aa)))


_SPR = {}


def _blit_plush(p, name, s):
    """The plush drawn once into a pixmap (per zoom) and blitted: four of them every frame add up."""
    from PySide6.QtGui import QPainter, QPixmap
    tr = p.worldTransform()
    zoom = math.hypot(tr.m11(), tr.m12()) * s
    key = (name, round(zoom, 2))
    pm = _SPR.get(key)
    if pm is None:
        if len(_SPR) > 30:
            _SPR.clear()
        spec = PALS[name]
        pm = QPixmap(max(1, int(40 * zoom)), max(1, int(40 * zoom)))
        pm.fill(Qt.transparent)
        q = QPainter(pm)
        q.setRenderHint(QPainter.Antialiasing)
        q.scale(zoom, zoom)
        H.draw_plush(q, spec["kind"], 20, 34, 1.0, spec["color"])
        if name == "baby dragon":
            q.translate(20, 34)
            _dragon_spikes(q, 1.0)
        q.end()
        _SPR[key] = pm
    p.save()
    p.scale(s / zoom, s / zoom)
    p.drawPixmap(QPointF(-20 * zoom, -34 * zoom), pm)
    p.restore()


def _dragon_wings(p, t, s):
    flap = math.sin(t * 9) * 12
    p.setPen(QPen(QColor("#4c8a52"), 1.0))
    p.setBrush(QColor("#7cc47f"))
    for d, k in ((-1, 0.9), (1, 1.0)):
        p.save()
        p.translate(d * 5 * s, -12 * s)
        p.rotate(d * (20 + flap))
        path = QPainterPath(QPointF(0, 0))
        path.cubicTo(QPointF(d * 6 * s, -10 * s), QPointF(d * 16 * s * k, -8 * s), QPointF(d * 16 * s * k, -2 * s))
        path.quadTo(QPointF(d * 11 * s, -3 * s), QPointF(d * 10 * s, 2 * s))
        path.quadTo(QPointF(d * 5 * s, -1 * s), QPointF(0, 2 * s))
        path.closeSubpath()
        p.drawPath(path)
        p.restore()


def _dragon_spikes(p, s):
    p.setPen(QPen(QColor("#4c8a52"), 0.8))
    p.setBrush(QColor("#7cc47f"))
    for k, (x, y) in enumerate(((-3, -24.5), (1, -25.2), (5, -24))):
        p.drawPolygon(QPolygonF([QPointF(x * s - 2 * s, y * s + 1.5 * s), QPointF(x * s, y * s - 3 * s),
                                 QPointF(x * s + 2 * s, y * s + 1.5 * s)]))
