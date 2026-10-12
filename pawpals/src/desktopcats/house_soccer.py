"""猫咪足球 (at the 猫咪球场): top-down football with a 毛绒门将 (a plush keeper sliding along each goal line).

Run into the ball to dribble it. With the ball, J tapped passes (to your team-mate, or a short kick forward), J held
charges a shot at the goal; without it, J pokes at the ball of whoever has it. L slide-tackles (the ball flies off
the person you catch, and they go down), Space jumps (a ball at head height is headed toward the other goal), E is a
short sprint. Red attacks the right-hand goal, blue the left. The first to the agreed number of goals wins.
"""
import math
import random

from . import house_art as H
from . import house_arena_art as AA
from . import house_battle as HB
from . import house_fanim as FA
from . import house_games as HG
from . import house_pals as PL
from . import house_tdgame as TD

P = AA.PITCH
GY0, GY1 = P["goal_y0"], P["goal_y1"]
GMID = (GY0 + GY1) / 2
BAR_Z = 70.0
BALL_R = 9.0
BG = 900.0                         # the ball's gravity
KEEPER_V = {"easy": 80.0, "normal": 115.0, "hard": 150.0}


def goal_x(team):
    """The goal a team attacks."""
    return P["x1"] if team % 2 == 0 else P["x0"]


def own_goal_x(team):
    return P["x0"] if team % 2 == 0 else P["x1"]


class SoccerBattle(TD.TopGame):
    GAME = "soccer"
    TRAIN_DONE = "训练完成！可以上场踢球啦 ⚽"
    FREE_STATES = ("idle",)

    def setup(self):
        self.limit = 240.0 if self.mode != "train" else 1e9
        self.goals = {0: 0, 1: 0}
        self.ball = self.new_ball()
        self.keepers = {0: {"x": P["x0"] + 16, "y": GMID, "st": "", "t": 0.0, "stun": 0.0},
                        1: {"x": P["x1"] - 16, "y": GMID, "st": "", "t": 0.0, "stun": 0.0}}
        self.pause = 0.0                    # after a goal
        self.freeze = 0.0                   # the kick-off
        self.last_goal = None
        for fi in self.fighters:
            fi.maxhp = 100
            fi.hp = 100.0
            fi.cds = {"k": 0.0}
            fi.charge = 0.0
            fi.glue = 0.0
            fi.sprint = 0.0
            fi.kick_cd = 0.0
            fi.cd["slide"] = 0.0
            fi.cd["sprint"] = 0.0

    def new_ball(self, x=None, y=None):
        return {"x": (P["x0"] + P["x1"]) / 2 if x is None else x, "y": GMID if y is None else y, "z": 0.0,
                "vx": 0.0, "vy": 0.0, "vz": 0.0, "own": None, "last": None, "spin": 0.0, "spin_t": 0.0,
                "cannon": False, "rot": 0.0, "trail": 0.0}

    def spawn_point(self, fi):
        sp = self.arena["spawns"]
        same = [f for f in self.fighters if f.team == fi.team]
        k = same.index(fi) if fi in same else 0
        return sp[(0 if fi.team == 0 else 2) + (k % 2)]

    def place_all(self):
        super().place_all()
        self.ball = self.new_ball()
        if self.train is not None:
            me = self.trainee()
            for fi in self.fighters:
                if fi is not me:
                    fi.a.x, fi.a.y = 700.0, 380.0
            if me is not None:
                me.a.x, me.a.y = 520.0, GMID
                self.ball = self.new_ball(600, GMID)
        for fi in self.fighters:
            fi.fx, fi.fy = (1.0, 0.0) if fi.team == 0 else (-1.0, 0.0)

    def can_stand(self, x, y, r=8.0, air=False):
        if not (P["x0"] - 14 < x < P["x1"] + 14 and P["y0"] - 16 < y < P["y1"] + 18):
            return False
        return super().can_stand(x, y, r, air)

    # ---- the frame ---------------------------------------------------------------------------------------------
    def step_game(self, dt):
        if self.pause > 0:
            self.pause -= dt
            self.step_ball(dt, free_only=True)
            self.step_keepers(dt)
            for fi in self.fighters:
                fi.inp["pressed"] = set()
                fi.vx = fi.vy = 0.0
            self.control(dt)
            for fi in self.fighters:
                fi.inp["pressed"] = set()
                self.celebrate_goal(fi)
            self.step_fx(dt)
            if self.pause <= 0:
                self.kickoff()
            if self.phase == "fight":
                self.check_end()
            return
        if self.freeze > 0:
            self.freeze -= dt
            self.control(dt)
            for fi in self.fighters:
                fi.inp["pressed"] = set()
                fi.st = "idle" if fi.st != "over" else fi.st
                self.pose(fi)
            self.step_fx(dt)
            return
        super().step_game(dt)

    def celebrate_goal(self, fi):
        a = fi.a
        scored = self.last_goal is not None and fi.team == self.last_goal
        if a.is_cat:
            a.set_pose("happy" if scored and int(self.t * 3) % 2 else ("stretch" if scored else "sit"))
        else:
            a.pose, a.rig, a.view = ("rig", FA.R["cheer"], "side") if scored else ("stand", None, "side")
        a.fanim = dict(rot=0.0, pz=8.0 * abs(math.sin(self.t * 8)) if scored else 0.0, sx=1.0, sy=1.0, dx=0.0, dy=0.0,
                       fl=0.0, gh=0, op=1.0)

    def kickoff(self):
        for fi in self.fighters:
            x, y = self.spawn_point(fi)
            fi.a.x, fi.a.y, fi.z = x, y, 0.0
            fi.kx = fi.ky = fi.vz = 0.0
            fi.fx, fi.fy = (1.0, 0.0) if fi.team == 0 else (-1.0, 0.0)
            self.start(fi, "idle", 0)
        self.ball = self.new_ball()
        if self.train is not None:
            me = self.trainee()
            if me is not None:
                me.a.x, me.a.y = 520.0, GMID
                self.ball = self.new_ball(580, GMID)
        self.freeze = 0.8
        self.say_banner("开球！", 0.9)

    def step_world(self, dt):
        self.step_ball(dt)
        self.step_keepers(dt)

    # ---- the ball ----------------------------------------------------------------------------------------------
    def owner(self):
        uid = self.ball["own"]
        return next((f for f in self.fighters if f.uid == uid), None) if uid else None

    def release(self, vx=0.0, vy=0.0, vz=0.0, by=None):
        b = self.ball
        b["own"] = None
        b["vx"], b["vy"], b["vz"] = vx, vy, vz
        if by is not None:
            b["last"] = by.uid
            by.kick_cd = 0.3

    def step_ball(self, dt, free_only=False):
        b = self.ball
        b["trail"] = max(0.0, b["trail"] - dt)
        o = self.owner()
        if o is not None and not free_only:
            if not o.alive() or o.st in ("down", "stun", "dizzy", "hit", "ko"):
                self.release(o.vx * 0.5 + random.uniform(-60, 60), o.vy * 0.5 + random.uniform(-60, 60), 60)
            else:
                tx = o.a.x + o.fx * (20 if o.a.is_cat else 22)
                ty = o.a.y + o.fy * 16
                k = min(1.0, dt * 18)
                b["x"] += (tx - b["x"]) * k
                b["y"] += (ty - b["y"]) * k
                b["z"] = 0.0
                b["vx"], b["vy"], b["vz"] = o.vx, o.vy, 0.0
                b["rot"] += math.hypot(o.vx, o.vy) * dt * 0.08
                b["last"] = o.uid
                self.check_goal_line()
                return
        if b["spin_t"] > 0:
            b["spin_t"] -= dt
            a = b["spin"] * dt
            ca, sa = math.cos(a), math.sin(a)
            b["vx"], b["vy"] = b["vx"] * ca - b["vy"] * sa, b["vx"] * sa + b["vy"] * ca
        if b["z"] > 0 or b["vz"] > 0:
            b["vz"] -= BG * dt
            b["z"] += b["vz"] * dt
            if b["z"] <= 0:
                b["z"] = 0.0
                if b["vz"] < -140:
                    b["vz"] = -b["vz"] * 0.45
                    self.add_fx("dust", None, x=b["x"], y=b["y"], z=0)
                else:
                    b["vz"] = 0.0
            fr = math.exp(-0.15 * dt)
        else:
            fr = math.exp(-1.05 * dt)
        b["vx"] *= fr
        b["vy"] *= fr
        b["x"] += b["vx"] * dt
        b["y"] += b["vy"] * dt
        b["rot"] += math.hypot(b["vx"], b["vy"]) * dt * 0.08
        # side lines bounce (boards)
        if b["y"] < P["y0"] + BALL_R:
            b["y"] = P["y0"] + BALL_R
            b["vy"] = abs(b["vy"]) * 0.7
        elif b["y"] > P["y1"] - BALL_R:
            b["y"] = P["y1"] - BALL_R
            b["vy"] = -abs(b["vy"]) * 0.7
        if b["x"] < 24 or b["x"] > H.PW - 24:            # the back of the net
            b["x"] = TD.clamp(b["x"], 24, H.PW - 24)
            b["vx"] = -b["vx"] * 0.2
        if self.check_goal_line():
            return
        if free_only:
            return
        # someone takes it
        if True:
            # the closest one gets to it first (not whoever happens to be first in the list)
            for fi in sorted(self.fighters, key=lambda f: TD.dist(f.a.x, f.a.y, b["x"], b["y"]) + random.random()):
                if not fi.alive() or fi.st in ("down", "stun", "dizzy", "hit", "ko") or fi.kick_cd > 0:
                    continue
                d = TD.dist(fi.a.x, fi.a.y, b["x"], b["y"])
                head = fi.st == "jump" and fi.z + (22 if fi.a.is_cat else 46) < b["z"] < fi.z + (64 if fi.a.is_cat else 104)
                if head and d < 34:
                    self.header(fi)
                    break
                if fi.st == "slide" and d < 30 and b["z"] < 30:
                    self.release(fi.fx * 380 + random.uniform(-40, 40), fi.fy * 380 + random.uniform(-40, 40), 80, fi)
                    self.note(fi, "tackle_ball")
                    break
                if d < (22 if fi.a.is_cat else 24) and b["z"] < 32 and fi.st in ("idle", "jump", "poke"):
                    if b.get("cannon"):
                        # a cannon shot bowls you over
                        self.start(fi, "down", 0.6)
                        fi.kx, fi.ky = b["vx"] * 0.3, b["vy"] * 0.3
                        b["vx"] *= 0.6
                        b["vy"] *= 0.6
                        b["cannon"] = False
                        FA.on_hit(self, None, fi, 10, heavy=True, side=False)
                        continue
                    b["own"] = fi.uid
                    b["last"] = fi.uid
                    b["spin_t"] = 0.0
                    b["cannon"] = False
                    self.note(fi, "dribble")
                    break

    def check_goal_line(self):
        b = self.ball
        for side in (0, 1):
            line = P["x0"] if side == 0 else P["x1"]
            past = b["x"] < line - BALL_R * 0.5 if side == 0 else b["x"] > line + BALL_R * 0.5
            if not past:
                continue
            if GY0 + 4 < b["y"] < GY1 - 4 and b["z"] < BAR_Z:
                self.scored(1 if side == 0 else 0)
                return True
            # the posts / the end boards
            o = self.owner()
            if o is not None:
                self.release(0.0, 0.0, 0.0)
            if side == 0:
                b["x"] = line + BALL_R * 0.5
                b["vx"] = abs(b["vx"]) * 0.6
            else:
                b["x"] = line - BALL_R * 0.5
                b["vx"] = -abs(b["vx"]) * 0.6
            if abs(b["y"] - GY0) < 10 or abs(b["y"] - GY1) < 10:
                self.add_fx("text", None, x=b["x"], y=b["y"], z=40, text="中柱！", small=True)
                self.sound("block")
        return False

    def scored(self, team):
        if self.pause > 0:
            return
        b = self.ball
        b["own"] = None
        b["vx"] *= 0.25
        b["vy"] *= 0.25
        self.goals[team] = self.goals.get(team, 0) + 1
        self.last_goal = team
        by = next((f for f in self.fighters if f.uid == b["last"]), None)
        own_goal = by is not None and by.team != team
        if by is not None and not own_goal:
            by.score += 1
            self.note(by, "goal")
        names = " : ".join(str(self.goals[k]) for k in (0, 1))
        if self.train is not None:
            text = "进球啦！🎉"
        elif own_goal:
            text = "乌龙球！%s" % names
        else:
            text = "进球！%s  %s" % ("%s 射门" % by.a.name if by else "", names)
        self.say_banner(text, 2.4)
        self.pause = 2.6 if self.train is None else 1.6
        gx = P["x0"] if team == 1 else P["x1"]
        col = HB.TEAM_COLORS.get(team, "#fff")
        for k in range(3):
            FA.burst(self, "star", gx, GMID + (k - 1) * 40, 40, n=12, col=col, col2="#ffd34c", spd=300, g=300, dur=1.0,
                     size=6, side=False)
        FA.burst(self, "spark", gx, GMID, 30, n=30, col="#ffffff", col2=col, spd=420, g=400, dur=0.8, size=3,
                 side=False)
        self.shake = 0.6
        self.gong()
        self.sound("boom")
        for fi in self.fighters:
            if fi.team == team:
                fi.a.say(random.choice(["球进啦！", "耶！", "好球！"]) if not fi.a.is_cat else "喵喵！", 1.8)

    def header(self, fi):
        gx = goal_x(fi.team)
        ty = GMID + random.uniform(-50, 50)
        ux, uy = HB.norm(gx - fi.a.x, ty - fi.a.y)
        b = self.ball
        b["own"] = None
        b["vx"], b["vy"], b["vz"] = ux * 520, uy * 520, 140
        b["last"] = fi.uid
        fi.kick_cd = 0.3
        FA.burst(self, "star", b["x"], b["y"], b["z"], n=8, col="#ffd34c", col2="#ffffff", spd=200, g=0, dur=0.4,
                 size=4, side=False)
        self.add_fx("text", fi, text="头球！", small=True)
        self.sound("hit2")
        self.note(fi, "header")

    # ---- keepers -----------------------------------------------------------------------------------------------
    def step_keepers(self, dt):
        b = self.ball
        sp0 = KEEPER_V.get(self.diff, 145.0) if self.train is None else 55.0
        for team, k in self.keepers.items():
            k["t"] += dt
            if k["stun"] > 0:
                k["stun"] -= dt
                continue
            line = k["x"]
            toward = (b["vx"] < -40) if team == 0 else (b["vx"] > 40)
            ty = b["y"]
            if toward and abs(b["vx"]) > 1:
                tt = (line - b["x"]) / b["vx"]
                if 0 < tt < 2.0:
                    ty = b["y"] + b["vy"] * tt
            ty = TD.clamp(ty, GY0 + 6, GY1 - 6)
            sp = sp0
            near = abs(b["x"] - line) < 240
            if toward and near and abs(b["vx"]) > 320:
                sp *= 1.45
                k["st"] = "dive"
            else:
                k["st"] = ""
            dy = ty - k["y"]
            k["y"] += TD.clamp(dy, -sp * dt, sp * dt)
            # a save
            if b["own"] is None and abs(b["x"] - line) < 24 and abs(b["y"] - k["y"]) < 19 and b["z"] < 62:
                if b.get("cannon"):
                    k["stun"] = 1.2
                    b["cannon"] = False
                    self.add_fx("text", None, x=line, y=k["y"], z=60, text="门将被撞飞了！", small=True)
                    FA.burst(self, "feather", line, k["y"], 30, n=12, col="#ffffff", col2="#f7b8cf", spd=220, g=200,
                             dur=0.8, size=4, side=False)
                    continue
                away = 1 if team == 0 else -1
                b["vx"] = away * (abs(b["vx"]) * 0.4 + 120)
                b["vy"] = random.uniform(-180, 180)
                b["vz"] = 220
                b["x"] = line + away * 26
                b["spin_t"] = 0.0
                k["st"], k["t"] = "save", 0.0
                self.add_fx("text", None, x=line, y=k["y"], z=60, text="扑救！", small=True)
                FA.burst(self, "star", line, k["y"], 30, n=8, col="#ffffff", col2="#ffd34c", spd=200, g=0, dur=0.5,
                         size=4, side=False)
                self.sound("block")
                last = next((f for f in self.fighters if f.uid == b["last"]), None)
                if last is not None:
                    self.note(last, "saved")

    # ---- fighters ----------------------------------------------------------------------------------------------
    SOCCER_K = {"calico": 0.95, "tabby": 1.0, "dad": 1.07, "mom": 1.07, "kid": 0.98}   # tuned by AI-vs-AI runs

    def speed_of(self, fi, owner):
        sp = self.base_speed(fi) * self.SOCCER_K.get(fi.char, 1.0)
        if owner:
            sp *= 0.9
        if fi.sprint > 0:
            sp *= 1.45
        if fi.glue > 0:
            sp *= 1.4
        return sp

    def step_fighter(self, fi, dt):
        self.tick(fi, dt)
        fi.glue = max(0.0, fi.glue - dt)
        fi.sprint = max(0.0, fi.sprint - dt)
        fi.kick_cd = max(0.0, fi.kick_cd - dt)
        inp = fi.inp
        held, pressed = inp["held"], inp["pressed"]
        mx, my, mn = self.stick(fi)
        has = self.ball["own"] == fi.uid
        sp = self.speed_of(fi, has)
        st = fi.st
        want = self.common_states(fi, dt, sp, mx, my)
        if want is None:
            want = (0.0, 0.0)
            if st == "idle":
                want = (mx * sp, my * sp)
                if mn > 0.1:
                    k = min(1.0, dt * (14 if not has else 9))
                    fi.fx, fi.fy = HB.norm(fi.fx + (mx - fi.fx) * k, fi.fy + (my - fi.fy) * k)
                if "guard" in pressed and fi.cd["slide"] <= 0 and not has:
                    if mn > 0.1:
                        fi.fx, fi.fy = mx, my
                    self.start(fi, "slide", 0.42)
                    fi.cd["slide"] = 1.3
                    fi.data["hit"] = set()
                    FA.on_dash(self, fi, side=False)
                    self.sound("whoosh")
                    self.note(fi, "slide")
                elif self.try_jump(fi, 340):
                    pass
                elif "throw" in pressed:
                    if fi.cd["sprint"] <= 0:
                        fi.sprint = 0.9
                        fi.cd["sprint"] = 3.0
                        self.add_fx("dash", fi)
                        FA.on_dash(self, fi, side=False)
                        self.note(fi, "sprint")
                elif "skill" in pressed:
                    if fi.cds["k"] <= 0:
                        self.use_skill(fi)
                    else:
                        self.tell(fi, "技能冷却中")
                elif "atk" in pressed:
                    if has:
                        self.start(fi, "kick", 9)
                        fi.charge = 0.0
                    else:
                        self.start(fi, "poke", 0.28)
                        self.poke(fi)
            elif st == "kick":
                want = (mx * sp * 0.5, my * sp * 0.5)
                if mn > 0.1:
                    fi.fx, fi.fy = HB.norm(fi.fx + (mx - fi.fx) * 0.2, fi.fy + (my - fi.fy) * 0.2)
                fi.charge = min(1.0, max(0.0, (fi.t - 0.2) / 0.8))
                if self.ball["own"] != fi.uid:
                    self.start(fi, "idle", 0)
                elif "atk" not in held:
                    if fi.t < 0.2:
                        self.pass_ball(fi)
                    else:
                        self.shoot(fi, fi.charge)
                    self.start(fi, "kicked", 0.22)
            elif st in ("kicked", "poke"):
                want = (mx * sp * 0.4, my * sp * 0.4)
                if fi.t >= fi.dur:
                    self.start(fi, "idle", 0)
            elif st == "slide":
                u = fi.t / fi.dur
                v = 470 * (1 - 0.6 * u)
                want = (fi.fx * v, fi.fy * v)
                for o in self.enemies(fi):
                    if o.uid in fi.data["hit"] or not o.alive() or o.z > 20:
                        continue
                    if TD.dist(o.a.x, o.a.y, fi.a.x + fi.fx * 14, fi.a.y + fi.fy * 10) < 30:
                        fi.data["hit"].add(o.uid)
                        self.tackled(fi, o)
                if fi.t >= fi.dur:
                    self.start(fi, "rec", 0.22)
            elif st == "rec":
                if fi.t >= fi.dur:
                    self.start(fi, "idle", 0)
            elif st == "skill":
                if fi.t >= fi.dur:
                    self.start(fi, "idle", 0)
                want = (mx * sp * 0.6, my * sp * 0.6)
        self.physics(fi, dt, want)

    def tackled(self, fi, o):
        if PL.block(self, o):
            return
        if o.glue > 0:
            self.add_fx("text", o, text="铲不到！", small=True)
            return
        had = self.ball["own"] == o.uid
        self.start(o, "down", 0.7 if had else 0.5)
        o.vz = 160
        o.kx, o.ky = fi.fx * 200, fi.fy * 200
        FA.on_hit(self, fi, o, 6, heavy=True, side=False)
        self.sound("hit2")
        if had:
            self.release(fi.fx * 260 + random.uniform(-80, 80), fi.fy * 260 + random.uniform(-80, 80), 120, fi)
            self.add_fx("text", fi, text="铲断！", small=True)
            self.note(fi, "tackle_win")
        else:
            self.add_fx("text", o, text="被铲倒了", small=True)

    def poke(self, fi):
        o = self.owner()
        if o is None or o.team == fi.team:
            return
        dx, dy = o.a.x - fi.a.x, o.a.y - fi.a.y
        d = math.hypot(dx, dy)
        if d > 52:
            return
        self.face_to(fi, o.a.x, o.a.y)
        if o.glue > 0 or PL.block(self, o):
            self.add_fx("text", o, text="抢不到！", small=True)
            return
        if random.random() < 0.55:
            b = self.ball
            b["own"] = fi.uid
            b["last"] = fi.uid
            o.kick_cd = 0.5
            self.add_fx("text", fi, text="抢到了！", small=True)
            self.sound("hit")
            self.note(fi, "steal")
        else:
            self.add_fx("text", fi, text="没抢到", small=True)

    def mate_of(self, fi):
        best = None
        for o in self.fighters:
            if o is fi or o.team != fi.team or not o.alive():
                continue
            dx, dy = o.a.x - fi.a.x, o.a.y - fi.a.y
            d = math.hypot(dx, dy)
            al = (dx * fi.fx + dy * fi.fy) / max(1.0, d)
            score = d * (1.6 - al)
            if best is None or score < best[0]:
                best = (score, o)
        return best[1] if best else None

    def pass_ball(self, fi):
        m = self.mate_of(fi)
        if m is not None:
            tx, ty = m.a.x + m.vx * 0.35, m.a.y + m.vy * 0.35
            ux, uy = HB.norm(tx - fi.a.x, ty - fi.a.y)
            d = TD.dist(tx, ty, fi.a.x, fi.a.y)
            v = TD.clamp(d * 1.6 + 200, 360, 640)
            self.release(ux * v, uy * v, 40, fi)
            self.add_fx("text", fi, text="传球", small=True)
        else:
            self.release(fi.fx * 430, fi.fy * 430, 50, fi)
        self.sound("hit")
        self.note(fi, "kick")

    def aim_goal(self, fi, err=0.0):
        gx = goal_x(fi.team)
        k = self.keepers[1 if fi.team == 0 else 0]
        ty = GMID + (52 if k["y"] < GMID else -52) + random.uniform(-err, err)
        return gx, TD.clamp(ty, GY0 + 8, GY1 - 8)

    def shoot(self, fi, power):
        gx, gy = self.aim_goal(fi, 40 * (1 - power) + 18)
        ux, uy = HB.norm(gx - fi.a.x, gy - fi.a.y)
        if ux * fi.fx + uy * fi.fy < -0.1:
            ux, uy = fi.fx, fi.fy                    # facing away from goal: it goes where you face
        v = 520 + 560 * power
        self.release(ux * v, uy * v, 60 + 120 * power, fi)
        self.ball["trail"] = 0.6 * power
        FA.burst(self, "dust", self.ball["x"], self.ball["y"], 2, n=8, col="#e8f0d8", col2="#bfdc9a", spd=160,
                 ang=math.degrees(math.atan2(-uy, -ux)), spread=80, g=0, dur=0.4, size=4, side=False)
        if power > 0.6:
            self.add_fx("text", fi, text="射门！", small=True)
            self.shake = 0.2
        self.sound("hit2" if power > 0.5 else "hit")
        self.note(fi, "kick")
        self.note(fi, "shot_big" if power > 0.5 else "shot")

    # ---- skills ------------------------------------------------------------------------------------------------
    def use_skill(self, fi):
        sk = HG.SKILLS["soccer"][fi.char][0]
        name = sk["key"]
        has = self.ball["own"] == fi.uid
        if name in ("cannon", "longball", "curve") and not has:
            self.tell(fi, "要带着球才能用")
            return
        b = self.ball
        if name == "dribble":
            fi.glue = 1.5
            if b["own"] is None and TD.dist(b["x"], b["y"], fi.a.x, fi.a.y) < 70 and b["z"] < 40:
                b["own"] = fi.uid
                b["last"] = fi.uid
        elif name == "cannon":
            gx, gy = self.aim_goal(fi, 10)
            ux, uy = HB.norm(gx - fi.a.x, gy - fi.a.y)
            self.release(ux * 1250, uy * 1250, 40, fi)
            b["cannon"] = True
            b["trail"] = 1.2
            self.shake = 0.5
            FA.burst(self, "spark", b["x"], b["y"], 10, n=18, col="#ffcf3a", col2="#ff6a3a", spd=360,
                     ang=math.degrees(math.atan2(-uy, -ux)), spread=60, g=0, dur=0.5, size=4, side=False)
            self.sound("boom")
        elif name == "longball":
            m = self.mate_of(fi)
            if m is not None:
                tx, ty = m.a.x + (60 if m.team == 0 else -60), m.a.y
            else:
                gx = goal_x(fi.team)
                tx, ty = gx + (-150 if fi.team == 0 else 150), GMID + random.uniform(-40, 40)
            d = TD.dist(tx, ty, fi.a.x, fi.a.y)
            t = max(0.5, d / 420.0)
            ux, uy = HB.norm(tx - fi.a.x, ty - fi.a.y)
            self.release(ux * d / t / math.exp(-0.15 * t / 2), uy * d / t / math.exp(-0.15 * t / 2), 0.5 * BG * t, fi)
            b["trail"] = 0.8
        elif name == "curve":
            gx, gy = self.aim_goal(fi, 6)
            ux, uy = HB.norm(gx - fi.a.x, gy - fi.a.y)
            side = 1 if gy > GMID else -1
            if fi.team == 1:
                side = -side
            a = -side * 0.55
            ca, sa = math.cos(a), math.sin(a)
            vx, vy = (ux * ca - uy * sa) * 760, (ux * sa + uy * ca) * 760
            self.release(vx, vy, 60, fi)
            b["spin"], b["spin_t"] = side * 1.25, 0.85
            b["trail"] = 0.9
        elif name == "feint":
            for o in self.enemies(fi):
                if o.alive() and TD.dist(o.a.x, o.a.y, fi.a.x, fi.a.y) < 170 and not PL.block(self, o):
                    self.start(o, "dizzy", 1.0)
                    self.add_fx("stars", o)
            self.add_fx("ringz", None, x=fi.a.x, y=fi.a.y, z=10, r=170, col=HG.CHARS[fi.char]["color"], dur=0.4)
        fi.cds["k"] = sk["cd"]
        self.start(fi, "skill", 0.3)
        fi.data["sk"] = name
        self.skill_banner(fi, sk)

    # ---- pals --------------------------------------------------------------------------------------------------
    def pal_act(self, fi, name, px, py, pz):
        if name == "兔兔":
            if fi.st in ("down", "dizzy", "stun"):
                self.start(fi, "idle", 0)
                fi.inv = 0.5
                FA.burst(self, "glow", fi.a.x, fi.a.y, 40, n=10, col="#ff8fb0", col2="#ffffff", spd=90, ang=90,
                         spread=120, g=-120, dur=0.8, size=4, side=False)
                return True
            fi.pal_cd = 0.3
            return False
        return None

    def pal_land(self, own, o, kind, x, y, z):
        if kind == "fire" and not PL.block(self, o):
            self.start(o, "down", 0.5)
            o.flash = 0.1
            FA.burst(self, "spark", o.a.x, o.a.y, 20, n=10, col="#ffcf3a", col2="#ff6a3a", spd=240, g=300, dur=0.35,
                     size=3, side=False)
            return True
        return kind == "fire"

    # ---- poses -------------------------------------------------------------------------------------------------
    def pose(self, fi):
        if fi.st == "idle" and self.ball["own"] == fi.uid and self.phase == "fight":
            moving = math.hypot(fi.vx, fi.vy) > 20
            self.tpose(fi, "run" if moving else "f_ready", "run" if moving else "stand")
            return
        if self.base_pose(fi):
            return
        st = fi.st
        if st == "kick":
            self.tpose(fi, "crouch", rig=FA.R["kick_w"])
        elif st == "kicked":
            self.tpose(fi, "kick", rig=FA.R["kick"])
        elif st == "poke":
            self.tpose(fi, "f_swat", rig=FA.R["sweep"], fu=min(1.0, fi.t / 0.28))
        elif st == "slide":
            self.tpose(fi, "belly", rig=FA.R["slide"])
        elif st == "rec":
            self.tpose(fi, "crouch", rig=FA.R["crouch"])
        elif st == "skill":
            self.tpose(fi, "kick", rig=FA.R["kick"])
        else:
            self.tpose(fi, "stand")

    # ---- the end -----------------------------------------------------------------------------------------------
    def check_end(self):
        if self.train is not None or self.phase != "fight":
            return
        need = max(1, self.kos_to_win)
        win = [t for t in (0, 1) if self.goals.get(t, 0) >= need]
        if win and self.pause <= 1.0:
            self.end_match(win)
        elif self.clock >= self.limit and self.pause <= 0:
            if self.goals[0] == self.goals[1]:
                self.end_match([])
            else:
                self.end_match([0 if self.goals[0] > self.goals[1] else 1])

    def end_match(self, win):
        score = "%d : %d" % (self.goals[0], self.goals[1])
        text = "平局！%s" % score if not win else "%s 赢了！%s" % (HB.TEAM_NAMES.get(win[0], ""), score)
        self.finish_with(win, text)
        best = max(self.fighters, key=lambda f: f.score)
        if best.score > 0:
            self.result["rank"] = "进球最多：%s（%d 球）" % (best.a.name, best.score)

    # ---- network -----------------------------------------------------------------------------------------------
    def net_extra(self):
        b = self.ball
        return {"ball": {"x": round(b["x"], 1), "y": round(b["y"], 1), "z": round(b["z"], 1), "own": b["own"],
                         "rot": round(b["rot"], 2), "trail": round(b["trail"], 2), "cannon": b["cannon"],
                         "vx": round(b["vx"]), "vy": round(b["vy"])},
                "keepers": {str(k): {"x": round(v["x"]), "y": round(v["y"], 1), "st": v["st"], "stun": round(v["stun"], 1)}
                            for k, v in self.keepers.items()},
                "goals": {str(k): v for k, v in self.goals.items()}, "pause": round(self.pause, 2),
                "freeze": round(self.freeze, 2)}

    def fighter_extra(self, fi):
        return {"cds": {"k": round(fi.cds["k"], 1)}, "charge": round(fi.charge, 2), "glue": round(fi.glue, 1),
                "sprint": round(fi.sprint, 1)}

    # ---- tutorial ----------------------------------------------------------------------------------------------
    def train_prepare(self, key, me):
        if me is None:
            return
        mate = next((f for f in self.fighters if f is not me), None)
        b = self.ball
        if key == "tackle" and mate is not None:
            self.ball = self.new_ball(mate.a.x + 20, mate.a.y)
            self.ball["own"] = mate.uid
        elif key in ("touch", "pass", "shoot", "skill") and b["own"] is None and \
                TD.dist(b["x"], b["y"], me.a.x, me.a.y) > 300:
            self.ball = self.new_ball(me.a.x + 70, me.a.y)

    def step_train(self, dt):
        super().step_train(dt)
        tr = self.train
        if tr is None or tr["i"] >= len(self.TRAIN_STEPS):
            return
        b = self.ball
        me = self.trainee()
        key = self.TRAIN_STEPS[tr["i"]][0]
        # a ball that is sitting still far away comes back
        if me is not None and b["own"] is None and math.hypot(b["vx"], b["vy"]) < 20 and \
                TD.dist(b["x"], b["y"], me.a.x, me.a.y) > 420 and key != "header":
            self.ball = self.new_ball(me.a.x + 60 * (1 if me.a.x < 1000 else -1), me.a.y)

    def make_ai(self, fi):
        return SoccerTrainAI(self, fi) if self.train is not None else SoccerAI(self, fi)


SoccerBattle.TRAIN_STEPS = [
    ("touch", "跑到球那里：碰到球就会自动带着球跑", "WASD", "dribble", "带球"),
    ("pass", "带着球点一下 J：把球踢出去（有队友时就是传给他）", "J", "kick", "踢球"),
    ("shoot", "带球到对面球门前，按住 J 蓄力，松开大力射门！（射角落，门将扑不到）", "按住 J", "goal", "射门"),
    ("tackle", "陪练带着球：跑过去按 L 铲球，把球铲下来", "L", "tackle_win", "铲球"),
    ("header", "陪练会把球高高地挑给你：球飞到头顶时按空格跳起来，顶向球门", "空格", "header", "头球"),
    ("skill", "按 K：技能「{k}」——{desc}", "K", "skill", "技能"),
]


# ======================================================================================================== AI
class SoccerAI:
    def __init__(self, b, fi):
        self.b = b
        self.fi = fi
        self.lv = TD.level_of(fi, b)
        self.steer = TD.Steer(b, fi)
        self.think = 0.0
        self.hold = 0.0
        self.plan = None
        self.side = random.choice((-1, 1))

    def step(self, dt):
        b, fi = self.b, self.fi
        TD.clear_inputs(fi)
        inp = fi.inp
        lv = self.lv
        if b.pause > 0 or b.freeze > 0:
            return
        if self.hold > 0:
            self.hold -= dt
            if fi.st == "kick" and self.hold > 0:
                inp["held"] = {"atk"}
                gx, gy = b.aim_goal(fi)
                ux, uy = HB.norm(gx - fi.a.x, gy - fi.a.y)
                inp["dx"], inp["dy"] = ux * 0.3, uy * 0.3
            return
        if not fi.alive() or fi.st not in ("idle", "jump"):
            return
        ball = b.ball
        own = b.owner()
        mates = [o for o in b.fighters if o.team == fi.team]
        dball = TD.dist(ball["x"], ball["y"], fi.a.x, fi.a.y)
        chaser = min(mates, key=lambda o: TD.dist(ball["x"], ball["y"], o.a.x, o.a.y)) is fi
        gx = goal_x(fi.team)
        ogx = own_goal_x(fi.team)
        if own is fi:
            dgoal = abs(gx - fi.a.x)
            name = HG.SKILLS["soccer"][fi.char][0]["key"]
            if fi.cds["k"] <= 0 and random.random() < lv["skill"] * dt * 3:
                if (name in ("cannon", "curve") and dgoal < 460) or (name == "longball" and dgoal > 600) or \
                        (name == "dribble" and self.enemy_near(110)) or (name == "feint" and self.enemy_near(120)):
                    inp["pressed"].add("skill")
                    return
            if dgoal < 300 + 120 * lv["smart"] and abs(fi.a.y - GMID) < 170:
                gy = b.aim_goal(fi)[1]
                b.face_to(fi, gx, gy)
                inp["pressed"].add("atk")
                inp["held"] = {"atk"}
                self.hold = TD.clamp(0.35 + dgoal / 700, 0.4, 1.0) + random.uniform(-0.1, 0.1) * (1 - lv["smart"])
                return
            m = b.mate_of(fi)
            if m is not None and random.random() < 0.6 * dt and abs(gx - m.a.x) < abs(gx - fi.a.x) - 120 and \
                    not self.enemy_near(80, m):
                b.face_to(fi, m.a.x, m.a.y)
                inp["pressed"].add("atk")
                return
            # dribble on, around whoever is in the way
            tx, ty = gx - (1 if fi.team == 0 else -1) * 120, GMID + self.side * 40
            e = self.enemy_near(110)
            if e is not None:
                ux, uy = HB.norm(tx - fi.a.x, ty - fi.a.y)
                px, py = -uy, ux                       # sideways, on the side away from the defender
                if px * (e.a.x - fi.a.x) + py * (e.a.y - fi.a.y) > 0:
                    px, py = -px, -py
                tx, ty = fi.a.x + ux * 80 + px * 70, fi.a.y + uy * 80 + py * 70
                if fi.cd["sprint"] <= 0 and random.random() < lv["smart"] * 0.3:
                    inp["pressed"].add("throw")
            self.steer.go(tx, ty, dt, stop=4)
            return
        if own is not None and own.team != fi.team:
            if chaser or TD.dist(own.a.x, own.a.y, fi.a.x, fi.a.y) < 160:
                d = TD.dist(own.a.x, own.a.y, fi.a.x, fi.a.y)
                if d < 46 and random.random() < dt * 4 * lv["smart"]:
                    inp["pressed"].add("atk")
                elif d < 110 and fi.cd["slide"] <= 0 and random.random() < dt * 2.5 * lv["smart"]:
                    b.face_to(fi, own.a.x + own.vx * 0.15, own.a.y + own.vy * 0.15)
                    ux, uy = HB.norm(own.a.x - fi.a.x, own.a.y - fi.a.y)
                    inp["dx"], inp["dy"] = ux, uy
                    inp["pressed"].add("guard")
                elif HG.SKILLS["soccer"][fi.char][0]["key"] == "feint" and d < 120 and fi.cds["k"] <= 0 and \
                        random.random() < lv["skill"] * dt * 3:
                    inp["pressed"].add("skill")
                else:
                    self.steer.go(own.a.x + own.vx * 0.2, own.a.y + own.vy * 0.2, dt, stop=4)
            else:
                self.defend_spot(dt, ogx)
            return
        # a loose ball
        if chaser or dball < 120:
            px, py = ball["x"] + ball["vx"] * 0.25, ball["y"] + ball["vy"] * 0.25
            if ball["z"] > 30 and dball < 70 and ball["vz"] < 0 and fi.st == "idle" and \
                    random.random() < lv["smart"]:
                inp["pressed"].add("jump")
            # come at it from behind, so the dribble faces the goal
            back = -1 if fi.team == 0 else 1
            if dball > 40:
                px += back * 16
            self.steer.go(px, py, dt, stop=2)
        else:
            if fi.team == 0 and ball["x"] > 630 or fi.team == 1 and ball["x"] < 630:
                tx = ball["x"] + (1 if fi.team == 0 else -1) * 160
                self.steer.go(TD.clamp(tx, P["x0"] + 60, P["x1"] - 60), GMID + self.side * 110, dt, stop=20)
            else:
                self.defend_spot(dt, ogx)

    def defend_spot(self, dt, ogx):
        b = self.b
        ball = b.ball
        tx = ogx + (ball["x"] - ogx) * 0.45
        ty = GMID + (ball["y"] - GMID) * 0.6
        self.steer.go(tx, ty, dt, stop=16)

    def enemy_near(self, r, who=None):
        who = who or self.fi
        for o in self.b.enemies(who):
            if o.alive() and TD.dist(o.a.x, o.a.y, who.a.x, who.a.y) < r:
                return o
        return None


class SoccerTrainAI:
    """The partner: stands aside, carries the ball slowly for the tackle lesson, lobs it for the header lesson."""

    def __init__(self, b, fi):
        self.b = b
        self.fi = fi
        self.steer = TD.Steer(b, fi)
        self.t = 2.0
        self.dir = 1

    def step(self, dt):
        b, fi = self.b, self.fi
        TD.clear_inputs(fi)
        tr = b.train
        if tr is None or tr["i"] >= len(b.TRAIN_STEPS) or not fi.alive() or b.pause > 0 or b.freeze > 0:
            return
        key = b.TRAIN_STEPS[tr["i"]][0]
        me = b.trainee()
        ball = b.ball
        if key == "tackle":
            if ball["own"] == fi.uid:
                if fi.a.x > 1000:
                    self.dir = -1
                elif fi.a.x < 300:
                    self.dir = 1
                fi.inp["dx"] = 0.45 * self.dir
                return
            if ball["own"] is None and tr.get("done_t") is None:
                self.steer.go(ball["x"], ball["y"], dt, stop=2)
            return
        if key == "header" and me is not None:
            if ball["own"] == fi.uid:
                self.t -= dt
                if self.t <= 0:
                    self.t = 2.4
                    d = TD.dist(me.a.x, me.a.y, fi.a.x, fi.a.y)
                    t = max(0.9, d / 280.0)
                    ux, uy = HB.norm(me.a.x - fi.a.x, me.a.y - fi.a.y)
                    k = math.exp(-0.15 * t / 2)            # the air drag on the way
                    b.release(ux * d / t / k, uy * d / t / k, (0.5 * BG * t * t + 46) / t, fi)
                    fi.kick_cd = 1.5
                return
            if ball["own"] is None and math.hypot(ball["vx"], ball["vy"]) < 60 and ball["z"] < 2:
                b.ball = b.new_ball(fi.a.x + 16, fi.a.y)
                b.ball["own"] = fi.uid
            if ball["own"] == me.uid:
                b.ball = b.new_ball(fi.a.x + 16, fi.a.y)
                b.ball["own"] = fi.uid
            return
        # otherwise: out of the way
        self.steer.go(700, 410, dt, stop=10)
