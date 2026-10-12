"""Shared pieces of the v24 top-down games (合作守家 / 涂地占领 / 猫咪足球 / 抢鱼大作战 / 躲猫猫).

TopGame is a Battle with the frame loop every one of them uses (keys -> buffered presses -> each fighter's state
machine -> the game's world -> tutorial -> effects -> poses -> end check), plus helpers for running about, rolling,
jumping and posing in the top-down view, and a steering helper for the AI.
"""
import math
import random

from . import house_art as H
from . import house_battle as HB
from . import house_fanim as FA
from . import house_games as HG
from . import house_pals as PL

SPEED = {"calico": 200.0, "tabby": 178.0, "dad": 172.0, "mom": 180.0, "kid": 192.0}
HP = {"calico": 92, "tabby": 112, "dad": 110, "mom": 100, "kid": 88}
ROLL_V = 380.0


def clamp(v, a, b):
    return a if v < a else (b if v > b else v)


def dist(ax, ay, bx, by):
    return math.hypot(ax - bx, ay - by)


class TopGame(HB.Battle):
    GAME = "melee"
    TOP = True
    MIN_FIGHTERS = 2
    BUF = 0.25                      # how long a press made while busy is kept

    # ---- the frame ---------------------------------------------------------------------------------------------
    def step_game(self, dt):
        self.control(dt)
        order = list(self.fighters)
        random.shuffle(order)          # nobody always acts first (two slide tackles at once: either may win)
        for fi in order:
            buf = fi.buf
            for k in [k for k, until in buf.items() if until <= self.clock]:
                del buf[k]
            fi.inp["pressed"] |= set(buf)
            before = fi.st
            self.step_fighter(fi, dt)
            if before in self.FREE_STATES or fi.st != before:
                buf.clear()
            else:
                for k in fi.inp["pressed"]:
                    buf.setdefault(k, self.clock + self.BUF)
            fi.inp["pressed"] = set()
        self.separate()
        self.step_world(dt)
        if self.train is not None:
            self.step_train(dt)
        self.step_fx(dt)
        for fi in self.fighters:
            self.pose(fi)
        if self.phase == "fight":
            self.check_end()

    FREE_STATES = ("idle",)

    def step_world(self, dt):
        """The game's own things (ball, fish, monsters...)."""

    # ---- helpers for a fighter's frame -------------------------------------------------------------------------
    def tick(self, fi, dt):
        fi.t += dt
        fi.inv = max(0.0, fi.inv - dt)
        for k in fi.cd:
            fi.cd[k] = max(0.0, fi.cd[k] - dt)
        cds = getattr(fi, "cds", None)
        if cds:
            for k in cds:
                cds[k] = max(0.0, cds[k] - dt)

    def stick(self, fi):
        """The move keys as a unit vector (mx, my) and how hard they are pushed."""
        mx, my = fi.inp["dx"], fi.inp["dy"]
        mn = math.hypot(mx, my)
        if mn > 1e-6:
            mx, my = mx / mn, my / mn
        return mx, my, mn

    def base_speed(self, fi):
        k = SPEED.get(fi.char, 180.0)
        if fi.buff.get("speed", 0) > self.clock:
            k *= 1.3
        return k * PL.speed(self, fi)

    def try_roll(self, fi, mx, my, mn, cd=0.6, dur=0.32):
        """L with a direction: a quick roll (no hits land while rolling)."""
        inp = fi.inp
        want = ("guard" in inp["pressed"] and mn > 0.1) or \
               ("guard" in inp["held"] and mn > 0.1 and abs(fi.pdir[0]) + abs(fi.pdir[1]) < 0.1)
        fi.pdir = (inp["dx"], inp["dy"])
        if want and fi.cd.get("roll", 0) <= 0:
            self.start(fi, "roll", dur)
            fi.data["rd"] = (mx, my)
            fi.inv = max(fi.inv, dur * 0.8)
            fi.cd["roll"] = cd
            self.dust(fi)
            FA.burst(self, "dust", fi.a.x - mx * 10, fi.a.y - my * 10, 2, n=6, col="#d9c9b0", spd=120,
                     ang=math.degrees(math.atan2(-my, -mx)), spread=60, g=0, dur=0.4, size=4, side=False)
            self.note(fi, "roll")
            return True
        return False

    def try_jump(self, fi, vz=330.0):
        if "jump" in fi.inp["pressed"] and fi.z <= 0:
            self.start(fi, "jump", 9)
            fi.vz = vz
            self.note(fi, "jump")
            return True
        return False

    def physics(self, fi, dt, want, slip=False):
        """Run toward want (vx, vy), plus knock-back, gravity, and the floor / furniture."""
        a = fi.a
        ax, ay = want
        if slip:
            k = min(1.0, dt * 2.5)
            fi.vx += (ax - fi.vx) * k
            fi.vy += (ay - fi.vy) * k
        else:
            fi.vx, fi.vy = ax, ay
        fr = 7.0
        fi.kx *= max(0.0, 1 - fr * dt)
        fi.ky *= max(0.0, 1 - fr * dt)
        self.move(fi, (fi.vx + fi.kx) * dt, (fi.vy + fi.ky) * dt)
        if fi.z > 0 or fi.vz != 0:
            fi.vz -= HB.GRAV * dt
            fi.z += fi.vz * dt
            if fi.z <= 0:
                if fi.vz < -250:
                    FA.on_land(self, fi, side=False)
                fi.z, fi.vz = 0.0, 0.0
        a.h = fi.z

    def face_to(self, fi, x, y):
        ux, uy = HB.norm(x - fi.a.x, y - fi.a.y)
        if ux or uy:
            fi.fx, fi.fy = ux, uy

    def common_states(self, fi, dt, sp, mx, my):
        """roll / jump / hit / down / stun: returns the wanted velocity, or None when the state is not one of them."""
        st = fi.st
        if st == "roll":
            d = fi.data.get("rd", (fi.fx, fi.fy))
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
            return (d[0] * ROLL_V, d[1] * ROLL_V)
        if st == "jump":
            if fi.t > 0.05 and fi.z <= 0:
                self.start(fi, "idle", 0)
            return (mx * sp * 0.85, my * sp * 0.85)
        if st in ("hit", "stun", "down", "dizzy"):
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
                if st == "down":
                    fi.inv = max(fi.inv, 0.5)
            return (0.0, 0.0)
        return None

    # ---- posing --------------------------------------------------------------------------------------------------
    def tpose(self, fi, cat="stand", person="stand", rig=None, view="side", prop=None, fu=None):
        """Set a fighter's look for this frame (top-down games)."""
        a = fi.a
        a.h = fi.z
        if abs(fi.fx) > 0.15:
            a.facing = 1 if fi.fx > 0 else -1
        if a.is_cat:
            a.set_pose(cat)
            a.running = cat == "run"
            if fu is not None:
                a.fu, a.fk = fu, 0
        else:
            if rig is not None:
                if prop:
                    rig = dict(rig, prop=prop)
                a.pose, a.rig = "rig", rig
            else:
                a.pose, a.rig = person, None
            a.view, a.prop, a.seat = view, prop, 0.0

    def base_pose(self, fi):
        """The poses every top-down game shares; returns True when it set one."""
        a = fi.a
        st = fi.st
        moving = math.hypot(fi.vx, fi.vy) > 20
        if self.phase in ("travel", "count") and st == "idle":
            if a.is_cat:
                self.tpose(fi, "crouch" if self.phase == "count" else "stand")
            else:
                self.tpose(fi, rig=FA.stance_rig(a.t) if self.phase == "count" else None)
            return True
        if st == "idle":
            if a.is_cat:
                self.tpose(fi, "run" if moving else "f_ready")
            else:
                self.tpose(fi, "run" if moving else "stand")
            return True
        if st == "roll":
            self.tpose(fi, "belly", rig=FA.R["crouch"])
            return True
        if st == "jump":
            self.tpose(fi, "jump", rig=FA.R["rise"] if fi.vz > 0 else FA.R["fall"])
            return True
        if st == "hit":
            self.tpose(fi, "f_hit", rig=FA.R["hit"], fu=min(1.0, fi.t / max(0.01, fi.dur)))
            return True
        if st in ("down", "ko"):
            self.tpose(fi, "f_down", "floor", view="front")
            return True
        if st in ("stun", "dizzy"):
            self.tpose(fi, "grumpy", rig=FA.R["hit2"])
            return True
        if st == "over":
            return True
        return False

    def post_pose(self):
        for fi in self.fighters:
            FA.animate_top(self, fi)
            if fi.st == "dizzy" and fi.a.fanim is not None:
                fi.a.fanim["rot"] = 10 * math.sin(fi.a.t * 12)

    # ---- the end -------------------------------------------------------------------------------------------------
    def finish_with(self, winners, text):
        self.finish(winners)
        self.result["text"] = text
        self.say_banner(text, 30)

    def winners_by(self, scores):
        """Teams with the best score (a draw when more than one)."""
        if not scores:
            return []
        best = max(scores.values())
        return [tm for tm, v in scores.items() if v == best]

    def team_label(self, tm):
        if self.mode == "ffa":
            fi = next((f for f in self.fighters if f.team == tm), None)
            return fi.a.name if fi is not None else "?"
        return HB.TEAM_NAMES.get(tm, "")

    def train_text(self, i):
        key, text, keys = self.TRAIN_STEPS[i][:3]
        me = self.trainee()
        ch = me.char if me is not None else "calico"
        sks = HG.skills(self.GAME, ch)
        sk = sks[0] if sks else {"name": "", "desc": ""}
        sk2 = sks[1] if len(sks) > 1 else sk
        return text.format(k=sk["name"], desc=sk["desc"], k2=sk2["name"], desc2=sk2["desc"]), keys

    def skill_banner(self, fi, sk):
        self.add_fx("skillname", fi, text=sk["icon"] + " " + sk["name"], color=HG.CHARS[fi.char]["color"])
        col = HG.CHARS[fi.char]["color"]
        FA.burst(self, "glow", fi.a.x, fi.a.y, fi.z + 30, n=10, col=col, col2="#ffffff", spd=160, g=0, dur=0.5,
                 size=4, side=False)
        self.sound("whoosh")
        self.note(fi, "skill", key=sk["key"])


# ======================================================================================================== AI helpers
class Steer:
    """Walks an AI fighter toward a point, sidestepping furniture and walls."""

    def __init__(self, b, fi):
        self.b = b
        self.fi = fi
        self.side = random.choice((-1, 1))
        self.stuck = 0.0
        self.last = (fi.a.x, fi.a.y)

    def go(self, x, y, dt=0.05, stop=10.0, slow=None):
        fi, b = self.fi, self.b
        dx, dy = x - fi.a.x, y - fi.a.y
        d = math.hypot(dx, dy)
        if d < stop:
            fi.inp["dx"] = fi.inp["dy"] = 0.0
            return True
        ux, uy = dx / d, dy / d
        r = 14.0
        if b.blocked(fi.a.x + ux * 28, fi.a.y + uy * 28, r) or not b.floor_ok(fi.a.x + ux * 28, fi.a.y + uy * 28):
            # slide along: try the side we picked, then the other
            for s in (self.side, -self.side):
                vx, vy = -uy * s, ux * s
                if not b.blocked(fi.a.x + vx * 28, fi.a.y + vy * 28, r):
                    ux, uy = (ux * 0.3 + vx) / 1.04, (uy * 0.3 + vy) / 1.04
                    self.side = s
                    break
        k = 1.0 if slow is None or d > slow else max(0.35, d / slow)
        fi.inp["dx"], fi.inp["dy"] = ux * k, uy * k
        # stuck? change sides
        moved = math.hypot(fi.a.x - self.last[0], fi.a.y - self.last[1])
        self.last = (fi.a.x, fi.a.y)
        self.stuck = self.stuck + dt if moved < 0.5 else 0.0
        if self.stuck > 0.6:
            self.side = -self.side
            self.stuck = 0.0
        return False


def clear_inputs(fi):
    inp = fi.inp
    inp["dx"] = inp["dy"] = 0.0
    inp["held"] = set()


AI_LEVELS = {"easy": dict(react=0.6, aim=0.35, rate=1.3, skill=0.25, smart=0.3),
             "normal": dict(react=0.32, aim=0.18, rate=0.85, skill=0.55, smart=0.6),
             "hard": dict(react=0.16, aim=0.07, rate=0.6, skill=0.85, smart=0.9)}


def level_of(fi, b):
    lv = fi.ctrl[3:] if str(fi.ctrl).startswith("ai:") else b.diff
    return AI_LEVELS.get(lv, AI_LEVELS["normal"])
