"""雪球射击 (in the snow field): a cover shooter. J throws a snowball at the nearest opponent you can see (hold to
charge a big one that splashes); you carry six; E scoops two more anywhere, or fills up at a snowball pile. Hold L to
crouch: half damage, and nothing gets you while you hug a snow wall from the side the shot comes from; L with a
direction rolls. Out of HP you are frozen into a snowman for a few seconds. K is each character's own trick.
"""
import math
import random

from . import house_art as H
from . import house_battle as HB
from . import house_games as HG
from . import house_pals as PL

MAX_AMMO = 6
HB.AMMO.setdefault("bigsnow", dict(name="大雪球", dmg=20, kb=300, speed=470, arc=True, count=1, r=15, splash=50))
HB.AMMO.setdefault("minisnow", dict(name="小雪球", dmg=6, kb=100, speed=560, arc=True, count=1, r=6))
SHOT_CD = 0.26
COCOA = 16                      # 热可可 heal (v23: was 35 every 12 s, which won every 1v1)
SPEED = {"calico": 190, "tabby": 165, "dad": 160, "mom": 168, "kid": 182}
HP = {"calico": 112, "tabby": 115, "dad": 118, "mom": 100, "kid": 95}


def seg_blocked(b, x0, y0, x1, y1, team=None):
    """Does a snow wall stand between two points? (Walls a team built itself don't block its own throws.)"""
    for o in b.obst:
        if o["hp"] <= 0 or (team is not None and o.get("team") == team):
            continue
        hw, hd = o["w"] / 2 + 4, o["d"] / 2 + 4
        # sample along the line
        n = int(max(abs(x1 - x0), abs(y1 - y0)) / 18) + 1
        for i in range(1, n):
            u = i / n
            x, y = x0 + (x1 - x0) * u, y0 + (y1 - y0) * u
            if abs(x - o["x"]) < hw and abs(y - o["y"]) < hd:
                return True
    return False


class ShootBattle(HB.Battle):
    GAME = "shoot"

    def setup(self):
        self.rollers = []
        for fi in self.fighters:
            fi.maxhp = HP[fi.char]
            fi.hp = float(fi.maxhp)
            fi.ammo = MAX_AMMO
            fi.cds = {"k": 0.0}
            fi.shot_cd = 0.0
            fi.target = None

    def place_all(self):
        super().place_all()
        if self.train is not None:
            me = self.trainee()
            for fi in self.fighters:
                if fi is not me:
                    fi.a.x, fi.a.y = 560.0, 250.0
                    fi.fx, fi.fy = -1.0, 0.0

    # ---- aiming ------------------------------------------------------------------------------------------------
    def target_of(self, fi, rng=600.0):
        best = None
        for o in self.enemies(fi):
            if not o.alive():
                continue
            d = math.hypot(o.a.x - fi.a.x, o.a.y - fi.a.y)
            if d > rng:
                continue
            seen = not seg_blocked(self, fi.a.x, fi.a.y, o.a.x, o.a.y, fi.team)
            score = d + (0 if seen else 400)
            if best is None or score < best[0]:
                best = (score, o)
        return best[1] if best else None

    def aim_at(self, fi):
        o = self.target_of(fi)
        fi.target = o.uid if o is not None else None
        if o is not None:
            ux, uy = HB.norm(o.a.x - fi.a.x, o.a.y - fi.a.y)
            if ux or uy:
                fi.fx, fi.fy = ux, uy
        return o

    def throw_ball(self, fi, kind, spread=0.0, free=False):
        o = self.aim_at(fi)              # fans (三连发 / 散射) are centred on the target too
        spec = HB.AMMO[kind]
        ang = math.atan2(fi.fy, fi.fx) + spread
        tx, ty = math.cos(ang), math.sin(ang)
        sp = spec["speed"]
        vz = 180.0
        if o is not None:
            # lob it so it comes down near them
            d = math.hypot(o.a.x - fi.a.x, o.a.y - fi.a.y)
            t = max(0.25, d / sp)
            z0 = 34.0
            vz = (0.5 * HB.GRAV * 0.55 * t * t - z0 + 26) / t
            vz = max(40.0, min(420.0, vz))
        p = {"k": kind, "x": fi.a.x + tx * 20, "y": fi.a.y + ty * 20, "z": 34.0, "vx": tx * sp, "vy": ty * sp,
             "vz": vz, "owner": fi.uid, "team": fi.team, "life": 2.2, "r": spec["r"], "rot": 0.0}
        self.projs.append(p)
        if not free:
            fi.ammo -= 2 if kind == "bigsnow" else 1
        self.note(fi, "shot", big=kind == "bigsnow")
        return p

    # ---- the frame ---------------------------------------------------------------------------------------------
    def step_game(self, dt):
        self.control(dt)
        for fi in self.fighters:
            buf = fi.buf
            for k in [k for k, until in buf.items() if until <= self.clock]:
                del buf[k]
            fi.inp["pressed"] |= set(buf)
            before = fi.st
            self.step_fighter(fi, dt)
            if before in ("idle", "crouch") or fi.st != before:
                buf.clear()
            else:
                for k in fi.inp["pressed"]:
                    if k != "atk":
                        buf.setdefault(k, self.clock + 0.25)
            fi.inp["pressed"] = set()
        self.separate()
        self.step_projs(dt)
        self.step_rollers(dt)
        self.step_items(dt)
        if self.train is not None:
            self.step_train(dt)
        self.step_fx(dt)
        for fi in self.fighters:
            self.pose(fi)
        self.check_end()

    def step_fighter(self, fi, dt):
        a = fi.a
        fi.t += dt
        fi.inv = max(0.0, fi.inv - dt)
        fi.shot_cd = max(0.0, fi.shot_cd - dt)
        for k in fi.cds:
            fi.cds[k] = max(0.0, fi.cds[k] - dt)
        for k in fi.cd:
            fi.cd[k] = max(0.0, fi.cd[k] - dt)
        inp = fi.inp
        held, pressed = inp["held"], inp["pressed"]
        mx, my = inp["dx"], inp["dy"]
        mn = math.hypot(mx, my)
        if mn > 1e-6:
            mx, my = mx / mn, my / mn
        st = fi.st
        sp = SPEED[fi.char] * (1.3 if fi.buff.get("speed", 0) > self.clock else 1.0) * PL.speed(self, fi)
        want = (0.0, 0.0)
        if st in ("idle", "crouch", "charge"):
            if st == "idle":
                want = (mx * sp, my * sp)
                if mn > 0.1:
                    fi.fx, fi.fy = mx, my
                else:
                    o = self.target_of(fi, 500)
                    if o is not None:
                        fi.fx, fi.fy = HB.norm(o.a.x - a.x, o.a.y - a.y)
                roll = ("guard" in pressed and mn > 0.1) or ("guard" in held and mn > 0.1 and
                                                            abs(fi.pdir[0]) + abs(fi.pdir[1]) < 0.1)
                fi.pdir = (inp["dx"], inp["dy"])
                if roll and fi.cd["roll"] <= 0:
                    self.start(fi, "roll", 0.34)
                    fi.data["rd"] = (mx, my)
                    fi.inv = 0.26
                    fi.cd["roll"] = 0.55
                    self.dust(fi)
                    self.note(fi, "roll")
                elif "jump" in pressed and fi.z <= 0:
                    self.start(fi, "jump", 9)
                    fi.vz = 330
                    self.note(fi, "jump")
                elif "atk" in pressed:
                    if fi.ammo <= 0:
                        self.tell(fi, "没雪球了！按 E 捏")
                    elif fi.shot_cd <= 0:
                        self.start(fi, "charge", 9)
                        fi.charge = 0.0
                elif "skill" in pressed:
                    if fi.cds["k"] <= 0:
                        self.use_skill(fi)
                    else:
                        self.tell(fi, "技能冷却中")
                elif "throw" in pressed:
                    if fi.hold:
                        self.aim_at(fi)
                        self.throw_or_grab(fi)
                    else:
                        near = any(math.hypot(it.x - a.x, it.y - a.y) < 75 for it in self.ammo_piles)
                        if fi.ammo >= MAX_AMMO:
                            self.tell(fi, "雪球满了")
                        else:
                            self.start(fi, "reload" if near else "scoop", 0.45 if near else 0.75)
                elif "guard" in held:
                    self.start(fi, "crouch", 99)
            elif st == "crouch":
                want = (mx * sp * 0.25, my * sp * 0.25)
                fi.pdir = (inp["dx"], inp["dy"])
                if "guard" not in held:
                    self.start(fi, "idle", 0)
                elif mn > 0.1 and ("guard" in pressed or True) and fi.cd["roll"] <= 0 and fi.t > 0.15:
                    self.start(fi, "roll", 0.34)
                    fi.data["rd"] = (mx, my)
                    fi.inv = 0.26
                    fi.cd["roll"] = 0.55
                    self.dust(fi)
                    self.note(fi, "roll")
                elif "atk" in pressed and fi.ammo > 0 and fi.shot_cd <= 0:
                    self.shoot(fi, "snowball")
            elif st == "charge":
                want = (mx * sp * 0.55, my * sp * 0.55)
                if mn > 0.1:
                    pass
                fi.charge = min(1.0, max(0.0, (fi.t - 0.22) / 0.6))
                if "atk" not in held:
                    if fi.t < 0.22 or fi.ammo < 2:
                        self.shoot(fi, "snowball")
                    else:
                        self.shoot(fi, "bigsnow")
                    if fi.st == "charge":
                        self.start(fi, "throw", 0.16)
        elif st == "throw":
            want = (mx * sp * 0.6, my * sp * 0.6)
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
        elif st in ("scoop", "reload"):
            if mn > 0.1 and fi.t > 0.1:
                self.start(fi, "idle", 0)            # walked off: cancelled
            elif fi.t >= fi.dur:
                if st == "reload":
                    fi.ammo = MAX_AMMO
                    self.add_fx("text", fi, text="雪球装满了", small=True)
                else:
                    fi.ammo = min(MAX_AMMO, fi.ammo + 2)
                    self.add_fx("text", fi, text="+2 雪球", small=True)
                self.note(fi, "reload")
                self.start(fi, "idle", 0)
        elif st == "roll":
            d = fi.data.get("rd", (fi.fx, fi.fy))
            want = (d[0] * 360, d[1] * 360)
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
        elif st == "jump":
            want = (mx * sp * 0.8, my * sp * 0.8)
            if fi.t > 0.05 and fi.z <= 0:
                self.start(fi, "idle", 0)
        elif st in ("hit", "stun"):
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
        elif st == "down":
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
                fi.inv = 0.5
        elif st == "skill":
            if fi.t >= fi.dur:
                self.start(fi, "idle", 0)
        elif st == "ko":
            if fi.t >= fi.dur:
                self.respawn(fi)
            return
        elif st == "throw_y":
            pass
        # yarn bombs etc. use the base "throw" state: launch handled by base when data has ammo
        if st == "throw" and fi.data.get("ammo") and fi.t >= 0.1 and not fi.data.get("done"):
            fi.data["done"] = True
            self.launch(fi, fi.data["ammo"])
        # movement (base helpers)
        ax, ay = want
        zones = self.zone_at(a.x, a.y) if fi.z <= 0 else []
        slip = any(z[0] == "slip" for z in zones)
        if slip and fi.st in ("idle", "crouch", "charge"):
            k = min(1.0, dt * 2.2)
            fi.vx += (ax - fi.vx) * k
            fi.vy += (ay - fi.vy) * k
        else:
            fi.vx, fi.vy = ax, ay
        fr = 1.6 if slip else 7.0
        fi.kx *= max(0.0, 1 - fr * dt)
        fi.ky *= max(0.0, 1 - fr * dt)
        self.move(fi, (fi.vx + fi.kx) * dt, (fi.vy + fi.ky) * dt)
        if fi.z > 0 or fi.vz != 0:
            fi.vz -= HB.GRAV * dt
            fi.z += fi.vz * dt
            if fi.z <= 0:
                fi.z, fi.vz = 0.0, 0.0
        a.h = fi.z

    def shoot(self, fi, kind):
        self.throw_ball(fi, kind)
        fi.shot_cd = SHOT_CD if kind == "snowball" else 0.5
        if kind == "bigsnow":
            self.add_fx("text", fi, text="大雪球！", small=True)

    # ---- hits --------------------------------------------------------------------------------------------------
    def hit(self, att, o, dmg, kb, stun, kd, dirv, guard_break=False, proj=False):
        if not o.alive() or o.inv > 0:
            return False
        if o.st == "crouch":
            ux, uy = HB.norm(*dirv)
            # a wall right in front of me, towards the shot: safe
            for ob in self.obst:
                if ob["hp"] > 0 and math.hypot(ob["x"] - (o.a.x - ux * 40), (ob["y"] - (o.a.y - uy * 40)) * 1.3) < 60:
                    self.add_fx("block", o)
                    self.note(o, "covered")
                    return False
            dmg *= 0.5
            kd = False
            self.note(o, "crouched")
        return super().hit(att, o, dmg, kb, stun, kd, dirv, guard_break, proj)

    def check_ko(self, o, att):
        if o.hp > 0 or not o.alive():
            return
        if self.mode == "train":
            o.hp = float(o.maxhp)
            self.add_fx("text", o, text="（训练中，血量回满）", small=True)
            return
        o.hp = 0
        o.kos += 1
        self.start(o, "ko", 3.0)
        self.credit(o)
        self.add_fx("text", o, text="冻住了！")
        self.add_fx("poof", o)
        o.a.say("好冷……" if not o.a.is_cat else "喵呜……（冻住了）", 1.6)

    def respawn(self, fi):
        super().respawn(fi)
        fi.ammo = MAX_AMMO

    def step_projs(self, dt):
        before = list(self.projs)
        super().step_projs(dt)
        # a big snowball that landed or hit something splashes
        for p in before:
            if p not in self.projs and p["k"] == "bigsnow":
                owner = next((f for f in self.fighters if f.uid == p["owner"]), None)
                for o in self.fighters:
                    if o is owner or not o.alive() or (self.mode != "ffa" and owner is not None and o.team == owner.team):
                        continue
                    if math.hypot(o.a.x - p["x"], o.a.y - p["y"]) < HB.AMMO["bigsnow"]["splash"]:
                        self.hit(owner, o, 8, 160, 0.3, False, (o.a.x - p["x"] + 0.1, o.a.y - p["y"]), proj=True)
                self.add_fx("splash_big", None, x=p["x"], y=p["y"], z=0, r=50)

    def step_rollers(self, dt):
        keep = []
        for r in self.rollers:
            r["t"] += dt
            r["rad"] = min(36.0, 14 + r["t"] * 12)
            r["x"] += r["vx"] * dt
            r["y"] += r["vy"] * dt
            r["rot"] += dt * 6
            gone = r["t"] > 2.6 or not (10 < r["x"] < H.PW - 10 and 10 < r["y"] < H.PD_PLACE - 10)
            for ob in self.obst:
                if ob["hp"] > 0 and abs(r["x"] - ob["x"]) < ob["w"] / 2 + r["rad"] * 0.6 and \
                        abs(r["y"] - ob["y"]) < ob["d"] / 2 + r["rad"] * 0.4:
                    self.hurt_obstacle(ob, 3)
                    gone = True
            owner = next((f for f in self.fighters if f.uid == r["owner"]), None)
            for o in self.fighters:
                if o is owner or o.uid in r["hit"] or not o.alive() or o.z > 25:
                    continue
                if self.mode != "ffa" and owner is not None and o.team == owner.team:
                    continue
                if math.hypot(o.a.x - r["x"], (o.a.y - r["y"]) * 1.3) < r["rad"] + 14:
                    r["hit"].append(o.uid)
                    self.hit(owner, o, 18, 320, 0.5, True, (r["vx"], r["vy"]), proj=True)
            if gone:
                self.add_fx("splash_big", None, x=r["x"], y=r["y"], z=0, r=r["rad"] + 20)
            else:
                keep.append(r)
        self.rollers = keep

    # ---- skills ------------------------------------------------------------------------------------------------
    def use_skill(self, fi):
        sk = HG.SKILLS["shoot"][fi.char][0]
        name = sk["key"]
        self.aim_at(fi)
        ok = True
        if name == "burst":
            for k, sp in enumerate((-0.2, 0.0, 0.2)):
                p = self.throw_ball(fi, "snowball", spread=sp if sp else 0.0001, free=True)
        elif name == "spread":
            for sp in (-0.42, -0.21, 0.0001, 0.21, 0.42):
                self.throw_ball(fi, "minisnow", spread=sp, free=True)
        elif name == "bigroll":
            self.rollers.append({"x": fi.a.x + fi.fx * 30, "y": fi.a.y + fi.fy * 30, "vx": fi.fx * 300,
                                 "vy": fi.fy * 300, "t": 0.0, "rad": 14.0, "rot": 0.0, "owner": fi.uid, "hit": []})
        elif name == "wall":
            x, y = fi.a.x + fi.fx * 70, fi.a.y + fi.fy * 70
            if 40 < x < H.PW - 40 and 30 < y < H.PD_PLACE - 30 and not self.blocked(x, y, 30):
                self.obst.append({"k": "snow_wall", "x": x, "y": y, "w": 92, "d": 24, "hp": 3, "team": fi.team})
                self.add_fx("poof", None, x=x, y=y, z=20)
            else:
                ok = False
        elif name == "cocoa":
            n = 0
            for o in self.fighters:
                if o.alive() and (o is fi or (self.mode != "ffa" and o.team == fi.team)) and \
                        math.hypot(o.a.x - fi.a.x, o.a.y - fi.a.y) < 170:
                    o.hp = min(o.maxhp, o.hp + COCOA)
                    self.add_fx("text", o, text="+%d" % COCOA, heal=True)
                    n += 1
            self.add_fx("steam", fi)
        if ok:
            fi.cds["k"] = sk["cd"]
            self.start(fi, "skill", 0.3)
            self.add_fx("skillname", fi, text=sk["icon"] + " " + sk["name"], color=HG.CHARS[fi.char]["color"])
            self.note(fi, "skill")
        else:
            self.tell(fi, "这里堆不了")

    # ---- poses -------------------------------------------------------------------------------------------------
    def pose(self, fi):
        a = fi.a
        a.h = fi.z
        if abs(fi.fx) > 0.15:
            a.facing = 1 if fi.fx > 0 else -1
        st = fi.st
        moving = math.hypot(fi.vx, fi.vy) > 20
        if self.phase in ("travel", "count") and st == "idle":
            if a.is_cat:
                a.set_pose("crouch" if self.phase == "count" else "stand")
            else:
                a.pose, a.view, a.prop, a.seat = "stand", "side", None, 0.0
            return
        if a.is_cat:
            p = {"idle": "run" if moving else "stand", "crouch": "crouch", "charge": "crouch", "throw": "swat",
                 "scoop": "kneel" if False else "crouch", "reload": "crouch", "roll": "belly", "jump": "jump",
                 "hit": "annoyed", "down": "belly", "skill": "swat", "ko": "sit"}.get(st, "stand")
            a.set_pose(p)
            a.running = moving
        else:
            p = {"idle": "run" if moving else "stand", "crouch": "crouch", "charge": "stretch", "throw": "reach",
                 "scoop": "crouch", "reload": "crouch", "roll": "crouch", "jump": "stretch", "hit": "stand",
                 "down": "floor", "skill": "reach", "ko": "stand"}.get(st, "stand")
            a.pose, a.view, a.prop, a.seat = p, ("front" if st in ("down", "ko") else "side"), None, 0.0

    # ---- network -----------------------------------------------------------------------------------------------
    def net_extra(self):
        return {"rollers": [{"x": round(r["x"]), "y": round(r["y"]), "rad": round(r["rad"], 1), "rot": round(r["rot"], 1)}
                            for r in self.rollers]}

    def fighter_extra(self, fi):
        return {"ammo": fi.ammo, "cds": {"k": round(fi.cds["k"], 1)}, "target": fi.target}

    # ---- tutorial ----------------------------------------------------------------------------------------------
    def train_text(self, i):
        key, text, keys = self.TRAIN_STEPS[i][:3]
        me = self.trainee()
        sk = HG.SKILLS["shoot"][me.char if me is not None else "calico"][0]
        return text.format(k=sk["name"], desc=sk["desc"]), keys

    def train_prepare(self, key, me):
        if me is not None and key == "reload":
            me.ammo = min(me.ammo, 2)
        if me is not None and key == "big":
            me.ammo = MAX_AMMO

    def step_train(self, dt):
        super().step_train(dt)
        tr = self.train
        if tr is None or tr["i"] >= len(self.TRAIN_STEPS) or tr.get("done_t") is not None:
            return
        me = self.trainee()
        mate = next((f for f in self.fighters if f is not me), None)
        if me is not None and mate is not None and self.TRAIN_STEPS[tr["i"]][0] == "crouch" and me.st == "crouch" \
                and me.t > 0.8 and seg_blocked(self, mate.a.x, mate.a.y, me.a.x, me.a.y):
            self.note(me, "covered")

    def make_ai(self, fi):
        return ShootTrainAI(self, fi) if self.train is not None else ShootAI(self, fi, fi.ctrl[3:])


ShootBattle.TRAIN_STEPS = [
    ("hit", "按 J 扔雪球，打中陪练（会自动瞄准）", "J", lambda ev, kw: ev == "hit_by_me", "扔雪球"),
    ("big", "按住 J 蓄力，松开扔出大雪球（耗 2 个雪球）", "按住 J", lambda ev, kw: ev == "shot" and kw.get("big"), "大雪球"),
    ("reload", "雪球快没了：按 E 捏雪球；走到雪球堆旁边按 E 能一下装满", "E", "reload", "捏雪球"),
    ("crouch", "陪练开始扔你了！躲到雪墙后面按住 L 蹲下", "按住 L", lambda ev, kw: ev in ("covered", "crouched"), "蹲下躲"),
    ("roll", "按住 L 再按方向键：翻滚躲开", "L + 方向", "roll", "翻滚"),
    ("skill", "按 K：技能「{k}」——{desc}", "K", "skill", "技能"),
]

# "hit_by_me": the base hit() reports hits through note(att, ...) only in melee; report them here
_orig_hit = ShootBattle.hit


def _hit(self, att, o, dmg, kb, stun, kd, dirv, guard_break=False, proj=False):
    ok = _orig_hit(self, att, o, dmg, kb, stun, kd, dirv, guard_break, proj)
    if ok and att is not None:
        self.note(att, "hit_by_me")
    return ok


ShootBattle.hit = _hit


# ======================================================================================================== AI
class ShootAI:
    LEVELS = {"easy": dict(react=0.7, rate=1.4, dodge=0.1, charge=0.05, skill=0.2, cover=0.2),
              "normal": dict(react=0.35, rate=0.85, dodge=0.3, charge=0.2, skill=0.5, cover=0.5),
              "hard": dict(react=0.18, rate=0.55, dodge=0.55, charge=0.35, skill=0.8, cover=0.8)}

    def __init__(self, b, fi, level):
        self.b = b
        self.fi = fi
        self.lv = self.LEVELS.get(level, self.LEVELS["normal"])
        self.next = random.uniform(0.3, 0.8)
        self.shoot_t = random.uniform(0.5, 1.0)
        self.strafe = random.choice((-1, 1))
        self.hold_atk = 0.0
        self.crouch = 0.0
        self.goal = None

    def step(self, dt):
        fi, b = self.fi, self.b
        inp = fi.inp
        inp["dx"] = inp["dy"] = 0.0
        inp["held"] = set()
        if not fi.alive() or fi.st in ("hit", "down", "ko", "roll", "scoop", "reload", "skill"):
            self.hold_atk = 0.0
            return
        self.next -= dt
        self.shoot_t -= dt
        if self.hold_atk > 0:
            self.hold_atk -= dt
            if self.hold_atk > 0:
                inp["held"] = {"atk"}
            return
        if self.crouch > 0:
            self.crouch -= dt
            inp["held"] = {"guard"}
            return
        o = b.target_of(fi, 3000)
        if o is None:
            return
        dxp, dyp = o.a.x - fi.a.x, o.a.y - fi.a.y
        d = math.hypot(dxp, dyp)
        seen = not seg_blocked(b, fi.a.x, fi.a.y, o.a.x, o.a.y, fi.team)
        # incoming
        for p in b.projs:
            if p["owner"] == fi.uid or (b.mode != "ffa" and p["team"] == fi.team):
                continue
            if math.hypot(p["x"] - fi.a.x, p["y"] - fi.a.y) < 150 and \
                    (fi.a.x - p["x"]) * p["vx"] + (fi.a.y - p["y"]) * p["vy"] > 0:
                if random.random() < self.lv["dodge"] * dt * 12:
                    if self.wall_near() and random.random() < 0.6:
                        self.crouch = 0.6
                        inp["held"] = {"guard"}
                        return
                    ux, uy = HB.norm(p["vx"], p["vy"])
                    inp["dx"], inp["dy"] = -uy * self.strafe, ux * self.strafe
                    inp["held"] = {"guard"}
                    inp["pressed"].add("guard")
                    return
        # ammo
        if fi.ammo <= 0 and not fi.hold:
            pile = min(b.ammo_piles, key=lambda it: math.hypot(it.x - fi.a.x, it.y - fi.a.y)) if b.ammo_piles else None
            if pile is not None and math.hypot(pile.x - fi.a.x, pile.y - fi.a.y) < 320:
                if math.hypot(pile.x - fi.a.x, pile.y - fi.a.y) < 60:
                    inp["pressed"].add("throw")
                else:
                    self.go(pile.x, pile.y - 30)
                return
            inp["pressed"].add("throw")
            return
        # skill
        if fi.cds["k"] <= 0 and random.random() < self.lv["skill"] * dt * 2:
            name = HG.SKILLS["shoot"][fi.char][0]["key"]
            use = (name in ("burst", "spread") and seen and d < 380) or (name == "bigroll" and d < 500 and seen) or \
                (name == "wall" and seen and d < 450) or (name == "cocoa" and fi.hp < fi.maxhp * 0.6)
            if use:
                inp["pressed"].add("skill")
                return
        # throw
        if seen and d < 560 and self.shoot_t <= 0 and fi.st in ("idle", "crouch"):
            self.shoot_t = self.lv["rate"] * random.uniform(0.7, 1.3)
            if fi.ammo >= 2 and random.random() < self.lv["charge"]:
                self.hold_atk = 0.9
                inp["held"] = {"atk"}
                inp["pressed"].add("atk")
            else:
                inp["pressed"].add("atk")
            return
        if fi.hold and seen and d < 420:
            inp["pressed"].add("throw")
            return
        # move: keep a comfortable distance, from the side; to cover when hurt
        if self.next <= 0:
            self.next = self.lv["react"] * random.uniform(1.5, 3.0)
            if random.random() < 0.2:
                self.strafe = -self.strafe
            if fi.hp < fi.maxhp * 0.5 and random.random() < self.lv["cover"]:
                w = self.cover_spot(o)
                self.goal = w
            else:
                want = 320
                k = (d - want) / max(1.0, d)
                gx = fi.a.x + dxp * k - dyp / max(1.0, d) * 90 * self.strafe
                gy = fi.a.y + dyp * k + dxp / max(1.0, d) * 90 * self.strafe
                self.goal = (min(max(gx, 60), H.PW - 60), min(max(gy, 40), H.PD_PLACE - 40))
        if self.goal is not None:
            if math.hypot(self.goal[0] - fi.a.x, self.goal[1] - fi.a.y) < 14:
                self.goal = None
                if fi.hp < fi.maxhp * 0.5 and self.wall_near():
                    self.crouch = 1.0
            else:
                self.go(*self.goal)

    def go(self, x, y):
        fi = self.fi
        dx, dy = x - fi.a.x, y - fi.a.y
        d = math.hypot(dx, dy)
        if d > 1:
            ux, uy = dx / d, dy / d
            # don't walk into walls
            if self.b.blocked(fi.a.x + ux * 30, fi.a.y + uy * 30, 10):
                ux, uy = -uy * self.strafe, ux * self.strafe
            fi.inp["dx"], fi.inp["dy"] = ux, uy

    def wall_near(self):
        fi = self.fi
        return any(o["hp"] > 0 and math.hypot(o["x"] - fi.a.x, o["y"] - fi.a.y) < 80 for o in self.b.obst)

    def cover_spot(self, o):
        fi = self.fi
        best = None
        for ob in self.b.obst:
            if ob["hp"] <= 0:
                continue
            ux, uy = HB.norm(ob["x"] - o.a.x, ob["y"] - o.a.y)
            x, y = ob["x"] + ux * 36, ob["y"] + uy * 30
            d = math.hypot(x - fi.a.x, y - fi.a.y)
            if best is None or d < best[0]:
                best = (d, (x, y))
        return best[1] if best else None


class ShootTrainAI:
    """The partner stands behind a wall; while you learn to take cover it lobs slow snowballs at you."""

    def __init__(self, b, fi):
        self.b = b
        self.fi = fi
        self.t = 2.0

    def step(self, dt):
        fi, b = self.fi, self.b
        inp = fi.inp
        inp["dx"] = inp["dy"] = 0.0
        inp["held"] = set()
        fi.ammo = MAX_AMMO
        tr = b.train
        if tr is None or tr["i"] >= len(b.TRAIN_STEPS) or not fi.alive():
            return
        key = b.TRAIN_STEPS[tr["i"]][0]
        if key in ("crouch", "roll") and tr.get("done_t") is None and fi.st == "idle":
            self.t -= dt
            if self.t <= 0:
                self.t = 1.6
                inp["pressed"].add("atk")
