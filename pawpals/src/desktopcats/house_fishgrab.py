"""抢鱼大作战 (at the 码头鱼市): fish rain down on the pier (a shadow shows where); pick them up by walking over them,
carry them to your own basket (a 🌟 golden fish is worth 3). You can hold three, and every fish slows you a little.
J swats: whoever you swat drops everything they carry. E throws a fish (into your basket from a distance, or to a
team-mate), Space jumps (catch a fish before it lands), L + direction rolls, K is each character's own trick.
A greedy seagull swoops over now and then and takes fish lying about. Most points when the time is up wins.
"""
import math
import random

from . import house_art as H
from . import house_battle as HB
from . import house_fanim as FA
from . import house_games as HG
from . import house_pals as PL
from . import house_tdgame as TD

FG = 700.0                         # fish gravity
BASKET_R = 50.0
CAP = 3
TEAM_BASKETS = {0: (95.0, 250.0), 1: (1165.0, 250.0)}
FFA_BASKETS = [(95.0, 110.0), (1165.0, 390.0), (95.0, 390.0), (1165.0, 110.0)]


def value(k):
    return 3 if k == "g" else 1


class FishBattle(TD.TopGame):
    GAME = "fish"
    TRAIN_DONE = "训练完成！去码头抢鱼吧 🐟"
    FREE_STATES = ("idle",)

    def setup(self):
        self.limit = 60.0 * max(1, min(5, self.kos_to_win)) if self.mode != "train" else 1e9
        self.fish = []
        self.fid = 0
        self.next_fish = 1.0
        self.pts = {fi.team: 0 for fi in self.fighters}
        self.baskets = {}
        teams = sorted(set(fi.team for fi in self.fighters))
        for tm in teams:
            self.baskets[tm] = FFA_BASKETS[teams.index(tm) % 4] if self.mode == "ffa" else TEAM_BASKETS[tm % 2]
        self.traps = []
        self.nets = []
        self.gull = None
        self.next_gull = random.uniform(14, 20)
        for fi in self.fighters:
            fi.maxhp = 100
            fi.hp = 100.0
            fi.fish = []
            fi.cds = {"k": 0.0}
            fi.cd["swat"] = 0.0
            fi.belly = 0.0
            fi.lure = 0.0
            fi.delivered = 0

    def spawn_point(self, fi):
        bx, by = self.baskets.get(fi.team, (630, 250))
        same = [f for f in self.fighters if f.team == fi.team]
        k = same.index(fi) if fi in same else 0
        dx = 90 if bx < 630 else -90
        return bx + dx, TD.clamp(by + (k * 70 - 35 if len(same) > 1 else 0), 50, 430)

    def place_all(self):
        super().place_all()
        if self.train is not None:
            me = self.trainee()
            for fi in self.fighters:
                if fi is not me:
                    fi.a.x, fi.a.y = 700.0, 300.0
            if me is not None:
                for dx in (110, 190):
                    self.add_fish(me.a.x + dx, me.a.y + random.uniform(-30, 30), lying=True)

    # ---- fish --------------------------------------------------------------------------------------------------
    def add_fish(self, x, y, lying=False, k=None, z=None):
        self.fid += 1
        k = k or ("g" if random.random() < 0.1 else "n")
        f = {"id": self.fid, "k": k, "x": x, "y": y, "z": 0.0 if lying else (z or 380.0), "vx": 0.0, "vy": 0.0,
             "vz": 0.0, "st": "lie" if lying else "fall", "t": 0.0, "team": None, "own": None,
             "flop": random.uniform(0, 6)}
        self.fish.append(f)
        return f

    def free_spot(self):
        for _ in range(30):
            x, y = random.uniform(200, 1060), random.uniform(55, 425)
            if not self.blocked(x, y, 14) and all(TD.dist(x, y, bx, by) > 90 for bx, by in self.baskets.values()):
                return x, y
        return 630.0, 250.0

    def step_world(self, dt):
        if self.train is None:
            self.next_fish -= dt
            lying = sum(1 for f in self.fish if f["st"] == "lie")
            if self.next_fish <= 0 and lying < 10:
                self.next_fish = random.uniform(1.0, 1.6) * (0.85 if len(self.fighters) > 2 else 1.0)
                self.add_fish(*self.free_spot())
            self.step_gull(dt)
        self.step_fish(dt)
        self.step_traps(dt)
        self.step_nets(dt)

    def step_fish(self, dt):
        keep = []
        for f in self.fish:
            f["t"] += dt
            if f["st"] == "fall":
                f["vz"] -= FG * dt
                f["z"] += f["vz"] * dt
                # caught in the air by a jumper
                for fi in sorted(self.fighters, key=lambda o: TD.dist(o.a.x, o.a.y, f["x"], f["y"]) + random.random()):
                    if fi.alive() and fi.z > 8 and len(fi.fish) < self.cap(fi) and \
                            TD.dist(fi.a.x, fi.a.y, f["x"], f["y"]) < 36 and fi.z + 6 < f["z"] < fi.z + 90:
                        fi.fish.append(f["k"])
                        f["st"] = "gone"
                        self.add_fx("text", fi, text="接住了！", small=True)
                        FA.burst(self, "star", f["x"], f["y"], f["z"], n=8, col="#ffd34c", col2="#ffffff", spd=180,
                                 g=0, dur=0.5, size=4, side=False)
                        self.sound("chime")
                        self.note(fi, "catch")
                        self.note(fi, "pick")
                        break
                if f["st"] == "fall" and f["z"] <= 0:
                    f["z"], f["vz"], f["st"], f["t"] = 0.0, 0.0, "lie", 0.0
                    FA.burst(self, "drop", f["x"], f["y"], 2, n=6, col="#bfe3f5", spd=140, g=500, dur=0.35, size=3,
                             side=False)
            elif f["st"] == "fly":
                f["vz"] -= FG * dt
                f["x"] += f["vx"] * dt
                f["y"] += f["vy"] * dt
                f["z"] += f["vz"] * dt
                f["x"] = TD.clamp(f["x"], 30, H.PW - 30)
                f["y"] = TD.clamp(f["y"], 30, H.PD_PLACE - 20)
                if f["z"] <= 0:
                    f["z"], f["vz"] = 0.0, 0.0
                    tm = f.get("team")
                    if tm is not None and tm in self.baskets and \
                            TD.dist(f["x"], f["y"], *self.baskets[tm]) < BASKET_R + 6:
                        thrower = next((o for o in self.fighters if o.uid == f.get("own")), None)
                        self.score(tm, f["k"], thrower, thrown=True)
                        f["st"] = "gone"
                    else:
                        f["st"], f["t"] = "lie", 0.0
            elif f["st"] == "lie":
                if f["t"] > 16:
                    f["st"] = "gone"
                    FA.burst(self, "drop", f["x"], f["y"], 2, n=5, col="#bfe3f5", spd=100, g=500, dur=0.3, size=3,
                             side=False)
                else:
                    for fi in sorted(self.fighters, key=lambda o: TD.dist(o.a.x, o.a.y, f["x"], f["y"]) + random.random()):
                        if fi.alive() and fi.z < 20 and fi.st not in ("down", "stun") and \
                                len(fi.fish) < self.cap(fi) and TD.dist(fi.a.x, fi.a.y, f["x"], f["y"]) < 28:
                            fi.fish.append(f["k"])
                            f["st"] = "gone"
                            self.note(fi, "pick")
                            if f["k"] == "g":
                                self.add_fx("text", fi, text="🌟 金鱼！", small=True)
                            if random.random() < 0.35:
                                self.sound("chime")
                            break
                    if f["st"] == "lie":
                        lurer = next((o for o in self.fighters if o.lure > 0 and
                                      TD.dist(o.a.x, o.a.y, f["x"], f["y"]) < 300), None)
                        if lurer is not None:
                            ux, uy = HB.norm(lurer.a.x - f["x"], lurer.a.y - f["y"])
                            f["x"] += ux * 260 * dt
                            f["y"] += uy * 260 * dt
            if f["st"] != "gone":
                keep.append(f)
        self.fish = keep

    def cap(self, fi):
        return 6 if fi.belly > 0 else CAP

    def score(self, team, k, who, thrown=False):
        v = value(k)
        self.pts[team] = self.pts.get(team, 0) + v
        if who is not None:
            who.score += v
            who.delivered += v
            self.note(who, "score", v=v)
            if thrown:
                self.note(who, "throw_score")
        bx, by = self.baskets[team]
        col = HB.TEAM_COLORS.get(team, "#fff")
        FA.burst(self, "star", bx, by, 40, n=6 + 4 * v, col="#ffd34c" if k == "g" else "#ffffff", col2=col, spd=200,
                 g=200, dur=0.7, size=5, side=False)
        self.add_fx("text", None, x=bx, y=by, z=70, text="+%d" % v, heal=True)
        self.sound("chime")

    def drop_all(self, fi, hop=True):
        n = len(fi.fish)
        for k in fi.fish:
            a = random.uniform(0, math.tau)
            sp = random.uniform(70, 150)
            f = self.add_fish(fi.a.x, fi.a.y, k=k)
            f.update(st="fly", z=fi.z + 30, vx=math.cos(a) * sp, vy=math.sin(a) * sp, vz=random.uniform(180, 280))
        fi.fish = []
        if n:
            self.add_fx("text", fi, text="鱼掉了！", small=True)
        return n

    def step_gull(self, dt):
        g = self.gull
        if g is None:
            self.next_gull -= dt
            if self.next_gull <= 0:
                d = random.choice((-1, 1))
                self.gull = {"x": -60.0 if d > 0 else H.PW + 60.0, "y": random.uniform(90, 400), "vx": 330.0 * d,
                             "t": 0.0, "got": 0}
                self.add_fx("text", None, x=630, y=440, z=80, text="海鸥来了！", small=True)
            return
        g["t"] += dt
        g["x"] += g["vx"] * dt
        for f in self.fish:
            if f["st"] == "lie" and abs(f["x"] - g["x"]) < 26 and abs(f["y"] - g["y"]) < 40 and g["got"] < 2:
                f["st"] = "gone"
                g["got"] += 1
                FA.burst(self, "feather", f["x"], f["y"], 30, n=6, col="#ffffff", col2="#d8d8d8", spd=120, g=100,
                         dur=0.7, size=4, side=False)
                self.add_fx("text", None, x=f["x"], y=f["y"], z=50, text="被海鸥叼走了！", small=True)
        self.fish = [f for f in self.fish if f["st"] != "gone"]
        if not (-80 < g["x"] < H.PW + 80):
            self.gull = None
            self.next_gull = random.uniform(15, 22)

    def step_traps(self, dt):
        keep = []
        for tr in self.traps:
            tr["t"] -= dt
            hit = None
            for fi in self.fighters:
                if fi.team != tr["team"] and fi.alive() and fi.z < 6 and \
                        TD.dist(fi.a.x, fi.a.y, tr["x"], tr["y"]) < 24 and fi.st != "roll":
                    hit = fi
                    break
            if hit is not None:
                if not PL.block(self, hit):
                    self.drop_all(hit)
                    self.start(hit, "down", 0.8)
                    hit.vz = 180
                    hit.kx, hit.ky = hit.vx * 0.8, hit.vy * 0.8
                    self.add_fx("text", hit, text="踩到香蕉皮了！", small=True)
                    self.sound("oof" if not hit.a.is_cat else "mew", hit)
                    own = next((o for o in self.fighters if o.uid == tr["own"]), None)
                    if own is not None:
                        self.note(own, "trap")
                continue
            if tr["t"] > 0:
                keep.append(tr)
        self.traps = keep

    def step_nets(self, dt):
        keep = []
        for n in self.nets:
            n["t"] += dt
            u = min(1.0, n["t"] / n["dur"])
            if u >= 1:
                fi = next((o for o in self.fighters if o.uid == n["own"]), None)
                got = 0
                for f in self.fish:
                    if f["st"] == "lie" and TD.dist(f["x"], f["y"], n["tx"], n["ty"]) < 85:
                        f["st"] = "gone"
                        if fi is not None and len(fi.fish) < self.cap(fi):
                            fi.fish.append(f["k"])
                        elif fi is not None:
                            self.add_fish(fi.a.x + random.uniform(-25, 25), fi.a.y + random.uniform(-20, 20),
                                          lying=True, k=f["k"])
                        got += 1
                self.fish = [f for f in self.fish if f["st"] != "gone"]
                FA.burst(self, "drop", n["tx"], n["ty"], 4, n=10, col="#bfe3f5", spd=160, g=500, dur=0.4, size=3,
                         side=False)
                if fi is not None:
                    self.add_fx("text", fi, text="网到 %d 条！" % got if got else "空网……", small=True)
            else:
                keep.append(n)
        self.nets = keep

    # ---- fighters ----------------------------------------------------------------------------------------------
    def load(self, fi):
        if fi.belly > 0:
            return 0
        return sum(2 if k == "g" else 1 for k in fi.fish)

    def step_fighter(self, fi, dt):
        self.tick(fi, dt)
        fi.belly = max(0.0, fi.belly - dt)
        fi.lure = max(0.0, fi.lure - dt)
        if fi.belly <= 0 and len(fi.fish) > CAP:
            extra = fi.fish[CAP:]
            fi.fish = fi.fish[:CAP]
            for k in extra:
                self.add_fish(fi.a.x + random.uniform(-25, 25), fi.a.y + random.uniform(-20, 20), lying=True, k=k)
        inp = fi.inp
        pressed = inp["pressed"]
        mx, my, mn = self.stick(fi)
        sp = self.base_speed(fi) * max(0.55, 1 - 0.1 * self.load(fi))
        st = fi.st
        # deliver
        if fi.fish and fi.alive():
            bx, by = self.baskets.get(fi.team, (0, 0))
            if TD.dist(fi.a.x, fi.a.y, bx, by) < BASKET_R + 8:
                for k in fi.fish:
                    self.score(fi.team, k, fi)
                fi.fish = []
        want = self.common_states(fi, dt, sp, mx, my)
        if want is None:
            want = (0.0, 0.0)
            if st == "idle":
                want = (mx * sp, my * sp)
                if mn > 0.1:
                    fi.fx, fi.fy = mx, my
                if self.try_roll(fi, mx, my, mn):
                    pass
                elif self.try_jump(fi, 360):
                    pass
                elif "atk" in pressed and fi.cd["swat"] <= 0:
                    o = self.nearest_enemy(fi, 120)
                    if o is not None:
                        self.face_to(fi, o.a.x, o.a.y)
                    self.start(fi, "swat", 0.3)
                    fi.cd["swat"] = 0.45
                elif "throw" in pressed:
                    if fi.fish:
                        self.throw_fish(fi)
                    else:
                        self.tell(fi, "手里没有鱼")
                elif "skill" in pressed:
                    if fi.cds["k"] <= 0:
                        self.use_skill(fi)
                    else:
                        self.tell(fi, "技能冷却中")
            elif st == "swat":
                want = (fi.fx * 70, fi.fy * 70) if fi.t < 0.15 else (0.0, 0.0)
                if fi.t >= 0.08 and not fi.data.get("hit"):
                    fi.data["hit"] = True
                    self.swat(fi)
                if fi.t >= fi.dur:
                    self.start(fi, "idle", 0)
            elif st == "throw":
                want = (mx * sp * 0.4, my * sp * 0.4)
                if fi.t >= fi.dur:
                    self.start(fi, "idle", 0)
            elif st == "dash":
                tx, ty = fi.data["to"]
                d = TD.dist(tx, ty, fi.a.x, fi.a.y)
                if d > 16 and fi.t < 0.45:
                    ux, uy = HB.norm(tx - fi.a.x, ty - fi.a.y)
                    want = (ux * 900, uy * 900)
                    fi.fx, fi.fy = ux, uy
                else:
                    o = next((f for f in self.fighters if f.uid == fi.data.get("victim")), None)
                    if o is not None and o.fish and TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y) < 70 and not PL.block(self, o):
                        k = o.fish.pop()
                        if len(fi.fish) < self.cap(fi):
                            fi.fish.append(k)
                        else:
                            self.add_fish(fi.a.x, fi.a.y, lying=True, k=k)
                        self.start(o, "stun", 0.5)
                        self.add_fx("text", fi, text="抢到一条！", small=True)
                        self.sound("hit")
                    self.start(fi, "idle", 0)
            elif st == "skill":
                want = (mx * sp * 0.5, my * sp * 0.5)
                if fi.t >= fi.dur:
                    self.start(fi, "idle", 0)
        self.physics(fi, dt, want)

    def swat(self, fi):
        self.add_fx("swing", fi, r=56, z=fi.z + 20)
        self.sound("whoosh")
        for o in self.enemies(fi):
            if not o.alive() or o.inv > 0 or o.st == "roll" or abs(o.z - fi.z) > 40:
                continue
            dx, dy = o.a.x - fi.a.x, o.a.y - fi.a.y
            d = math.hypot(dx, dy * 1.1)
            if d > 62 or (d > 1 and (dx * fi.fx + dy * fi.fy) / d < math.cos(math.radians(60))):
                continue
            if PL.block(self, o):
                continue
            n = self.drop_all(o)
            o.kx, o.ky = HB.norm(dx, dy)[0] * 160, HB.norm(dx, dy)[1] * 160
            self.start(o, "stun" if n else "hit", 0.35 if n else 0.22)
            FA.on_hit(self, fi, o, 4 + 2 * n, heavy=n >= 2, side=False)
            self.sound("hit2" if n else "hit")
            if n:
                self.note(fi, "swat_drop", n=n)
            t = fi.__dict__.setdefault("tally", {})
            t["hits"] = t.get("hits", 0) + 1

    def throw_fish(self, fi):
        k = fi.fish.pop()
        bx, by = self.baskets.get(fi.team, (fi.a.x, fi.a.y))
        mate = next((o for o in self.fighters if o is not fi and o.team == fi.team and o.alive()), None)
        db = TD.dist(bx, by, fi.a.x, fi.a.y)
        if db < 470:
            tx, ty = bx, by
        elif mate is not None and TD.dist(mate.a.x, mate.a.y, fi.a.x, fi.a.y) < 500:
            tx, ty = mate.a.x, mate.a.y
        else:
            tx, ty = fi.a.x + fi.fx * 230, fi.a.y + fi.fy * 200
        self.face_to(fi, tx, ty)
        d = TD.dist(tx, ty, fi.a.x, fi.a.y)
        t = max(0.35, d / 420.0)
        ux, uy = HB.norm(tx - fi.a.x, ty - fi.a.y)
        f = self.add_fish(fi.a.x, fi.a.y, k=k)
        z0 = fi.z + 34
        f.update(st="fly", z=z0, vx=ux * d / t, vy=uy * d / t, vz=(0.5 * FG * t * t - z0) / t, team=fi.team, own=fi.uid)
        self.start(fi, "throw", 0.25)
        self.sound("whoosh")
        self.note(fi, "throw")

    # ---- skills ------------------------------------------------------------------------------------------------
    def use_skill(self, fi):
        sk = HG.SKILLS["fish"][fi.char][0]
        name = sk["key"]
        if name == "snatch":
            best = None
            for o in self.enemies(fi):
                if o.alive() and o.fish:
                    d = TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y)
                    if d < 340 and (best is None or d < best[0]):
                        best = (d, o)
            if best is not None:
                o = best[1]
                self.start(fi, "dash", 0.5)
                fi.data["to"] = (o.a.x, o.a.y)
                fi.data["victim"] = o.uid
                fi.inv = 0.4
            else:
                self.start(fi, "dash", 0.3)
                fi.data["to"] = (fi.a.x + fi.fx * 160, fi.a.y + fi.fy * 120)
            FA.on_dash(self, fi, side=False)
        elif name == "belly":
            fi.belly = 8.0
            self.start(fi, "skill", 0.3)
        elif name == "net":
            tx = TD.clamp(fi.a.x + fi.fx * 150, 40, H.PW - 40)
            ty = TD.clamp(fi.a.y + fi.fy * 120, 40, H.PD_PLACE - 30)
            self.nets.append({"x0": fi.a.x, "y0": fi.a.y, "tx": tx, "ty": ty, "t": 0.0, "dur": 0.4, "own": fi.uid})
            self.start(fi, "skill", 0.35)
        elif name == "lure":
            fi.lure = 1.6
            self.start(fi, "skill", 0.4)
            self.add_fx("ringz", None, x=fi.a.x, y=fi.a.y, z=6, r=300, col="#f2b630", dur=0.5)
        elif name == "banana":
            x, y = fi.a.x - fi.fx * 30, fi.a.y - fi.fy * 24
            self.traps.append({"x": x, "y": y, "t": 15.0, "team": fi.team, "own": fi.uid})
            self.start(fi, "skill", 0.25)
        fi.cds["k"] = sk["cd"]
        self.skill_banner(fi, sk)

    # ---- pals --------------------------------------------------------------------------------------------------
    def pal_act(self, fi, name, px, py, pz):
        if name == "兔兔":
            bx, by = self.baskets.get(fi.team, (0, 0))
            if fi.fish and TD.dist(fi.a.x, fi.a.y, bx, by) > 220:
                k = fi.fish.pop()
                self.score(fi.team, k, fi)
                self.add_fx("text", fi, text="🐰 帮你送了一条鱼", small=True)
                FA.burst(self, "glow", fi.a.x, fi.a.y, 50, n=10, col="#ff8fb0", col2="#ffffff", spd=90, ang=90,
                         spread=120, g=-120, dur=0.8, size=4, side=False)
                return True
            fi.pal_cd = 0.5
            return False
        if name in ("baby dragon",):
            # it goes for whoever is carrying the most
            best = None
            for o in self.enemies(fi):
                if o.alive() and o.fish and (best is None or len(o.fish) > len(best.fish)):
                    best = o
            if best is None:
                fi.pal_cd = 0.6
                return False
            self.pal_shots.append({"k": "fire", "x": px, "y": py, "z": pz, "to": best.uid, "own": fi.uid, "t": 0.0})
            self.sound("whoosh")
            return True
        return None

    def pal_land(self, own, o, kind, x, y, z):
        if kind == "fire":
            if not PL.block(self, o):
                self.drop_all(o)
                self.start(o, "stun", 0.4)
                o.flash = 0.1
                FA.burst(self, "spark", o.a.x, o.a.y, 20, n=10, col="#ffcf3a", col2="#ff6a3a", spd=240, g=300,
                         dur=0.35, size=3, side=False)
            return True
        return False

    # ---- poses -------------------------------------------------------------------------------------------------
    def pose(self, fi):
        if self.base_pose(fi):
            if fi.st == "idle" and fi.fish and not fi.a.is_cat:
                moving = math.hypot(fi.vx, fi.vy) > 20
                self.tpose(fi, rig=dict(FA.R["lift"]) if not moving else None, person="run" if moving else "stand")
            return
        st = fi.st
        if st == "swat":
            self.tpose(fi, "f_swat", rig=FA.R["jab"] if fi.t > 0.06 else FA.R["jab_w"], fu=min(1.0, fi.t / 0.3))
        elif st == "throw":
            self.tpose(fi, "f_swat", rig=FA.R["throw"])
        elif st == "dash":
            self.tpose(fi, "f_dash", rig=FA.R["dash"])
        elif st == "skill":
            self.tpose(fi, "f_swat", rig=FA.R["throw"])
        else:
            self.tpose(fi, "stand")

    # ---- the end -----------------------------------------------------------------------------------------------
    def check_end(self):
        if self.train is not None:
            return
        if self.clock >= self.limit:
            win = self.winners_by(self.pts)
            parts = ["%s %d 分" % (self.team_label(tm), v) for tm, v in sorted(self.pts.items(), key=lambda kv: -kv[1])]
            text = "平局！" if len(win) != 1 else "%s 赢了！" % self.team_label(win[0])
            self.finish_with(win if len(win) == 1 else [], text)
            self.result["rank"] = " · ".join(parts)

    # ---- network -----------------------------------------------------------------------------------------------
    def net_extra(self):
        g = self.gull
        return {"fish": [{"k": f["k"], "x": round(f["x"]), "y": round(f["y"]), "z": round(f["z"]), "st": f["st"],
                          "t": round(f["t"], 1), "flop": round(f["flop"], 1)} for f in self.fish],
                "pts": {str(k): v for k, v in self.pts.items()},
                "baskets": {str(k): v for k, v in self.baskets.items()},
                "traps": [{"x": round(t["x"]), "y": round(t["y"]), "team": t["team"]} for t in self.traps],
                "nets": [{"x0": round(n["x0"]), "y0": round(n["y0"]), "tx": round(n["tx"]), "ty": round(n["ty"]),
                          "t": round(n["t"], 2), "dur": n["dur"]} for n in self.nets],
                "gull": {"x": round(g["x"]), "y": round(g["y"]), "vx": g["vx"]} if g else None}

    def fighter_extra(self, fi):
        return {"cds": {"k": round(fi.cds["k"], 1)}, "fish": list(fi.fish), "belly": round(fi.belly, 1),
                "lure": round(fi.lure, 1)}

    # ---- tutorial ----------------------------------------------------------------------------------------------
    def train_prepare(self, key, me):
        if me is None:
            return
        mate = next((f for f in self.fighters if f is not me), None)
        if key == "swat" and mate is not None:
            mate.fish = ["n", "n", "g"]
        if key in ("pick", "throw") and not any(f["st"] == "lie" for f in self.fish):
            self.add_fish(TD.clamp(me.a.x + 120, 200, 1000), me.a.y, lying=True)

    def step_train(self, dt):
        super().step_train(dt)
        tr = self.train
        if tr is None or tr["i"] >= len(self.TRAIN_STEPS) or tr.get("done_t") is not None:
            return
        me = self.trainee()
        if me is None:
            return
        key = self.TRAIN_STEPS[tr["i"]][0]
        if key == "catch" and not any(f["st"] == "fall" for f in self.fish):
            self.add_fish(TD.clamp(me.a.x + me.fx * 40, 80, 1180), TD.clamp(me.a.y + me.fy * 30, 50, 430), z=300,
                          k="n")
        if key in ("pick", "score", "throw") and not me.fish and not any(f["st"] in ("lie", "fly") for f in self.fish):
            self.add_fish(TD.clamp(me.a.x + 140, 200, 1000), TD.clamp(me.a.y + 40, 60, 420), lying=True)
        if key == "swat":
            mate = next((f for f in self.fighters if f is not me), None)
            if mate is not None and not mate.fish and not any(f["st"] in ("lie", "fly") for f in self.fish):
                mate.fish = ["n", "n"]

    def make_ai(self, fi):
        return FishTrainAI(self, fi) if self.train is not None else FishAI(self, fi)


FishBattle.TRAIN_STEPS = [
    ("pick", "走到地上的鱼那里，自动就捡起来了", "WASD", "pick", "捡鱼"),
    ("score", "把鱼抱回你的篮子（你那一边、红色的篮子）", "WASD", "score", "送回篮子"),
    ("catch", "天上掉鱼啦！看着影子，在鱼落地前按空格跳起来接住", "空格", "catch", "空中接鱼"),
    ("throw", "抱着鱼走到篮子附近，按 E 把鱼扔进去", "E", "throw_score", "扔进篮子"),
    ("swat", "陪练抱着鱼：走过去按 J 拍他，他的鱼就全掉了", "J", "swat_drop", "拍掉鱼"),
    ("skill", "按 K：技能「{k}」——{desc}", "K", "skill", "技能"),
]


# ======================================================================================================== AI
class FishAI:
    def __init__(self, b, fi):
        self.b = b
        self.fi = fi
        self.lv = TD.level_of(fi, b)
        self.steer = TD.Steer(b, fi)
        self.think = 0.0
        self.goal = None
        self.throw_t = 0.0

    def step(self, dt):
        b, fi = self.b, self.fi
        TD.clear_inputs(fi)
        inp = fi.inp
        lv = self.lv
        if not fi.alive() or fi.st != "idle":
            return
        self.think -= dt
        self.throw_t -= dt
        cap = b.cap(fi)
        n = len(fi.fish)
        bx, by = b.baskets.get(fi.team, (630, 250))
        db = TD.dist(bx, by, fi.a.x, fi.a.y)
        # dodge a swatter
        for o in b.enemies(fi):
            if o.alive() and o.st == "swat" and n and TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y) < 80 and \
                    random.random() < lv["smart"] * 0.6:
                ux, uy = HB.norm(fi.a.x - o.a.x + 0.1, fi.a.y - o.a.y)
                inp["dx"], inp["dy"] = ux, uy
                inp["pressed"].add("guard")
                inp["held"] = {"guard"}
                return
        name = HG.SKILLS["fish"][fi.char][0]["key"]
        if fi.cds["k"] <= 0 and random.random() < lv["skill"] * dt * 2:
            lying = [f for f in b.fish if f["st"] == "lie"]
            near = [f for f in lying if TD.dist(f["x"], f["y"], fi.a.x, fi.a.y) < 280]
            carriers = [o for o in b.enemies(fi) if o.alive() and o.fish and TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y) < 330]
            use = (name == "snatch" and carriers and n < cap) or (name == "belly" and len(near) >= 3) or \
                  (name == "lure" and len(near) >= 2 and n < cap) or \
                  (name == "banana" and any(TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y) < 150 for o in b.enemies(fi))) or \
                  (name == "net" and sum(1 for f in lying if TD.dist(f["x"], f["y"], fi.a.x + fi.fx * 150,
                                                                       fi.a.y + fi.fy * 120) < 85) >= 2)
            if use:
                inp["pressed"].add("skill")
                return
        # swat a nearby carrier
        for o in b.enemies(fi):
            if o.alive() and o.fish and fi.cd["swat"] <= 0:
                d = TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y)
                if d < 58 and random.random() < 0.3 + 0.6 * lv["smart"]:
                    b.face_to(fi, o.a.x, o.a.y)
                    inp["pressed"].add("atk")
                    return
                if d < 160 and len(o.fish) >= (1 if lv["smart"] > 0.5 else 2) and n < cap and \
                        random.random() < lv["smart"]:
                    self.steer.go(o.a.x, o.a.y, dt, stop=4)
                    return
        nearby = [f for f in b.fish if f["st"] in ("lie", "fall") and TD.dist(f["x"], f["y"], fi.a.x, fi.a.y) < 230]
        time_left = b.limit - b.clock
        if n >= cap or (n and (not nearby or "g" in fi.fish or time_left < 8 or db < 160)):
            if db < 400 and self.throw_t <= 0 and random.random() < 0.4 + 0.5 * lv["smart"]:
                self.throw_t = 0.4
                b.face_to(fi, bx, by)
                inp["pressed"].add("throw")
                return
            self.steer.go(bx, by, dt, stop=4)
            return
        # go for a fish
        if self.think <= 0 or self.goal is None or self.goal not in b.fish:
            self.think = lv["react"]
            best = None
            for f in b.fish:
                if f["st"] not in ("lie", "fall"):
                    continue
                d = TD.dist(f["x"], f["y"], fi.a.x, fi.a.y)
                score = d - value(f["k"]) * 70
                # someone else is right on it
                if any(TD.dist(o.a.x, o.a.y, f["x"], f["y"]) < d * 0.5 for o in b.fighters if o is not fi):
                    score += 150
                if best is None or score < best[0]:
                    best = (score, f)
            self.goal = best[1] if best else None
        f = self.goal
        if f is None:
            self.steer.go(630 + (bx - 630) * 0.3, 250, dt, stop=30)
            return
        if f["st"] == "fall" and TD.dist(f["x"], f["y"], fi.a.x, fi.a.y) < 40 and 40 < f["z"] < 110 and \
                random.random() < lv["smart"]:
            inp["pressed"].add("jump")
        self.steer.go(f["x"], f["y"], dt, stop=2)


class FishTrainAI:
    def __init__(self, b, fi):
        self.b = b
        self.fi = fi
        self.steer = TD.Steer(b, fi)
        self.t = 0.0
        self.goal = (fi.a.x, fi.a.y)

    def step(self, dt):
        b, fi = self.b, self.fi
        TD.clear_inputs(fi)
        tr = b.train
        if tr is None or tr["i"] >= len(b.TRAIN_STEPS):
            return
        key = b.TRAIN_STEPS[tr["i"]][0]
        if key != "swat":
            self.steer.go(700, 400, dt, stop=10)
            return
        self.t -= dt
        if self.t <= 0:
            self.t = random.uniform(2, 3.5)
            self.goal = (random.uniform(450, 850), random.uniform(120, 380))
        self.steer.go(*self.goal, dt, stop=10, slow=80)
        fi.inp["dx"] *= 0.45
        fi.inp["dy"] *= 0.45
