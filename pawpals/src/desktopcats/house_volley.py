"""猫咪排球 (at the 沙滩排球场): side-view beach volleyball with a big yarn ball.

Red plays on the left, blue on the right of the net. A / D run, Space jumps, J hits the ball when it is in reach (a
press a moment early counts): on the ground it is a bump (up to your team-mate near the net, or over the net), in the
air near the net it is a spike, elsewhere in the air a lob over. L dives for a ball that is about to land, E (or J)
serves. A ball that touches the sand is a point for the other side; the side that won the point serves. K is each
character's own trick. First to the agreed number of points wins.
"""
import math
import random

from . import house_art as H
from . import house_battle as HB
from . import house_brawl as HBR
from . import house_fanim as FA
from . import house_games as HG
from . import house_pals as PL
from . import house_side as SD

LANE = 36
NET_X, NET_H = 630.0, 118.0
XMIN, XMAX = 40.0, 1220.0
STAGE = dict(lane=LANE, xmin=XMIN, xmax=XMAX, ground=[(XMIN, XMAX)], plats=[], solids=[(NET_X - 5, NET_X + 5, 0, NET_H)],
             spawns=[(330, 0), (190, 0), (930, 0), (1070, 0)])
SD.STAGES[24] = STAGE
GB = 760.0
BR = 13.0
RUN = {"calico": 285.0, "tabby": 250.0, "dad": 255.0, "mom": 262.0, "kid": 275.0}
JUMP = 720.0


def side_of(x):
    return 0 if x < NET_X else 1


def dir_of(team):
    return 1 if team % 2 == 0 else -1


def lob_to(x0, z0, x1, apex):
    """vx, vz to fly from (x0, z0) up to height apex and come down through (x1, z0)."""
    apex = max(apex, z0 + 30)
    vz = math.sqrt(2 * GB * (apex - z0))
    t_up = vz / GB
    t_dn = math.sqrt(2 * (apex - max(BR, z0 * 0.4)) / GB)
    t = t_up + t_dn
    return (x1 - x0) / t, vz


class VolleyBattle(HB.Battle):
    GAME = "volley"
    TRAIN_DONE = "训练完成！可以打排球比赛啦 🏐"
    TOP = False

    def setup(self):
        self.stage = SD.Stage(STAGE)
        self.limit = 600.0 if self.mode != "train" else 1e9
        self.projs = []
        self.obst = []
        if self.mode == "train":
            for fi in self.fighters:
                fi.team = 0                        # the partner is on your side (it sets the ball for you)
        self.points = {0: 0, 1: 0}
        self.ball = {"x": 300.0, "z": 200.0, "vx": 0.0, "vz": 0.0, "last": None, "team": None, "kind": "", "rot": 0.0,
                     "touch": 0, "held": None, "trail": 0.0}
        self.vstate = "serve"
        self.vtimer = 0.0
        self.serve_team = random.choice((0, 1)) if self.mode != "train" else 0
        self.serve_idx = {0: 0, 1: 0}
        self.server = None
        for fi in self.fighters:
            HBR.setup_side_fighter(fi, self.stage)
            fi.maxhp = 100
            fi.hp = 100.0
            fi.cds = {"k": 0.0}
            fi.hit_q = 0.0
            fi.touch_cd = 0.0
            fi.smash = fi.dink = fi.power = fi.block = 0.0
            fi.spikes = 0

    def spawn_point(self, fi):
        team = fi.team % 2
        same = [f for f in self.fighters if f.team == fi.team]
        k = same.index(fi) if fi in same else 0
        xs = (330, 190) if team == 0 else (930, 1070)
        return xs[k % 2], LANE, 0

    def place_all(self):
        for fi in self.fighters:
            x, y, z = self.spawn_point(fi)
            a = fi.a
            a.f, a.x, a.y, a.h = self.f, x, y, 0.0
            fi.z, fi.vx, fi.vz, fi.ground = 0.0, 0.0, 0.0, True
            fi.face = dir_of(fi.team)
            fi.st, fi.t = "idle", 0.0
        self.setup_serve()

    def begin(self):
        super().begin()
        for fi in self.fighters:
            a = fi.a
            if a.path and a.path[0].get("t") == "travel":
                x, y, z = self.spawn_point(fi)
                a.path[0]["x"], a.path[0]["y"] = x, y

    # ---- serving -----------------------------------------------------------------------------------------------
    def setup_serve(self):
        team = self.serve_team
        mates = [f for f in self.fighters if f.team % 2 == team]
        if self.train is not None:
            me = self.trainee()
            mates = [me] if me is not None else mates
        if not mates:
            mates = list(self.fighters)
        srv = mates[self.serve_idx[team] % len(mates)]
        self.server = srv.uid
        for fi in self.fighters:
            t = fi.team % 2
            same = [f for f in self.fighters if f.team % 2 == t]
            if fi is srv:
                x = 110.0 if t == 0 else 1150.0
            elif t == team:
                x = 470.0 if t == 0 else 790.0
            else:
                x = (320.0, 500.0)[same.index(fi) % 2] if t == 0 else (940.0, 760.0)[same.index(fi) % 2]
                if len(same) == 1:
                    x = 360.0 if t == 0 else 900.0
            fi.x, fi.z, fi.vx, fi.vz, fi.ground = x, 0.0, 0.0, 0.0, True
            fi.face = dir_of(t)
            fi.smash = fi.dink = fi.power = fi.block = 0.0
            if fi.st not in ("over",):
                self.start(fi, "idle", 0)
        self.ball.update(held=srv.uid, kind="", touch=0, last=srv.uid, team=team, vx=0.0, vz=0.0, trail=0.0)
        self.vstate = "serve"
        self.vtimer = 0.0

    def serve(self, fi):
        b = self.ball
        if b["held"] != fi.uid:
            return
        d = dir_of(fi.team)
        b["held"] = None
        b["x"], b["z"] = fi.x + d * 12, fi.z + fi.hgt + 18
        land = NET_X + d * random.uniform(220, 420)
        b["vx"], b["vz"] = lob_to(b["x"], b["z"], land, random.uniform(250, 300))
        b["last"], b["team"], b["touch"], b["kind"] = fi.uid, fi.team % 2, 1, ""
        fi.touch_cd = 0.4
        self.vstate = "play"
        self.start(fi, "atk", 0.3)
        fi.data["mv"] = "uj"
        FA.burst(self, "star", b["x"], LANE, b["z"], n=6, col="#ffd34c", col2="#ffffff", spd=160, g=0, dur=0.4, size=4)
        self.sound("hit")
        self.note(fi, "serve")

    # ---- the frame ---------------------------------------------------------------------------------------------
    def step_game(self, dt):
        self.control(dt)
        for fi in self.fighters:
            self.step_player(fi, dt)
            fi.inp["pressed"] = set()
        self.step_ball(dt)
        if self.train is not None:
            self.step_train(dt)
        self.step_fx(dt)
        for fi in self.fighters:
            self.pose(fi)
        if self.phase == "fight":
            self.check_end()

    def speed(self, fi):
        return RUN.get(fi.char, 260.0) * PL.speed(self, fi)

    def step_player(self, fi, dt):
        fi.t += dt
        fi.inv = max(0.0, fi.inv - dt)
        fi.flash = max(0.0, fi.flash - dt)
        fi.land_t = max(0.0, fi.land_t - dt)
        fi.cds["k"] = max(0.0, fi.cds["k"] - dt)
        for k in ("hit_q", "touch_cd", "smash", "dink", "power", "block"):
            setattr(fi, k, max(0.0, getattr(fi, k) - dt))
        inp = fi.inp
        pressed = inp["pressed"]
        dx = inp["dx"]
        mx = 1 if dx > 0.3 else (-1 if dx < -0.3 else 0)
        st = fi.st
        b = self.ball
        if self.vstate == "point" or st == "over":
            fi.vx *= 0.8
            self.phys(fi, dt)
            return
        if st in ("down", "rec"):
            fi.vx *= max(0.0, 1 - dt * 6)
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
            self.phys(fi, dt)
            return
        if b["held"] == fi.uid:
            # serving: stand still, J / E to serve
            fi.vx = 0.0
            b["x"], b["z"] = fi.x + dir_of(fi.team) * 12, fi.z + fi.hgt + 14
            self.vtimer += dt
            if "atk" in pressed or "throw" in pressed or (self.vtimer > 8.0 and not fi.ctrl.startswith("ai:")):
                self.serve(fi)
            self.phys(fi, dt)
            return
        if "atk" in pressed:
            fi.hit_q = 0.28
        if st == "dive":
            if fi.t >= fi.dur:
                self.start(fi, "rec", 0.35)
            self.try_hit(fi, dive=True)
            self.phys(fi, dt)
            return
        if "guard" in pressed and fi.ground and self.vstate == "play":
            d = mx or (1 if b["x"] > fi.x else -1)
            fi.face = d
            fi.vx = d * 540
            fi.vz, fi.ground = 170, False
            self.start(fi, "dive", 0.45)
            FA.on_dash(self, fi)
            self.sound("whoosh")
            self.note(fi, "dive")
            self.phys(fi, dt)
            return
        if "jump" in pressed and fi.ground:
            fi.vz, fi.ground = JUMP, False
            self.start(fi, "air", 0)
            FA.on_land(self, fi)
            self.note(fi, "jump")
        if "skill" in pressed:
            if fi.cds["k"] <= 0:
                self.use_skill(fi)
            else:
                self.tell(fi, "技能冷却中")
        v = self.speed(fi)
        want = mx * v
        if mx:
            fi.face = mx
        k = min(1.0, dt * (12 if fi.ground else 4))
        fi.vx += (want - fi.vx) * k
        if fi.st not in ("atk",) or fi.t >= fi.dur:
            fi.st = ("run" if abs(fi.vx) > 30 else "idle") if fi.ground else "air"
        self.try_hit(fi)
        self.phys(fi, dt)

    def phys(self, fi, dt):
        vz0 = fi.vz
        hit = self.stage.move(fi, dt, fi.hw, fi.hgt)
        # each side stays on its own half
        team = fi.team % 2
        if team == 0:
            fi.x = min(fi.x, NET_X - 8 - fi.hw)
        else:
            fi.x = max(fi.x, NET_X + 8 + fi.hw)
        if hit == "land":
            if vz0 < -300:
                fi.land_t = 0.14
                FA.on_land(self, fi, hard=vz0 < -800)
            if fi.st == "air":
                fi.st = "idle"
        a = fi.a
        a.h = fi.z
        a.y = LANE
        a.facing = fi.face

    # ---- hitting -----------------------------------------------------------------------------------------------
    def in_reach(self, fi, extra=0.0, low=False):
        b = self.ball
        if b["held"] is not None:
            return False
        dx = b["x"] - fi.x
        dz = b["z"] - fi.z
        if abs(dx) > fi.hw + 34 + extra:
            return False
        if low:
            return -20 < dz < 90
        return -14 < dz < fi.hgt + 52

    def try_hit(self, fi, dive=False):
        b = self.ball
        if self.vstate != "play" or fi.touch_cd > 0 or b["held"] is not None:
            return
        if fi.block > 0 and not fi.ground:
            dxa = abs(b["x"] - fi.x)
            if dxa < fi.hw + 40 and fi.z + fi.hgt - 14 < b["z"] < fi.z + fi.hgt + 64 and \
                    side_of(b["x"]) != fi.team % 2 or (dxa < fi.hw + 30 and abs(b["x"] - NET_X) < 60 and
                                                        fi.z + fi.hgt - 14 < b["z"] < fi.z + fi.hgt + 64):
                d = dir_of(fi.team)
                b["vx"], b["vz"] = d * 330, -140
                self.touched(fi, "block")
                self.add_fx("text", fi, text="拦网！")
                FA.burst(self, "star", b["x"], LANE, b["z"], n=10, col="#ffd34c", col2="#ffffff", spd=220, g=0,
                         dur=0.5, size=5)
                self.sound("block")
                self.note(fi, "block")
                return
        if side_of(b["x"]) != fi.team % 2 and abs(b["x"] - NET_X) > 40:
            return
        if dive:
            if self.in_reach(fi, extra=60, low=True):
                d = dir_of(fi.team)
                b["vx"], b["vz"] = d * 130 + (NET_X - b["x"]) * 0.15, 580
                self.touched(fi, "dig")
                self.add_fx("text", fi, text="救起来了！", small=True)
                self.note(fi, "dive_save")
            return
        if fi.hit_q > 0 and self.in_reach(fi):
            fi.hit_q = 0.0
            self.hit(fi)
            return
        # the ball bumps off you by itself (gently) when you don't swing
        if b["vz"] < 0 and self.in_reach(fi, extra=-14) and fi.hit_q <= 0 and \
                (not fi.ctrl.startswith("ai:") or random.random() < 0.15):
            d = dir_of(fi.team)
            b["vx"], b["vz"] = d * 90 + (NET_X - d * 140 - b["x"]) * 0.25, 470
            self.touched(fi, "auto")

    def hit(self, fi):
        b = self.ball
        d = dir_of(fi.team)
        team = fi.team % 2
        mate = next((o for o in self.fighters if o is not fi and o.team % 2 == team and o.alive()), None)
        ground = fi.ground or fi.z < 12
        kind = "bump"
        if fi.dink > 0:
            fi.dink = 0.0
            b["vx"], b["vz"] = lob_to(b["x"], b["z"], NET_X + d * 85, max(NET_H + 70, b["z"] + 40))
            kind = "dink"
            self.add_fx("text", fi, text="吊球～", small=True)
        elif not ground and b["z"] > NET_H - 12 and abs(b["x"] - NET_X) < 340:
            sp = 600.0 * (1.35 if fi.power > 0 else 1.0)
            if fi.smash > 0:
                sp *= 1.55
            vx, vz = d * sp * 0.82, -sp * 0.42
            # make sure it clears the net
            for _ in range(8):
                t = abs(NET_X - b["x"]) / max(1.0, abs(vx))
                if b["z"] + vz * t - 0.5 * GB * t * t > NET_H + BR + 4:
                    break
                vz += 90
            b["vx"], b["vz"] = vx, vz
            kind = "smash" if fi.smash > 0 else "spike"
            fi.smash = 0.0
            fi.power = 0.0
            self.shake = 0.35 if kind == "spike" else 0.7
            self.add_fx("text", fi, text="扣杀！" if kind == "spike" else "重炮扣杀！")
            FA.burst(self, "spark", b["x"], LANE, b["z"], n=16, col="#ffffff", col2=HG.CHARS[fi.char]["color"], spd=360,
                     ang=-40 if d > 0 else 220, spread=80, g=0, dur=0.4, size=3.5)
            b["trail"] = 0.8
            self.sound("hit2")
            self.note(fi, "spike")
            fi.spikes += 1
        elif not ground:
            b["vx"], b["vz"] = lob_to(b["x"], b["z"], NET_X + d * random.uniform(160, 380), max(NET_H + 120, b["z"] + 60))
            kind = "air"
        else:
            if mate is not None and b["touch"] < 2 and side_of(b["x"]) == team and \
                    abs(mate.x - NET_X) < abs(fi.x - NET_X):
                b["vx"], b["vz"] = lob_to(b["x"], b["z"], NET_X - d * 100, 270)
                kind = "set"
            else:
                b["vx"], b["vz"] = lob_to(b["x"], b["z"], NET_X + d * random.uniform(180, 430), 290)
            self.note(fi, "bump")
        if b.get("kind") == "smash" and b["team"] is not None and b["team"] != team and kind not in ("spike", "smash"):
            # receiving a 重炮扣杀: it knocks you over and the ball only pops up a little
            b["vx"], b["vz"] = d * 60, 320
            self.start(fi, "down", 0.8)
            fi.vz = 200
            FA.on_hit(self, None, fi, 12, heavy=True)
            self.add_fx("text", fi, text="好重！", small=True)
        else:
            self.start(fi, "atk", 0.3)
            fi.data["mv"] = {"spike": "aj3", "smash": "aj3", "air": "aj1", "dink": "j1"}.get(kind, "uj")
        self.touched(fi, kind)
        if kind not in ("spike", "smash"):
            self.sound("hit")

    def touched(self, fi, kind):
        b = self.ball
        team = fi.team % 2
        if b["team"] != team:
            b["touch"] = 0
        b["touch"] += 1
        b["team"] = team
        b["last"] = fi.uid
        b["kind"] = kind if kind in ("smash",) else ""
        fi.touch_cd = 0.25
        if kind not in ("spike", "smash"):
            b["trail"] = 0.0
        self.note(fi, "touch", kind=kind)
        FA.burst(self, "glow", b["x"], LANE, b["z"], n=5, col="#ffffff", spd=100, g=0, dur=0.3, size=3)

    # ---- the ball ----------------------------------------------------------------------------------------------
    def step_ball(self, dt):
        b = self.ball
        b["trail"] = max(0.0, b["trail"] - dt)
        if b["held"] is not None or self.vstate == "serve":
            return
        if self.vstate == "point":
            self.vtimer -= dt
            if b["z"] > BR:
                b["vz"] -= GB * dt
                b["z"] = max(BR, b["z"] + b["vz"] * dt)
                b["x"] += b["vx"] * dt * 0.5
            if self.vtimer <= 0:
                if self.train is not None:
                    self.train_feed()
                else:
                    self.setup_serve()
            return
        px = b["x"]
        b["vz"] -= GB * dt
        b["x"] += b["vx"] * dt
        b["z"] += b["vz"] * dt
        b["rot"] += b["vx"] * dt * 0.05
        # the net
        crossed = (px - NET_X) * (b["x"] - NET_X) <= 0
        if crossed and b["z"] < NET_H + BR * 0.4:
            if b["z"] > NET_H - 10:
                # the net cord: it trickles over (or falls back)
                b["vz"] = abs(b["vz"]) * 0.4 + 90
                b["vx"] *= 0.35
                self.add_fx("text", None, x=NET_X, y=LANE, z=NET_H + 30, text="擦网！", small=True)
            else:
                b["x"] = px
                b["vx"] = -b["vx"] * 0.45
                self.sound("block")
        elif crossed:
            b["touch"] = 0
        # the walls
        if b["x"] < XMIN + BR:
            b["x"], b["vx"] = XMIN + BR, abs(b["vx"]) * 0.75
        elif b["x"] > XMAX - BR:
            b["x"], b["vx"] = XMAX - BR, -abs(b["vx"]) * 0.75
        # avocado's bubble saves a ball about to land
        if b["vz"] < 0 and b["z"] < 60:
            for fi in self.fighters:
                if getattr(fi, "pal_shield", False) and side_of(b["x"]) == fi.team % 2 and abs(fi.x - b["x"]) < 220:
                    fi.pal_shield = False
                    b["vz"] = 520
                    b["vx"] = dir_of(fi.team) * 80 + (NET_X - dir_of(fi.team) * 150 - b["x"]) * 0.2
                    FA.burst(self, "drop", b["x"], LANE, b["z"], n=14, col="#c8f0ff", col2="#ffffff", spd=240, g=300,
                             dur=0.5, size=3)
                    self.add_fx("text", fi, text="🦆 泡泡救球！", small=True)
                    break
        if b["z"] <= BR:
            b["z"] = BR
            self.rally_over(side_of(b["x"]))

    def rally_over(self, landed_side):
        b = self.ball
        if self.train is not None:
            self.vstate, self.vtimer = "point", 0.9
            FA.burst(self, "dust", b["x"], LANE, 4, n=10, col="#e8d4a6", col2="#d9bf86", spd=180, g=0, dur=0.5, size=5)
            return
        win = 1 - landed_side
        self.points[win] += 1
        last = next((f for f in self.fighters if f.uid == b["last"]), None)
        if last is not None and last.team % 2 == win:
            last.score += 1
            if b.get("trail", 0) > 0 or b.get("kind") == "smash":
                self.note(last, "spike_point")
        FA.burst(self, "dust", b["x"], LANE, 4, n=16, col="#e8d4a6", col2="#d9bf86", spd=260, g=0, dur=0.6, size=6)
        FA.burst(self, "star", b["x"], LANE, 30, n=10, col=HB.TEAM_COLORS[win], col2="#ffffff", spd=240, g=300,
                 dur=0.8, size=5)
        self.say_banner("%s 得分！%d : %d" % (HB.TEAM_NAMES[win], self.points[0], self.points[1]), 1.6)
        self.sound("boom")
        self.w.sfx("chime", 1)
        if self.serve_team != win:
            self.serve_team = win
            self.serve_idx[win] += 1
        self.vstate, self.vtimer = "point", 1.7
        b["vx"] *= 0.2
        b["vz"] = 0.0
        for fi in self.fighters:
            if fi.team % 2 == win and random.random() < 0.5:
                fi.a.say("好球！" if not fi.a.is_cat else "喵！", 1.2)

    # ---- skills ------------------------------------------------------------------------------------------------
    def use_skill(self, fi):
        sk = HG.SKILLS["volley"][fi.char][0]
        name = sk["key"]
        b = self.ball
        if name == "highjump":
            if not fi.ground:
                self.tell(fi, "站在地上才能用")
                return
            fi.vz, fi.ground = 990.0, False
            fi.power = 2.0
            self.start(fi, "air", 0)
            self.add_fx("ring2", fi, z=fi.z, r=40)
        elif name == "smash":
            fi.smash = 6.0
        elif name == "wall":
            if fi.ground:
                fi.vz, fi.ground = 780.0, False
                self.start(fi, "air", 0)
            fi.block = 1.1
        elif name == "set":
            if b["held"] is not None or abs(b["x"] - fi.x) > 180 or side_of(b["x"]) != fi.team % 2 or \
                    self.vstate != "play":
                self.tell(fi, "球在身边才能托")
                return
            d = dir_of(fi.team)
            b["vx"], b["vz"] = lob_to(b["x"], b["z"], NET_X - d * 80, 280)
            self.touched(fi, "set")
            FA.burst(self, "glow", b["x"], LANE, b["z"], n=12, col="#e4639b", col2="#ffffff", spd=160, g=0, dur=0.6,
                     size=4)
        elif name == "dink":
            fi.dink = 6.0
        fi.cds["k"] = sk["cd"]
        self.add_fx("skillname", fi, text=sk["icon"] + " " + sk["name"], color=HG.CHARS[fi.char]["color"])
        FA.burst(self, "glow", fi.x, LANE, fi.z + fi.hgt * 0.5, n=10, col=HG.CHARS[fi.char]["color"], col2="#ffffff",
                 spd=160, g=0, dur=0.5, size=4)
        self.sound("whoosh")
        self.note(fi, "skill")

    # ---- pals --------------------------------------------------------------------------------------------------
    def pal_act(self, fi, name, px, py, pz):
        if name == "兔兔":
            if fi.st in ("down", "rec"):
                self.start(fi, "idle", 0)
                FA.burst(self, "glow", fi.x, LANE, fi.z + 40, n=10, col="#ff8fb0", col2="#ffffff", spd=90, ang=90,
                         spread=120, g=-120, dur=0.8, size=4)
                return True
            b = self.ball
            if self.vstate == "play" and b["vz"] < 0 and b["z"] < 90 and side_of(b["x"]) == fi.team % 2 and \
                    abs(b["x"] - fi.x) < 120:
                b["vz"] = 480
                b["vx"] = dir_of(fi.team) * 80
                self.add_fx("text", fi, text="🐰 帮你垫了一下", small=True)
                return True
            fi.pal_cd = 0.15
            return False
        if name == "avocado":
            if fi.pal_shield:
                fi.pal_cd = 1.0
                return False
            fi.pal_shield = True
            return True
        return None

    def pal_land(self, own, o, kind, x, y, z):
        if kind == "fire":
            if not PL.block(self, o):
                self.start(o, "down", 0.5)
                o.flash = 0.1
            return True
        return False

    # ---- poses -------------------------------------------------------------------------------------------------
    def pose(self, fi):
        a = fi.a
        a.h = fi.z
        a.facing = fi.face
        a.hidden = False
        st = fi.st
        if st == "dive":
            fi.st = "slide"
            FA.animate(self, fi)
            fi.st = "dive"
        elif st == "rec":
            fi.st = "getup"
            fi.data.setdefault("gu", 0)
            FA.animate(self, fi)
            fi.st = "rec"
        elif fi.block > 0 and not fi.ground:
            fi.st = "block"
            FA.animate(self, fi)
            fi.st = st
        else:
            FA.animate(self, fi)

    # ---- the end -----------------------------------------------------------------------------------------------
    def check_end(self):
        if self.train is not None:
            return
        need = max(1, self.kos_to_win)
        win = [t for t in (0, 1) if self.points[t] >= need]
        if win and self.vstate == "point" and self.vtimer < 1.0:
            self.end_match(win)
        elif self.clock >= self.limit and self.vstate != "play":
            if self.points[0] == self.points[1]:
                self.end_match([])
            else:
                self.end_match([0 if self.points[0] > self.points[1] else 1])

    def end_match(self, win):
        score = "%d : %d" % (self.points[0], self.points[1])
        text = "平局！%s" % score if not win else "%s 赢了！%s" % (HB.TEAM_NAMES.get(win[0], ""), score)
        self.finish(win)
        self.result["text"] = text
        self.say_banner(text, 30)
        best = max(self.fighters, key=lambda f: f.spikes)
        if best.spikes:
            self.result["rank"] = "扣杀最多：%s（%d 次）" % (best.a.name, best.spikes)

    # ---- network -----------------------------------------------------------------------------------------------
    def net_extra(self):
        b = self.ball
        return {"ball": {"x": round(b["x"], 1), "z": round(b["z"], 1), "rot": round(b["rot"], 2), "held": b["held"],
                         "trail": round(b["trail"], 2), "kind": b["kind"], "vx": round(b["vx"]), "vz": round(b["vz"])},
                "points": {str(k): v for k, v in self.points.items()}, "vstate": self.vstate, "server": self.server}

    def fighter_extra(self, fi):
        return {"cds": {"k": round(fi.cds["k"], 1)}, "face": fi.face, "hgt": fi.hgt, "smash": round(fi.smash, 1),
                "dink": round(fi.dink, 1), "power": round(fi.power, 1), "block": round(fi.block, 1),
                "hidden": False, "z": round(fi.z, 1)}

    # ---- tutorial ----------------------------------------------------------------------------------------------
    def train_feed(self):
        """Put the ball in play the way the current lesson wants it."""
        tr = self.train
        me = self.trainee()
        b = self.ball
        if tr is None or me is None or tr["i"] >= len(self.TRAIN_STEPS):
            return
        key = self.TRAIN_STEPS[tr["i"]][0]
        mate = next((f for f in self.fighters if f is not me), None)
        b.update(held=None, kind="", touch=0, team=None, trail=0.0)
        self.vstate = "play"
        if key == "serve":
            self.serve_team = 0
            self.setup_serve()
            return
        if key == "spike" and mate is not None:
            mate.x = 420.0
            b["x"], b["z"] = mate.x, mate.z + mate.hgt + 30
            b["vx"], b["vz"] = lob_to(b["x"], b["z"], NET_X - 70, 300)
            b["vx"] *= 0.6
            b["last"] = mate.uid
            return
        if key == "dive":
            tx = me.x + (190 if me.x < 330 else -190)
            b["x"], b["z"] = NET_X - 20, 260
            b["vx"], b["vz"] = lob_to(b["x"], b["z"], max(80.0, min(NET_X - 40, tx)), 300)
            return
        # move / bump / skill: a gentle ball from above, a little way off
        tx = me.x + random.choice((-1, 1)) * random.uniform(110, 170)
        b["x"], b["z"] = max(90.0, min(NET_X - 60, tx)), 420
        b["vx"], b["vz"] = 0.0, 0.0

    def train_prepare(self, key, me):
        self.vstate, self.vtimer = "point", 0.5
        self.ball["held"] = None

    def step_train(self, dt):
        super().step_train(dt)
        tr = self.train
        if tr is None or tr["i"] >= len(self.TRAIN_STEPS) or tr.get("done_t") is not None:
            return
        me = self.trainee()
        b = self.ball
        if me is not None and self.TRAIN_STEPS[tr["i"]][0] == "move" and abs(b["x"] - me.x) < 34 and b["z"] < 200:
            self.note(me, "under")
        if self.vstate == "play" and b["held"] is None and side_of(b["x"]) == 1 and b["vx"] > 0:
            # over the net: the lesson's ball is done, a new one comes
            if b["z"] < 120:
                self.vstate, self.vtimer = "point", 0.6

    def make_ai(self, fi):
        return VolleyTrainAI(self, fi) if self.train is not None else VolleyAI(self, fi)


VolleyBattle.TRAIN_STEPS = [
    ("move", "球从天上掉下来了：用 A / D 跑到球的下面", "A / D", "under", "跑位"),
    ("bump", "球落到身边时按 J 垫球，把球往上垫起来", "J", "bump", "垫球"),
    ("serve", "轮到你发球了：按 J（或 E）发球过网", "J", "serve", "发球"),
    ("spike", "队友把球托到网前：跑到网前，按空格起跳，在空中按 J 扣杀！", "空格 → J", "spike", "扣杀"),
    ("dive", "球落得远，跑不过去：按 L 鱼跃扑救", "L", "dive_save", "扑救"),
    ("skill", "按 K：技能「{k}」——{desc}", "K", "skill", "技能"),
]


# ======================================================================================================== AI
def predict(b, h, tmax=3.0, step=1 / 60.0):
    """Where the ball will be (x, time) when it comes down through height h (None if it won't within tmax)."""
    x, z, vx, vz = b["x"], b["z"], b["vx"], b["vz"]
    t = 0.0
    while t < tmax:
        vz -= GB * step
        px = x
        x += vx * step
        z += vz * step
        if (px - NET_X) * (x - NET_X) <= 0 and z < NET_H:
            vx = -vx * 0.45
            x = px
        if x < XMIN + BR:
            x, vx = XMIN + BR, abs(vx) * 0.75
        elif x > XMAX - BR:
            x, vx = XMAX - BR, -abs(vx) * 0.75
        t += step
        if vz < 0 and z <= h:
            return x, t
    return None


class VolleyAI:
    LV = {"easy": dict(err=70.0, react=0.45, spike=0.35, jump_err=0.12, skill=0.3, dive=0.3),
          "normal": dict(err=32.0, react=0.25, spike=0.7, jump_err=0.06, skill=0.6, dive=0.6),
          "hard": dict(err=12.0, react=0.12, spike=0.92, jump_err=0.025, skill=0.85, dive=0.9)}

    def __init__(self, b, fi):
        self.b = b
        self.fi = fi
        lv = fi.ctrl[3:] if str(fi.ctrl).startswith("ai:") else b.diff
        self.lv = self.LV.get(lv, self.LV["normal"])
        self.think = 0.0
        self.target = None
        self.noise = 0.0
        self.serve_wait = random.uniform(0.9, 1.6)

    def step(self, dt):
        b, fi = self.b, self.fi
        inp = fi.inp
        inp["dx"] = 0.0
        inp["held"] = set()
        if fi.st in ("down", "rec", "dive", "over") or b.vstate == "point":
            return
        ball = b.ball
        team = fi.team % 2
        d = dir_of(team)
        if ball["held"] == fi.uid:
            self.serve_wait -= dt
            if self.serve_wait <= 0:
                self.serve_wait = random.uniform(0.9, 1.6)
                inp["pressed"].add("atk")
            return
        if b.vstate != "play":
            return
        self.think -= dt
        if self.think <= 0:
            self.think = self.lv["react"]
            self.noise = random.uniform(-self.lv["err"], self.lv["err"])
            land = predict(ball, fi.z + fi.hgt * 0.7)
            self.target = land
        mates = [o for o in b.fighters if o.team % 2 == team and o.alive()]
        land = self.target
        coming = land is not None and side_of(land[0]) == team
        me_takes = True
        if coming and len(mates) > 1:
            closest = min(mates, key=lambda o: abs(o.x - land[0]))
            me_takes = closest is fi
        front_x = NET_X - d * 95
        name = HG.SKILLS["volley"][fi.char][0]["key"]
        # spike chance: the ball is high near the net on our side
        if coming and land is not None and abs(land[0] - NET_X) < 260 and ball["vz"] < 220 and \
                (me_takes or abs(fi.x - NET_X) < abs(mates[0].x - NET_X) + 1) and random.random() < 1.0:
            spike_h = fi.hgt + 120
            hit = predict(ball, spike_h)
            if hit is not None and abs(hit[0] - NET_X) < 280 and side_of(hit[0]) == team and \
                    random.random() < self.lv["spike"] + 0.1:
                hx, ht = hit
                tx = hx - d * 18
                self.go(tx)
                # take off so we meet it near the top of the jump
                t_up = JUMP / SD.G
                if fi.ground and abs(fi.x - tx) < 40 and abs(ht - t_up) < 0.08 + self.lv["jump_err"]:
                    if fi.cds["k"] <= 0 and name in ("highjump", "smash") and random.random() < self.lv["skill"]:
                        inp["pressed"].add("skill")
                    else:
                        inp["pressed"].add("jump")
                if not fi.ground and b.in_reach(fi):
                    inp["pressed"].add("atk")
                return
        if coming and me_takes:
            tx = land[0] + self.noise * 0.5 - d * 10
            far = abs(tx - fi.x)
            if far > b.speed(fi) * land[1] + 30 and far < b.speed(fi) * land[1] + 200 and land[1] < 0.45 and \
                    random.random() < self.lv["dive"]:
                fi.face = 1 if tx > fi.x else -1
                inp["dx"] = fi.face
                inp["pressed"].add("guard")
                return
            self.go(tx)
            if b.in_reach(fi) and ball["vz"] < 60:
                if name == "set" and fi.cds["k"] <= 0 and len(mates) > 1 and random.random() < self.lv["skill"]:
                    inp["pressed"].add("skill")
                elif name == "dink" and fi.cds["k"] <= 0 and random.random() < self.lv["skill"] * 0.3:
                    inp["pressed"].add("skill")
                else:
                    inp["pressed"].add("atk")
            return
        # not mine: the block, or wait in position
        if not coming and ball["team"] is not None and ball["team"] != team and abs(ball["x"] - NET_X) < 200 and \
                ball["z"] > NET_H and name == "wall" and fi.cds["k"] <= 0 and abs(fi.x - NET_X) < 120 and \
                random.random() < self.lv["skill"] * dt * 6:
            inp["pressed"].add("skill")
            return
        if len(mates) > 1 and not me_takes:
            self.go(front_x)
        else:
            self.go(NET_X - d * (300 if len(mates) == 1 else 360))

    def go(self, x):
        fi = self.fi
        dx = x - fi.x
        fi.inp["dx"] = 0.0 if abs(dx) < 8 else (1.0 if dx > 0 else -1.0)


class VolleyTrainAI(VolleyAI):
    """The partner sets the ball for you in the spike lesson and otherwise keeps out of the way."""

    def step(self, dt):
        b, fi = self.b, self.fi
        fi.inp["dx"] = 0.0
        fi.inp["held"] = set()
        tr = b.train
        if tr is None or tr["i"] >= len(b.TRAIN_STEPS):
            return
        key = b.TRAIN_STEPS[tr["i"]][0]
        if key == "spike":
            self.go(420.0)
        else:
            me = b.trainee()
            self.go(80.0 if me is None or me.x > 200 else 520.0)
