"""屋顶竞速 (on the moonlit roofs): a side-view parkour race round two storeys of roofs.

The lap: run right along the lower roofs (a vent to hop, a gap to jump, a washing line to slide under), take the
spring up at the far end, run left along the upper roofs (a chimney, a gap that drops you back down), and drop down the
far left to cross the line. A high ledge in the middle has item boxes. A / D run, Space jumps (double jump),
J dashes, L slides, E uses the item from a ? box (🍌 dropped behind you, 🧶 rolls ahead, 🐟 a burst of speed), K is
the character's own trick. The arena's "knock-outs" setting is the number of laps.
"""
import math
import random

from . import house_art as H
from . import house_battle as HB
from . import house_fanim as FA
from . import house_brawl as HBR
from . import house_games as HG
from . import house_pals as PL
from . import house_side as SD

LANE = 36
L1, L2 = 175.0, 282.0
TRACK = dict(lane=LANE, xmin=30, xmax=1225,
             ground=[(40, 700), (770, 1215)],
             plats=[(440, 820, L2)],
             solids=[(560, 600, 0, 34), (110, 520, L1 - 14, L1), (585, 1135, L1 - 14, L1), (330, 372, L1, L1 + 58)],
             spawns=[(120, 0), (165, 0), (75, 0), (210, 0)])
SD.STAGES[14] = TRACK
SPRING = (1168, 1210)                          # on the lower roof, far right
PAD0 = (230, 330, 0.0)                         # speed pads: x0, x1, z
PAD2 = (600, 700, L2)
LINE = (880, 1000, 36.0, 50.0)                 # the washing line: x0, x1, z0, z1
BOXES = [(470, 0.0), (800, L1), (560, L2), (700, L2)]
RUN = {"calico": 270, "tabby": 270, "dad": 270, "mom": 270, "kid": 270}
RACE_JUMP, RACE_JUMP2 = 690.0, 570.0             # (v23) same for everyone: a higher jump only made a runner slower
ITEMS = ("banana", "yarn", "fish")
ITEM_NAMES = {"banana": "🍌 香蕉皮", "yarn": "🧶 毛线球", "fish": "🐟 加速鱼"}


class RaceBattle(HB.Battle):
    GAME = "race"
    TOP = False

    def setup(self):
        self.stage = SD.Stage(TRACK)
        self.laps = max(1, min(5, self.kos_to_win)) if self.mode != "train" else 99
        self.limit = 60.0 * self.laps + 120 if self.mode != "train" else 1e9
        self.boxes = [{"x": x, "z": z, "t": 0.0} for x, z in BOXES]
        self.bananas = []
        self.yarns = []
        self.order = []                         # uids in the order they finished
        self.first_fin = None
        self.projs = []
        self.obst = []
        for fi in self.fighters:
            HBR.setup_side_fighter(fi, self.stage)
            fi.maxhp = 1
            fi.hp = 1.0
            fi.lap, fi.seg, fi.prog = 0, 0, 0.0
            fi.item = None
            fi.boost = fi.slip = fi.trip = fi.shield = fi.skate = fi.sprint = 0.0
            fi.superjump = False
            fi.cds = {"k": 0.0}
            fi.dash_cd = fi.slide_t = 0.0
            fi.safe = (120.0, 0.0)
            fi.place = None
            fi.line_cd = 0.0
            fi.ram = 0.0

    def spawn_point(self, fi):
        k = self.fighters.index(fi) % 4
        x, z = TRACK["spawns"][k]
        return x, LANE, z

    def place_all(self):
        for fi in self.fighters:
            x, y, z = self.spawn_point(fi)
            a = fi.a
            a.f, a.x, a.y, a.h = self.f, x, y, z
            fi.z, fi.vx, fi.vz, fi.ground = z, 0.0, 0.0, True
            fi.face = 1
            fi.st, fi.t = "idle", 0.0

    def begin(self):
        super().begin()
        for fi in self.fighters:
            a = fi.a
            if a.path and a.path[0].get("t") == "travel":
                x, y, z = self.spawn_point(fi)
                a.path[0]["x"], a.path[0]["y"] = x, y

    # ---- the frame ---------------------------------------------------------------------------------------------
    def step_game(self, dt):
        self.control(dt)
        for fi in self.fighters:
            buf = fi.buf
            for k in [k for k, until in buf.items() if until <= self.clock]:
                del buf[k]
            fi.inp["pressed"] |= set(buf)
            before = fi.st
            self.step_runner(fi, dt)
            if fi.st == before and before in ("idle", "run", "air"):
                buf.clear()
            else:
                for k in fi.inp["pressed"]:
                    # a key that just did its job is not kept (a jump off the ground is not a second, double jump)
                    if (k == "jump" and fi.st == "air" and before != "air") or (k == "guard" and fi.st == "slide"):
                        continue
                    buf.setdefault(k, self.clock + 0.22)
            fi.inp["pressed"] = set()
        self.step_things(dt)
        if self.train is not None:
            self.step_train(dt)
        self.step_fx(dt)
        for fi in self.fighters:
            self.pose(fi)
        self.check_end()

    def speed(self, fi):
        v = RUN[fi.char]
        if fi.boost > 0:
            v *= 1.5
        if fi.sprint > 0:
            v *= 1.15
        if fi.skate > 0:
            v *= 1.3
        if fi.slip > 0:
            v *= 0.3
        return v * PL.speed(self, fi)

    def step_runner(self, fi, dt):
        a = fi.a
        fi.t += dt
        for k in ("boost", "slip", "trip", "shield", "skate", "sprint", "dash_cd", "slide_t", "line_cd", "ram"):
            setattr(fi, k, max(0.0, getattr(fi, k) - dt))
        fi.land_t = max(0.0, getattr(fi, "land_t", 0.0) - dt)
        fi.flash = max(0.0, getattr(fi, "flash", 0.0) - dt)
        if fi.trip > 0 and getattr(fi, "was_trip", 0.0) <= 0:
            fi.flash = 0.1                       # the moment of tripping: flash, stars
            FA.burst(self, "star", fi.x, LANE, fi.z + fi.hgt, n=6, col="#ffd34c", col2="#ffffff", spd=160, g=0,
                     dur=0.6, size=5)
            self.sound("mew" if fi.a.is_cat else "oof", fi)
        fi.was_trip = fi.trip
        fi.cds["k"] = max(0.0, fi.cds["k"] - dt)
        inp = fi.inp
        pressed, held = inp["pressed"], inp["held"]
        dx = inp["dx"]
        mx = 1 if dx > 0.3 else (-1 if dx < -0.3 else 0)
        st = fi.st
        if st == "finish":
            fi.vx *= 0.9
            self.phys(fi, dt)
            return
        if st == "fall":
            if fi.t >= 1.0:
                x, z = fi.safe
                fi.x, fi.z = x, z + 30
                fi.vx = fi.vz = 0.0
                fi.ground = False
                fi.inv = 1.0
                self.start(fi, "air", 0)
            return
        if fi.trip > 0:
            st = fi.st = "trip"
            fi.vx *= max(0.0, 1 - dt * 5)
            self.phys(fi, dt)
            return
        if st == "trip":
            self.start(fi, "idle" if fi.ground else "air", 0)
        if fi.slide_t <= 0 and fi.st == "slide":
            fi.hgt = SD.body(fi.char)[1]
            self.start(fi, "idle" if fi.ground else "air", 0)
        # inputs
        if "jump" in pressed:
            if fi.ground:
                vz = 1200.0 if fi.superjump else RACE_JUMP
                if fi.superjump:
                    fi.superjump = False
                    self.add_fx("ring2", fi, z=fi.z, r=40)
                fi.vz, fi.ground, fi.jumps = vz, False, 1
                if fi.st == "slide":
                    fi.hgt = SD.body(fi.char)[1]
                self.start(fi, "air", 0)
                FA.on_land(self, fi)
                self.note(fi, "jump")
            elif fi.jumps > 0:
                fi.vz, fi.jumps = RACE_JUMP2, 0
                self.add_fx("ring2", fi, z=fi.z, r=26)
                FA.burst(self, "glow", fi.x, LANE, fi.z, n=6, col="#ffffff", spd=120, ang=-90, spread=160, g=0,
                         dur=0.35, size=3)
                self.note(fi, "jump2")
        if "atk" in pressed and fi.dash_cd <= 0:
            fi.dash_cd = 2.2
            fi.boost = max(fi.boost, 0.45)
            fi.vx = (mx or fi.face) * self.speed(fi) * 1.4
            self.add_fx("dash", fi, fx=mx or fi.face)
            FA.on_dash(self, fi)
            self.sound("whoosh")
            self.note(fi, "dash")
        fi.slide_q = max(0.0, getattr(fi, "slide_q", 0.0) - dt)
        if "guard" in pressed and not fi.ground and fi.z < 70:
            fi.slide_q = 0.3                     # pressed just before landing: slide as soon as you touch down
        if "guard" in pressed and fi.ground and fi.slide_t <= 0:
            fi.slide_t = 0.55
            fi.hgt = 22
            self.start(fi, "slide", 9)
            FA.on_dash(self, fi)
            self.note(fi, "slide")
        if "throw" in pressed:
            self.use_item(fi)
        if "skill" in pressed:
            if fi.cds["k"] <= 0:
                self.use_skill(fi)
            else:
                self.tell(fi, "技能冷却中")
        # running
        v = self.speed(fi)
        fi.spring_t = max(0.0, getattr(fi, "spring_t", 0.0) - dt)
        if fi.spring_t > 0:
            mx = 0                          # flying up the spring: clear of the roof above first
        if fi.st == "slide":
            want = fi.face * max(abs(fi.vx), v * 0.9)
        elif fi.ram > 0:
            want = fi.face * v * 1.6
        else:
            want = mx * v
            if mx:
                fi.face = mx
        k = min(1.0, dt * (10 if fi.ground else 5))
        if fi.spring_t > 0:
            want, k = 0.0, 1.0
        fi.leap = max(0.0, getattr(fi, "leap", 0.0) - dt)
        if fi.leap > 0 and not fi.ground:
            k = 0.0                              # mid-leap: keep the speed
        fi.vx += (want - fi.vx) * k
        if fi.ground and fi.st not in ("slide",):
            fi.st = "run" if abs(fi.vx) > 30 else "idle"
        elif not fi.ground and fi.st not in ("slide",):
            fi.st = "air"
        # the skateboard hops small things and ducks lines by itself
        if fi.skate > 0 and fi.ground:
            ahead = fi.x + fi.face * 50
            if any(x0 < ahead < x1 and z1 - fi.z < 45 and z1 > fi.z + 4 for x0, x1, z0, z1 in TRACK["solids"]) or \
                    (fi.z < 10 and not self.stage.ground_at(ahead) and fi.z < 5):
                fi.vz, fi.ground = 640, False
            if LINE[0] - 60 < fi.x < LINE[1] and fi.z < 10 and fi.slide_t <= 0:
                fi.slide_t = 0.5
                fi.hgt = 22
                self.start(fi, "slide", 9)
        self.phys(fi, dt)

    def phys(self, fi, dt):
        vz0 = fi.vz
        hit = self.stage.move(fi, dt, fi.hw, fi.hgt)
        if hit == "land":
            fi.jumps = 1
            if getattr(fi, "slide_q", 0.0) > 0 and fi.slide_t <= 0 and fi.st != "trip":
                fi.slide_q = 0.0
                fi.slide_t = 0.55
                fi.hgt = 22
                self.start(fi, "slide", 9)
                FA.on_dash(self, fi)
            if vz0 < -300:
                fi.land_t = 0.14                 # squash on landing
                FA.on_land(self, fi, hard=vz0 < -750)
        a = fi.a
        a.h = fi.z
        a.y = LANE
        a.facing = fi.face
        if fi.ground and fi.z < 2 and self.stage.ground_at(fi.x):
            fi.safe = (fi.x - fi.face * 30, 0.0)
        if fi.z < SD.KILL_Z and fi.st != "fall":
            self.start(fi, "fall", 1.0)
            self.add_fx("text", fi, text="掉下去了！", small=True)
            # the safe spot is before the gap
            x, z = fi.safe
            fi.safe = (min(x, 660.0) if 600 < x < 780 else x, z)
            return
        # spring
        if fi.ground and fi.z < 2 and SPRING[0] <= fi.x:     # (up to the wall: the narrowest runner stops at 1211)
            fi.vz, fi.ground = 1080.0, False
            fi.spring_t = 0.4
            fi.vx = 0.0
            fi.jumps = 1
            self.start(fi, "air", 0)
            self.add_fx("ring2", fi, z=fi.z, r=30)
            FA.burst(self, "star", fi.x, LANE, fi.z + 10, n=8, col="#ffd34c", col2="#ffffff", spd=260, ang=90,
                     spread=120, g=400, dur=0.6, size=5)
            self.spring_t = self.t
            self.note(fi, "spring")
        # speed pads
        for x0, x1, z in (PAD0, PAD2):
            if fi.ground and abs(fi.z - z) < 3 and x0 <= fi.x <= x1:
                if fi.boost < 0.3:
                    self.add_fx("text", fi, text="加速！", small=True)
                    FA.burst(self, "glow", fi.x, LANE, fi.z + 20, n=10, col="#7fd8ff", col2="#ffffff", spd=300,
                             ang=180 if fi.face > 0 else 0, spread=40, g=0, dur=0.5, size=4)
                fi.boost = max(fi.boost, 1.0)
        # the washing line
        if LINE[0] <= fi.x <= LINE[1] and fi.st == "slide":
            self.note(fi, "slide_line")
        elif LINE[0] <= fi.x <= LINE[1] and fi.z < LINE[3] and fi.z + fi.hgt > LINE[2] and fi.line_cd <= 0:
            fi.line_cd = 1.2
            fi.trip = 0.7
            fi.vx = -fi.face * 120
            self.add_fx("text", fi, text="被晾衣绳绊倒了！", small=True)
        # laps
        self.progress(fi)

    def progress(self, fi):
        if fi.place is not None:
            return
        if fi.seg == 0 and fi.ground and fi.z >= L1 - 2:
            fi.seg = 1
        elif fi.seg == 1 and fi.z < 60 and fi.ground:
            fi.seg = 0
            if fi.x < 230:
                fi.lap += 1
                self.note(fi, "lap")
                if fi.lap >= self.laps:
                    self.order.append(fi.uid)
                    fi.place = len(self.order)
                    if self.first_fin is None:
                        self.first_fin = self.clock
                    self.start(fi, "finish", 99)
                    self.add_fx("text", fi, text="第 %d 名冲线！" % fi.place)
                    self.w.sfx("chime", 2)
                else:
                    self.add_fx("text", fi, text="第 %d 圈" % (fi.lap + 1), small=True)
        if fi.seg == 0:
            if fi.x > 760 and fi.z < 5 and self.stage.ground_at(fi.x):
                self.note(fi, "gap")
            fi.prog = fi.lap * 2 + max(0.0, min(1.0, (fi.x - 60) / 1150))
            if fi.x > 300:
                self.note(fi, "run_far")
        else:
            fi.prog = fi.lap * 2 + 1 + max(0.0, min(1.0, (1180 - fi.x) / 1100))

    def ranking(self):
        done = [f for f in self.fighters if f.place is not None]
        done.sort(key=lambda f: f.place)
        rest = [f for f in self.fighters if f.place is None]
        rest.sort(key=lambda f: -f.prog)
        return done + rest

    # ---- boxes, bananas, yarn ----------------------------------------------------------------------------------
    def step_things(self, dt):
        for bx in self.boxes:
            bx["t"] = max(0.0, bx["t"] - dt)
            if bx["t"] > 0:
                continue
            for fi in self.fighters:
                if fi.place is None and abs(fi.x - bx["x"]) < 26 and fi.z - 6 < bx["z"] + 46 and fi.z + fi.hgt > bx["z"] + 20:
                    bx["t"] = 4.0
                    if fi.item is None:
                        fi.item = random.choices(ITEMS, weights=[3, 3, 2])[0] if self.train is None else "fish"
                        self.add_fx("text", fi, text="拿到 " + ITEM_NAMES[fi.item] + "（E 用）", small=True)
                        self.note(fi, "item_get")
                    self.add_fx("poof", None, x=bx["x"], y=LANE, z=bx["z"] + 36)
                    FA.burst(self, "rock", bx["x"], LANE, bx["z"] + 36, n=10, col="#c4862c", col2="#f2c94c",
                             spd=300, ang=90, spread=160, g=1000, dur=0.6, size=5)
                    self.sound("hit")
                    break
        for bn in list(self.bananas):
            bn["t"] += dt
            for fi in self.fighters:
                if fi.uid == bn["owner"] and bn["t"] < 0.6:
                    continue
                if fi.ground and abs(fi.x - bn["x"]) < 20 and abs(fi.z - bn["z"]) < 6 and fi.shield <= 0 and fi.place is None:
                    fi.slip = 0.9
                    fi.trip = 0.45
                    self.bananas.remove(bn)
                    self.add_fx("text", fi, text="踩到香蕉皮！", small=True)
                    break
            if bn in self.bananas and bn["t"] > 25:
                self.bananas.remove(bn)
        for y in list(self.yarns):
            y["t"] += dt
            y["vz"] -= SD.G * dt
            nz = y["z"] + y["vz"] * dt
            for x0, x1, top, oneway in self.stage.surfaces():
                if x0 <= y["x"] <= x1 and y["z"] >= top - 1 >= nz - 1:
                    nz, y["vz"] = top, 0.0
            y["z"] = nz
            y["x"] += y["vx"] * dt
            y["rot"] += y["vx"] * dt * 0.08
            gone = y["t"] > 4 or y["z"] < -150 or not (30 < y["x"] < 1225)
            for x0, x1, z0, z1 in TRACK["solids"]:
                if x0 < y["x"] < x1 and z0 < y["z"] + 6 < z1:
                    gone = True
            for fi in self.fighters:
                if fi.uid == y["owner"] or fi.place is not None:
                    continue
                if abs(fi.x - y["x"]) < fi.hw + 10 and fi.z - 4 < y["z"] + 14 and y["z"] < fi.z + fi.hgt:
                    if fi.shield <= 0:
                        fi.trip = 0.8
                        fi.vx = y["vx"] * 0.3
                        self.add_fx("text", fi, text="被毛线球绊倒！", small=True)
                    else:
                        self.add_fx("block", fi)
                    gone = True
                    break
            if gone:
                self.yarns.remove(y)
                self.add_fx("poof", None, x=y["x"], y=LANE, z=y["z"])

    def use_item(self, fi):
        k = fi.item
        if k is None:
            self.tell(fi, "没有道具（撞问号箱）")
            return
        fi.item = None
        if k == "banana":
            z = fi.z if fi.ground else self.surface_below(fi.x - fi.face * 30, fi.z)
            self.bananas.append({"x": fi.x - fi.face * 34, "z": z, "owner": fi.uid, "t": 0.0})
        elif k == "yarn":
            self.yarns.append({"x": fi.x + fi.face * 26, "z": fi.z + 2, "vx": fi.face * 560, "vz": 0.0, "owner": fi.uid,
                               "t": 0.0, "rot": 0.0})
        elif k == "fish":
            fi.boost = max(fi.boost, 1.8)
            self.add_fx("text", fi, text="加速！", small=True)
        self.note(fi, "item_use")

    def surface_below(self, x, z):
        best = 0.0
        for x0, x1, top, oneway in self.stage.surfaces():
            if x0 <= x <= x1 and top <= z + 1:
                best = max(best, top)
        return best

    def use_skill(self, fi):
        sk = HG.SKILLS["race"][fi.char][0]
        name = sk["key"]
        fi.cds["k"] = sk["cd"]
        if name == "superjump":
            # (v23) 飞跃: a long cat leap forward, over gaps and low things
            fi.vz, fi.ground, fi.jumps = 560.0, False, 1
            fi.vx = fi.face * RUN[fi.char] * 1.9
            fi.leap = 0.9
            if fi.st == "slide":
                fi.hgt = SD.body(fi.char)[1]
                fi.slide_t = 0.0
            self.start(fi, "air", 0)
            FA.on_dash(self, fi)
            FA.burst(self, "star", fi.x, LANE, fi.z + 20, n=8, col="#ffd34c", col2="#ffffff", spd=200, g=200,
                     dur=0.5, size=4)
        elif name == "ram":
            fi.ram = 0.6
            for o in self.fighters:
                if o is not fi and o.place is None and 0 < (o.x - fi.x) * fi.face < 140 and abs(o.z - fi.z) < 40 and \
                        o.shield <= 0:
                    o.trip = 0.8
                    o.vx = fi.face * 260
                    FA.on_hit(self, fi, o, 8, heavy=True)
                    self.add_fx("text", o, text="被撞飞了！", small=True)
        elif name == "sprint":
            fi.sprint = 2.0
        elif name == "shield":
            fi.shield = 4.0
            fi.boost = max(fi.boost, 0.8)
        elif name == "skate":
            fi.skate = 4.0
        self.add_fx("skillname", fi, text=sk["icon"] + " " + sk["name"], color=HG.CHARS[fi.char]["color"])
        FA.burst(self, "glow", fi.x, LANE, fi.z + fi.hgt * 0.5, n=12, col=HG.CHARS[fi.char]["color"],
                 col2="#ffffff", spd=200, g=0, dur=0.5, size=4)
        self.note(fi, "skill")

    # ---- the end -----------------------------------------------------------------------------------------------
    def check_end(self):
        if self.train is not None:
            return
        n = len(self.fighters)
        if self.order and (len(self.order) >= n or (self.first_fin is not None and self.clock - self.first_fin > 15)):
            self.end_race()
        elif self.clock >= self.limit:
            self.end_race()

    def end_race(self):
        rank = self.ranking()
        if self.mode == "2v2":
            pts = {}
            for i, fi in enumerate(rank):
                pts[fi.team] = pts.get(fi.team, 0) + (len(rank) - i)
            best = max(pts.values())
            winners = [t for t, p in pts.items() if p == best]
        else:
            winners = [rank[0].team]
        names = "  ".join("%d. %s" % (i + 1, fi.a.name) for i, fi in enumerate(rank))
        self.finish(winners)
        if len(winners) == 1:
            self.result["text"] = "🏁 %s 赢了！" % (rank[0].a.name if self.mode != "2v2" else
                                                 HB.TEAM_NAMES.get(winners[0], ""))
        self.result["rank"] = names
        self.say_banner(self.result["text"], 30)

    def celebrate(self, fi, dt):
        a = fi.a
        if not fi.ground:
            fi.vx = 0.0
            self.stage.move(fi, dt, fi.hw, fi.hgt)
        a.h = fi.z
        win = self.result is not None and (fi.team in self.result.get("teams", ()) or self.train is not None)
        if a.is_cat:
            a.set_pose(("happy" if int(self.t * 2) % 2 else "stretch") if win else "grumpy")
        else:
            a.pose = ("dance" if int(self.t * 1.5) % 2 else "clap") if win else "stand"
            a.view = "front"
            a.prop = None

    def pose(self, fi):
        a = fi.a
        a.h = fi.z
        a.facing = fi.face
        a.hidden = False
        FA.animate(self, fi)

    # ---- network -----------------------------------------------------------------------------------------------
    def net_extra(self):
        return {"boxes": [{"x": b["x"], "z": b["z"], "t": round(b["t"], 1)} for b in self.boxes],
                "bananas": [{"x": round(b["x"]), "z": round(b["z"])} for b in self.bananas],
                "yarns": [{"x": round(y["x"]), "z": round(y["z"]), "rot": round(y["rot"], 1)} for y in self.yarns],
                "laps": self.laps, "order": list(self.order)}

    def fighter_extra(self, fi):
        return {"lap": fi.lap, "seg": fi.seg, "prog": round(fi.prog, 3), "item": fi.item, "place": fi.place,
                "cds": {"k": round(fi.cds["k"], 1)}, "boost": round(fi.boost, 1), "shield": round(fi.shield, 1),
                "skate": round(fi.skate, 1), "sprint": round(fi.sprint, 1), "superjump": fi.superjump,
                "face": fi.face, "hidden": False, "meter": 0}

    # ---- tutorial ----------------------------------------------------------------------------------------------
    def train_text(self, i):
        key, text, keys = self.TRAIN_STEPS[i][:3]
        me = self.trainee()
        sk = HG.SKILLS["race"][me.char if me is not None else "calico"][0]
        return text.format(k=sk["name"], desc=sk["desc"]), keys

    def train_prepare(self, key, me):
        if me is not None and key == "item" and me.item is None and (me.x > 450 or me.seg == 1):
            me.item = "fish"
            self.add_fx("text", me, text="送你一个 🐟（按 E）", small=True)

    def make_ai(self, fi):
        return RaceAI(self, fi, "easy" if self.train is not None else fi.ctrl[3:], slow=self.train is not None)


RaceBattle.TRAIN_STEPS = [
    ("run", "按住 D 往右跑", "D", "run_far", "跑"),
    ("dash", "按 J 冲刺，一下子跑得飞快", "J", "dash", "冲刺"),
    ("item", "撞开前面的问号箱拿道具，再按 E 用掉", "E", "item_use", "道具"),
    ("jump", "按空格跳过通风口", "空格", "jump", "跳"),
    ("gap", "前面屋顶有缝：起跳跳过去，跳不够就在空中再按一次空格（二段跳）", "空格 空格", "gap", "跳缝"),
    ("slide", "晾衣绳很低：快到的时候按 L 滑铲钻过去", "L", "slide_line", "滑铲"),
    ("spring", "踩最右边的弹簧弹上去，在空中按 A 往左，落到上层屋顶", "→ 弹簧 → A", "spring", "弹簧"),
    ("skill", "按 K：技能「{k}」——{desc}", "K", "skill", "技能"),
    ("lap", "按 A 一直往左跑，跑到头跳下去冲线，完成一圈！", "A", "lap", "冲线"),
]


# ======================================================================================================== AI
class RaceAI:
    LEVELS = {"easy": dict(react=0.12, speed=0.86, items=0.4, skill=0.3, high=0.2, dash=0.3),
              "normal": dict(react=0.06, speed=0.95, items=0.7, skill=0.6, high=0.4, dash=0.6),
              "hard": dict(react=0.02, speed=1.0, items=0.95, skill=0.9, high=0.6, dash=0.9)}

    def __init__(self, b, fi, level, slow=False):
        self.b = b
        self.fi = fi
        self.lv = self.LEVELS.get(level, self.LEVELS["normal"])
        self.slow = slow
        self.go_high = random.random() < self.lv["high"]
        self.think = 0.0

    def step(self, dt):
        fi, b = self.fi, self.b
        inp = fi.inp
        inp["dx"] = inp["dy"] = 0.0
        inp["held"] = set()
        if fi.st in ("finish", "fall") or fi.place is not None:
            return
        if self.slow:
            # the training partner jogs a little behind
            me = b.trainee()
            if me is not None and fi.prog > me.prog - 0.05:
                return
        direction = 1 if fi.seg == 0 else -1
        # just sprung up: steer back over the upper roof
        if not fi.ground and fi.x > 1100 and fi.z > L1 + 4:
            direction = -1
        if self.lv["speed"] < 1.0 and random.random() > self.lv["speed"]:
            direction = 0 if random.random() < 0.3 else direction
        inp["dx"] = float(direction)
        if direction == 0:
            return
        x, z = fi.x, fi.z
        la = 60 + abs(fi.vx) * 0.18
        ahead = x + direction * la
        if fi.ground:
            gap = False
            if z < 5:
                # look along the whole stretch ahead (a narrow gap fits between "here" and "ahead")
                gap = any(not b.stage.ground_at(x + direction * k) for k in range(int(la * 0.55), int(la) + 1, 12)) \
                    and not (SPRING[0] - 10 < ahead < SPRING[1] + 40)
            else:
                gap = b.stage.support(ahead, z, 4) is None and not (direction < 0 and ahead < 110)
            wall = any(min(x, ahead) < x1 and max(x, ahead) > x0 and z1 > z + 4 and z0 < z + fi.hgt
                       for x0, x1, z0, z1 in TRACK["solids"])
            if (gap or wall) and random.random() > self.lv["react"]:
                inp["pressed"].add("jump")
            # under the high ledge: hop up for the boxes
            if fi.seg == 1 and 760 < x < 830 and direction < 0 and self.go_high and z > 140:
                inp["pressed"].add("jump")
            # the washing line
            if z < 5 and LINE[0] - 34 < x < LINE[0] + 8 and direction > 0 and fi.slide_t <= 0 and \
                    random.random() > self.lv["react"] * 2:
                inp["pressed"].add("guard")
        else:
            # mid-air over a gap: double jump if falling short
            if z < 70 and fi.vz < 0 and direction > 0 and LINE[0] - 70 < x < LINE[1] - 40:
                inp["pressed"].add("guard")         # coming down at the washing line: slide on landing
            if fi.jumps > 0 and fi.vz < 0:
                if z < 90 and not b.stage.ground_at(x) and not b.stage.ground_at(x + direction * 40):
                    inp["pressed"].add("jump")
                elif fi.seg == 1 and 500 < x < 600 and z < L1 + 20 and z > 60:
                    inp["pressed"].add("jump")
                elif fi.seg == 1 and self.go_high and 760 < x < 830 and z > L1:
                    inp["pressed"].add("jump")
        self.think -= dt
        if self.think > 0:
            return
        self.think = 0.3
        # dash on clear stretches
        if fi.dash_cd <= 0 and fi.ground and random.random() < self.lv["dash"] * 0.5:
            clear = not any(min(x, x + direction * 250) < x1 and max(x, x + direction * 250) > x0
                            for x0, x1, z0, z1 in TRACK["solids"] if z0 < z + fi.hgt and z1 > z + 4)
            if clear:
                inp["pressed"].add("atk")
        # items
        if fi.item and random.random() < self.lv["items"]:
            others = [o for o in b.fighters if o is not fi and o.place is None]
            ahead_o = [o for o in others if o.seg == fi.seg and abs(o.z - fi.z) < 30 and 0 < (o.x - x) * direction < 500]
            behind_o = [o for o in others if o.seg == fi.seg and 0 < (x - o.x) * direction < 220]
            if fi.item == "fish" or (fi.item == "yarn" and ahead_o) or (fi.item == "banana" and behind_o and fi.ground):
                inp["pressed"].add("throw")
        # skill
        if fi.cds["k"] <= 0 and random.random() < self.lv["skill"] * 0.4:
            name = HG.SKILLS["race"][fi.char][0]["key"]
            others = [o for o in b.fighters if o is not fi and o.place is None]
            if name == "ram":
                clear = fi.ground and not any(min(x, x + direction * 200) < x1 and max(x, x + direction * 200) > x0
                                              for x0, x1, z0, z1 in TRACK["solids"] if z0 < z + fi.hgt and z1 > z + 4) \
                    and all(b.stage.support(x + direction * k, z, 4) is not None for k in (60, 120, 180)) \
                    and not (z < 5 and LINE[0] - 200 < x < LINE[1])
                if any(o.seg == fi.seg and 0 < (o.x - x) * direction < 130 and abs(o.z - z) < 30 for o in others) or \
                        (clear and random.random() < 0.25):
                    inp["pressed"].add("skill")
            elif name == "superjump":
                # leap where the way ahead is open (no ceiling, nothing tall), landing on a roof
                land = x + direction * 330
                open_ = fi.ground and fi.face == direction and not any(
                    min(x, land) < x1 and max(x, land) > x0 and z0 > z + 4 and z0 < z + 200
                    for x0, x1, z0, z1 in TRACK["solids"]) and b.stage.support(land, z, 4) is not None \
                    and not (z < 5 and LINE[0] - 330 < x < LINE[1])
                if open_:
                    inp["pressed"].add("skill")

            else:
                inp["pressed"].add("skill")
